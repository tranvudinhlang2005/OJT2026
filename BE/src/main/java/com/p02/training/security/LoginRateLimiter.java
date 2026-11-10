package com.p02.training.security;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.LongSupplier;
import org.springframework.stereotype.Component;

/**
 * Login rate limit, decision A-26: at most {@value #MAX_REQUESTS} requests per client IP in a fixed
 * 60-second window. Used only by {@link LoginRateLimitFilter}, for {@code POST /api/v1/auth/login}.
 *
 * <p>Each IP's window starts at its first counted request and lasts exactly 60 seconds; the next
 * request after that opens a new window. A refused request changes nothing: it neither counts
 * towards the limit nor restarts the window, so the reported wait is accurate and a client that
 * keeps retrying is let in again as soon as its window ends.
 *
 * <p>State is in this instance's memory, as approved for the single-instance deployment: it resets
 * on restart and is not shared between instances. Expired windows are removed once per window
 * length, and sooner (at most once per second) when more than {@value #SWEEP_THRESHOLD} IPs are
 * held, so memory is bounded by the IPs seen in about the last two minutes.
 *
 * <p>This is independent of the account lockout (5 failed logins lock an account for 15 minutes),
 * which {@code LoginAttemptService} applies per account in the database.
 */
@Component
public class LoginRateLimiter {

    static final int MAX_REQUESTS = 30;
    static final long WINDOW_NANOS = TimeUnit.SECONDS.toNanos(60);
    private static final int SWEEP_THRESHOLD = 10_000;
    private static final long NANOS_PER_SECOND = TimeUnit.SECONDS.toNanos(1);
    private static final long MIN_SWEEP_INTERVAL_NANOS = NANOS_PER_SECOND;

    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();
    private final LongSupplier nanoTime;
    private final AtomicLong nextSweepAt;

    public LoginRateLimiter() {
        this(System::nanoTime);
    }

    LoginRateLimiter(LongSupplier nanoTime) {
        this.nanoTime = nanoTime;
        this.nextSweepAt = new AtomicLong(nanoTime.getAsLong() + WINDOW_NANOS);
    }

    /** Counts one request for this IP if the limit allows it, and reports the outcome. */
    public Decision acquire(String clientIp) {
        long now = nanoTime.getAsLong();
        sweepIfDue(now);

        Decision[] decision = new Decision[1];
        windows.compute(clientIp == null ? "" : clientIp, (key, window) -> {
            if (window == null || window.hasExpired(now)) {
                decision[0] = Decision.ALLOWED;
                return new Window(now, 1);
            }
            if (window.count() < MAX_REQUESTS) {
                decision[0] = Decision.ALLOWED;
                return new Window(window.startedAt(), window.count() + 1);
            }
            decision[0] = Decision.refused(window.secondsUntilEnd(now));
            return window; // unchanged: a refused request neither counts nor restarts the window
        });
        return decision[0];
    }

    /** Same as {@code acquire(clientIp).allowed()}. */
    public boolean tryAcquire(String clientIp) {
        return acquire(clientIp).allowed();
    }

    /** Number of IPs currently held in memory. */
    int trackedClients() {
        return windows.size();
    }

    /**
     * Sweeps once per window length, or earlier when the map is crowded, but never more than once
     * per second, so a flood of distinct IPs cannot make every request scan the whole map.
     */
    private void sweepIfDue(long now) {
        long due = nextSweepAt.get();
        long lastSweep = due - WINDOW_NANOS;
        boolean scheduled = now - due >= 0;
        boolean crowded = windows.size() > SWEEP_THRESHOLD && now - lastSweep >= MIN_SWEEP_INTERVAL_NANOS;
        if ((scheduled || crowded) && nextSweepAt.compareAndSet(due, now + WINDOW_NANOS)) {
            // Only the thread that won the update sweeps; the others carry on.
            windows.forEach((key, window) -> {
                if (window.hasExpired(now)) {
                    windows.remove(key, window); // only if not replaced meanwhile
                }
            });
        }
    }

    private record Window(long startedAt, int count) {

        boolean hasExpired(long now) {
            return now - startedAt >= WINDOW_NANOS;
        }

        /** Whole seconds until the window ends, rounded up, at least 1. */
        long secondsUntilEnd(long now) {
            long remaining = WINDOW_NANOS - (now - startedAt);
            return Math.max(1, (remaining + NANOS_PER_SECOND - 1) / NANOS_PER_SECOND);
        }
    }

    /** The outcome for one request. {@code retryAfterSeconds} is 0 when allowed. */
    public record Decision(boolean allowed, long retryAfterSeconds) {

        static final Decision ALLOWED = new Decision(true, 0);

        static Decision refused(long retryAfterSeconds) {
            return new Decision(false, retryAfterSeconds);
        }
    }
}
