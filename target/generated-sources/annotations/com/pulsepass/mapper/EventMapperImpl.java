package com.pulsepass.mapper;

import com.pulsepass.domain.enums.EventCategory;
import com.pulsepass.domain.enums.EventStatus;
import com.pulsepass.domain.model.Artist;
import com.pulsepass.domain.model.Event;
import com.pulsepass.domain.model.Venue;
import com.pulsepass.dto.response.ArtistResponse;
import com.pulsepass.dto.response.EventResponse;
import com.pulsepass.dto.response.EventSummaryResponse;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import javax.annotation.processing.Generated;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-11-19T15:47:19-0500",
    comments = "version: 1.6.3, compiler: javac, environment: Java 21.0.12.1 (Eclipse Adoptium)"
)
@Component
public class EventMapperImpl implements EventMapper {

    private final ArtistMapper artistMapper;

    @Autowired
    public EventMapperImpl(ArtistMapper artistMapper) {

        this.artistMapper = artistMapper;
    }

    @Override
    public EventResponse toResponse(Event event) {
        if ( event == null ) {
            return null;
        }

        String venueCode = null;
        String venueName = null;
        Long id = null;
        String eventCode = null;
        String name = null;
        String description = null;
        EventCategory category = null;
        EventStatus status = null;
        LocalDateTime eventDate = null;
        Integer minimumAge = null;
        List<ArtistResponse> artists = null;

        venueCode = eventVenueCode( event );
        venueName = eventVenueName( event );
        id = event.getId();
        eventCode = event.getEventCode();
        name = event.getName();
        description = event.getDescription();
        category = event.getCategory();
        status = event.getStatus();
        eventDate = event.getEventDate();
        minimumAge = event.getMinimumAge();
        artists = artistSetToArtistResponseList( event.getArtists() );

        EventResponse eventResponse = new EventResponse( id, eventCode, name, description, category, status, eventDate, minimumAge, venueCode, venueName, artists );

        return eventResponse;
    }

    @Override
    public EventSummaryResponse toSummary(Event event) {
        if ( event == null ) {
            return null;
        }

        String venueCode = null;
        String venueName = null;
        Long id = null;
        String eventCode = null;
        String name = null;
        EventCategory category = null;
        EventStatus status = null;
        LocalDateTime eventDate = null;
        Integer minimumAge = null;

        venueCode = eventVenueCode( event );
        venueName = eventVenueName( event );
        id = event.getId();
        eventCode = event.getEventCode();
        name = event.getName();
        category = event.getCategory();
        status = event.getStatus();
        eventDate = event.getEventDate();
        minimumAge = event.getMinimumAge();

        EventSummaryResponse eventSummaryResponse = new EventSummaryResponse( id, eventCode, name, category, status, eventDate, minimumAge, venueCode, venueName );

        return eventSummaryResponse;
    }

    private String eventVenueCode(Event event) {
        Venue venue = event.getVenue();
        if ( venue == null ) {
            return null;
        }
        return venue.getCode();
    }

    private String eventVenueName(Event event) {
        Venue venue = event.getVenue();
        if ( venue == null ) {
            return null;
        }
        return venue.getName();
    }

    protected List<ArtistResponse> artistSetToArtistResponseList(Set<Artist> set) {
        if ( set == null ) {
            return null;
        }

        List<ArtistResponse> list = new ArrayList<ArtistResponse>( set.size() );
        for ( Artist artist : set ) {
            list.add( artistMapper.toResponse( artist ) );
        }

        return list;
    }
}
