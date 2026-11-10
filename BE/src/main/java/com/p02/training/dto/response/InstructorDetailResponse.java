package com.p02.training.dto.response;

import com.p02.training.entity.Instructor;
import com.p02.training.entity.User;
import java.util.List;

/**
 * An instructor as Admins see it (TR03, "Admin thấy đầy đủ"): profile, account and teachable
 * courses. {@code isActive} is the profile's flag; {@code accountActive} is the TR01 login status.
 */
public record InstructorDetailResponse(
        Long id,
        Long userId,
        String username,
        String fullName,
        String email,
        boolean accountActive,
        String instructorCode,
        String department,
        String phone,
        boolean isActive,
        List<CourseSummaryResponse> courses) {

    public static InstructorDetailResponse from(Instructor instructor, List<CourseSummaryResponse> courses) {
        User user = instructor.getUser();
        return new InstructorDetailResponse(instructor.getId(), user.getId(), user.getUsername(), user.getFullName(),
                user.getEmail(), user.isActive(), instructor.getInstructorCode(), instructor.getDepartment(),
                instructor.getPhone(), instructor.isActive(), courses);
    }
}
