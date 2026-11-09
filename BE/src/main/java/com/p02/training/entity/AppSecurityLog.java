package com.p02.training.entity;

import com.p02.training.entity.enums.SecurityAction;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Immutable;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * Security and action log (spec 0.6). Append-only, with no association to users, so it outlives what
 * it describes and survives a rollback.
 *
 * <p>{@code username} holds a real account's username or null, never raw login input (A-21c).
 * {@code details} must never contain passwords, hashes, tokens or cookies.
 */
@Entity
@Immutable
@Table(name = "app_security_log")
public class AppSecurityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, length = 30, updatable = false)
    private SecurityAction action;

    @Column(name = "username", length = 50, updatable = false)
    private String username;

    @Column(name = "ip_address", length = 45, updatable = false)
    private String ipAddress;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "details", updatable = false)
    private Map<String, Object> details;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected AppSecurityLog() {
    }

    public AppSecurityLog(SecurityAction action, String username, String ipAddress, Map<String, Object> details) {
        this.action = action;
        this.username = username;
        this.ipAddress = ipAddress;
        this.details = details == null ? null : new LinkedHashMap<>(details);
    }

    public Long getId() {
        return id;
    }

    public SecurityAction getAction() {
        return action;
    }

    public String getUsername() {
        return username;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public Map<String, Object> getDetails() {
        return details;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
