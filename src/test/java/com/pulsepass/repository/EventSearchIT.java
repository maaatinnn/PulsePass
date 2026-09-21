package com.pulsepass.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.pulsepass.domain.enums.EventStatus;
import com.pulsepass.domain.model.Event;
import com.pulsepass.domain.model.Venue;
import com.pulsepass.support.AbstractPostgresIT;
import com.pulsepass.support.TestData;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class EventSearchIT extends AbstractPostgresIT {

    @Autowired VenueRepository venueRepository;
    @Autowired EventRepository eventRepository;
    @Autowired ArtistRepository artistRepository;

    @BeforeEach
    void seed() {
        Venue santaMarta = venueRepository.save(TestData.venue());
        Venue bogota = venueRepository.save(TestData.venue("VEN-BOG-01", "Bogota"));

        Event festival = TestData.event(santaMarta);
        addArtists(festival, "Solar Beat", "Neon Waves", "Caribbean Sound");

        Event ocean = TestData.event("SMR-OCEAN-2027", EventStatus.PUBLISHED,
                LocalDateTime.of(2027, 3, 10, 21, 0), santaMarta);
        addArtists(ocean, "Ocean Drive");

        Event draft = TestData.event("SMR-DRAFT", EventStatus.DRAFT,
                LocalDateTime.of(2026, 12, 20, 21, 0), santaMarta);
        addArtists(draft, "Solar Beat");

        Event past = TestData.event("SMR-PAST", EventStatus.PUBLISHED,
                LocalDateTime.of(2026, 1, 15, 21, 0), santaMarta);
        addArtists(past, "Solar Beat");

        Event bogotaSolar = TestData.event("BOG-SOLAR", EventStatus.PUBLISHED,
                LocalDateTime.of(2026, 12, 10, 21, 0), bogota);
        addArtists(bogotaSolar, "Solar Beat");

        eventRepository.saveAll(List.of(festival, ocean, draft, past, bogotaSolar));
        flushAndClear();
    }

    @Test
    void findsEventsByArtistWithoutDuplicates() {
        List<Event> events = eventRepository.findByArtistStageName("Solar Beat");

        assertThat(events).extracting(Event::getEventCode)
                .containsExactlyInAnyOrder("CMF-2026", "SMR-DRAFT", "SMR-PAST", "BOG-SOLAR");
    }

    @Test
    void findsNothingForArtistWithoutEvents() {
        assertThat(eventRepository.findByArtistStageName("Digital Pulse")).isEmpty();
    }

    @Test
    void findsEventsByCityAndArtist() {
        assertThat(eventRepository.findByCityAndArtist("Santa Marta", "Solar Beat"))
                .extracting(Event::getEventCode)
                .containsExactlyInAnyOrder("CMF-2026", "SMR-DRAFT", "SMR-PAST");
        assertThat(eventRepository.findByCityAndArtist("Bogota", "Solar Beat"))
                .extracting(Event::getEventCode).containsExactly("BOG-SOLAR");
        assertThat(eventRepository.findByCityAndArtist("Bogota", "Ocean Drive")).isEmpty();
    }

    @Test
    void findsRecommendedEventsDistinctOrderedAndCaseInsensitive() {
        List<Event> recommended = eventRepository.findRecommended(
                LocalDateTime.of(2026, 10, 1, 0, 0), "Santa Marta", "EA");

        assertThat(recommended).extracting(Event::getEventCode)
                .containsExactly("CMF-2026", "SMR-OCEAN-2027");
    }

    @Test
    void recommendedEventsRespectCityAndArtistText() {
        LocalDateTime from = LocalDateTime.of(2026, 10, 1, 0, 0);

        assertThat(eventRepository.findRecommended(from, "Santa Marta", "solar"))
                .extracting(Event::getEventCode).containsExactly("CMF-2026");
        assertThat(eventRepository.findRecommended(from, "Bogota", "SOLAR"))
                .extracting(Event::getEventCode).containsExactly("BOG-SOLAR");
        assertThat(eventRepository.findRecommended(from, "Santa Marta", "zzz")).isEmpty();
    }

    private void addArtists(Event event, String... stageNames) {
        for (String name : stageNames) {
            event.addArtist(artistRepository.findByStageName(name).orElseThrow());
        }
    }
}
