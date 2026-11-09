package com.p02.training.repository;

import com.p02.training.entity.AppSecurityLog;
import com.p02.training.entity.enums.SecurityAction;
import com.p02.training.repository.projection.ActionCount;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Append-only. Services must never call delete. Time ranges include the start and exclude the end. */
public interface AppSecurityLogRepository extends JpaRepository<AppSecurityLog, Long> {

    /** TR18 security alerts: number of events per action. */
    @Query("""
            select a.action as action, count(a) as total from AppSecurityLog a
            where a.action in :actions and a.createdAt >= :from and a.createdAt < :to
            group by a.action
            """)
    List<ActionCount> countByAction(@Param("actions") Collection<SecurityAction> actions,
            @Param("from") Instant from, @Param("to") Instant to);

    /** TR18: the 20 most recent events, for Admins. */
    List<AppSecurityLog> findTop20ByActionInAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDescIdDesc(
            Collection<SecurityAction> actions, Instant from, Instant to);
}
