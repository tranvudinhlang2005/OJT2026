package com.p02.training.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

/**
 * One student's scores in a TR15 save. Each score is the value to store: null means "no score", so
 * sending null for an existing score clears it (A-27). A reason is required when an existing score
 * changes, including to null (D18, A-27); the service checks that. finalStatus, totalScore and
 * attendanceRate are not fields, so a client cannot set them.
 */
public record ResultItemRequest(
        @NotNull(message = "Học viên không được để trống")
        Long studentId,

        @DecimalMin(value = "0", message = "Điểm phải nằm trong thang 0–10")
        @DecimalMax(value = "10", message = "Điểm phải nằm trong thang 0–10")
        @Digits(integer = 2, fraction = 2, message = "Điểm có tối đa 2 chữ số thập phân")
        BigDecimal midtermScore,

        @DecimalMin(value = "0", message = "Điểm phải nằm trong thang 0–10")
        @DecimalMax(value = "10", message = "Điểm phải nằm trong thang 0–10")
        @Digits(integer = 2, fraction = 2, message = "Điểm có tối đa 2 chữ số thập phân")
        BigDecimal finalScore,

        String reason) {
}
