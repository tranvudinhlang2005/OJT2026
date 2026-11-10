package com.p02.training.bootstrap;

import com.p02.training.audit.SecurityAuditLogger;
import com.p02.training.dto.request.CreateUserRequest;
import com.p02.training.entity.User;
import com.p02.training.entity.enums.SecurityAction;
import com.p02.training.entity.enums.UserRole;
import com.p02.training.repository.UserRepository;
import com.p02.training.service.PasswordService;
import jakarta.persistence.EntityManager;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Creates the first TRAINING_ADMIN (decision A-23, one-time CLI bootstrap). Called only by
 * {@link AdminBootstrapCommand}; there is no HTTP endpoint and nothing runs it at startup.
 *
 * <p>Refuses whenever any TRAINING_ADMIN row exists, active or not. Concurrent runs are serialised
 * by a PostgreSQL transaction-level advisory lock, and the "no Admin yet" check is repeated after
 * the lock is held, so at most one initial Admin can ever be created.
 */
@Service
public class AdminBootstrapService {

    /** Advisory lock key reserved for this bootstrap: the ASCII bytes of "P02ADMIN". */
    static final long BOOTSTRAP_LOCK_KEY = 0x5030_3241_444D_494EL;

    static final String SOURCE = "CLI_BOOTSTRAP";

    private final EntityManager entityManager;
    private final UserRepository userRepository;
    private final PasswordService passwordService;
    private final SecurityAuditLogger auditLogger;
    private final Validator validator;

    public AdminBootstrapService(EntityManager entityManager, UserRepository userRepository,
            PasswordService passwordService, SecurityAuditLogger auditLogger, Validator validator) {
        this.entityManager = entityManager;
        this.userRepository = userRepository;
        this.passwordService = passwordService;
        this.auditLogger = auditLogger;
        this.validator = validator;
    }

    /** True if any TRAINING_ADMIN exists, including inactive ones. Lets the CLI stop before asking for a password. */
    @Transactional(readOnly = true)
    public boolean adminExists() {
        return userRepository.existsByRole(UserRole.TRAINING_ADMIN);
    }

    /**
     * Validates the input with the TR01 rules, then, in one transaction: takes the bootstrap lock,
     * re-checks that no Admin exists, inserts the Admin with a BCrypt hash, and logs USER_CREATE.
     *
     * @return the new Admin's id
     * @throws AdminBootstrapException if an Admin already exists, the input is invalid, or the
     *         username or email is taken
     * @throws com.p02.training.exception.ApiException WEAK_PASSWORD if the password fails TR01
     */
    @Transactional
    public Long createInitialAdmin(String username, String fullName, String email, String password) {
        CreateUserRequest request = new CreateUserRequest(username, email, password, fullName,
                UserRole.TRAINING_ADMIN, null, null);
        validate(request);
        passwordService.requireStrong(password);

        acquireBootstrapLock();
        if (userRepository.existsByRole(UserRole.TRAINING_ADMIN)) {
            throw new AdminBootstrapException(
                    "A TRAINING_ADMIN account already exists (active or not). Bootstrap refused.");
        }
        if (userRepository.existsByUsernameIgnoringCase(username) || userRepository.existsByEmailIgnoringCase(email)) {
            throw new AdminBootstrapException("The username or email is already used by another account.");
        }

        User admin = new User(username, email, passwordService.hashStrong(password), fullName,
                UserRole.TRAINING_ADMIN);
        try {
            userRepository.saveAndFlush(admin);
        } catch (DataIntegrityViolationException ex) {
            throw new AdminBootstrapException("The username or email is already used by another account.");
        }

        // No credential, hash or IP (there is no request). username is the new real account (A-21).
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("userId", admin.getId());
        details.put("role", UserRole.TRAINING_ADMIN.name());
        details.put("source", SOURCE);
        auditLogger.record(SecurityAction.USER_CREATE, admin.getUsername(), details);
        return admin.getId();
    }

    /**
     * Blocks until no other bootstrap transaction holds the lock; released at commit or rollback.
     * Wrapped in a subquery because pg_advisory_xact_lock returns void, which JPA cannot map.
     */
    private void acquireBootstrapLock() {
        entityManager.createNativeQuery("SELECT 1 FROM (SELECT pg_advisory_xact_lock(:key)) AS bootstrap_lock")
                .setParameter("key", BOOTSTRAP_LOCK_KEY)
                .getSingleResult();
    }

    /** Reports the failing fields and rule messages only, never the values. */
    private void validate(CreateUserRequest request) {
        Set<ConstraintViolation<CreateUserRequest>> violations = validator.validate(request);
        if (!violations.isEmpty()) {
            String problems = violations.stream()
                    .sorted(Comparator.comparing(violation -> violation.getPropertyPath().toString()))
                    .map(violation -> violation.getPropertyPath() + ": " + violation.getMessage())
                    .collect(Collectors.joining("; "));
            throw new AdminBootstrapException("Invalid input. " + problems);
        }
    }
}
