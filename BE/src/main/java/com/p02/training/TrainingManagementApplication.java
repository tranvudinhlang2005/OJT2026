package com.p02.training;

import com.p02.training.bootstrap.AdminBootstrapCommand;
import java.util.Arrays;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * UserDetailsServiceAutoConfiguration is excluded so Spring Boot does not create its default
 * in-memory user with a generated password. Accounts come only from the database (TR01).
 *
 * <p>A first argument of {@code bootstrap-admin} runs the one-time first-Admin command (A-23)
 * instead of the server, then exits. Normal startup never creates an account.
 */
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
@ConfigurationPropertiesScan
public class TrainingManagementApplication {

    public static void main(String[] args) {
        if (args.length > 0 && AdminBootstrapCommand.NAME.equals(args[0])) {
            System.exit(AdminBootstrapCommand.run(TrainingManagementApplication.class,
                    Arrays.copyOfRange(args, 1, args.length)));
        }
        SpringApplication.run(TrainingManagementApplication.class, args);
    }
}
