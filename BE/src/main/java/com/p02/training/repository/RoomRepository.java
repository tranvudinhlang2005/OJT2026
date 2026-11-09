package com.p02.training.repository;

import com.p02.training.entity.Room;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

/** The TR06 list uses the inherited {@code findAll(Pageable)}. */
public interface RoomRepository extends JpaRepository<Room, Long> {

    /** TR06: lock from spec 0.5. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Room> findLockedById(Long id);

    /** TR06 ROOM_CODE_DUPLICATE on create. */
    boolean existsByCode(String code);

    /** TR06 ROOM_CODE_DUPLICATE on edit. */
    boolean existsByCodeAndIdNot(String code, Long excludedId);
}
