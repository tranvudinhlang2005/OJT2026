package com.p02.training.testsupport;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;

/**
 * Checks the settings tests really resolve to. NoBeans turns off auto-configuration, so this test
 * opens no database connection and is safe to run in any environment.
 */
@SpringBootTest(classes = TestDatabaseConfigurationTest.NoBeans.class,
        webEnvironment = SpringBootTest.WebEnvironment.NONE)
class TestDatabaseConfigurationTest {

    @Autowired
    private Environment environment;

    @Test
    void testProfileIsActiveWithoutAnyAnnotation() {
        assertThat(environment.getActiveProfiles()).contains("test");
    }

    @Test
    void datasourceAndFlywayUseOnlyTheTestDatabase() {
        assertThat(environment.getProperty("spring.datasource.url"))
                .isEqualTo("jdbc:postgresql://localhost:5432/p02_training_test");
        assertThat(environment.getProperty("spring.flyway.url")).isNull();
        assertThat(environment.getProperty("spring.datasource.hikari.jdbc-url")).isNull();
    }

    @Test
    void flywayStaysSafeAndHibernateNeverChangesTheSchema() {
        assertThat(environment.getProperty("spring.flyway.enabled")).isEqualTo("true");
        assertThat(environment.getProperty("spring.flyway.locations")).isEqualTo("classpath:db/migration");
        assertThat(environment.getProperty("spring.flyway.clean-disabled")).isEqualTo("true");
        assertThat(environment.getProperty("spring.flyway.baseline-on-migrate")).isEqualTo("false");
        assertThat(environment.getProperty("spring.jpa.hibernate.ddl-auto")).isEqualTo("validate");
    }

    /** Deliberately has no annotations: a plain bean that gives the test a context and nothing else. */
    static class NoBeans {
    }
}
