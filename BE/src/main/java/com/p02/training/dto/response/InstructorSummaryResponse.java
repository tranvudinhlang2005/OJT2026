package com.p02.training.dto.response;

import com.p02.training.entity.Instructor;
import com.p02.training.entity.User;

/**
 * An instructor in the Admin list (TR03). {@code isActive} is the profile's "nhận lớp" flag, not the
 * account's login status, which TR01 manages.
 */
public record InstructorSummaryResponse(
        Long id,
        Long userId,
        String username,
        String fullName,
        String email,
        String instructorCode,
        String department,
        String phone,
        boolean isActive) {

    /** Expects the user to be loaded already, as the list query does. */
    public static InstructorSummaryResponse from(Instructor instructor) {
        User user = instructor.getUser();
        return new InstructorSummaryResponse(instructor.getId(), user.getId(), user.getUsername(),
                user.getFullName(), user.getEmail(), instructor.getInstructorCode(), instructor.getDepartment(),
                instructor.getPhone(), instructor.isActive());
    }
}
