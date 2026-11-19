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

import com.pulsepass.dto.request.CreateArtistRequest;
import com.pulsepass.dto.response.ArtistResponse;
import com.pulsepass.exception.BusinessRuleException;
import com.pulsepass.exception.DuplicateResourceException;
import com.pulsepass.exception.ResourceNotFoundException;
import com.pulsepass.service.ArtistService;
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

@WebMvcTest(ArtistController.class)

@Import(SecurityTestConfig.class)
@WithMockUser(roles = {"USER", "STAFF", "ADMIN"})
class ArtistControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private ArtistService artistService;

    private static ArtistResponse artist() {
        return new ArtistResponse(1L, "Solar Beat", "Colombia", "Electronic", true);
    }

    @Test
    void TEST_CTRL_ART_001_findById_existing_returns200() throws Exception {
        when(artistService.findById(1L)).thenReturn(artist());

        mockMvc.perform(get("/api/artists/1"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.stageName").value("Solar Beat"));

        verify(artistService).findById(1L);
    }

    @Test
    void TEST_CTRL_ART_002_findById_unknown_returns404() throws Exception {
        when(artistService.findById(99L)).thenThrow(ResourceNotFoundException.of("Artist", 99L));

        mockMvc.perform(get("/api/artists/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Artist not found: 99"));
    }

    @Test
    void TEST_CTRL_ART_003_findByStageName_returns200() throws Exception {
        when(artistService.findByStageName("Solar Beat")).thenReturn(artist());

        mockMvc.perform(get("/api/artists/by-stage-name").param("stageName", "Solar Beat"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stageName").value("Solar Beat"));

        verify(artistService).findByStageName("Solar Beat");
    }

    @Test
    void TEST_CTRL_ART_003b_findByStageName_unknown_returns404() throws Exception {
        when(artistService.findByStageName("Nadie"))
                .thenThrow(ResourceNotFoundException.of("Artist", "Nadie"));

        mockMvc.perform(get("/api/artists/by-stage-name").param("stageName", "Nadie"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Artist not found: Nadie"));
    }

    @Test
    void TEST_CTRL_ART_004_findActiveArtists_returns200() throws Exception {
        when(artistService.findActiveArtists()).thenReturn(List.of(artist()));

        mockMvc.perform(get("/api/artists/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].active").value(true));

        verify(artistService).findActiveArtists();
    }

    @Test
    void TEST_CTRL_ART_005_findAll_returns200() throws Exception {
        when(artistService.findAll()).thenReturn(List.of(artist()));

        mockMvc.perform(get("/api/artists"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].stageName").value("Solar Beat"));

        verify(artistService).findAll();
    }

    @Test
    void TEST_CTRL_ART_006_create_valid_returns201WithLocation() throws Exception {
        when(artistService.create(any(CreateArtistRequest.class))).thenReturn(artist());

        mockMvc.perform(post("/api/artists")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "stageName": "Solar Beat", "country": "Colombia", "genre": "Electronic" }
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/artists/1"))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.stageName").value("Solar Beat"));

        verify(artistService).create(new CreateArtistRequest("Solar Beat", "Colombia", "Electronic"));
    }

    @Test
    void TEST_CTRL_ART_007_create_blankStageName_returns400AndDoesNotCallService() throws Exception {
        mockMvc.perform(post("/api/artists")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "stageName": "  " }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.details.stageName").value("Stage name is required"));

        verify(artistService, never()).create(any());
    }

    @Test
    void TEST_CTRL_ART_008_create_duplicate_returns409() throws Exception {
        when(artistService.create(any(CreateArtistRequest.class)))
                .thenThrow(new DuplicateResourceException("Artist already exists: Solar Beat"));

        mockMvc.perform(post("/api/artists")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "stageName": "Solar Beat" }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Artist already exists: Solar Beat"));
    }

    @Test
    void TEST_CTRL_ART_009_delete_existing_returns204() throws Exception {
        mockMvc.perform(delete("/api/artists/1"))
                .andExpect(status().isNoContent());

        verify(artistService).delete(1L);
    }

    @Test
    void TEST_CTRL_ART_010_delete_unknown_returns404() throws Exception {
        org.mockito.Mockito.doThrow(ResourceNotFoundException.of("Artist", 99L))
                .when(artistService).delete(99L);

        mockMvc.perform(delete("/api/artists/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Artist not found: 99"));
    }

    @Test
    void TEST_CTRL_ART_011_delete_associatedToEvents_returns409() throws Exception {
        org.mockito.Mockito.doThrow(new BusinessRuleException(
                        "Cannot delete artist Solar Beat: it is associated with 1 event(s)."))
                .when(artistService).delete(1L);

        mockMvc.perform(delete("/api/artists/1"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message")
                        .value("Cannot delete artist Solar Beat: it is associated with 1 event(s)."));
    }
}
