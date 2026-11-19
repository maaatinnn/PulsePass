package com.pulsepass.service.impl;

import static com.pulsepass.service.impl.Validations.requireNonNull;
import static com.pulsepass.service.impl.Validations.requireText;
import static com.pulsepass.service.impl.Validations.trimToNull;

import com.pulsepass.domain.model.Venue;
import com.pulsepass.dto.request.CreateVenueRequest;
import com.pulsepass.dto.response.VenueResponse;
import com.pulsepass.exception.BusinessRuleException;
import com.pulsepass.exception.DuplicateResourceException;
import com.pulsepass.exception.ResourceNotFoundException;
import com.pulsepass.mapper.VenueMapper;
import com.pulsepass.repository.VenueRepository;
import com.pulsepass.service.VenueService;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VenueServiceImpl implements VenueService {

    private final VenueRepository venueRepository;
    private final VenueMapper venueMapper;

    public VenueServiceImpl(VenueRepository venueRepository, VenueMapper venueMapper) {
        this.venueRepository = venueRepository;
        this.venueMapper = venueMapper;
    }

    @Override
    @Transactional
    public VenueResponse create(CreateVenueRequest request) {
        requireNonNull(request, "request");
        requireText(request.code(), "code");
        requireText(request.name(), "name");
        requireText(request.city(), "city");
        requireNonNull(request.capacity(), "capacity");

        if (request.capacity() < 1) {
            throw new BusinessRuleException("Capacity must be greater than or equal to 1.");
        }

        String code = request.code().trim();
        if (venueRepository.existsByCode(code)) {
            throw new DuplicateResourceException("Venue already exists: " + code);
        }

        Venue venue = new Venue(code, request.name().trim(), request.city().trim(),
                trimToNull(request.address()), request.capacity());
        return venueMapper.toResponse(venueRepository.save(venue));
    }

    @Override
    @Transactional(readOnly = true)
    public VenueResponse findByCode(String code) {
        return venueRepository.findByCode(code)
                .map(venueMapper::toResponse)
                .orElseThrow(() -> ResourceNotFoundException.of("Venue", code));
    }

    @Override
    @Transactional(readOnly = true)
    public List<VenueResponse> findActiveVenues() {
        return venueRepository.findByActiveTrueOrderByNameAsc()
                .stream()
                .map(venueMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<VenueResponse> findAll() {
        return venueRepository.findAllByOrderByNameAsc()
                .stream()
                .map(venueMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void delete(String code) {
        Venue venue = venueRepository.findByCode(code)
                .orElseThrow(() -> ResourceNotFoundException.of("Venue", code));

        int events = venue.getEvents().size();
        if (events > 0) {
            throw new BusinessRuleException("Cannot delete venue " + code
                    + ": it has " + events + " associated event(s).");
        }

        venueRepository.delete(venue);
    }
}
