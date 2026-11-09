package com.p02.training.config;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.SQLException;
import javax.sql.DataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/** Logs which database the application reached at startup. A failure stops startup. */
@Component
public class DatabaseConnectionVerifier implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConnectionVerifier.class);
    private static final int VALIDATION_TIMEOUT_SECONDS = 5;

    private final DataSource dataSource;

    public DatabaseConnectionVerifier(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void run(ApplicationArguments args) throws SQLException {
        try (Connection connection = dataSource.getConnection()) {
            if (!connection.isValid(VALIDATION_TIMEOUT_SECONDS)) {
                throw new IllegalStateException("Database connection failed validation");
            }
            DatabaseMetaData metadata = connection.getMetaData();
            log.info("Database connection verified: database={}, server={} {}",
                    connection.getCatalog(),
                    metadata.getDatabaseProductName(),
                    metadata.getDatabaseProductVersion());
        }
    }
}
