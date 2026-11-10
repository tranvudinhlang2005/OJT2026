package com.p02.training.service;

import com.p02.training.audit.SecurityAuditLogger;
import com.p02.training.dto.request.ChangeStatusRequest;
import com.p02.training.dto.request.RoomRequest;
import com.p02.training.dto.response.PageResponse;
import com.p02.training.dto.response.RoomResponse;
import com.p02.training.entity.Room;
import com.p02.training.entity.enums.SecurityAction;
import com.p02.training.exception.ApiException;
import com.p02.training.exception.ErrorCode;
import com.p02.training.repository.RoomRepository;
import com.p02.training.repository.SessionRepository;
import com.p02.training.security.AuthenticatedUser;
import java.time.Clock;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * TR06 room management, for Training Admins (SecurityConfig). Writes lock the Room row (spec 0.5),
 * which also serialises them with session scheduling, and log ROOM_CHANGE in their transaction.
 */
@Service
public class RoomService {

    private static final String ROOM_CODE_DUPLICATE = "ROOM_CODE_DUPLICATE";
    private static final String ROOM_IN_USE = "ROOM_IN_USE";

    private final RoomRepository roomRepository;
    private final SessionRepository sessionRepository;
    private final SecurityAuditLogger auditLogger;
    private final Clock clock;

    public RoomService(RoomRepository roomRepository, SessionRepository sessionRepository,
            SecurityAuditLogger auditLogger, Clock clock) {
        this.roomRepository = roomRepository;
        this.sessionRepository = sessionRepository;
        this.auditLogger = auditLogger;
        this.clock = clock;
    }

    /** {@code GET /rooms}, sorted by code. TR06 defines no filter or sort field. */
    @Transactional(readOnly = true)
    public PageResponse<RoomResponse> listRooms(int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("code").and(Sort.by("id")));
        return PageResponse.of(roomRepository.findAll(pageable), RoomResponse::from);
    }

    /** {@code GET /rooms/{id}}. */
    @Transactional(readOnly = true)
    public RoomResponse getRoom(Long id) {
        return RoomResponse.from(roomRepository.findById(id).orElseThrow(RoomService::notFound));
    }

    /** {@code POST /rooms}: a unique code and a capacity of at least 1. */
    @Transactional
    public RoomResponse createRoom(RoomRequest request, AuthenticatedUser actor) {
        if (roomRepository.existsByCode(request.code())) {
            throw duplicateCode();
        }
        Room room = new Room(request.code(), request.capacity());
        try {
            roomRepository.saveAndFlush(room);
        } catch (DataIntegrityViolationException ex) {
            throw duplicateCode();
        }
        log(actor, "CREATE", room);
        return RoomResponse.from(room);
    }

    /** {@code PUT /rooms/{id}}: code and capacity. */
    @Transactional
    public RoomResponse updateRoom(Long id, RoomRequest request, AuthenticatedUser actor) {
        Room room = lockRoom(id);
        if (roomRepository.existsByCodeAndIdNot(request.code(), id)) {
            throw duplicateCode();
        }
        room.setCode(request.code());
        room.setCapacity(request.capacity());
        try {
            roomRepository.flush();
        } catch (DataIntegrityViolationException ex) {
            throw duplicateCode();
        }
        log(actor, "UPDATE", room);
        return RoomResponse.from(room);
    }

    /**
     * {@code PATCH /rooms/{id}/status}. A room cannot be taken out of use while it has a session from
     * today on in a DRAFT, OPEN or IN_PROGRESS class.
     */
    @Transactional
    public RoomResponse changeStatus(Long id, ChangeStatusRequest request, AuthenticatedUser actor) {
        Room room = lockRoom(id);
        boolean active = request.isActive();
        if (!active && sessionRepository
                .existsByRoom_IdAndSessionDateGreaterThanEqualAndClassOffering_StatusInAndClassOffering_DeletedAtIsNull(
                        id, LocalDate.now(clock), ScheduleConflictService.SCHEDULED_STATUSES)) {
            throw ApiException.conflict(ROOM_IN_USE, "Phòng đang có lịch học, không thể ngừng sử dụng");
        }
        room.setActive(active);
        log(actor, "STATUS", room);
        return RoomResponse.from(room);
    }

    private Room lockRoom(Long id) {
        return roomRepository.findLockedById(id).orElseThrow(RoomService::notFound);
    }

    private void log(AuthenticatedUser actor, String operation, Room room) {
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("operation", operation);
        details.put("roomId", room.getId());
        details.put("code", room.getCode());
        details.put("capacity", room.getCapacity());
        details.put("isActive", room.isActive());
        auditLogger.record(SecurityAction.ROOM_CHANGE, actor.username(), details);
    }

    private static ApiException notFound() {
        return new ApiException(ErrorCode.NOT_FOUND);
    }

    private static ApiException duplicateCode() {
        return ApiException.conflict(ROOM_CODE_DUPLICATE, "Mã phòng đã tồn tại");
    }
}
