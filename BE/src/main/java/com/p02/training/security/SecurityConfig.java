package com.p02.training.security;

import com.p02.training.common.ApiPaths;
import com.p02.training.common.TraceIdFilter;
import com.p02.training.config.AppProperties;
import com.p02.training.entity.enums.UserRole;
import java.util.List;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfFilter;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Security filter chain and the central role rules.
 *
 * <p>Filter order: JWT cookie authentication → CSRF → login rate limit → authorization. Role rules
 * live only in {@link #securityFilterChain}, so every role check is in one place and its refusals
 * are logged by {@link SecurityErrorHandler}. Roles come from the database through
 * {@link AccessTokenAuthenticator}.
 */
@Configuration
public class SecurityConfig {

    public static final String CSRF_HEADER = "X-XSRF-TOKEN";

    private static final String ADMIN = UserRole.TRAINING_ADMIN.name();
    private static final String INSTRUCTOR = UserRole.INSTRUCTOR.name();
    private static final String STUDENT = UserRole.STUDENT.name();
    private static final String MANAGER = UserRole.TRAINING_MANAGER.name();

    // Only in a servlet application: the bootstrap-admin CLI runs without a web server, where
    // HttpSecurity does not exist.
    @Bean
    @ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
    public SecurityFilterChain securityFilterChain(HttpSecurity http, SecurityErrorHandler errorHandler,
            AccessTokenAuthenticator accessTokenAuthenticator, LoginRateLimiter loginRateLimiter) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf
                        .csrfTokenRepository(csrfTokenRepository())
                        // Compare the raw token. The default handler expects a masked value,
                        // which does not fit the plain cookie/header double-submit in spec 0.2.
                        .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .requestCache(AbstractHttpConfigurer::disable)
                .addFilterBefore(new JwtAuthenticationFilter(accessTokenAuthenticator), CsrfFilter.class)
                .addFilterAfter(new LoginRateLimitFilter(loginRateLimiter, errorHandler), CsrfFilter.class)
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint(errorHandler)
                        .accessDeniedHandler(errorHandler))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.GET, ApiPaths.CSRF).permitAll()
                        .requestMatchers(HttpMethod.POST, ApiPaths.LOGIN).permitAll()
                        // TR01 account management: Training Admin only (spec part 3).
                        .requestMatchers(ApiPaths.USERS, ApiPaths.USERS + "/**").hasRole(ADMIN)
                        // TR02: every role reads courses (non-Admins see active ones only, in the
                        // service); only Training Admins write.
                        .requestMatchers(HttpMethod.GET, ApiPaths.COURSES, ApiPaths.COURSES + "/**").authenticated()
                        .requestMatchers(ApiPaths.COURSES, ApiPaths.COURSES + "/**").hasRole(ADMIN)
                        // TR03: an instructor reads only their own profile; everything else is Admin.
                        // Must come before the general rule, which also matches /me.
                        .requestMatchers(HttpMethod.GET, ApiPaths.MY_INSTRUCTOR_PROFILE).hasRole(INSTRUCTOR)
                        .requestMatchers(ApiPaths.INSTRUCTORS, ApiPaths.INSTRUCTORS + "/**").hasRole(ADMIN)
                        // TR04: a student reads only their own profile; everything else is Admin
                        // (a student calling /students/{id} gets 403).
                        .requestMatchers(HttpMethod.GET, ApiPaths.MY_STUDENT_PROFILE).hasRole(STUDENT)
                        // TR10 "my enrollments": Student. Must come before the general /students rule.
                        .requestMatchers(HttpMethod.GET, ApiPaths.MY_ENROLLMENTS).hasRole(STUDENT)
                        // TR15 "my results": Student. Must come before the general /students rule.
                        .requestMatchers(HttpMethod.GET, ApiPaths.MY_RESULTS).hasRole(STUDENT)
                        .requestMatchers(ApiPaths.STUDENTS, ApiPaths.STUDENTS + "/**").hasRole(ADMIN)
                        // TR06 rooms: Admin only, reads included.
                        .requestMatchers(ApiPaths.ROOMS, ApiPaths.ROOMS + "/**").hasRole(ADMIN)
                        // TR06: every role reads a class's sessions; the service limits the scope.
                        .requestMatchers(HttpMethod.GET, ApiPaths.CLASSES + "/*/sessions").authenticated()
                        // TR05, TR06, TR07 writes: Admin only. Listed one by one, so later features
                        // under /classes and /sessions (TR09-TR16) set their own rules.
                        .requestMatchers(HttpMethod.POST, ApiPaths.CLASSES).hasRole(ADMIN)
                        .requestMatchers(HttpMethod.PUT, ApiPaths.CLASSES + "/*", ApiPaths.CLASSES + "/*/instructor")
                        .hasRole(ADMIN)
                        .requestMatchers(HttpMethod.PATCH, ApiPaths.CLASSES + "/*/capacity").hasRole(ADMIN)
                        .requestMatchers(HttpMethod.POST, ApiPaths.CLASSES + "/*/publish", ApiPaths.CLASSES + "/*/unpublish",
                                ApiPaths.CLASSES + "/*/start", ApiPaths.CLASSES + "/*/cancel",
                                ApiPaths.CLASSES + "/*/sessions")
                        .hasRole(ADMIN)
                        .requestMatchers(HttpMethod.DELETE, ApiPaths.CLASSES + "/*").hasRole(ADMIN)
                        .requestMatchers(HttpMethod.PUT, ApiPaths.SESSIONS + "/*").hasRole(ADMIN)
                        .requestMatchers(HttpMethod.DELETE, ApiPaths.SESSIONS + "/*").hasRole(ADMIN)
                        // TR10, TR12: only students register and cancel (others: 403 + ACCESS_DENIED).
                        .requestMatchers(HttpMethod.POST, ApiPaths.ENROLLMENTS, ApiPaths.ENROLLMENTS + "/*/cancel")
                        .hasRole(STUDENT)
                        // TR13: Admin or Instructor; Students and Managers get 403 + ACCESS_DENIED. The
                        // service then limits an instructor to their own classes.
                        .requestMatchers(HttpMethod.GET, ApiPaths.CLASSES + "/*/students").hasAnyRole(ADMIN, INSTRUCTOR)
                        // TR14 attendance: view Admin or Instructor; save and lock Instructor; unlock
                        // Admin. The service limits an instructor to their assigned classes.
                        .requestMatchers(HttpMethod.GET, ApiPaths.SESSIONS + "/*/attendance")
                        .hasAnyRole(ADMIN, INSTRUCTOR)
                        .requestMatchers(HttpMethod.PUT, ApiPaths.SESSIONS + "/*/attendance").hasRole(INSTRUCTOR)
                        .requestMatchers(HttpMethod.POST, ApiPaths.SESSIONS + "/*/lock").hasRole(INSTRUCTOR)
                        .requestMatchers(HttpMethod.POST, ApiPaths.SESSIONS + "/*/unlock").hasRole(ADMIN)
                        // TR15 results: view Admin or Instructor; save and submit Instructor (assigned,
                        // checked in the service).
                        .requestMatchers(HttpMethod.GET, ApiPaths.CLASSES + "/*/results").hasAnyRole(ADMIN, INSTRUCTOR)
                        .requestMatchers(HttpMethod.PUT, ApiPaths.CLASSES + "/*/results").hasRole(INSTRUCTOR)
                        .requestMatchers(HttpMethod.POST, ApiPaths.CLASSES + "/*/results/submit").hasRole(INSTRUCTOR)
                        // TR16: Admin only; Instructors and Students get 403.
                        .requestMatchers(HttpMethod.POST, ApiPaths.CLASSES + "/*/results/return",
                                ApiPaths.CLASSES + "/*/results/confirm", ApiPaths.CLASSES + "/*/complete")
                        .hasRole(ADMIN)
                        // TR17: Student or Instructor; Admins and Managers get 403.
                        .requestMatchers(HttpMethod.GET, ApiPaths.MY_SCHEDULE).hasAnyRole(STUDENT, INSTRUCTOR)
                        // TR18: dashboard for Admin and Manager; grade audit for Admin only.
                        .requestMatchers(ApiPaths.DASHBOARD, ApiPaths.DASHBOARD + "/**").hasAnyRole(ADMIN, MANAGER)
                        .requestMatchers(ApiPaths.AUDIT, ApiPaths.AUDIT + "/**").hasRole(ADMIN)
                        // TR09 (GET /classes, /classes/{id}): every logged-in role, scoped by the
                        // service; covered by the rule below.
                        .anyRequest().authenticated());
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(AppProperties properties) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(properties.cors().allowedOrigin()));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Content-Type", CSRF_HEADER));
        configuration.setExposedHeaders(List.of(TraceIdFilter.RESPONSE_HEADER));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    private static CookieCsrfTokenRepository csrfTokenRepository() {
        // Readable by JavaScript on purpose, because the frontend copies it into the header.
        CookieCsrfTokenRepository repository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        repository.setCookiePath("/");
        repository.setHeaderName(CSRF_HEADER);
        repository.setCookieCustomizer(cookie -> cookie.secure(true).sameSite("Strict"));
        return repository;
    }
}
