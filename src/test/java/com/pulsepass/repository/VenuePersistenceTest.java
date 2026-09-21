package com.pulsepass.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.pulsepass.domain.enums.EventStatus;
import com.pulsepass.domain.model.Event;
import com.pulsepass.domain.model.Venue;
import com.pulsepass.support.AbstractPostgresIT;
import com.pulsepass.support.TestData;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;

class VenuePersistenceTest extends AbstractPostgresIT {

    @Autowired VenueRepository venueRepository;
    @Autowired EventRepository eventRepository;

    @Test
    void persistsVenueAndRecoversItByIdAndCode() {
        Long id = venueRepository.save(TestData.venue()).getId();
        flushAndClear();

        Venue byId = venueRepository.findById(id).orElseThrow();
        Venue byCode = venueRepository.findByCode("VEN-SMR-01").orElseThrow();

        assertThat(byCode.getId()).isEqualTo(id);
        assertThat(byId.getName()).isEqualTo("Marina Convention Center");
        assertThat(byId.getCity()).isEqualTo("Santa Marta");
        assertThat(byId.getCapacity()).isPositive().isEqualTo(5000);
        assertThat(byId.isActive()).isTrue();
    }

    @Test
    void rejectsDuplicateCode() {
        venueRepository.saveAndFlush(TestData.venue());

        assertThatThrownBy(() -> venueRepository.saveAndFlush(TestData.venue()))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @ParameterizedTest
    @ValueSource(ints = {0, -1})
    void rejectsNonPositiveCapacity(int capacity) {
        Venue invalid = new Venue("VEN-BAD-01", "Invalid", "Santa Marta", null, capacity);

        assertThatThrownBy(() -> venueRepository.saveAndFlush(invalid))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void venueHostsManyEventsAndHelperKeepsBothSidesInSync() {
        Venue venue = venueRepository.save(TestData.venue());
        Event first = TestData.event("EVT-A", EventStatus.PUBLISHED,
                LocalDateTime.of(2026, 11, 1, 20, 0), venue);
        Event second = TestData.event("EVT-B", EventStatus.DRAFT,
                LocalDateTime.of(2026, 11, 2, 20, 0), venue);
        venue.addEvent(first);
        venue.addEvent(second);
        eventRepository.saveAll(venue.getEvents());
        flushAndClear();

        Venue reloaded = venueRepository.findByCode("VEN-SMR-01").orElseThrow();

        assertThat(reloaded.getEvents()).extracting(Event::getEventCode)
                .containsExactlyInAnyOrder("EVT-A", "EVT-B");
        assertThat(reloaded.getEvents()).allSatisfy(e -> assertThat(e.getVenue()).isEqualTo(reloaded));
    }

    @Test
    void databaseRejectsEventWithoutValidVenue() {
        assertThatThrownBy(() -> jdbc.update("""
                INSERT INTO events (event_code, name, category, status, event_date, venue_id)
                VALUES ('ORPHAN-1', 'Sin venue', 'MUSIC', 'DRAFT', now(), 999999)
                """))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
