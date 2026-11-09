package com.p02.training;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * UserDetailsServiceAutoConfiguration is excluded so Spring Boot does not create its default
 * in-memory user with a generated password. Accounts come only from the database (TR01).
 */
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
@ConfigurationPropertiesScan
public class TrainingManagementApplication {

    public static void main(String[] args) {
        SpringApplication.run(TrainingManagementApplication.class, args);
    }
}
