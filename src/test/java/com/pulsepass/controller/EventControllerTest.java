package com.pulsepass.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.pulsepass.domain.enums.EventCategory;
import com.pulsepass.domain.enums.EventStatus;
import com.pulsepass.dto.request.CreateEventRequest;
import com.pulsepass.dto.response.ArtistResponse;
import com.pulsepass.dto.response.EventResponse;
import com.pulsepass.dto.response.EventSummaryResponse;
import com.pulsepass.exception.BusinessRuleException;
import com.pulsepass.exception.ResourceNotFoundException;
import com.pulsepass.service.EventService;
import java.time.LocalDateTime;
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

@WebMvcTest(EventController.class)

@Import(SecurityTestConfig.class)
@WithMockUser(roles = {"USER", "STAFF", "ADMIN"})
class EventControllerTest {

    private static final String VALID_BODY = """
            {
              "eventCode": "CMF-2026",
              "name": "Caribbean Music Fest 2026",
              "description": "Festival de música",
              "category": "MUSIC",
              "eventDate": "2026-12-20T20:00:00",
              "minimumAge": 18,
              "venueCode": "VEN-SMR-01"
            }
            """;

    @Autowired private MockMvc mockMvc;
    @MockitoBean private EventService eventService;

    private static EventResponse event(EventStatus status) {
        return new EventResponse(1L, "CMF-2026", "Caribbean Music Fest 2026", "Festival de música",
                EventCategory.MUSIC, status, LocalDateTime.of(2026, 12, 20, 20, 0), 18,
                "VEN-SMR-01", "Marina Convention Center",
                List.of(new ArtistResponse(1L, "Solar Beat", "Colombia", "Electronic", true)));
    }

    private static EventSummaryResponse summary() {
        return new EventSummaryResponse(1L, "CMF-2026", "Caribbean Music Fest 2026", EventCategory.MUSIC,
                EventStatus.PUBLISHED, LocalDateTime.of(2026, 12, 20, 20, 0), 18,
                "VEN-SMR-01", "Marina Convention Center");
    }

    @Test
    void TEST_CTRL_EVT_001_create_validRequest_returns201() throws Exception {
        when(eventService.create(any(CreateEventRequest.class))).thenReturn(event(EventStatus.DRAFT));

        mockMvc.perform(post("/api/events").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/events/CMF-2026"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.eventCode").value("CMF-2026"))
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.venueCode").value("VEN-SMR-01"));

        verify(eventService).create(any(CreateEventRequest.class));
    }

    @Test
    void TEST_CTRL_EVT_002_create_invalidRequest_returns400AndDoesNotCallService() throws Exception {
        String invalid = """
                {
                  "eventCode": "",
                  "name": "Caribbean Music Fest 2026",
                  "category": "MUSIC",
                  "eventDate": "2026-12-20T20:00:00",
                  "minimumAge": -1,
                  "venueCode": ""
                }
                """;

        mockMvc.perform(post("/api/events").contentType(MediaType.APPLICATION_JSON).content(invalid))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.details.eventCode").value("Event code is required"))
                .andExpect(jsonPath("$.details.venueCode").value("Venue code is required"))
                .andExpect(jsonPath("$.details.minimumAge").exists());

        verify(eventService, never()).create(any());
    }

    @Test
    void TEST_CTRL_EVT_002b_create_malformedJson_returns400() throws Exception {
        mockMvc.perform(post("/api/events").contentType(MediaType.APPLICATION_JSON).content("{ not json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));

        verifyNoInteractions(eventService);
    }

    @Test
    void TEST_CTRL_EVT_002c_create_unknownVenue_returns404() throws Exception {
        when(eventService.create(any(CreateEventRequest.class)))
                .thenThrow(ResourceNotFoundException.of("Venue", "VEN-SMR-01"));

        mockMvc.perform(post("/api/events").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Venue not found: VEN-SMR-01"));
    }

    @Test
    void TEST_CTRL_EVT_003_findByCode_existing_returns200() throws Exception {
        when(eventService.findByCode("CMF-2026")).thenReturn(event(EventStatus.DRAFT));

        mockMvc.perform(get("/api/events/CMF-2026"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.eventCode").value("CMF-2026"))
                .andExpect(jsonPath("$.artists[0].stageName").value("Solar Beat"));

        verify(eventService).findByCode("CMF-2026");
    }

    @Test
    void TEST_CTRL_EVT_004_findByCode_unknown_returns404() throws Exception {
        when(eventService.findByCode("X")).thenThrow(ResourceNotFoundException.of("Event", "X"));

        mockMvc.perform(get("/api/events/X"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Event not found: X"));
    }

    @Test
    void TEST_CTRL_EVT_005_findPublishedEvents_returns200() throws Exception {
        when(eventService.findPublishedEvents()).thenReturn(List.of(summary()));

        mockMvc.perform(get("/api/events/published"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].status").value("PUBLISHED"));

        verify(eventService).findPublishedEvents();
    }

    @Test
    void TEST_CTRL_EVT_006_publish_valid_returns200() throws Exception {
        when(eventService.publish("CMF-2026")).thenReturn(event(EventStatus.PUBLISHED));

        mockMvc.perform(patch("/api/events/CMF-2026/publish"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"));

        verify(eventService).publish("CMF-2026");
    }

    @Test
    void TEST_CTRL_EVT_007_publish_businessRuleViolation_returns409() throws Exception {
        when(eventService.publish("CMF-2026"))
                .thenThrow(new BusinessRuleException("Only DRAFT events can be published."));

        mockMvc.perform(patch("/api/events/CMF-2026/publish"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value("Only DRAFT events can be published."));
    }

    @Test
    void TEST_CTRL_EVT_008_addArtist_valid_returns200() throws Exception {
        when(eventService.addArtist("CMF-2026", 1L)).thenReturn(event(EventStatus.DRAFT));

        mockMvc.perform(post("/api/events/CMF-2026/artists/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.artists[0].id").value(1));

        verify(eventService).addArtist("CMF-2026", 1L);
    }

    @Test
    void TEST_CTRL_EVT_008b_addArtist_conflict_returns409() throws Exception {
        when(eventService.addArtist("CMF-2026", 1L))
                .thenThrow(new BusinessRuleException("Artist already associated with event: CMF-2026"));

        mockMvc.perform(post("/api/events/CMF-2026/artists/1"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    void TEST_CTRL_EVT_008c_addArtist_nonNumericArtistId_returns400() throws Exception {
        mockMvc.perform(post("/api/events/CMF-2026/artists/abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));

        verifyNoInteractions(eventService);
    }

    @Test
    void TEST_CTRL_EVT_009_findByArtist_returns200() throws Exception {
        when(eventService.findByArtist("Solar Beat")).thenReturn(List.of(summary()));

        mockMvc.perform(get("/api/events/by-artist").param("stageName", "Solar Beat"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].eventCode").value("CMF-2026"));

        verify(eventService).findByArtist("Solar Beat");
    }

    @Test
    void TEST_CTRL_EVT_009b_findByArtist_missingParam_returns400() throws Exception {
        mockMvc.perform(get("/api/events/by-artist"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));

        verifyNoInteractions(eventService);
    }
}
