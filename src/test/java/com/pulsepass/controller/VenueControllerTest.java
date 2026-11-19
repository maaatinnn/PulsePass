package com.pulsepass.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.pulsepass.dto.request.CreateVenueRequest;
import com.pulsepass.dto.response.VenueResponse;
import com.pulsepass.exception.BusinessRuleException;
import com.pulsepass.exception.DuplicateResourceException;
import com.pulsepass.exception.ResourceNotFoundException;
import com.pulsepass.service.VenueService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import com.pulsepass.support.SecurityTestConfig;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(VenueController.class)

@Import(SecurityTestConfig.class)
@WithMockUser(roles = {"USER", "STAFF", "ADMIN"})
class VenueControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private VenueService venueService;

    private static VenueResponse venue() {
        return new VenueResponse(1L, "VEN-SMR-01", "Marina Convention Center", "Santa Marta",
                "Calle 1", 3, true);
    }

    @Test
    void TEST_CTRL_VEN_001_findByCode_existing_returns200() throws Exception {
        when(venueService.findByCode("VEN-SMR-01")).thenReturn(venue());

        mockMvc.perform(get("/api/venues/VEN-SMR-01"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.code").value("VEN-SMR-01"))
                .andExpect(jsonPath("$.name").value("Marina Convention Center"))
                .andExpect(jsonPath("$.capacity").value(3));

        verify(venueService).findByCode("VEN-SMR-01");
    }

    @Test
    void TEST_CTRL_VEN_002_findByCode_unknown_returns404WithErrorResponse() throws Exception {
        when(venueService.findByCode("NOPE")).thenThrow(ResourceNotFoundException.of("Venue", "NOPE"));

        mockMvc.perform(get("/api/venues/NOPE"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Venue not found: NOPE"))
                .andExpect(jsonPath("$.timestamp").exists())
                .andExpect(jsonPath("$.details").isEmpty());
    }

    @Test
    void TEST_CTRL_VEN_003_findActiveVenues_returns200() throws Exception {
        when(venueService.findActiveVenues()).thenReturn(List.of(venue()));

        mockMvc.perform(get("/api/venues/active"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].code").value("VEN-SMR-01"))
                .andExpect(jsonPath("$[0].active").value(true));

        verify(venueService).findActiveVenues();
    }

    @Test
    void TEST_CTRL_VEN_004_findAll_returns200() throws Exception {
        when(venueService.findAll()).thenReturn(List.of(venue()));

        mockMvc.perform(get("/api/venues"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].code").value("VEN-SMR-01"));

        verify(venueService).findAll();
    }

    @Test
    void TEST_CTRL_VEN_005_create_valid_returns201WithLocation() throws Exception {
        when(venueService.create(any(CreateVenueRequest.class))).thenReturn(venue());

        mockMvc.perform(post("/api/venues")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "code": "VEN-SMR-01", "name": "Marina Convention Center",
                                  "city": "Santa Marta", "address": "Calle 1", "capacity": 3 }
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/venues/VEN-SMR-01"))
                .andExpect(jsonPath("$.code").value("VEN-SMR-01"))
                .andExpect(jsonPath("$.capacity").value(3));

        verify(venueService).create(new CreateVenueRequest(
                "VEN-SMR-01", "Marina Convention Center", "Santa Marta", "Calle 1", 3));
    }

    @Test
    void TEST_CTRL_VEN_006_create_invalid_returns400AndDoesNotCallService() throws Exception {
        mockMvc.perform(post("/api/venues")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "code": "", "name": "", "city": "", "capacity": 0 }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.details.code").value("Venue code is required"))
                .andExpect(jsonPath("$.details.name").value("Name is required"))
                .andExpect(jsonPath("$.details.city").value("City is required"))
                .andExpect(jsonPath("$.details.capacity").value("Capacity must be greater than or equal to 1"));

        verify(venueService, never()).create(any());
    }

    @Test
    void TEST_CTRL_VEN_007_create_duplicate_returns409() throws Exception {
        when(venueService.create(any(CreateVenueRequest.class)))
                .thenThrow(new DuplicateResourceException("Venue already exists: VEN-SMR-01"));

        mockMvc.perform(post("/api/venues")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "code": "VEN-SMR-01", "name": "Marina", "city": "Santa Marta", "capacity": 3 }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Venue already exists: VEN-SMR-01"));
    }

    @Test
    void TEST_CTRL_VEN_008_delete_existing_returns204() throws Exception {
        mockMvc.perform(delete("/api/venues/VEN-SMR-01"))
                .andExpect(status().isNoContent());

        verify(venueService).delete("VEN-SMR-01");
    }

    @Test
    void TEST_CTRL_VEN_009_delete_unknown_returns404() throws Exception {
        org.mockito.Mockito.doThrow(ResourceNotFoundException.of("Venue", "NOPE"))
                .when(venueService).delete("NOPE");

        mockMvc.perform(delete("/api/venues/NOPE"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Venue not found: NOPE"));
    }

    @Test
    void TEST_CTRL_VEN_010_delete_withEvents_returns409() throws Exception {
        org.mockito.Mockito.doThrow(new BusinessRuleException(
                        "Cannot delete venue VEN-SMR-01: it has 2 associated event(s)."))
                .when(venueService).delete("VEN-SMR-01");

        mockMvc.perform(delete("/api/venues/VEN-SMR-01"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message")
                        .value("Cannot delete venue VEN-SMR-01: it has 2 associated event(s)."));
    }
}
