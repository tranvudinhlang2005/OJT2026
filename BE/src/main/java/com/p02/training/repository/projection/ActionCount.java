package com.p02.training.repository.projection;

import com.p02.training.entity.enums.SecurityAction;

/** Number of security events for one action (TR18). */
public interface ActionCount {

    SecurityAction getAction();

    long getTotal();
}
