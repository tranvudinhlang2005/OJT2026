package com.p02.training.service;

import com.p02.training.audit.SecurityAuditLogger;
import com.p02.training.common.SearchPatterns;
import com.p02.training.dto.request.ChangeRoleRequest;
import com.p02.training.dto.request.ChangeStatusRequest;
import com.p02.training.dto.request.CreateUserRequest;
import com.p02.training.dto.request.ResetPasswordRequest;
import com.p02.training.dto.request.UpdateUserRequest;
import com.p02.training.dto.response.PageResponse;
import com.p02.training.dto.response.UserResponse;
import com.p02.training.entity.Instructor;
import com.p02.training.entity.Student;
import com.p02.training.entity.User;
import com.p02.training.entity.enums.SecurityAction;
import com.p02.training.entity.enums.UserRole;
import com.p02.training.exception.ApiException;
import com.p02.training.exception.ErrorCode;
import com.p02.training.repository.InstructorRepository;
import com.p02.training.repository.StudentRepository;
import com.p02.training.repository.UserRepository;
import com.p02.training.security.AuthenticatedUser;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * TR01 account management, for Training Admins only (enforced in SecurityConfig).
 *
 * <p>Check order follows spec 0.3: input (422) → existence (404) → business rules (409). Role and
 * status changes lock the active Admins first, then the target, so LAST_ADMIN holds under
 * concurrency.
 */
@Service
public class UserService {

    private static final String USER_DUPLICATE = "USER_DUPLICATE";
    private static final String USER_DUPLICATE_MESSAGE = "Tên đăng nhập, email hoặc mã đã tồn tại";
    private static final String SELF_MODIFICATION = "SELF_MODIFICATION";
    private static final String SELF_MODIFICATION_MESSAGE = "Không thể thay đổi tài khoản của chính bạn";
    private static final String LAST_ADMIN = "LAST_ADMIN";
    private static final String LAST_ADMIN_MESSAGE = "Hệ thống phải còn ít nhất một Training Admin";
    private static final String ROLE_CHANGE_NOT_ALLOWED = "ROLE_CHANGE_NOT_ALLOWED";
    private static final String ROLE_CHANGE_NOT_ALLOWED_MESSAGE =
            "Không thể đổi sang vai trò này, vui lòng tạo tài khoản mới";

    /** D04: roles can only switch between these two, because the others are tied to a profile. */
    private static final Set<UserRole> SWITCHABLE_ROLES =
            EnumSet.of(UserRole.TRAINING_ADMIN, UserRole.TRAINING_MANAGER);

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final InstructorRepository instructorRepository;
    private final PasswordService passwordService;
    private final SecurityAuditLogger auditLogger;

    public UserService(UserRepository userRepository, StudentRepository studentRepository,
            InstructorRepository instructorRepository, PasswordService passwordService,
            SecurityAuditLogger auditLogger) {
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.instructorRepository = instructorRepository;
        this.passwordService = passwordService;
        this.auditLogger = auditLogger;
    }

    /**
     * {@code GET /users?role=&isActive=&keyword=}. The keyword matches username, full name or email,
     * ignoring case. Sorted by id, because TR01 defines no sort field.
     */
    @Transactional(readOnly = true)
    public PageResponse<UserResponse> listUsers(UserRole role, Boolean isActive, String keyword, int page, int size) {
        Specification<User> specification = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (role != null) {
                predicates.add(cb.equal(root.get("role"), role));
            }
            if (isActive != null) {
                predicates.add(cb.equal(root.get("active"), isActive));
            }
            if (SearchPatterns.hasKeyword(keyword)) {
                String pattern = SearchPatterns.containsIgnoringCase(keyword);
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("username")), pattern, SearchPatterns.ESCAPE),
                        cb.like(cb.lower(root.get("fullName")), pattern, SearchPatterns.ESCAPE),
                        cb.like(cb.lower(root.get("email")), pattern, SearchPatterns.ESCAPE)));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "id"));
        return PageResponse.of(userRepository.findAll(specification, pageable), UserResponse::from);
    }

    /**
     * {@code POST /users}: creates the account and, for STUDENT or INSTRUCTOR, its profile, in one
     * transaction, then logs USER_CREATE.
     */
    @Transactional
    public UserResponse createUser(CreateUserRequest request, AuthenticatedUser actor) {
        passwordService.requireStrong(request.password());
        String profileCode = requiredProfileCode(request);

        if (userRepository.existsByUsernameIgnoringCase(request.username())
                || userRepository.existsByEmailIgnoringCase(request.email())
                || profileCodeExists(request.role(), profileCode)) {
            throw duplicate();
        }

        User user = new User(request.username(), request.email(), passwordService.hashStrong(request.password()),
                request.fullName(), request.role());
        try {
            userRepository.saveAndFlush(user);
            if (request.role() == UserRole.STUDENT) {
                studentRepository.saveAndFlush(new Student(user, profileCode));
            } else if (request.role() == UserRole.INSTRUCTOR) {
                instructorRepository.saveAndFlush(new Instructor(user, profileCode));
            }
        } catch (DataIntegrityViolationException ex) {
            // A concurrent request took the same username, email or code after the checks above.
            throw duplicate();
        }

        Map<String, Object> details = new LinkedHashMap<>();
        details.put("userId", user.getId());
        details.put("username", user.getUsername());
        details.put("role", user.getRole().name());
        auditLogger.record(SecurityAction.USER_CREATE, actor.username(), details);
        return UserResponse.from(user);
    }

    /** {@code PATCH /users/{id}}: full name and email. Does not end the user's sessions. */
    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request, AuthenticatedUser actor) {
        User user = lockUser(id);
        List<String> changed = new ArrayList<>();
        if (request.email() != null && !request.email().equals(user.getEmail())) {
            if (userRepository.existsByEmailIgnoringCaseAndIdNot(request.email(), id)) {
                throw duplicate();
            }
            user.setEmail(request.email());
            changed.add("email");
        }
        if (request.fullName() != null && !request.fullName().equals(user.getFullName())) {
            user.setFullName(request.fullName());
            changed.add("fullName");
        }
        try {
            userRepository.flush();
        } catch (DataIntegrityViolationException ex) {
            throw duplicate();
        }

        Map<String, Object> details = new LinkedHashMap<>();
        details.put("userId", user.getId());
        details.put("changedFields", changed);
        auditLogger.record(SecurityAction.USER_UPDATE, actor.username(), details);
        return UserResponse.from(user);
    }

    /**
     * {@code PATCH /users/{id}/role}: not on oneself, not demoting the last active Admin, only as D04
     * allows. token_version + 1 signs the user out at once; logs ROLE_CHANGE.
     */
    @Transactional
    public UserResponse changeRole(Long id, ChangeRoleRequest request, AuthenticatedUser actor) {
        List<User> activeAdmins = userRepository.lockActiveByRole(UserRole.TRAINING_ADMIN);
        User user = lockUser(id);
        rejectSelf(user, actor);

        UserRole oldRole = user.getRole();
        UserRole newRole = request.role();
        if (isActiveAdmin(user) && newRole != UserRole.TRAINING_ADMIN && activeAdmins.size() <= 1) {
            throw ApiException.conflict(LAST_ADMIN, LAST_ADMIN_MESSAGE);
        }
        if (!SWITCHABLE_ROLES.contains(oldRole) || !SWITCHABLE_ROLES.contains(newRole)) {
            throw ApiException.conflict(ROLE_CHANGE_NOT_ALLOWED, ROLE_CHANGE_NOT_ALLOWED_MESSAGE);
        }

        user.setRole(newRole);
        user.setTokenVersion(user.getTokenVersion() + 1);

        Map<String, Object> details = new LinkedHashMap<>();
        details.put("userId", user.getId());
        details.put("oldRole", oldRole.name());
        details.put("newRole", newRole.name());
        auditLogger.record(SecurityAction.ROLE_CHANGE, actor.username(), details);
        return UserResponse.from(user);
    }

    /**
     * {@code PATCH /users/{id}/status}: lock (false) or unlock (true). Not on oneself, not locking the
     * last active Admin. Unlocking also clears failed_login_count and locked_until. token_version + 1;
     * logs USER_STATUS_CHANGE.
     */
    @Transactional
    public UserResponse changeStatus(Long id, ChangeStatusRequest request, AuthenticatedUser actor) {
        List<User> activeAdmins = userRepository.lockActiveByRole(UserRole.TRAINING_ADMIN);
        User user = lockUser(id);
        rejectSelf(user, actor);

        boolean active = request.isActive();
        if (!active && isActiveAdmin(user) && activeAdmins.size() <= 1) {
            throw ApiException.conflict(LAST_ADMIN, LAST_ADMIN_MESSAGE);
        }

        user.setActive(active);
        if (active) {
            user.setFailedLoginCount(0);
            user.setLockedUntil(null);
        }
        user.setTokenVersion(user.getTokenVersion() + 1);

        Map<String, Object> details = new LinkedHashMap<>();
        details.put("userId", user.getId());
        details.put("isActive", active);
        auditLogger.record(SecurityAction.USER_STATUS_CHANGE, actor.username(), details);
        return UserResponse.from(user);
    }

    /**
     * {@code PATCH /users/{id}/password}: an Admin sets a new password for another user.
     * token_version + 1 signs the user out; logs PASSWORD_CHANGE.
     */
    @Transactional
    public void resetPassword(Long id, ResetPasswordRequest request, AuthenticatedUser actor) {
        passwordService.requireStrong(request.newPassword());
        User user = lockUser(id);
        rejectSelf(user, actor);

        user.setPasswordHash(passwordService.hashStrong(request.newPassword()));
        user.setTokenVersion(user.getTokenVersion() + 1);

        Map<String, Object> details = new LinkedHashMap<>();
        details.put("userId", user.getId());
        details.put("resetByAdmin", true);
        auditLogger.record(SecurityAction.PASSWORD_CHANGE, actor.username(), details);
    }

    private User lockUser(Long id) {
        return userRepository.findLockedById(id).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
    }

    private static void rejectSelf(User target, AuthenticatedUser actor) {
        if (target.getId().equals(actor.id())) {
            throw ApiException.conflict(SELF_MODIFICATION, SELF_MODIFICATION_MESSAGE);
        }
    }

    private static boolean isActiveAdmin(User user) {
        return user.getRole() == UserRole.TRAINING_ADMIN && user.isActive();
    }

    /** STUDENT needs studentCode and INSTRUCTOR needs instructorCode; other roles have no profile. */
    private static String requiredProfileCode(CreateUserRequest request) {
        return switch (request.role()) {
            case STUDENT -> requirePresent(request.studentCode(), "studentCode", "Mã học viên là bắt buộc");
            case INSTRUCTOR -> requirePresent(request.instructorCode(), "instructorCode", "Mã giảng viên là bắt buộc");
            case TRAINING_ADMIN, TRAINING_MANAGER -> null;
        };
    }

    private static String requirePresent(String value, String field, String message) {
        if (value == null || value.isBlank()) {
            throw ApiException.validation(field, message);
        }
        return value;
    }

    private boolean profileCodeExists(UserRole role, String code) {
        return switch (role) {
            case STUDENT -> studentRepository.existsByStudentCode(code);
            case INSTRUCTOR -> instructorRepository.existsByInstructorCode(code);
            case TRAINING_ADMIN, TRAINING_MANAGER -> false;
        };
    }

    private static ApiException duplicate() {
        return ApiException.conflict(USER_DUPLICATE, USER_DUPLICATE_MESSAGE);
    }
}
