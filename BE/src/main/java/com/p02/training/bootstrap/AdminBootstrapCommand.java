package com.p02.training.bootstrap;

import com.p02.training.exception.ApiException;
import java.io.Console;
import java.util.Arrays;
import org.springframework.boot.Banner;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;

/**
 * One-time CLI command that creates the first TRAINING_ADMIN (decision A-23):
 *
 * <pre>java -jar training-management-backend.jar bootstrap-admin</pre>
 *
 * <p>It starts the application without a web server, with lazy bean initialisation (so only what
 * the bootstrap needs is created; JWT_SECRET is not required), asks for the account details on the
 * terminal, and exits. The password is read without echo and is never accepted from arguments,
 * environment variables or files. Nothing is printed or logged that contains it or its hash.
 *
 * <p>Exit codes: 0 created; 1 refused (an Admin exists, invalid input, cancelled); 2 no interactive
 * terminal; 3 unexpected failure.
 */
public final class AdminBootstrapCommand {

    public static final String NAME = "bootstrap-admin";

    static final int CREATED = 0;
    static final int REFUSED = 1;
    static final int NO_TERMINAL = 2;
    static final int FAILED = 3;

    private AdminBootstrapCommand() {
    }

    /** Runs the command. {@code springArgs} are passed to Spring, for example {@code --spring.datasource.url=...}. */
    public static int run(Class<?> applicationClass, String[] springArgs) {
        Console console = System.console();
        if (console == null) {
            System.err.println("bootstrap-admin needs an interactive terminal: the password is read without echo "
                    + "and cannot be piped or passed as an argument.");
            return NO_TERMINAL;
        }

        try (ConfigurableApplicationContext context = new SpringApplicationBuilder(applicationClass)
                .web(WebApplicationType.NONE)
                .lazyInitialization(true)
                .bannerMode(Banner.Mode.OFF)
                .logStartupInfo(false)
                .run(springArgs)) {
            return execute(console, context.getBean(AdminBootstrapService.class));
        } catch (RuntimeException ex) {
            // Startup or database failure. The exception holds no user input; details are in the log.
            System.err.println("bootstrap-admin failed: " + ex.getClass().getSimpleName()
                    + ". No account was created. See the log above for the cause.");
            return FAILED;
        }
    }

    private static int execute(Console console, AdminBootstrapService service) {
        if (service.adminExists()) {
            console.printf("A TRAINING_ADMIN account already exists (active or not). Bootstrap refused.%n"
                    + "If no Admin can sign in, follow the operator recovery procedure in "
                    + "docs/operations/admin-bootstrap-and-recovery.md.%n");
            return REFUSED;
        }

        console.printf("P02 first Admin bootstrap. No TRAINING_ADMIN exists yet.%n");
        String username = trim(console.readLine("Username (4-50 characters: a-z 0-9 . _): "));
        String fullName = trim(console.readLine("Full name: "));
        String email = trim(console.readLine("Email: "));

        char[] password = console.readPassword("Password (8-64 characters, upper case, lower case, digit): ");
        char[] confirmation = console.readPassword("Repeat password: ");
        try {
            if (password == null || confirmation == null || !Arrays.equals(password, confirmation)) {
                console.printf("The passwords do not match. No account was created.%n");
                return REFUSED;
            }
            String answer = trim(console.readLine("Create TRAINING_ADMIN '%s' <%s>? Type yes to continue: ",
                    username, email));
            if (!"yes".equals(answer)) {
                console.printf("Cancelled. No account was created.%n");
                return REFUSED;
            }

            Long id = service.createInitialAdmin(username, fullName, email, new String(password));
            console.printf("Created TRAINING_ADMIN '%s' (id %d). Sign in and keep these credentials "
                    + "with their designated holder.%n", username, id);
            return CREATED;
        } catch (AdminBootstrapException | ApiException ex) {
            console.printf("%s No account was created.%n", ex.getMessage());
            return REFUSED;
        } finally {
            wipe(password);
            wipe(confirmation);
        }
    }

    private static String trim(String value) {
        return value == null ? null : value.trim();
    }

    private static void wipe(char[] value) {
        if (value != null) {
            Arrays.fill(value, '\0');
        }
    }
}
