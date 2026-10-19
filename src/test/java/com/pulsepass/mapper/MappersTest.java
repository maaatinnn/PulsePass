package com.pulsepass.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import com.pulsepass.domain.enums.EventCategory;
import com.pulsepass.domain.enums.EventStatus;
import com.pulsepass.domain.enums.TicketStatus;
import com.pulsepass.domain.enums.TicketType;
import com.pulsepass.domain.model.Artist;
import com.pulsepass.domain.model.Event;
import com.pulsepass.domain.model.Ticket;
import com.pulsepass.domain.model.User;
import com.pulsepass.domain.model.UserProfile;
import com.pulsepass.domain.model.Venue;
import com.pulsepass.dto.response.EventResponse;
import com.pulsepass.dto.response.EventSummaryResponse;
import com.pulsepass.dto.response.TicketResponse;
import com.pulsepass.dto.response.UserResponse;
import com.pulsepass.dto.response.VenueResponse;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;

class MappersTest {

    private final ArtistMapper artistMapper = new ArtistMapperImpl();
    private final EventMapper eventMapper = new EventMapperImpl(artistMapper);
    private final TicketMapper ticketMapper = new TicketMapperImpl();
    private final UserMapper userMapper = new UserMapperImpl();
    private final VenueMapper venueMapper = new VenueMapperImpl();

    private final Venue venue = new Venue("VEN-SMR-01", "Marina Convention Center", "Santa Marta", "Calle 1", 3);
    private final Event event = new Event("CMF-2026", "Caribbean Music Fest 2026", EventCategory.MUSIC,
            EventStatus.DRAFT, LocalDateTime.of(2026, 12, 5, 19, 0), venue);

    @Test
    void venueMapper_mapsAllFields() {
        VenueResponse dto = venueMapper.toResponse(venue);

        assertThat(dto.code()).isEqualTo("VEN-SMR-01");
        assertThat(dto.capacity()).isEqualTo(3);
        assertThat(dto.active()).isTrue();
    }

    @Test
    void eventMapper_flattensVenueAndMapsArtists() {
        event.setMinimumAge(18);
        event.addArtist(new Artist("Solar Beat", "CO", "Pop"));

        EventResponse dto = eventMapper.toResponse(event);

        assertThat(dto.eventCode()).isEqualTo("CMF-2026");
        assertThat(dto.status()).isEqualTo(EventStatus.DRAFT);
        assertThat(dto.minimumAge()).isEqualTo(18);
        assertThat(dto.venueCode()).isEqualTo("VEN-SMR-01");
        assertThat(dto.venueName()).isEqualTo("Marina Convention Center");
        assertThat(dto.artists()).extracting("stageName").containsExactly("Solar Beat");
    }

    @Test
    void eventMapper_toSummary_flattensVenue() {
        EventSummaryResponse dto = eventMapper.toSummary(event);

        assertThat(dto.venueCode()).isEqualTo("VEN-SMR-01");
        assertThat(dto.venueName()).isEqualTo("Marina Convention Center");
    }

    @Test
    void ticketMapper_flattensUserAndEvent() {
        User user = new User("andrea", "andrea@email.com");
        Ticket ticket = new Ticket("TKT-1", TicketType.VIP, new BigDecimal("250.00"), TicketStatus.PAID,
                LocalDateTime.of(2026, 10, 11, 10, 0), user, event);

        TicketResponse dto = ticketMapper.toResponse(ticket);

        assertThat(dto.userEmail()).isEqualTo("andrea@email.com");
        assertThat(dto.eventCode()).isEqualTo("CMF-2026");
        assertThat(dto.eventName()).isEqualTo("Caribbean Music Fest 2026");
        assertThat(dto.price()).isEqualByComparingTo("250.00");
        assertThat(dto.status()).isEqualTo(TicketStatus.PAID);
    }

    @Test
    void userMapper_includesProfileFields() {
        User user = new User("andrea", "andrea@email.com");
        UserProfile profile = new UserProfile("Andrea", "Perez");
        profile.setBirthDate(LocalDate.of(2001, 1, 1));
        user.setProfile(profile);

        UserResponse dto = userMapper.toResponse(user);

        assertThat(dto.username()).isEqualTo("andrea");
        assertThat(dto.firstName()).isEqualTo("Andrea");
        assertThat(dto.birthDate()).isEqualTo(LocalDate.of(2001, 1, 1));
        assertThat(dto.active()).isTrue();
    }

    @Test
    void userMapper_withoutProfile_doesNotFail() {
        UserResponse dto = userMapper.toResponse(new User("andrea", "andrea@email.com"));

        assertThat(dto.firstName()).isNull();
    }
}
