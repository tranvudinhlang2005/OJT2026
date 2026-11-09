package com.p02.training.config;

import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ClockConfig {

    /**
     * Clock in the business time zone. Services must use {@code LocalDate.now(clock)} for every
     * "today" comparison (spec 0.1), because the host's time zone is not reliable.
     */
    @Bean
    public Clock businessClock(AppProperties properties) {
        return Clock.system(properties.businessZone());
    }
}
