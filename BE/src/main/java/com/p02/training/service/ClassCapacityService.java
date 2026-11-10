package com.p02.training.service;

import com.p02.training.entity.ClassOffering;
import com.p02.training.exception.ApiException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * TR11 capacity rule: 0 ≤ enrolled_count ≤ max_capacity at all times, with the database CHECK
 * {@code ck_co_enrolled_count} as the last line of defence.
 *
 * <p>enrolled_count changes only together with an Enrollment change, in the same transaction: +1
 * when a student enrolls (TR10), −1 when a student cancels (TR12), 0 when the class is cancelled
 * (TR05, done in {@code ClassService.cancel}), unchanged when the class is completed (TR16).
 * Clients never send it. Callers must hold the ClassOffering row lock ({@code SELECT ... FOR
 * UPDATE}) before calling, so the value compared is current. The optional periodic reconciliation
 * in TR11 is not implemented.
 */
@Service
@Transactional(propagation = Propagation.MANDATORY)
public class ClassCapacityService {

    /** Takes one seat, or fails with 409 CLASS_FULL. The class row must already be locked. */
    public void takeSeat(ClassOffering lockedClass) {
        if (lockedClass.getEnrolledCount() >= lockedClass.getMaxCapacity()) {
            throw ApiException.conflict("CLASS_FULL", "Lớp học đã đủ sĩ số");
        }
        lockedClass.setEnrolledCount(lockedClass.getEnrolledCount() + 1);
    }

    /** Gives one seat back. The class row must already be locked. */
    public void releaseSeat(ClassOffering lockedClass) {
        if (lockedClass.getEnrolledCount() <= 0) {
            // An ENROLLED row exists, so the count cannot be 0 unless the data is inconsistent.
            throw new IllegalStateException("enrolled_count is already 0 for class " + lockedClass.getId());
        }
        lockedClass.setEnrolledCount(lockedClass.getEnrolledCount() - 1);
    }
}
