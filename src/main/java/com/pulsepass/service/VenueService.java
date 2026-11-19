package com.pulsepass.service;

import com.pulsepass.dto.request.CreateVenueRequest;
import com.pulsepass.dto.response.VenueResponse;
import java.util.List;

public interface VenueService {

    VenueResponse create(CreateVenueRequest request);

    VenueResponse findByCode(String code);

    List<VenueResponse> findActiveVenues();

    List<VenueResponse> findAll();

    void delete(String code);
}
