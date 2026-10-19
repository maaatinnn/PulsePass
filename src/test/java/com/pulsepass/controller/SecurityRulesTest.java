package com.pulsepass.controller;

import static org.mockito.ArgumentMatchers.any;
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
import com.pulsepass.dto.response.EventResponse;
import com.pulsepass.service.ArtistService;
import com.pulsepass.service.AuthService;
import com.pulsepass.service.EventService;
import com.pulsepass.service.TicketService;
import com.pulsepass.service.UserService;
import com.pulsepass.service.VenueService;
import com.pulsepass.support.SecurityTestConfig;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Reglas de la filter chain REAL (PRD §17.2, T-SEC-001..004, 012, 013). Los Services están mockeados:
 * lo que se verifica es que un request denegado NUNCA llega al negocio.
 *
 * <p>Mitad 1: sin filtro JWT, la identidad se simula con @WithMockUser. Las pruebas con token real
 * llegan con la etapa 5/6.
 */
@WebMvcTest(controllers = {VenueController.class, EventController.class, ArtistController.class,
        UserController.class, TicketController.class, AuthController.class})
@Import(SecurityTestConfig.class)
class SecurityRulesTest {

    private static final String EVENT_BODY = """
            {
              "eventCode": "CMF-2026", "name": "Caribbean Music Fest 2026", "category": "MUSIC",
              "eventDate": "2026-12-20T20:00:00", "minimumAge": 18, "venueCode": "VEN-SMR-01"
            }
            """;

    @Autowired private MockMvc mockMvc;
    @MockitoBean private VenueService venueService;
    @MockitoBean private EventService eventService;
    @MockitoBean private ArtistService artistService;
    @MockitoBean private UserService userService;
    @MockitoBean private TicketService ticketService;
    @MockitoBean private AuthService authService;

    // ---------- públicas ----------

    @Test
    void T_SEC_001_anonymous_canReadPublishedEvents() throws Exception {
        mockMvc.perform(get("/api/events/published")).andExpect(status().isOk());
    }

    @Test
    void anonymous_canReadVenuesAndArtists() throws Exception {
        mockMvc.perform(get("/api/venues/active")).andExpect(status().isOk());
        mockMvc.perform(get("/api/venues/VEN-SMR-01")).andExpect(status().isOk());
        mockMvc.perform(get("/api/artists/active")).andExpect(status().isOk());
        mockMvc.perform(get("/api/artists/1")).andExpect(status().isOk());
        mockMvc.perform(get("/api/artists/by-stage-name").param("stageName", "Solar Beat"))
                .andExpect(status().isOk());
    }

    @Test
    void anonymous_canReachRegisterAndLogin_validationRunsInsteadOfSecurity() throws Exception {
        mockMvc.perform(post("/api/users").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
    }

    // ---------- 401: sin identidad ----------

    @Test
    void T_SEC_002_anonymous_postEvents_returns401ErrorResponse_andDoesNotCallService() throws Exception {
        mockMvc.perform(post("/api/events").contentType(MediaType.APPLICATION_JSON).content(EVENT_BODY))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(header().string("WWW-Authenticate", "Bearer"))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("Autenticación requerida o token inválido"))
                .andExpect(jsonPath("$.details").isEmpty());

        verifyNoInteractions(eventService);
    }

    @Test
    void T_SEC_017_anonymous_canReachEventByCodeAndByArtist() throws Exception {
        mockMvc.perform(get("/api/events/CMF-2026")).andExpect(status().isOk());
        mockMvc.perform(get("/api/events/by-artist").param("stageName", "Solar Beat"))
                .andExpect(status().isOk());
    }

    @Test
    void anonymous_cannotTouchTicketsOrUserData() throws Exception {
        mockMvc.perform(get("/api/tickets/TKT-1")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/tickets/by-user").param("email", "carlos@email.com"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/users/by-email").param("email", "carlos@email.com"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/users/by-username").param("username", "carlos"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(patch("/api/tickets/TKT-1/cancel")).andExpect(status().isUnauthorized());

        verifyNoInteractions(ticketService, userService);
    }

    @Test
    void unknownRoutesAreDeniedByDefault() throws Exception {
        mockMvc.perform(get("/api/ruta-que-no-existe")).andExpect(status().isUnauthorized());
    }

    // ---------- 403: identidad válida sin rol ----------

    @Test
    @WithMockUser(roles = "USER")
    void T_SEC_003_user_postEvents_returns403ErrorResponse_andDoesNotCallService() throws Exception {
        mockMvc.perform(post("/api/events").contentType(MediaType.APPLICATION_JSON).content(EVENT_BODY))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"))
                .andExpect(jsonPath("$.message").value("No tiene permisos para realizar esta operación"))
                .andExpect(jsonPath("$.details").isEmpty());

        verifyNoInteractions(eventService);
    }

    @Test
    @WithMockUser(roles = "USER")
    void user_cannotPublishEventOrAddArtists() throws Exception {
        mockMvc.perform(patch("/api/events/CMF-2026/publish")).andExpect(status().isForbidden());
        mockMvc.perform(post("/api/events/CMF-2026/artists/1")).andExpect(status().isForbidden());

        verifyNoInteractions(eventService);
    }

    @Test
    @WithMockUser(roles = "STAFF")
    void staff_cannotCreateOrPublishEvents() throws Exception {
        mockMvc.perform(post("/api/events").contentType(MediaType.APPLICATION_JSON).content(EVENT_BODY))
                .andExpect(status().isForbidden());
        mockMvc.perform(patch("/api/events/CMF-2026/publish")).andExpect(status().isForbidden());

        verifyNoInteractions(eventService);
    }

    @Test
    @WithMockUser(roles = "USER")
    void T_SEC_012_user_cannotMarkTicketAsUsed_orListPaidTickets() throws Exception {
        mockMvc.perform(patch("/api/tickets/TKT-1/use")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/events/CMF-2026/tickets/paid")).andExpect(status().isForbidden());

        verifyNoInteractions(ticketService);
    }

    // ---------- 2xx: rol correcto ----------

    @Test
    @WithMockUser(roles = "ADMIN")
    void T_SEC_004_admin_postEvents_returns201() throws Exception {
        when(eventService.create(any(CreateEventRequest.class))).thenReturn(new EventResponse(
                1L, "CMF-2026", "Caribbean Music Fest 2026", null, EventCategory.MUSIC, EventStatus.DRAFT,
                LocalDateTime.of(2026, 12, 20, 20, 0), 18, "VEN-SMR-01", "Marina Convention Center", List.of()));

        mockMvc.perform(post("/api/events").contentType(MediaType.APPLICATION_JSON).content(EVENT_BODY))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void T_SEC_014_admin_canPublishEventAndAddArtist() throws Exception {
        mockMvc.perform(patch("/api/events/CMF-2026/publish")).andExpect(status().isOk());
        mockMvc.perform(post("/api/events/CMF-2026/artists/1")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "STAFF")
    void T_SEC_013_staff_canMarkTicketAsUsed_andListPaidTickets() throws Exception {
        mockMvc.perform(patch("/api/tickets/TKT-1/use")).andExpect(status().isOk());
        mockMvc.perform(get("/api/events/CMF-2026/tickets/paid")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void admin_canMarkTicketAsUsed() throws Exception {
        mockMvc.perform(patch("/api/tickets/TKT-1/use")).andExpect(status().isOk());
    }
}
