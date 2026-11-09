package com.p02.training.testsupport;

import java.util.List;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.Environment;

/**
 * Stops any test context that is not pointed at the test database. It runs before beans are
 * created, so Flyway and Hibernate never connect to the wrong database.
 *
 * <p>Environment variables outrank application-test.yml, so the YAML alone cannot prevent this.
 * Registered through META-INF/spring.factories on the test classpath only. Error messages name the
 * property but never its value, because a JDBC URL can contain credentials.
 */
public class TestDatabaseGuard implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    public static final String TEST_DATABASE_URL = "jdbc:postgresql://localhost:5432/p02_training_test";

    private static final String DATASOURCE_URL = "spring.datasource.url";

    /** These replace the datasource URL when set, so they must also match or be absent. */
    private static final List<String> OVERRIDING_URLS =
            List.of("spring.datasource.hikari.jdbc-url", "spring.flyway.url");

    @Override
    public void initialize(ConfigurableApplicationContext context) {
        Environment environment = context.getEnvironment();
        if (!TEST_DATABASE_URL.equals(environment.getProperty(DATASOURCE_URL))) {
            throw refusal(DATASOURCE_URL);
        }
        for (String property : OVERRIDING_URLS) {
            String value = environment.getProperty(property);
            if (value != null && !TEST_DATABASE_URL.equals(value)) {
                throw refusal(property);
            }
        }
    }

    private static IllegalStateException refusal(String property) {
        return new IllegalStateException(
                "Refusing to start: " + property + " is not the test database p02_training_test");
    }
}
