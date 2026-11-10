package com.p02.training.dto.response;

import com.p02.training.entity.Enrollment;
import com.p02.training.entity.Student;
import com.p02.training.entity.enums.EnrollmentStatus;
import java.time.Instant;

/**
 * One student on a class roster (TR13). Deliberately limited to these fields: no email, date of
 * birth or phone.
 */
public record ClassStudentResponse(
        Long enrollmentId,
        Long studentId,
        String studentCode,
        String fullName,
        EnrollmentStatus enrollmentStatus,
        Instant enrolledAt) {

    /** Expects the student and their user to be loaded, as the roster query does. */
    public static ClassStudentResponse from(Enrollment enrollment) {
        Student student = enrollment.getStudent();
        return new ClassStudentResponse(enrollment.getId(), student.getId(), student.getStudentCode(),
                student.getUser().getFullName(), enrollment.getStatus(), enrollment.getEnrolledAt());
    }
}
