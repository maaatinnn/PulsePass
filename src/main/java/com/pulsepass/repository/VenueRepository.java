package com.pulsepass.repository;

import com.pulsepass.domain.model.Venue;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VenueRepository extends JpaRepository<Venue, Long> {

    Optional<Venue> findByCode(String code);

    boolean existsByCode(String code);
}
