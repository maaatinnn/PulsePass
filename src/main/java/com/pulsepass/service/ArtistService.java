package com.pulsepass.service;

import com.pulsepass.dto.request.CreateArtistRequest;
import com.pulsepass.dto.response.ArtistResponse;
import java.util.List;

public interface ArtistService {

    ArtistResponse create(CreateArtistRequest request);

    ArtistResponse findById(Long id);

    ArtistResponse findByStageName(String stageName);

    List<ArtistResponse> findActiveArtists();

    List<ArtistResponse> findAll();

    void delete(Long id);
}
