package com.p02.training.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.concurrent.atomic.AtomicLong;
import org.junit.jupiter.api.Test;

class LoginRateLimiterTest {

    private final AtomicLong nanos = new AtomicLong(1_000_000_000L);
    private final LoginRateLimiter limiter = new LoginRateLimiter(nanos::get);

    @Test
    void allowsThirtyRequestsPerMinuteThenRefuses() {
        for (int i = 0; i < 30; i++) {
            assertThat(limiter.tryAcquire("10.0.0.1")).as("request %d", i + 1).isTrue();
        }
        assertThat(limiter.tryAcquire("10.0.0.1")).isFalse();
    }

    @Test
    void eachIpHasItsOwnLimit() {
        for (int i = 0; i < 30; i++) {
            limiter.tryAcquire("10.0.0.1");
        }
        assertThat(limiter.tryAcquire("10.0.0.2")).isTrue();
    }

    @Test
    void windowSlidesAfterOneMinute() {
        for (int i = 0; i < 30; i++) {
            limiter.tryAcquire("10.0.0.1");
        }
        nanos.addAndGet(LoginRateLimiter.WINDOW_NANOS - 1);
        assertThat(limiter.tryAcquire("10.0.0.1")).isFalse();

        nanos.addAndGet(1);
        assertThat(limiter.tryAcquire("10.0.0.1")).isTrue();
    }
}
