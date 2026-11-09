/**
 * JPA entities mapped to the Flyway schema. They are never exposed through the API.
 *
 * <p>Conventions: associations are lazy with no cascades and no inverse collections, so a
 * relationship cannot pull in, serialize or delete another entity by accident. Entities keep the
 * default identity-based equals, hashCode and toString. Business rules belong in services.
 */
package com.p02.training.entity;
