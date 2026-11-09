/**
 * Spring Data JPA repositories. They only read and write data: business rules, including which
 * statuses count for a rule, are passed in by services.
 *
 * <p>Methods named {@code findLockedBy...} run {@code SELECT ... FOR UPDATE} and need a transaction.
 * Services must take locks in the order from spec 0.5: Instructor, Student, Room, ClassOffering,
 * Session, Enrollment.
 *
 * <p>Repositories for list endpoints extend {@code JpaSpecificationExecutor}, so services can build
 * optional filters, role scopes and {@code keyword} matching, which the spec leaves undefined. Results
 * must be mapped to DTOs, never returned from the API.
 */
package com.p02.training.repository;
