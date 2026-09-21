package com.pulsepass.repository;

import com.pulsepass.domain.enums.EventStatus;
import com.pulsepass.domain.model.Event;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EventRepository extends JpaRepository<Event, Long> {

    Optional<Event> findByEventCode(String eventCode);

    List<Event> findByStatusOrderByEventDateAsc(EventStatus status);

    List<Event> findByVenueCode(String venueCode);

    @Query("""
            select distinct e
            from Event e
            join e.artists a
            where a.stageName = :stageName
            """)
    List<Event> findByArtistStageName(@Param("stageName") String stageName);

    @Query("""
            select distinct e
            from Event e
            join e.venue v
            join e.artists a
            where v.city = :city
              and a.stageName = :stageName
            """)
    List<Event> findByCityAndArtist(@Param("city") String city,
                                    @Param("stageName") String stageName);

    @Query("""
            select distinct e
            from Event e
            join e.venue v
            join e.artists a
            where e.status = com.pulsepass.domain.enums.EventStatus.PUBLISHED
              and e.eventDate > :from
              and v.city = :city
              and lower(a.stageName) like lower(concat('%', :artistText, '%'))
            order by e.eventDate asc
            """)
    List<Event> findRecommended(@Param("from") LocalDateTime from,
                                @Param("city") String city,
                                @Param("artistText") String artistText);
}
