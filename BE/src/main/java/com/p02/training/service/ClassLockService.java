package com.p02.training.service;

import com.p02.training.entity.ClassOffering;
import com.p02.training.entity.Instructor;
import com.p02.training.exception.ApiException;
import com.p02.training.exception.ErrorCode;
import com.p02.training.repository.ClassOfferingRepository;
import com.p02.training.repository.InstructorRepository;
import java.util.Objects;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Row locks for class writes, in the order of spec 0.5: Instructor → (Room) → ClassOffering.
 * Used by TR05, TR06 and TR07. Every method must run inside the caller's transaction.
 *
 * <p>A class must never be loaded before it is locked: Hibernate would return the cached instance
 * from a later locking query without refreshing it. The instructor id is therefore read as a scalar
 * first, and compared with the locked class afterwards.
 */
@Service
@Transactional(propagation = Propagation.MANDATORY)
public class ClassLockService {

    private final ClassOfferingRepository classOfferingRepository;
    private final InstructorRepository instructorRepository;

    public ClassLockService(ClassOfferingRepository classOfferingRepository,
            InstructorRepository instructorRepository) {
        this.classOfferingRepository = classOfferingRepository;
        this.instructorRepository = instructorRepository;
    }

    /** The class's current instructor id, without loading the class. Null if none (or no class). */
    public Long currentInstructorId(Long classId) {
        return classOfferingRepository.findInstructorIdById(classId).orElse(null);
    }

    /** Locks the instructor, or does nothing for null. 404 if it no longer exists. */
    public Instructor lockInstructor(Long instructorId) {
        if (instructorId == null) {
            return null;
        }
        return instructorRepository.findLockedById(instructorId).orElseThrow(ClassLockService::notFound);
    }

    /** Locks the class. 404 if it does not exist or is soft-deleted (spec 0.4). */
    public ClassOffering lockClass(Long classId) {
        ClassOffering classOffering = classOfferingRepository.findLockedById(classId)
                .orElseThrow(ClassLockService::notFound);
        if (classOffering.getDeletedAt() != null) {
            throw notFound();
        }
        return classOffering;
    }

    /**
     * Fails with 409 VERSION_CONFLICT if the locked class's instructor is not the one locked before
     * it, which means another request assigned an instructor in between.
     */
    public void requireSameInstructor(ClassOffering classOffering, Long lockedInstructorId) {
        Long actual = classOffering.getInstructor() == null ? null : classOffering.getInstructor().getId();
        if (!Objects.equals(actual, lockedInstructorId)) {
            throw new ApiException(ErrorCode.VERSION_CONFLICT);
        }
    }

    private static ApiException notFound() {
        return new ApiException(ErrorCode.NOT_FOUND);
    }
}
