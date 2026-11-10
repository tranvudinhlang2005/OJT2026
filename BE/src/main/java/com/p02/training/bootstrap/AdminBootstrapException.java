package com.p02.training.bootstrap;

/**
 * An expected refusal of the first-Admin bootstrap (A-23). Its message is written for the
 * operator and never contains a password, a hash or other input values.
 */
public class AdminBootstrapException extends RuntimeException {

    public AdminBootstrapException(String message) {
        super(message);
    }
}
