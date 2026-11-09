package com.p02.training.testsupport;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.context.support.GenericApplicationContext;
import org.springframework.mock.env.MockEnvironment;

class TestDatabaseGuardTest {

    private static final String DATASOURCE_URL = "spring.datasource.url";
    private static final String MAIN_DATABASE_URL = "jdbc:postgresql://localhost:5432/p02_training";

    @Test
    void allowsTheTestDatabase() {
        assertThatCode(() -> guard(new MockEnvironment()
                .withProperty(DATASOURCE_URL, TestDatabaseGuard.TEST_DATABASE_URL)))
                .doesNotThrowAnyException();
    }

    @Test
    void refusesAMissingUrl() {
        assertRefused(new MockEnvironment(), DATASOURCE_URL);
    }

    @ParameterizedTest
    @ValueSource(strings = {
            MAIN_DATABASE_URL,
            "jdbc:postgresql://localhost:5432/p02_training_test2",
            "jdbc:postgresql://localhost:5432/P02_TRAINING_TEST",
            "jdbc:postgresql://localhost:5432/p02_training_test?PGDBNAME=p02_training",
            "jdbc:postgresql://other-host:5432/p02_training_test"
    })
    void refusesAnyOtherDatasourceUrl(String url) {
        assertRefused(new MockEnvironment().withProperty(DATASOURCE_URL, url), DATASOURCE_URL);
    }

    @ParameterizedTest
    @ValueSource(strings = {"spring.flyway.url", "spring.datasource.hikari.jdbc-url"})
    void refusesAnOverrideThatPointsElsewhere(String property) {
        assertRefused(new MockEnvironment()
                .withProperty(DATASOURCE_URL, TestDatabaseGuard.TEST_DATABASE_URL)
                .withProperty(property, MAIN_DATABASE_URL), property);
    }

    @Test
    void errorMessageDoesNotRevealTheUrl() {
        String secretUrl = "jdbc:postgresql://localhost:5432/other?password=secret-value";

        assertThatThrownBy(() -> guard(new MockEnvironment().withProperty(DATASOURCE_URL, secretUrl)))
                .message().doesNotContain("secret-value");
    }

    private static void assertRefused(MockEnvironment environment, String property) {
        assertThatThrownBy(() -> guard(environment))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining(property);
    }

    private static void guard(MockEnvironment environment) {
        try (GenericApplicationContext context = new GenericApplicationContext()) {
            context.setEnvironment(environment);
            new TestDatabaseGuard().initialize(context);
        }
    }
}
