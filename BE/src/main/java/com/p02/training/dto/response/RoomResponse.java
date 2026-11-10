package com.p02.training.dto.response;

import com.p02.training.entity.Room;

/** A TR06 room. */
public record RoomResponse(Long id, String code, int capacity, boolean isActive) {

    public static RoomResponse from(Room room) {
        return new RoomResponse(room.getId(), room.getCode(), room.getCapacity(), room.isActive());
    }
}
