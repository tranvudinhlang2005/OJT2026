package com.p02.training.dto.response;

import com.p02.training.entity.Student;
import com.p02.training.entity.User;
import com.p02.training.entity.enums.StudentStatus;
import java.time.LocalDate;

/** {@code GET /students/me} (TR04): the logged-in student's full profile. */
public record MyStudentProfileResponse(
        Long id,
        String studentCode,
        String fullName,
        String email,
        LocalDate dateOfBirth,
        String homeroomClass,
        StudentStatus status) {

    public static MyStudentProfileResponse from(Student student) {
        User user = student.getUser();
        return new MyStudentProfileResponse(student.getId(), student.getStudentCode(), user.getFullName(),
                user.getEmail(), student.getDateOfBirth(), student.getHomeroomClass(), student.getStatus());
    }
}
