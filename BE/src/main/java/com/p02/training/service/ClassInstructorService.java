package com.p02.training.service;

import com.p02.training.audit.SecurityAuditLogger;
import com.p02.training.dto.request.AssignInstructorRequest;
import com.p02.training.dto.response.ClassResponse;
import com.p02.training.entity.ClassOffering;
import com.p02.training.entity.Instructor;
import com.p02.training.entity.InstructorCourseId;
import com.p02.training.entity.enums.ClassStatus;
import com.p02.training.entity.enums.SecurityAction;
import com.p02.training.exception.ApiException;
import com.p02.training.repository.InstructorCourseRepository;
import com.p02.training.repository.InstructorRepository;
import com.p02.training.repository.SessionRepository;
import com.p02.training.security.AuthenticatedUser;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * TR07 instructor assignment, for Training Admins (SecurityConfig). The MVP has one main instructor
 * per class, so assigning replaces the previous one.
 */
@Service
public class ClassInstructorService {

    private final InstructorRepository instructorRepository;
    private final InstructorCourseRepository instructorCourseRepository;
    private final SessionRepository sessionRepository;
    private final ClassLockService locks;
    private final ScheduleConflictService conflicts;
    private final SecurityAuditLogger auditLogger;

    public ClassInstructorService(InstructorRepository instructorRepository,
            InstructorCourseRepository instructorCourseRepository, SessionRepository sessionRepository,
            ClassLockService locks, ScheduleConflictService conflicts, SecurityAuditLogger auditLogger) {
        this.instructorRepository = instructorRepository;
        this.instructorCourseRepository = instructorCourseRepository;
        this.sessionRepository = sessionRepository;
        this.locks = locks;
        this.conflicts = conflicts;
        this.auditLogger = auditLogger;
    }

    /**
     * {@code PUT /classes/{id}/instructor}. Locks Instructor → ClassOffering (spec 0.5), then checks
     * in order: class is DRAFT; instructor and their account are active; the instructor may teach
     * the course (InstructorCourse, which includes an assignment kept after the course became
     * inactive, A-29); every session of the class is free in the instructor's other classes (TR08).
     * Logs ASSIGN_INSTRUCTOR with the old and new instructor.
     */
    @Transactional
    public ClassResponse assignInstructor(Long classId, AssignInstructorRequest request, AuthenticatedUser actor) {
        // An unknown instructor id is invalid input (422). Locking it first follows spec 0.5.
        Instructor instructor = instructorRepository.findLockedById(request.instructorId())
                .orElseThrow(() -> ApiException.validation("instructorId", "Giảng viên không tồn tại"));
        ClassOffering classOffering = locks.lockClass(classId);

        if (classOffering.getStatus() != ClassStatus.DRAFT) {
            throw ApiException.conflict("CLASS_NOT_EDITABLE", "Lớp đã công bố, không thể đổi giảng viên");
        }
        if (!instructor.isActive() || !instructor.getUser().isActive()) {
            throw ApiException.conflict("INSTRUCTOR_INACTIVE", "Giảng viên đang ngừng nhận lớp");
        }
        if (!instructorCourseRepository.existsById(
                new InstructorCourseId(instructor.getId(), classOffering.getCourse().getId()))) {
            throw ApiException.conflict("INSTRUCTOR_NOT_ELIGIBLE", "Giảng viên chưa đủ điều kiện dạy môn này");
        }
        List<ScheduleConflictService.Slot> slots =
                sessionRepository.findByClassOffering_IdOrderBySessionDateAscStartTimeAsc(classId).stream()
                        .map(ScheduleConflictService.Slot::of)
                        .toList();
        conflicts.requireNoInstructorConflict(conflicts.checkInstructorConflict(instructor.getId(), slots, classId));

        Long oldInstructorId = classOffering.getInstructor() == null ? null : classOffering.getInstructor().getId();
        classOffering.setInstructor(instructor);

        Map<String, Object> details = new LinkedHashMap<>();
        details.put("classId", classOffering.getId());
        details.put("classCode", classOffering.getClassCode());
        details.put("oldInstructorId", oldInstructorId);
        details.put("newInstructorId", instructor.getId());
        auditLogger.record(SecurityAction.ASSIGN_INSTRUCTOR, actor.username(), details);
        return ClassResponse.from(classOffering);
    }
}
