package com.p02.training.config;

import com.p02.training.entity.enums.UserRole;
import com.p02.training.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Warns at startup when no active TRAINING_ADMIN exists. It only reads: the application never
 * creates an Admin. The first Admin is created in the database with scripts/create-first-admin.sql.
 */
@Component
public class ActiveAdminStartupCheck implements ApplicationRunner {

    public static final String NO_ACTIVE_ADMIN_WARNING = "Chưa có TRAINING_ADMIN nào đang hoạt động";

    private static final Logger log = LoggerFactory.getLogger(ActiveAdminStartupCheck.class);

    private final UserRepository userRepository;

    public ActiveAdminStartupCheck(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.countByRoleAndActiveTrue(UserRole.TRAINING_ADMIN) == 0) {
            log.warn(NO_ACTIVE_ADMIN_WARNING);
        }
    }
}
