package com.p02.training.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.function.Supplier;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

/** Every test runs in a transaction that rolls back, as the cleanup policy requires. */
@SpringBootTest
@Transactional
@EnabledIfEnvironmentVariable(named = "DB_PASSWORD", matches = ".+")
abstract class RepositoryTestSupport {

    @PersistenceContext
    protected EntityManager entityManager;

    protected TestData data;

    @BeforeEach
    void createTestData() {
        data = new TestData(entityManager);
    }

    /** Clears the persistence context first, so every association really has to be loaded. */
    protected long countStatements(Supplier<?> action) {
        data.flushAndClear();
        Statistics statistics = entityManager.getEntityManagerFactory().unwrap(SessionFactory.class).getStatistics();
        statistics.setStatisticsEnabled(true);
        statistics.clear();
        try {
            action.get();
            return statistics.getPrepareStatementCount();
        } finally {
            statistics.setStatisticsEnabled(false);
        }
    }
}
