package com.p02.training;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.ZoneId;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Starts the full application against the configured PostgreSQL. Flyway really runs, as it does at
 * normal startup. Skipped when DB_PASSWORD is not set, so check the Maven summary for skipped tests.
 */
@SpringBootTest
@EnabledIfEnvironmentVariable(named = "DB_PASSWORD", matches = ".+")
class DatabaseFoundationIntegrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private Flyway flyway;

    @Autowired
    private Environment environment;

    @Autowired
    private Clock clock;

    @Test
    void connectsToPostgresql() {
        assertThat(jdbcTemplate.queryForObject("SELECT version()", String.class)).startsWith("PostgreSQL");
    }

    @Test
    void flywayHasNoPendingOrFailedMigrations() {
        assertThat(flyway.info().pending()).isEmpty();
        assertThat(flyway.validateWithResult().validationSuccessful).isTrue();
    }

    @Test
    void requiredConfigurationIsActive() {
        assertThat(environment.getProperty("spring.jpa.hibernate.ddl-auto")).isEqualTo("validate");
        assertThat(environment.getProperty("spring.jpa.open-in-view")).isEqualTo("false");
        assertThat(environment.getProperty("spring.jpa.properties.hibernate.jdbc.time_zone")).isEqualTo("UTC");
        assertThat(clock.getZone()).isEqualTo(ZoneId.of("Asia/Ho_Chi_Minh"));
    }
}
