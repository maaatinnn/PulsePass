package com.pulsepass.service.impl;

import static com.pulsepass.service.impl.Validations.requireNonNull;
import static com.pulsepass.service.impl.Validations.requireText;
import static com.pulsepass.service.impl.Validations.trimToNull;

import com.pulsepass.domain.model.Artist;
import com.pulsepass.dto.request.CreateArtistRequest;
import com.pulsepass.dto.response.ArtistResponse;
import com.pulsepass.exception.BusinessRuleException;
import com.pulsepass.exception.DuplicateResourceException;
import com.pulsepass.exception.ResourceNotFoundException;
import com.pulsepass.mapper.ArtistMapper;
import com.pulsepass.repository.ArtistRepository;
import com.pulsepass.service.ArtistService;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ArtistServiceImpl implements ArtistService {

    private final ArtistRepository artistRepository;
    private final ArtistMapper artistMapper;

    public ArtistServiceImpl(ArtistRepository artistRepository, ArtistMapper artistMapper) {
        this.artistRepository = artistRepository;
        this.artistMapper = artistMapper;
    }

    @Override
    @Transactional
    public ArtistResponse create(CreateArtistRequest request) {
        requireNonNull(request, "request");
        requireText(request.stageName(), "stageName");

        String stageName = request.stageName().trim();
        if (artistRepository.existsByStageNameIgnoreCase(stageName)) {
            throw new DuplicateResourceException("Artist already exists: " + stageName);
        }

        Artist artist = new Artist(stageName, trimToNull(request.country()), trimToNull(request.genre()));
        return artistMapper.toResponse(artistRepository.save(artist));
    }

    @Override
    @Transactional(readOnly = true)
    public ArtistResponse findById(Long id) {
        return artistRepository.findById(id)
                .map(artistMapper::toResponse)
                .orElseThrow(() -> ResourceNotFoundException.of("Artist", id));
    }

    @Override
    @Transactional(readOnly = true)
    public ArtistResponse findByStageName(String stageName) {
        return artistRepository.findByStageNameIgnoreCase(stageName)
                .map(artistMapper::toResponse)
                .orElseThrow(() -> ResourceNotFoundException.of("Artist", stageName));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ArtistResponse> findActiveArtists() {
        return artistRepository.findByActiveTrueOrderByStageNameAsc()
                .stream()
                .map(artistMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ArtistResponse> findAll() {
        return artistRepository.findAllByOrderByStageNameAsc()
                .stream()
                .map(artistMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Artist artist = artistRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Artist", id));

        long events = artistRepository.countEventsByArtistId(id);
        if (events > 0) {
            throw new BusinessRuleException("Cannot delete artist " + artist.getStageName()
                    + ": it is associated with " + events + " event(s).");
        }

        artistRepository.delete(artist);
    }
}
