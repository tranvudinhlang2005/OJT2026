package com.p02.training.repository.projection;

import com.p02.training.entity.enums.ClassStatus;

/** Number of classes in one status (TR18). */
public interface ClassStatusCount {

    ClassStatus getStatus();

    long getTotal();
}
