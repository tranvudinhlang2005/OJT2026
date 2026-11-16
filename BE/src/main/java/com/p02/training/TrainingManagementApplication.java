package com.p02.training;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * UserDetailsServiceAutoConfiguration is excluded so Spring Boot does not create its default
 * in-memory user with a generated password. Accounts come only from the database (TR01).
 *
 * <p>The application never creates an account by itself. The first TRAINING_ADMIN is inserted
 * directly in the database by an operator (scripts/create-first-admin.sql); later Admins are
 * promoted from TRAINING_MANAGER by another Admin through {@code PATCH /users/{id}/role}.
 */
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
@ConfigurationPropertiesScan
public class TrainingManagementApplication {

    public static void main(String[] args) {
        SpringApplication.run(TrainingManagementApplication.class, args);
    }
}
