package com.pulsepass.service.impl;

import static com.pulsepass.service.impl.Validations.requireNonNull;
import static com.pulsepass.service.impl.Validations.requireText;

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
import com.pulsepass.service.EventService;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EventServiceImpl implements EventService {

    private static final Set<EventStatus> STATUSES_CLOSED_TO_ARTISTS =
            Set.of(EventStatus.CANCELLED, EventStatus.FINISHED);

    private final EventRepository eventRepository;
    private final VenueRepository venueRepository;
    private final ArtistRepository artistRepository;
    private final EventMapper eventMapper;
    private final Clock clock;

    public EventServiceImpl(EventRepository eventRepository,
                            VenueRepository venueRepository,
                            ArtistRepository artistRepository,
                            EventMapper eventMapper,
                            Clock clock) {
        this.eventRepository = eventRepository;
        this.venueRepository = venueRepository;
        this.artistRepository = artistRepository;
        this.eventMapper = eventMapper;
        this.clock = clock;
    }

    @Override
    @Transactional
    public EventResponse create(CreateEventRequest request) {
        requireNonNull(request, "request");
        requireText(request.eventCode(), "eventCode");
        requireText(request.name(), "name");
        requireNonNull(request.category(), "category");
        requireNonNull(request.eventDate(), "eventDate");
        requireText(request.venueCode(), "venueCode");

        // BR-EVENT-001
        if (eventRepository.existsByEventCode(request.eventCode())) {
            throw new DuplicateResourceException("Event already exists: " + request.eventCode());
        }

        // BR-EVENT-002
        Venue venue = venueRepository.findByCode(request.venueCode())
                .orElseThrow(() -> ResourceNotFoundException.of("Venue", request.venueCode()));

        // BR-EVENT-003
        requireActiveVenue(venue, "create an event");

        // BR-EVENT-004
        if (!request.eventDate().isAfter(now())) {
            throw new BusinessRuleException("Event date must be in the future: " + request.eventDate());
        }

        // BR-EVENT-006 (null se interpreta como "sin restricción")
        int minimumAge = request.minimumAge() == null ? 0 : request.minimumAge();
        if (minimumAge < 0) {
            throw new BusinessRuleException("Minimum age must be greater than or equal to 0.");
        }

        // BR-EVENT-005: el estado inicial lo decide el sistema, nunca el request.
        Event event = new Event(request.eventCode(), request.name(), request.category(),
                EventStatus.DRAFT, request.eventDate(), venue);
        event.setDescription(request.description());
        event.setMinimumAge(minimumAge);

        return eventMapper.toResponse(eventRepository.save(event));
    }

    @Override
    @Transactional(readOnly = true)
    public EventResponse findByCode(String eventCode) {
        return eventMapper.toResponse(getEvent(eventCode));
    }

    @Override
    @Transactional(readOnly = true)
    public List<EventSummaryResponse> findPublishedEvents() {
        return eventRepository.findByStatusOrderByEventDateAsc(EventStatus.PUBLISHED)
                .stream()
                .map(eventMapper::toSummary)
                .toList();
    }

    @Override
    @Transactional
    public EventResponse publish(String eventCode) {
        Event event = getEvent(eventCode);

        // BR-EVENT-007
        if (event.getStatus() != EventStatus.DRAFT) {
            throw new BusinessRuleException("Only DRAFT events can be published. Event "
                    + eventCode + " is " + event.getStatus() + ".");
        }
        // BR-EVENT-008
        if (!event.getEventDate().isAfter(now())) {
            throw new BusinessRuleException("Cannot publish event " + eventCode
                    + ": its date is no longer in the future.");
        }
        // BR-EVENT-009
        requireActiveVenue(event.getVenue(), "publish event " + eventCode);

        event.setStatus(EventStatus.PUBLISHED);
        return eventMapper.toResponse(eventRepository.save(event));
    }

    @Override
    @Transactional
    public EventResponse addArtist(String eventCode, Long artistId) {
        Event event = getEvent(eventCode);
        Artist artist = artistRepository.findById(artistId)
                .orElseThrow(() -> ResourceNotFoundException.of("Artist", artistId));

        // BR-EVENT-011
        if (STATUSES_CLOSED_TO_ARTISTS.contains(event.getStatus())) {
            throw new BusinessRuleException("Cannot add artists to event " + eventCode
                    + " because it is " + event.getStatus() + ".");
        }
        // BR-EVENT-010
        if (event.getArtists().contains(artist)) {
            throw new DuplicateResourceException("Artist " + artist.getStageName()
                    + " is already associated with event " + eventCode + ".");
        }

        event.addArtist(artist);
        return eventMapper.toResponse(eventRepository.save(event));
    }

    @Override
    @Transactional(readOnly = true)
    public List<EventSummaryResponse> findByArtist(String stageName) {
        Artist artist = artistRepository.findByStageNameIgnoreCase(stageName)
                .orElseThrow(() -> ResourceNotFoundException.of("Artist", stageName));

        return eventRepository.findByArtistStageName(artist.getStageName())
                .stream()
                .map(eventMapper::toSummary)
                .toList();
    }

    private Event getEvent(String eventCode) {
        return eventRepository.findByEventCode(eventCode)
                .orElseThrow(() -> ResourceNotFoundException.of("Event", eventCode));
    }

    private void requireActiveVenue(Venue venue, String operation) {
        if (!venue.isActive()) {
            throw new BusinessRuleException("Cannot " + operation + ": venue "
                    + venue.getCode() + " is inactive.");
        }
    }

    private LocalDateTime now() {
        return LocalDateTime.now(clock);
    }
}
