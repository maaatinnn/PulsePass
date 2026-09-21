package com.pulsepass.repository;

import com.pulsepass.domain.enums.TicketStatus;
import com.pulsepass.domain.model.Ticket;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    Optional<Ticket> findByTicketCode(String ticketCode);

    List<Ticket> findByUserEmail(String email);

    List<Ticket> findByUserEmailAndStatus(String email, TicketStatus status);

    List<Ticket> findByEventEventCodeAndStatus(String eventCode, TicketStatus status);

    @Query("""
            select count(t)
            from Ticket t
            join t.event e
            where e.eventCode = :eventCode
              and t.status = com.pulsepass.domain.enums.TicketStatus.PAID
            """)
    long countPaidByEventCode(@Param("eventCode") String eventCode);

    @Query("""
            select t
            from Ticket t
            join t.event e
            where e.eventDate > :from
            order by e.eventDate asc
            """)
    List<Ticket> findForEventsAfter(@Param("from") LocalDateTime from);
}