package com.p02.training.dto.response;

import com.p02.training.entity.AssessmentResult;
import com.p02.training.entity.ClassOffering;
import com.p02.training.entity.enums.FinalStatus;
import java.math.BigDecimal;

/** {@code GET /students/me/results} (TR15): one of the student's own results, only once CONFIRMED (D20). */
public record MyResultResponse(
        Long classId,
        String classCode,
        String courseCode,
        String courseName,
        String semester,
        BigDecimal midtermScore,
        BigDecimal finalScore,
        BigDecimal totalScore,
        BigDecimal attendanceRate,
        FinalStatus finalStatus) {

    /** Expects the class and course to be loaded, as the student query does. */
    public static MyResultResponse from(AssessmentResult result) {
        ClassOffering classOffering = result.getClassOffering();
        return new MyResultResponse(classOffering.getId(), classOffering.getClassCode(),
                classOffering.getCourse().getCode(), classOffering.getCourse().getName(), classOffering.getSemester(),
                result.getMidtermScore(), result.getFinalScore(), result.getTotalScore(), result.getAttendanceRate(),
                result.getFinalStatus());
    }
}
