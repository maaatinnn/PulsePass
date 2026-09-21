package com.pulsepass.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.pulsepass.domain.enums.EventStatus;
import com.pulsepass.domain.model.Artist;
import com.pulsepass.domain.model.Event;
import com.pulsepass.domain.model.Venue;
import com.pulsepass.support.AbstractPostgresIT;
import com.pulsepass.support.TestData;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;

class EventArtistIT extends AbstractPostgresIT {

    @Autowired VenueRepository venueRepository;
    @Autowired EventRepository eventRepository;
    @Autowired ArtistRepository artistRepository;

    @Test
    void persistsAndRecoversArtist() {
        artistRepository.save(new Artist("Mar Abierto", "Colombia", "Vallenato"));
        flushAndClear();

        Artist found = artistRepository.findByStageName("Mar Abierto").orElseThrow();

        assertThat(found.getCountry()).isEqualTo("Colombia");
        assertThat(found.getGenre()).isEqualTo("Vallenato");
        assertThat(found.isActive()).isTrue();
    }

    @Test
    void rejectsDuplicateStageName() {
        assertThatThrownBy(() -> artistRepository.saveAndFlush(new Artist("Solar Beat", "Peru", "Rock")))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void associatesThreeArtistsWithAnEvent() {
        Event event = TestData.event(venueRepository.save(TestData.venue()));
        List.of("Solar Beat", "Neon Waves", "Caribbean Sound").forEach(name ->
                event.addArtist(artistRepository.findByStageName(name).orElseThrow()));
        Long eventId = eventRepository.saveAndFlush(event).getId();
        flushAndClear();

        Event reloaded = eventRepository.findByEventCode("CMF-2026").orElseThrow();

        assertThat(reloaded.getArtists()).extracting(Artist::getStageName)
                .containsExactlyInAnyOrder("Solar Beat", "Neon Waves", "Caribbean Sound");
        assertThat(countAssociations(eventId)).isEqualTo(3);
    }

    @Test
    void addingTheSameArtistTwiceStoresOneAssociation() {
        Event event = TestData.event(venueRepository.save(TestData.venue()));
        Artist solarBeat = artistRepository.findByStageName("Solar Beat").orElseThrow();
        event.addArtist(solarBeat);
        event.addArtist(solarBeat);
        Long eventId = eventRepository.saveAndFlush(event).getId();

        assertThat(event.getArtists()).hasSize(1);
        assertThat(countAssociations(eventId)).isEqualTo(1);
    }

    @Test
    void primaryKeyRejectsRepeatedEventArtistPair() {
        Event event = TestData.event(venueRepository.save(TestData.venue()));
        Artist solarBeat = artistRepository.findByStageName("Solar Beat").orElseThrow();
        event.addArtist(solarBeat);
        Long eventId = eventRepository.saveAndFlush(event).getId();

        assertThatThrownBy(() -> jdbc.update(
                "INSERT INTO event_artists (event_id, artist_id) VALUES (?, ?)",
                eventId, solarBeat.getId()))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void artistCanPlayInSeveralEvents() {
        Venue venue = venueRepository.save(TestData.venue());
        Artist solarBeat = artistRepository.findByStageName("Solar Beat").orElseThrow();
        for (String code : List.of("SB-1", "SB-2", "SB-3")) {
            Event event = TestData.event(code, EventStatus.PUBLISHED,
                    LocalDateTime.of(2026, 12, 1, 20, 0), venue);
            event.addArtist(solarBeat);
            eventRepository.save(event);
        }
        flushAndClear();

        assertThat(eventRepository.findByArtistStageName("Solar Beat"))
                .extracting(Event::getEventCode).containsExactlyInAnyOrder("SB-1", "SB-2", "SB-3");
        assertThat(eventRepository.findByArtistStageName("Neon Waves")).isEmpty();
    }

    private int countAssociations(Long eventId) {
        return jdbc.queryForObject(
                "SELECT count(*) FROM event_artists WHERE event_id = ?", Integer.class, eventId);
    }
}
