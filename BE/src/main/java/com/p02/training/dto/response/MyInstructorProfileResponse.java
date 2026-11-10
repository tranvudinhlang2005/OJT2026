package com.p02.training.dto.response;

import com.p02.training.entity.Instructor;
import com.p02.training.entity.User;
import java.util.List;

/**
 * {@code GET /instructors/me} (TR03): the logged-in instructor's own profile and teachable courses.
 * Leaves out account details that only Admins manage.
 */
public record MyInstructorProfileResponse(
        Long id,
        String instructorCode,
        String fullName,
        String email,
        String department,
        String phone,
        boolean isActive,
        List<CourseSummaryResponse> courses) {

    public static MyInstructorProfileResponse from(Instructor instructor, List<CourseSummaryResponse> courses) {
        User user = instructor.getUser();
        return new MyInstructorProfileResponse(instructor.getId(), instructor.getInstructorCode(), user.getFullName(),
                user.getEmail(), instructor.getDepartment(), instructor.getPhone(), instructor.isActive(), courses);
    }
}
