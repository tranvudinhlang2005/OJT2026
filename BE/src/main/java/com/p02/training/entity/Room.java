package com.p02.training.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** A room that sessions use. */
@Entity
@Table(name = "room")
public class Room extends AuditedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @Column(name = "code", nullable = false, length = 30)
    private String code;

    @Column(name = "capacity", nullable = false)
    private int capacity;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    protected Room() {
    }

    public Room(String code, int capacity) {
        this.code = code;
        this.capacity = capacity;
    }

    public Long getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public int getCapacity() {
        return capacity;
    }

    public void setCapacity(int capacity) {
        this.capacity = capacity;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
