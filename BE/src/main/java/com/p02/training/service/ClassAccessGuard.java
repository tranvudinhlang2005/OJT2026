package com.p02.training.service;

import com.p02.training.audit.SecurityAuditLogger;
import com.p02.training.entity.ClassOffering;
import com.p02.training.entity.enums.SecurityAction;
import com.p02.training.entity.enums.UserRole;
import com.p02.training.exception.ApiException;
import com.p02.training.exception.ErrorCode;
import com.p02.training.security.AuthenticatedUser;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.stereotype.Component;

/**
 * Object-level permission for class data that only the assigned instructor may touch (TR14, TR15).
 * The instructor is identified from the session, never from the request. A refusal is 403 with
 * ACCESS_DENIED, written in its own transaction so a rollback cannot lose it (spec 0.3, 0.5).
 */
@Component
public class ClassAccessGuard {

    private final SecurityAuditLogger auditLogger;

    public ClassAccessGuard(SecurityAuditLogger auditLogger) {
        this.auditLogger = auditLogger;
    }

    /** True if the viewer is the instructor currently assigned to the class. */
    public static boolean isAssignedInstructor(ClassOffering classOffering, AuthenticatedUser viewer) {
        return viewer != null && viewer.role() == UserRole.INSTRUCTOR
                && classOffering.getInstructor() != null
                && classOffering.getInstructor().getUser().getId().equals(viewer.id());
    }

    /** Admin, or the class's assigned instructor (reads). */
    public void requireAdminOrAssigned(ClassOffering classOffering, AuthenticatedUser viewer, String resource) {
        boolean admin = viewer != null && viewer.role() == UserRole.TRAINING_ADMIN;
        if (!admin && !isAssignedInstructor(classOffering, viewer)) {
            deny(classOffering, viewer, resource);
        }
    }

    /** Only the class's assigned instructor (writes). */
    public void requireAssigned(ClassOffering classOffering, AuthenticatedUser viewer, String resource) {
        if (!isAssignedInstructor(classOffering, viewer)) {
            deny(classOffering, viewer, resource);
        }
    }

    private void deny(ClassOffering classOffering, AuthenticatedUser viewer, String resource) {
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("resource", resource);
        details.put("classId", classOffering.getId());
        auditLogger.recordIndependently(SecurityAction.ACCESS_DENIED, viewer == null ? null : viewer.username(),
                details);
        throw new ApiException(ErrorCode.FORBIDDEN);
    }
}
