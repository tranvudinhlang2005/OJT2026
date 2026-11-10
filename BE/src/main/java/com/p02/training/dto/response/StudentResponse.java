package com.p02.training.dto.response;

import com.p02.training.entity.Student;
import com.p02.training.entity.User;
import com.p02.training.entity.enums.StudentStatus;
import java.time.LocalDate;

/**
 * A student as Admins see it (TR04): profile and account. {@code status} is the profile status that
 * TR10 checks; {@code accountActive} is the TR01 login status.
 */
public record StudentResponse(
        Long id,
        Long userId,
        String username,
        String fullName,
        String email,
        boolean accountActive,
        String studentCode,
        LocalDate dateOfBirth,
        String homeroomClass,
        StudentStatus status) {

    /** Expects the user to be loaded already, or loadable in the current transaction. */
    public static StudentResponse from(Student student) {
        User user = student.getUser();
        return new StudentResponse(student.getId(), user.getId(), user.getUsername(), user.getFullName(),
                user.getEmail(), user.isActive(), student.getStudentCode(), student.getDateOfBirth(),
                student.getHomeroomClass(), student.getStatus());
    }
}
