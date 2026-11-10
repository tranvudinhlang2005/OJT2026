package com.p02.training.service;

import com.p02.training.audit.SecurityAuditLogger;
import com.p02.training.common.SearchPatterns;
import com.p02.training.dto.request.ChangeStudentStatusRequest;
import com.p02.training.dto.request.UpdateStudentRequest;
import com.p02.training.dto.response.MyStudentProfileResponse;
import com.p02.training.dto.response.PageResponse;
import com.p02.training.dto.response.StudentResponse;
import com.p02.training.entity.Student;
import com.p02.training.entity.User;
import com.p02.training.entity.enums.SecurityAction;
import com.p02.training.entity.enums.StudentStatus;
import com.p02.training.exception.ApiException;
import com.p02.training.exception.ErrorCode;
import com.p02.training.repository.StudentRepository;
import com.p02.training.security.AuthenticatedUser;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * TR04 student management. Profiles are created with the account in TR01; TR04 only updates them.
 * Admins read and write; a student reads only their own profile (/me). Roles are enforced in
 * SecurityConfig. Writes lock the Student row (spec 0.5) and log STUDENT_CHANGE in their transaction.
 */
@Service
public class StudentService {

    private static final String STUDENT_CODE_DUPLICATE = "STUDENT_CODE_DUPLICATE";
    private static final String STUDENT_CODE_DUPLICATE_MESSAGE = "Mã học viên đã tồn tại";

    private final StudentRepository studentRepository;
    private final SecurityAuditLogger auditLogger;
    private final Clock clock;

    public StudentService(StudentRepository studentRepository, SecurityAuditLogger auditLogger, Clock clock) {
        this.studentRepository = studentRepository;
        this.auditLogger = auditLogger;
        this.clock = clock;
    }

    /**
     * {@code GET /students?keyword=&status=}. keyword matches the student code, full name, username or
     * email, ignoring case. Sorted by student code, because TR04 defines no sort field. Accounts are
     * loaded in the same query.
     */
    @Transactional(readOnly = true)
    public PageResponse<StudentResponse> listStudents(String keyword, StudentStatus status, int page, int size) {
        Specification<Student> specification = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (SearchPatterns.hasKeyword(keyword)) {
                String pattern = SearchPatterns.containsIgnoringCase(keyword);
                Join<Student, User> user = root.join("user");
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("studentCode")), pattern, SearchPatterns.ESCAPE),
                        cb.like(cb.lower(user.get("fullName")), pattern, SearchPatterns.ESCAPE),
                        cb.like(cb.lower(user.get("username")), pattern, SearchPatterns.ESCAPE),
                        cb.like(cb.lower(user.get("email")), pattern, SearchPatterns.ESCAPE)));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        PageRequest pageable = PageRequest.of(page, size, Sort.by("studentCode").and(Sort.by("id")));
        return PageResponse.of(studentRepository.findAll(specification, pageable), StudentResponse::from);
    }

    /** {@code GET /students/{id}} for Admins. */
    @Transactional(readOnly = true)
    public StudentResponse getStudent(Long id) {
        return StudentResponse.from(studentRepository.findById(id).orElseThrow(StudentService::notFound));
    }

    /** {@code GET /students/me}: the logged-in student's own profile. 404 if the account has none. */
    @Transactional(readOnly = true)
    public MyStudentProfileResponse getMyProfile(AuthenticatedUser currentUser) {
        Student student = studentRepository.findByUser_Id(currentUser.id()).orElseThrow(StudentService::notFound);
        return MyStudentProfileResponse.from(student);
    }

    /** {@code PUT /students/{id}}: code (unique), date of birth (before today), homeroom class. */
    @Transactional
    public StudentResponse updateStudent(Long id, UpdateStudentRequest request, AuthenticatedUser actor) {
        if (request.dateOfBirth() != null && !request.dateOfBirth().isBefore(LocalDate.now(clock))) {
            throw ApiException.validation("dateOfBirth", "Ngày sinh phải trước ngày hôm nay");
        }
        Student student = lockStudent(id);
        if (studentRepository.existsByStudentCodeAndIdNot(request.studentCode(), id)) {
            throw duplicateCode();
        }
        student.setStudentCode(request.studentCode());
        student.setDateOfBirth(request.dateOfBirth());
        student.setHomeroomClass(request.homeroomClass());
        try {
            studentRepository.flush();
        } catch (DataIntegrityViolationException ex) {
            // Another request took the same code after the check above.
            throw duplicateCode();
        }
        log(actor, "UPDATE", student);
        return StudentResponse.from(student);
    }

    /**
     * {@code PATCH /students/{id}/status}. SUSPENDED or INACTIVE only blocks new registrations
     * (TR10): existing enrollments and scores are left untouched.
     */
    @Transactional
    public StudentResponse changeStatus(Long id, ChangeStudentStatusRequest request, AuthenticatedUser actor) {
        Student student = lockStudent(id);
        student.setStatus(request.status());
        log(actor, "STATUS", student);
        return StudentResponse.from(student);
    }

    private Student lockStudent(Long id) {
        return studentRepository.findLockedById(id).orElseThrow(StudentService::notFound);
    }

    private void log(AuthenticatedUser actor, String operation, Student student) {
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("operation", operation);
        details.put("studentId", student.getId());
        details.put("studentCode", student.getStudentCode());
        if ("STATUS".equals(operation)) {
            details.put("status", student.getStatus().name());
        }
        auditLogger.record(SecurityAction.STUDENT_CHANGE, actor.username(), details);
    }

    private static ApiException notFound() {
        return new ApiException(ErrorCode.NOT_FOUND);
    }

    private static ApiException duplicateCode() {
        return ApiException.conflict(STUDENT_CODE_DUPLICATE, STUDENT_CODE_DUPLICATE_MESSAGE);
    }
}
