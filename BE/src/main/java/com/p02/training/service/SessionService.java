package com.p02.training.service;

import com.p02.training.audit.SecurityAuditLogger;
import com.p02.training.dto.request.SessionRequest;
import com.p02.training.dto.response.SessionResponse;
import com.p02.training.entity.ClassOffering;
import com.p02.training.entity.Instructor;
import com.p02.training.entity.Room;
import com.p02.training.entity.Session;
import com.p02.training.entity.enums.ClassStatus;
import com.p02.training.entity.enums.SecurityAction;
import com.p02.training.exception.ApiException;
import com.p02.training.exception.ErrorCode;
import com.p02.training.repository.ClassOfferingRepository;
import com.p02.training.repository.RoomRepository;
import com.p02.training.repository.SessionRepository;
import com.p02.training.security.AuthenticatedUser;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * TR06 session scheduling. Writes are for Training Admins (SecurityConfig) and only while the class
 * is DRAFT. They lock Instructor (if the class has one) → Room → ClassOffering → Session (spec 0.5),
 * check conflicts with TR08, and log SESSION_CHANGE in their transaction.
 */
@Service
public class SessionService {

    /** Published classes ("Public = lớp đã công bố", spec part 3), whose sessions students and managers may read. */
    private static final Set<ClassStatus> PUBLIC_STATUSES =
            EnumSet.of(ClassStatus.OPEN, ClassStatus.IN_PROGRESS, ClassStatus.CLOSED);

    private static final String INVALID_TIME_MESSAGE = "Thời gian buổi học chưa hợp lệ";

    private final SessionRepository sessionRepository;
    private final ClassOfferingRepository classOfferingRepository;
    private final RoomRepository roomRepository;
    private final ClassLockService locks;
    private final ScheduleConflictService conflicts;
    private final SecurityAuditLogger auditLogger;

    public SessionService(SessionRepository sessionRepository, ClassOfferingRepository classOfferingRepository,
            RoomRepository roomRepository, ClassLockService locks, ScheduleConflictService conflicts,
            SecurityAuditLogger auditLogger) {
        this.sessionRepository = sessionRepository;
        this.classOfferingRepository = classOfferingRepository;
        this.roomRepository = roomRepository;
        this.locks = locks;
        this.conflicts = conflicts;
        this.auditLogger = auditLogger;
    }

    /**
     * {@code GET /classes/{id}/sessions}, in time order. Admins see every class; an instructor sees
     * only classes currently assigned to them, in any status including CANCELLED; students and
     * managers see published classes (A-31). A class outside the caller's scope is 404, as if it did
     * not exist (spec 0.4).
     */
    @Transactional(readOnly = true)
    public List<SessionResponse> listSessions(Long classId, AuthenticatedUser viewer) {
        ClassOffering classOffering = classOfferingRepository.findWithDetailsByIdAndDeletedAtIsNull(classId)
                .orElseThrow(SessionService::notFound);
        if (!canView(classOffering, viewer)) {
            throw notFound();
        }
        return sessionRepository.findByClassOffering_IdOrderBySessionDateAscStartTimeAsc(classId).stream()
                .map(SessionResponse::from)
                .toList();
    }

    /** {@code POST /classes/{id}/sessions}. */
    @Transactional
    public SessionResponse addSession(Long classId, SessionRequest request, AuthenticatedUser actor) {
        validateTimes(request);
        requireRoomExists(request.roomId());

        Long instructorId = locks.currentInstructorId(classId);
        Instructor instructor = locks.lockInstructor(instructorId);
        Room room = lockRoom(request.roomId());
        ClassOffering classOffering = locks.lockClass(classId);
        locks.requireSameInstructor(classOffering, instructorId);

        checkSchedulable(classOffering, request, room, instructor, null);

        Session session = new Session(classOffering, request.sessionDate(), request.startTime(), request.endTime(), room);
        session.setTopic(request.topic());
        sessionRepository.saveAndFlush(session);
        log(actor, "CREATE", classOffering, session);
        return SessionResponse.from(session);
    }

    /** {@code PUT /sessions/{id}}: the session itself is ignored in the conflict checks. */
    @Transactional
    public SessionResponse updateSession(Long sessionId, SessionRequest request, AuthenticatedUser actor) {
        validateTimes(request);
        requireRoomExists(request.roomId());
        Long classId = sessionRepository.findClassIdById(sessionId).orElseThrow(SessionService::notFound);

        Long instructorId = locks.currentInstructorId(classId);
        Instructor instructor = locks.lockInstructor(instructorId);
        Room room = lockRoom(request.roomId());
        ClassOffering classOffering = locks.lockClass(classId);
        locks.requireSameInstructor(classOffering, instructorId);
        Session session = sessionRepository.findLockedById(sessionId).orElseThrow(SessionService::notFound);

        checkSchedulable(classOffering, request, room, instructor, sessionId);

        session.setSessionDate(request.sessionDate());
        session.setStartTime(request.startTime());
        session.setEndTime(request.endTime());
        session.setRoom(room);
        session.setTopic(request.topic());
        log(actor, "UPDATE", classOffering, session);
        return SessionResponse.from(session);
    }

    /** {@code DELETE /sessions/{id}}: only while the class is DRAFT. Locks ClassOffering → Session. */
    @Transactional
    public void deleteSession(Long sessionId, AuthenticatedUser actor) {
        Long classId = sessionRepository.findClassIdById(sessionId).orElseThrow(SessionService::notFound);
        ClassOffering classOffering = locks.lockClass(classId);
        Session session = sessionRepository.findLockedById(sessionId).orElseThrow(SessionService::notFound);
        requireDraft(classOffering);
        log(actor, "DELETE", classOffering, session);
        sessionRepository.delete(session);
    }

    /**
     * The checks shared by add and edit, after the locks: class DRAFT; date within the class; room
     * active; then TR08: no other session of the class, no session in the room, and (if the class
     * has an instructor) none of the instructor's other sessions at the same time.
     */
    private void checkSchedulable(ClassOffering classOffering, SessionRequest request, Room room,
            Instructor instructor, Long excludedSessionId) {
        requireDraft(classOffering);
        if (request.sessionDate().isBefore(classOffering.getStartDate())
                || request.sessionDate().isAfter(classOffering.getEndDate())) {
            throw invalidTime("sessionDate", "Ngày học phải nằm trong thời gian của lớp");
        }
        if (!room.isActive()) {
            throw ApiException.conflict("ROOM_INACTIVE", "Phòng học đã ngừng sử dụng");
        }

        ScheduleConflictService.Slot slot =
                new ScheduleConflictService.Slot(request.sessionDate(), request.startTime(), request.endTime());
        conflicts.requireNoSessionOverlap(
                conflicts.checkSessionOverlapInClass(classOffering.getId(), slot, excludedSessionId));
        conflicts.requireNoRoomConflict(room.getCode(), conflicts.checkRoomConflict(room.getId(), slot, excludedSessionId));
        if (instructor != null) {
            conflicts.requireNoInstructorConflict(
                    conflicts.checkInstructorConflict(instructor.getId(), List.of(slot), classOffering.getId()));
        }
    }

    /**
     * TR06 session visibility (A-31), applied literally: "Admin, Instructor (Assigned),
     * Student/Manager (lớp Public)". It is deliberately not TR09's class-visibility rule.
     */
    private static boolean canView(ClassOffering classOffering, AuthenticatedUser viewer) {
        if (viewer == null) {
            return false;
        }
        return switch (viewer.role()) {
            case TRAINING_ADMIN -> true;
            // Only the instructor currently assigned, in any status, CANCELLED included.
            case INSTRUCTOR -> classOffering.getInstructor() != null
                    && classOffering.getInstructor().getUser().getId().equals(viewer.id());
            case STUDENT, TRAINING_MANAGER -> PUBLIC_STATUSES.contains(classOffering.getStatus());
        };
    }

    private static void validateTimes(SessionRequest request) {
        if (!request.startTime().isBefore(request.endTime())) {
            throw invalidTime("endTime", "Giờ kết thúc phải sau giờ bắt đầu");
        }
    }

    /** An unknown room id is invalid input (422); checked before any lock is taken. */
    private void requireRoomExists(Long roomId) {
        if (!roomRepository.existsById(roomId)) {
            throw ApiException.validation("roomId", "Phòng học không tồn tại");
        }
    }

    private Room lockRoom(Long roomId) {
        return roomRepository.findLockedById(roomId)
                .orElseThrow(() -> ApiException.validation("roomId", "Phòng học không tồn tại"));
    }

    private static void requireDraft(ClassOffering classOffering) {
        if (classOffering.getStatus() != ClassStatus.DRAFT) {
            throw ApiException.conflict("CLASS_NOT_EDITABLE", "Lịch đã chốt, không thể sửa");
        }
    }

    private void log(AuthenticatedUser actor, String operation, ClassOffering classOffering, Session session) {
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("operation", operation);
        details.put("sessionId", session.getId());
        details.put("classId", classOffering.getId());
        details.put("classCode", classOffering.getClassCode());
        details.put("sessionDate", session.getSessionDate().toString());
        details.put("startTime", session.getStartTime().toString());
        details.put("endTime", session.getEndTime().toString());
        details.put("roomCode", session.getRoom().getCode());
        auditLogger.record(SecurityAction.SESSION_CHANGE, actor.username(), details);
    }

    /** 422 VALIDATION_ERROR with TR06's message for an invalid time or date. */
    private static ApiException invalidTime(String field, String detail) {
        ErrorCode errorCode = ErrorCode.VALIDATION_ERROR;
        return new ApiException(errorCode.status(), errorCode.name(), INVALID_TIME_MESSAGE,
                Map.of(field, List.of(detail)));
    }

    private static ApiException notFound() {
        return new ApiException(ErrorCode.NOT_FOUND);
    }
}
