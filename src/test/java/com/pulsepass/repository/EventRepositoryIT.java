package com.pulsepass.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.pulsepass.domain.enums.EventStatus;
import com.pulsepass.domain.model.Event;
import com.pulsepass.domain.model.Venue;
import com.pulsepass.support.AbstractPostgresIT;
import com.pulsepass.support.TestData;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;

class EventRepositoryIT extends AbstractPostgresIT {

    @Autowired VenueRepository venueRepository;
    @Autowired EventRepository eventRepository;

    @Test
    void findsEventWithItsVenue() {
        Venue venue = venueRepository.save(TestData.venue());
        eventRepository.save(TestData.event(venue));
        flushAndClear();

        Event found = eventRepository.findByEventCode("CMF-2026").orElseThrow();

        assertThat(found.getName()).isEqualTo("Caribbean Music Fest 2026");
        assertThat(found.getVenue().getCode()).isEqualTo("VEN-SMR-01");
    }

    @Test
    void findsEventsOnlyOfTheRequestedVenue() {
        Venue santaMarta = venueRepository.save(TestData.venue());
        Venue bogota = venueRepository.save(TestData.venue("VEN-BOG-01", "Bogota"));
        eventRepository.save(TestData.event(santaMarta));
        eventRepository.save(TestData.event("BOG-2026", EventStatus.PUBLISHED,
                LocalDateTime.of(2026, 11, 20, 20, 0), bogota));
        flushAndClear();

        assertThat(eventRepository.findByVenueCode("VEN-SMR-01"))
                .extracting(Event::getEventCode).containsExactly("CMF-2026");
        assertThat(eventRepository.findByVenueCode("VEN-BOG-01"))
                .extracting(Event::getEventCode).containsExactly("BOG-2026");
    }

    @Test
    void storesEnumsAsReadableNames() {
        Venue venue = venueRepository.save(TestData.venue());
        eventRepository.save(TestData.event(venue));
        flushAndClear();

        assertThat(jdbc.queryForObject(
                "SELECT category FROM events WHERE event_code = 'CMF-2026'", String.class))
                .isEqualTo("MUSIC");
        assertThat(jdbc.queryForObject(
                "SELECT status FROM events WHERE event_code = 'CMF-2026'", String.class))
                .isEqualTo("PUBLISHED");
    }

    @Test
    void rejectsDuplicateEventCode() {
        Venue venue = venueRepository.save(TestData.venue());
        eventRepository.saveAndFlush(TestData.event(venue));

        assertThatThrownBy(() -> eventRepository.saveAndFlush(TestData.event(venue)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void databaseRejectsStatusOutsideTheCatalog() {
        Venue venue = venueRepository.saveAndFlush(TestData.venue());

        assertThatThrownBy(() -> jdbc.update("""
                INSERT INTO events (event_code, name, category, status, event_date, venue_id)
                VALUES (?, ?, ?, ?, ?, ?)
                """, "BAD-STATUS", "Estado inválido", "MUSIC", "ARCHIVED",
                Timestamp.valueOf(LocalDateTime.of(2026, 12, 1, 20, 0)), venue.getId()))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void rejectsNegativeMinimumAge() {
        Venue venue = venueRepository.save(TestData.venue());
        Event event = TestData.event(venue);
        event.setMinimumAge(-1);

        assertThatThrownBy(() -> eventRepository.saveAndFlush(event))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void listsPublishedEventsInChronologicalOrder() {
        Venue venue = venueRepository.save(TestData.venue());
        eventRepository.saveAll(List.of(
                TestData.event("LATE", EventStatus.PUBLISHED, LocalDateTime.of(2027, 3, 1, 20, 0), venue),
                TestData.event("DRAFT-1", EventStatus.DRAFT, LocalDateTime.of(2026, 10, 1, 20, 0), venue),
                TestData.event("EARLY", EventStatus.PUBLISHED, LocalDateTime.of(2026, 11, 1, 20, 0), venue),
                TestData.event("CANCELLED-1", EventStatus.CANCELLED, LocalDateTime.of(2026, 10, 15, 20, 0), venue),
                TestData.event("MIDDLE", EventStatus.PUBLISHED, LocalDateTime.of(2026, 12, 1, 20, 0), venue)));
        flushAndClear();

        List<Event> published = eventRepository.findByStatusOrderByEventDateAsc(EventStatus.PUBLISHED);

        assertThat(published).extracting(Event::getEventCode)
                .containsExactly("EARLY", "MIDDLE", "LATE");
    }

    @Test
    void streamingUrlIsOptional() {
        Venue venue = venueRepository.save(TestData.venue());
        Event onSite = TestData.event(venue);
        Event hybrid = TestData.event("HYBRID-1", EventStatus.PUBLISHED,
                LocalDateTime.of(2026, 12, 6, 19, 0), venue);
        hybrid.setStreamingUrl("https://stream.pulsepass.test/hybrid-1");
        eventRepository.saveAll(List.of(onSite, hybrid));
        flushAndClear();

        assertThat(eventRepository.findByEventCode("CMF-2026").orElseThrow().getStreamingUrl()).isNull();
        assertThat(eventRepository.findByEventCode("HYBRID-1").orElseThrow().getStreamingUrl())
                .isEqualTo("https://stream.pulsepass.test/hybrid-1");
    }

    @Test
    void rejectsStreamingUrlLongerThan500Characters() {
        Venue venue = venueRepository.save(TestData.venue());
        Event event = TestData.event(venue);
        event.setStreamingUrl("https://stream.pulsepass.test/" + "x".repeat(500));

        assertThatThrownBy(() -> eventRepository.saveAndFlush(event))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
