package com.pulsepass.repository;

import com.pulsepass.domain.model.Artist;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ArtistRepository extends JpaRepository<Artist, Long> {

    Optional<Artist> findByStageName(String stageName);

    Optional<Artist> findByStageNameIgnoreCase(String stageName);

    boolean existsByStageNameIgnoreCase(String stageName);

    List<Artist> findByActiveTrueOrderByStageNameAsc();

    List<Artist> findAllByOrderByStageNameAsc();

    @Query("""
            select count(e)
            from Event e
            join e.artists a
            where a.id = :artistId
            """)
    long countEventsByArtistId(@Param("artistId") Long artistId);
}
