package com.p02.training.audit;

import com.p02.training.entity.AppSecurityLog;
import com.p02.training.entity.enums.SecurityAction;
import com.p02.training.repository.AppSecurityLogRepository;
import com.p02.training.security.ClientIp;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * The only writer of {@code app_security_log} (spec 0.6). The IP address comes from the current
 * request.
 *
 * <p>Callers pass {@code username} only as a real account's username, or null (A-21). {@code details}
 * must never contain passwords, hashes, tokens or cookies.
 */
@Component
public class SecurityAuditLogger {

    private static final Logger log = LoggerFactory.getLogger(SecurityAuditLogger.class);

    private final AppSecurityLogRepository repository;
    private final TransactionTemplate independentTransaction;

    public SecurityAuditLogger(AppSecurityLogRepository repository, PlatformTransactionManager transactionManager) {
        this.repository = repository;
        this.independentTransaction = new TransactionTemplate(transactionManager);
        this.independentTransaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    /**
     * Records an action inside the caller's business transaction, so the entry commits or rolls back
     * together with the change it describes (spec 0.3, last step).
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void record(SecurityAction action, String username, Map<String, Object> details) {
        repository.save(new AppSecurityLog(action, username, currentIp(), details));
    }

    /**
     * Records a refusal (ACCESS_DENIED, LOGIN_FAILED) in its own transaction, so a rollback of the
     * business transaction cannot lose it (spec 0.5). A failure to write is logged and swallowed, so
     * it never changes the response the client gets.
     */
    public void recordIndependently(SecurityAction action, String username, Map<String, Object> details) {
        String ip = currentIp();
        try {
            independentTransaction.executeWithoutResult(
                    status -> repository.save(new AppSecurityLog(action, username, ip, details)));
        } catch (RuntimeException ex) {
            log.error("Could not write security log entry for action {}", action, ex);
        }
    }

    private static String currentIp() {
        return ClientIp.current();
    }
}
