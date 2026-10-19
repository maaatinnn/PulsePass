package com.pulsepass.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.pulsepass.domain.enums.EventCategory;
import com.pulsepass.domain.enums.EventStatus;
import com.pulsepass.domain.model.Artist;
import com.pulsepass.domain.model.Event;
import com.pulsepass.domain.model.Venue;
import com.pulsepass.dto.request.CreateEventRequest;
import com.pulsepass.dto.response.EventResponse;
import com.pulsepass.dto.response.EventSummaryResponse;
import com.pulsepass.exception.BusinessRuleException;
import com.pulsepass.exception.DuplicateResourceException;
import com.pulsepass.exception.ResourceNotFoundException;
import com.pulsepass.mapper.EventMapper;
import com.pulsepass.repository.ArtistRepository;
import com.pulsepass.repository.EventRepository;
import com.pulsepass.repository.VenueRepository;
import com.pulsepass.service.impl.EventServiceImpl;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class EventServiceImplTest {

    private static final ZoneId ZONE = ZoneId.of("UTC");
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 10, 11, 10, 0);
    private static final LocalDateTime EVENT_DATE = LocalDateTime.of(2026, 12, 5, 19, 0);

    @Mock private EventRepository eventRepository;
    @Mock private VenueRepository venueRepository;
    @Mock private ArtistRepository artistRepository;
    @Mock private EventMapper eventMapper;
    @Mock private com.pulsepass.security.AuthorizationService authorizationService;

    private EventServiceImpl service;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(NOW.atZone(ZONE).toInstant(), ZONE);
        service = new EventServiceImpl(eventRepository, venueRepository, artistRepository,
                eventMapper, clock, authorizationService);
    }

    private static Venue venue(boolean active) {
        Venue venue = new Venue("VEN-SMR-01", "Marina Convention Center", "Santa Marta", "Calle 1", 3);
        venue.setActive(active);
        return venue;
    }

    private static Event event(EventStatus status, LocalDateTime date, Venue venue) {
        return new Event("CMF-2026", "Caribbean Music Fest 2026", EventCategory.MUSIC, status, date, venue);
    }

    private static CreateEventRequest request(LocalDateTime date, Integer minimumAge) {
        return new CreateEventRequest("CMF-2026", "Caribbean Music Fest 2026", "Festival",
                EventCategory.MUSIC, date, minimumAge, "VEN-SMR-01");
    }

    private static EventResponse response(EventStatus status) {
        return new EventResponse(1L, "CMF-2026", "Caribbean Music Fest 2026", "Festival",
                EventCategory.MUSIC, status, EVENT_DATE, 18, "VEN-SMR-01",
                "Marina Convention Center", List.of());
    }

    @Test
    void TEST_EVENT_001_findByCode_existingEvent_returnsDto() {

        Event event = event(EventStatus.PUBLISHED, EVENT_DATE, venue(true));
        EventResponse expected = response(EventStatus.PUBLISHED);
        when(eventRepository.findByEventCode("CMF-2026")).thenReturn(Optional.of(event));
        when(eventMapper.toResponse(event)).thenReturn(expected);

        EventResponse result = service.findByCode("CMF-2026");

        assertThat(result).isEqualTo(expected);
        verify(eventRepository).findByEventCode("CMF-2026");
    }

    @Test
    void TEST_EVENT_002_findByCode_unknownEvent_throwsResourceNotFound() {
        when(eventRepository.findByEventCode("NOPE")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findByCode("NOPE"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Event not found: NOPE");
    }

    @Test
    void TEST_EVENT_003_create_validRequest_savesEventInDraft() {

        Venue venue = venue(true);
        when(eventRepository.existsByEventCode("CMF-2026")).thenReturn(false);
        when(venueRepository.findByCode("VEN-SMR-01")).thenReturn(Optional.of(venue));
        when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));
        EventResponse expected = response(EventStatus.DRAFT);
        when(eventMapper.toResponse(any(Event.class))).thenReturn(expected);

        EventResponse result = service.create(request(EVENT_DATE, 18));

        ArgumentCaptor<Event> captor = ArgumentCaptor.forClass(Event.class);
        verify(eventRepository).save(captor.capture());
        Event saved = captor.getValue();
        assertThat(saved.getStatus()).isEqualTo(EventStatus.DRAFT);
        assertThat(saved.getEventCode()).isEqualTo("CMF-2026");
        assertThat(saved.getMinimumAge()).isEqualTo(18);
        assertThat(saved.getVenue()).isSameAs(venue);
        assertThat(result.status()).isEqualTo(EventStatus.DRAFT);
    }

    @Test
    void create_nullMinimumAge_isTreatedAsNoRestriction() {
        when(eventRepository.existsByEventCode(any())).thenReturn(false);
        when(venueRepository.findByCode(any())).thenReturn(Optional.of(venue(true)));
        when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));
        when(eventMapper.toResponse(any(Event.class))).thenReturn(response(EventStatus.DRAFT));

        service.create(request(EVENT_DATE, null));

        ArgumentCaptor<Event> captor = ArgumentCaptor.forClass(Event.class);
        verify(eventRepository).save(captor.capture());
        assertThat(captor.getValue().getMinimumAge()).isZero();
    }

    @Test
    void create_duplicateEventCode_throwsDuplicateResource() {
        when(eventRepository.existsByEventCode("CMF-2026")).thenReturn(true);

        assertThatThrownBy(() -> service.create(request(EVENT_DATE, 18)))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("CMF-2026");

        verify(eventRepository, never()).save(any());
    }

    @Test
    void TEST_EVENT_004_create_unknownVenue_throwsAndNeverSaves() {
        when(eventRepository.existsByEventCode("CMF-2026")).thenReturn(false);
        when(venueRepository.findByCode("VEN-SMR-01")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(request(EVENT_DATE, 18)))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("VEN-SMR-01");

        verify(eventRepository, never()).save(any());
    }

    @Test
    void TEST_EVENT_005_create_inactiveVenue_throwsBusinessRule() {
        when(eventRepository.existsByEventCode("CMF-2026")).thenReturn(false);
        when(venueRepository.findByCode("VEN-SMR-01")).thenReturn(Optional.of(venue(false)));

        assertThatThrownBy(() -> service.create(request(EVENT_DATE, 18)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("inactive");

        verify(eventRepository, never()).save(any());
    }

    @Test
    void TEST_EVENT_006_create_pastDate_throwsBusinessRule() {
        when(eventRepository.existsByEventCode("CMF-2026")).thenReturn(false);
        when(venueRepository.findByCode("VEN-SMR-01")).thenReturn(Optional.of(venue(true)));

        assertThatThrownBy(() -> service.create(request(NOW.minusDays(1), 18)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("future");

        verify(eventRepository, never()).save(any());
    }

    @Test
    void create_negativeMinimumAge_throwsBusinessRule() {
        when(eventRepository.existsByEventCode("CMF-2026")).thenReturn(false);
        when(venueRepository.findByCode("VEN-SMR-01")).thenReturn(Optional.of(venue(true)));

        assertThatThrownBy(() -> service.create(request(EVENT_DATE, -1)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Minimum age");

        verify(eventRepository, never()).save(any());
    }

    @Test
    void create_missingRequiredField_throwsBusinessRule() {
        CreateEventRequest invalid = new CreateEventRequest(" ", "Name", null,
                EventCategory.MUSIC, EVENT_DATE, 0, "VEN-SMR-01");

        assertThatThrownBy(() -> service.create(invalid))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("eventCode");

        verify(eventRepository, never()).save(any());
    }

    @Test
    void TEST_EVENT_007_publish_validDraft_becomesPublished() {
        Event event = event(EventStatus.DRAFT, EVENT_DATE, venue(true));
        when(eventRepository.findByEventCode("CMF-2026")).thenReturn(Optional.of(event));
        when(eventRepository.save(event)).thenReturn(event);
        when(eventMapper.toResponse(event)).thenReturn(response(EventStatus.PUBLISHED));

        EventResponse result = service.publish("CMF-2026");

        assertThat(event.getStatus()).isEqualTo(EventStatus.PUBLISHED);
        assertThat(result.status()).isEqualTo(EventStatus.PUBLISHED);
        verify(eventRepository).save(event);
    }

    @Test
    void TEST_EVENT_008_publish_cancelledEvent_throwsAndDoesNotPersist() {
        Event event = event(EventStatus.CANCELLED, EVENT_DATE, venue(true));
        when(eventRepository.findByEventCode("CMF-2026")).thenReturn(Optional.of(event));

        assertThatThrownBy(() -> service.publish("CMF-2026"))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("CANCELLED");

        assertThat(event.getStatus()).isEqualTo(EventStatus.CANCELLED);
        verify(eventRepository, never()).save(any());
    }

    @Test
    void publish_alreadyPublishedSoldOutOrFinished_throwsBusinessRule() {
        for (EventStatus status : List.of(EventStatus.PUBLISHED, EventStatus.SOLD_OUT, EventStatus.FINISHED)) {
            Event event = event(status, EVENT_DATE, venue(true));
            when(eventRepository.findByEventCode("CMF-2026")).thenReturn(Optional.of(event));

            assertThatThrownBy(() -> service.publish("CMF-2026"))
                    .isInstanceOf(BusinessRuleException.class);
        }
        verify(eventRepository, never()).save(any());
    }

    @Test
    void publish_eventDateInThePast_throwsBusinessRule() {
        Event event = event(EventStatus.DRAFT, NOW.minusHours(1), venue(true));
        when(eventRepository.findByEventCode("CMF-2026")).thenReturn(Optional.of(event));

        assertThatThrownBy(() -> service.publish("CMF-2026"))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("future");

        verify(eventRepository, never()).save(any());
    }

    @Test
    void publish_inactiveVenue_throwsBusinessRule() {
        Event event = event(EventStatus.DRAFT, EVENT_DATE, venue(false));
        when(eventRepository.findByEventCode("CMF-2026")).thenReturn(Optional.of(event));

        assertThatThrownBy(() -> service.publish("CMF-2026"))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("inactive");

        verify(eventRepository, never()).save(any());
    }

    @Test
    void publish_unknownEvent_throwsResourceNotFound() {
        when(eventRepository.findByEventCode("NOPE")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.publish("NOPE"))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(eventRepository, never()).save(any());
    }

    @Test
    void addArtist_validArtist_associatesAndSaves() {
        Event event = event(EventStatus.DRAFT, EVENT_DATE, venue(true));
        Artist artist = new Artist("Solar Beat", "CO", "Pop");
        when(eventRepository.findByEventCode("CMF-2026")).thenReturn(Optional.of(event));
        when(artistRepository.findById(1L)).thenReturn(Optional.of(artist));
        when(eventRepository.save(event)).thenReturn(event);
        when(eventMapper.toResponse(event)).thenReturn(response(EventStatus.DRAFT));

        service.addArtist("CMF-2026", 1L);

        assertThat(event.getArtists()).containsExactly(artist);
        verify(eventRepository).save(event);
    }

    @Test
    void addArtist_allThreeScenarioArtists_canBeAssociated() {
        Event event = event(EventStatus.PUBLISHED, EVENT_DATE, venue(true));
        when(eventRepository.findByEventCode("CMF-2026")).thenReturn(Optional.of(event));
        when(eventRepository.save(event)).thenReturn(event);
        when(eventMapper.toResponse(event)).thenReturn(response(EventStatus.PUBLISHED));
        List<String> names = List.of("Solar Beat", "Neon Waves", "Caribbean Sound");
        for (int i = 0; i < names.size(); i++) {
            when(artistRepository.findById((long) i + 1))
                    .thenReturn(Optional.of(new Artist(names.get(i), "CO", "Pop")));
        }

        for (long id = 1; id <= 3; id++) {
            service.addArtist("CMF-2026", id);
        }

        assertThat(event.getArtists()).extracting(Artist::getStageName)
                .containsExactlyInAnyOrderElementsOf(names);
    }

    @Test
    void addArtist_sameArtistTwice_throwsDuplicateAndDoesNotPersist() {
        Event event = event(EventStatus.DRAFT, EVENT_DATE, venue(true));
        Artist artist = new Artist("Solar Beat", "CO", "Pop");
        event.addArtist(artist);
        when(eventRepository.findByEventCode("CMF-2026")).thenReturn(Optional.of(event));
        when(artistRepository.findById(1L)).thenReturn(Optional.of(artist));

        assertThatThrownBy(() -> service.addArtist("CMF-2026", 1L))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Solar Beat");

        verify(eventRepository, never()).save(any());
    }

    @Test
    void addArtist_cancelledOrFinishedEvent_throwsBusinessRule() {
        Artist artist = new Artist("Solar Beat", "CO", "Pop");
        when(artistRepository.findById(1L)).thenReturn(Optional.of(artist));

        for (EventStatus status : List.of(EventStatus.CANCELLED, EventStatus.FINISHED)) {
            Event event = event(status, EVENT_DATE, venue(true));
            when(eventRepository.findByEventCode("CMF-2026")).thenReturn(Optional.of(event));

            assertThatThrownBy(() -> service.addArtist("CMF-2026", 1L))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining(status.name());
            assertThat(event.getArtists()).isEmpty();
        }
        verify(eventRepository, never()).save(any());
    }

    @Test
    void addArtist_unknownEvent_throwsResourceNotFound() {
        when(eventRepository.findByEventCode("NOPE")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.addArtist("NOPE", 1L))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(eventRepository, never()).save(any());
    }

    @Test
    void addArtist_unknownArtist_throwsResourceNotFound() {
        Event event = event(EventStatus.DRAFT, EVENT_DATE, venue(true));
        when(eventRepository.findByEventCode("CMF-2026")).thenReturn(Optional.of(event));
        when(artistRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.addArtist("CMF-2026", 99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");

        verify(eventRepository, never()).save(any());
    }

    @Test
    void findPublishedEvents_mapsEveryPublishedEvent() {
        Event event = event(EventStatus.PUBLISHED, EVENT_DATE, venue(true));
        EventSummaryResponse summary = new EventSummaryResponse(1L, "CMF-2026", "Caribbean Music Fest 2026",
                EventCategory.MUSIC, EventStatus.PUBLISHED, EVENT_DATE, 18, "VEN-SMR-01", "Marina");
        when(eventRepository.findByStatusOrderByEventDateAsc(EventStatus.PUBLISHED)).thenReturn(List.of(event));
        when(eventMapper.toSummary(event)).thenReturn(summary);

        assertThat(service.findPublishedEvents()).containsExactly(summary);
    }

    @Test
    void findByArtist_usesCanonicalStageName() {
        Artist artist = new Artist("Solar Beat", "CO", "Pop");
        Event event = event(EventStatus.PUBLISHED, EVENT_DATE, venue(true));
        EventSummaryResponse summary = new EventSummaryResponse(1L, "CMF-2026", "Caribbean Music Fest 2026",
                EventCategory.MUSIC, EventStatus.PUBLISHED, EVENT_DATE, 18, "VEN-SMR-01", "Marina");
        when(artistRepository.findByStageNameIgnoreCase("solar beat")).thenReturn(Optional.of(artist));
        when(eventRepository.findByArtistStageName(eq("Solar Beat"))).thenReturn(List.of(event));
        when(eventMapper.toSummary(event)).thenReturn(summary);

        assertThat(service.findByArtist("solar beat")).containsExactly(summary);
    }

    @Test
    void findByArtist_unknownArtist_throwsResourceNotFound() {
        when(artistRepository.findByStageNameIgnoreCase("Ghost")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findByArtist("Ghost"))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(eventRepository, never()).findByArtistStageName(any());
    }
}
