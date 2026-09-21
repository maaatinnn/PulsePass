package com.pulsepass.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.pulsepass.domain.enums.EventStatus;
import com.pulsepass.domain.enums.TicketStatus;
import com.pulsepass.domain.enums.TicketType;
import com.pulsepass.domain.model.Event;
import com.pulsepass.domain.model.Ticket;
import com.pulsepass.domain.model.User;
import com.pulsepass.domain.model.Venue;
import com.pulsepass.support.AbstractPostgresIT;
import com.pulsepass.support.TestData;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;

class TicketRepositoryIT extends AbstractPostgresIT {

    @Autowired VenueRepository venueRepository;
    @Autowired EventRepository eventRepository;
    @Autowired UserRepository userRepository;
    @Autowired TicketRepository ticketRepository;

    private Event festival;
    private User andrea;

    private void seedPrdScenario() {
        Venue venue = venueRepository.save(TestData.venue());
        festival = eventRepository.save(TestData.event(venue));
        andrea = userRepository.save(TestData.user("andrea"));
        User carlos = userRepository.save(TestData.user("carlos"));
        User laura = userRepository.save(TestData.user("laura"));
        User miguel = userRepository.save(TestData.user("miguel"));

        ticketRepository.saveAll(List.of(
                TestData.ticket("TCK-0001", TicketType.VIP, "250000", TicketStatus.PAID, andrea, festival),
                TestData.ticket("TCK-0002", TicketType.GENERAL, "120000", TicketStatus.PAID, carlos, festival),
                TestData.ticket("TCK-0003", TicketType.GENERAL, "120000", TicketStatus.RESERVED, laura, festival),
                TestData.ticket("TCK-0004", TicketType.VIP, "250000", TicketStatus.CANCELLED, miguel, festival)));
        flushAndClear();
    }

    @Test
    void ticketNavigatesToItsUserAndEvent() {
        seedPrdScenario();

        Ticket ticket = ticketRepository.findByTicketCode("TCK-0001").orElseThrow();

        assertThat(ticket.getUser().getEmail()).isEqualTo("andrea@pulsepass.test");
        assertThat(ticket.getEvent().getEventCode()).isEqualTo("CMF-2026");
        assertThat(ticket.getType()).isEqualTo(TicketType.VIP);
        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.PAID);
        assertThat(ticket.getPrice()).isEqualByComparingTo("250000");
        assertThat(ticket.getPurchaseDate()).isNotNull();
    }

    @Test
    void storesTypeAndStatusAsReadableNames() {
        seedPrdScenario();

        assertThat(jdbc.queryForObject(
                "SELECT type FROM tickets WHERE ticket_code = 'TCK-0001'", String.class)).isEqualTo("VIP");
        assertThat(jdbc.queryForObject(
                "SELECT status FROM tickets WHERE ticket_code = 'TCK-0001'", String.class)).isEqualTo("PAID");
    }

    @Test
    void findsTicketsByUserEmailAndOptionallyByStatus() {
        seedPrdScenario();

        assertThat(ticketRepository.findByUserEmail("andrea@pulsepass.test"))
                .extracting(Ticket::getTicketCode).containsExactly("TCK-0001");
        assertThat(ticketRepository.findByUserEmailAndStatus("andrea@pulsepass.test", TicketStatus.PAID))
                .hasSize(1);
        assertThat(ticketRepository.findByUserEmailAndStatus("andrea@pulsepass.test", TicketStatus.RESERVED))
                .isEmpty();
    }

    @Test
    void findsPaidTicketsOfAnEvent() {
        seedPrdScenario();

        assertThat(ticketRepository.findByEventEventCodeAndStatus("CMF-2026", TicketStatus.PAID))
                .extracting(Ticket::getTicketCode).containsExactlyInAnyOrder("TCK-0001", "TCK-0002");
        assertThat(ticketRepository.findByEventEventCodeAndStatus("OTRO-EVENTO", TicketStatus.PAID)).isEmpty();
    }

    @Test
    void countsOnlyPaidTickets() {
        seedPrdScenario();

        assertThat(ticketRepository.countPaidByEventCode("CMF-2026")).isEqualTo(2);
        assertThat(ticketRepository.countPaidByEventCode("OTRO-EVENTO")).isZero();
    }

    @Test
    void findsTicketsOfFutureEventsInChronologicalOrder() {
        Venue venue = venueRepository.save(TestData.venue());
        Event past = eventRepository.save(TestData.event("PAST", EventStatus.FINISHED,
                LocalDateTime.of(2025, 5, 1, 20, 0), venue));
        Event soon = eventRepository.save(TestData.event("SOON", EventStatus.PUBLISHED,
                LocalDateTime.of(2026, 11, 1, 20, 0), venue));
        Event later = eventRepository.save(TestData.event("LATER", EventStatus.PUBLISHED,
                LocalDateTime.of(2027, 2, 1, 20, 0), venue));
        User user = userRepository.save(TestData.user("andrea"));
        ticketRepository.saveAll(List.of(
                TestData.ticket("T-LATER", TicketType.GENERAL, "100", TicketStatus.PAID, user, later),
                TestData.ticket("T-PAST", TicketType.GENERAL, "100", TicketStatus.USED, user, past),
                TestData.ticket("T-SOON", TicketType.GENERAL, "100", TicketStatus.PAID, user, soon)));
        flushAndClear();

        List<Ticket> tickets = ticketRepository.findForEventsAfter(LocalDateTime.of(2026, 1, 1, 0, 0));

        assertThat(tickets).extracting(Ticket::getTicketCode).containsExactly("T-SOON", "T-LATER");
    }

    @Test
    void rejectsDuplicateTicketCode() {
        seedPrdScenario();
        User user = userRepository.findByUsername("andrea").orElseThrow();
        Event event = eventRepository.findByEventCode("CMF-2026").orElseThrow();

        assertThatThrownBy(() -> ticketRepository.saveAndFlush(
                TestData.ticket("TCK-0001", TicketType.GENERAL, "120000", TicketStatus.RESERVED, user, event)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void rejectsNegativePrice() {
        seedPrdScenario();
        User user = userRepository.findByUsername("andrea").orElseThrow();
        Event event = eventRepository.findByEventCode("CMF-2026").orElseThrow();
        Ticket invalid = TestData.ticket("TCK-NEG", TicketType.GENERAL, "-1", TicketStatus.RESERVED, user, event);

        assertThatThrownBy(() -> ticketRepository.saveAndFlush(invalid))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void acceptsZeroPrice() {
        seedPrdScenario();
        User user = userRepository.findByUsername("andrea").orElseThrow();
        Event event = eventRepository.findByEventCode("CMF-2026").orElseThrow();

        ticketRepository.saveAndFlush(
                TestData.ticket("TCK-FREE", TicketType.STUDENT, "0", TicketStatus.RESERVED, user, event));
        flushAndClear();

        assertThat(ticketRepository.findByTicketCode("TCK-FREE").orElseThrow().getPrice())
                .isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void databaseRejectsTicketWithUnknownUser() {
        seedPrdScenario();
        Long eventId = festival.getId();

        assertThatThrownBy(() -> insertRawTicket("TCK-RAW-1", 999_999L, eventId))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void databaseRejectsTicketWithUnknownEvent() {
        seedPrdScenario();
        Long userId = andrea.getId();

        assertThatThrownBy(() -> insertRawTicket("TCK-RAW-2", userId, 999_999L))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    private void insertRawTicket(String code, Long userId, Long eventId) {
        jdbc.update("""
                INSERT INTO tickets (ticket_code, type, price, status, purchase_date, user_id, event_id)
                VALUES (?, 'GENERAL', 100, 'RESERVED', ?, ?, ?)
                """, code, Timestamp.valueOf(LocalDateTime.of(2026, 9, 1, 10, 0)), userId, eventId);
    }
}