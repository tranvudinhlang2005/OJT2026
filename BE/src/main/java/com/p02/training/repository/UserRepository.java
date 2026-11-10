package com.p02.training.repository;

import com.p02.training.entity.User;
import com.p02.training.entity.enums.UserRole;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Uses {@code @Query} for case-insensitive lookups because Spring Data's IgnoreCase generates
 * {@code upper(...)}, which cannot use the unique indexes on {@code LOWER(username)} and
 * {@code LOWER(email)}.
 */
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    /** TR01 login. */
    @Query("select u from User u where lower(u.username) = lower(:username)")
    Optional<User> findByUsernameIgnoringCase(@Param("username") String username);

    /** TR01 USER_DUPLICATE. */
    @Query("select count(u) > 0 from User u where lower(u.username) = lower(:username)")
    boolean existsByUsernameIgnoringCase(@Param("username") String username);

    /** TR01 USER_DUPLICATE on create (A-17). */
    @Query("select count(u) > 0 from User u where lower(u.email) = lower(:email)")
    boolean existsByEmailIgnoringCase(@Param("email") String email);

    /** TR01 USER_DUPLICATE when an Admin edits a user's email. */
    @Query("select count(u) > 0 from User u where lower(u.email) = lower(:email) and u.id <> :excludedId")
    boolean existsByEmailIgnoringCaseAndIdNot(@Param("email") String email, @Param("excludedId") Long excludedId);

    /** TR01 LAST_ADMIN. */
    long countByRoleAndActiveTrue(UserRole role);

    /** First Admin bootstrap (A-23): true for any Admin, active or not. */
    boolean existsByRole(UserRole role);

    /**
     * TR01 writes to one account (login counters, logout, password, role, status). The row lock stops
     * concurrent changes, such as two failed logins, from overwriting each other.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<User> findLockedById(Long id);

    /**
     * TR01 LAST_ADMIN: locks every active account with this role, in id order. Role and status
     * changes take this lock before locking their target, so two Admins demoting or deactivating
     * each other at the same time are serialised and cannot remove the last active Admin.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.role = :role and u.active = true order by u.id")
    List<User> lockActiveByRole(@Param("role") UserRole role);
}
