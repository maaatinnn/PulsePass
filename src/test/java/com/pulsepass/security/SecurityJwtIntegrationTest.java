package com.pulsepass.security;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.pulsepass.controller.ArtistController;
import com.pulsepass.controller.AuthController;
import com.pulsepass.controller.EventController;
import com.pulsepass.controller.TicketController;
import com.pulsepass.controller.UserController;
import com.pulsepass.controller.VenueController;
import com.pulsepass.domain.enums.EventCategory;
import com.pulsepass.domain.enums.EventStatus;
import com.pulsepass.domain.enums.TicketStatus;
import com.pulsepass.domain.enums.TicketType;
import com.pulsepass.domain.model.Ticket;
import com.pulsepass.domain.model.User;
import com.pulsepass.dto.request.LoginRequest;
import com.pulsepass.dto.request.PurchaseTicketRequest;
import com.pulsepass.dto.response.AuthResponse;
import com.pulsepass.dto.response.AuthenticatedUserResponse;
import com.pulsepass.dto.response.EventResponse;
import com.pulsepass.dto.response.TicketResponse;
import com.pulsepass.dto.response.UserResponse;
import com.pulsepass.exception.InvalidCredentialsException;
import com.pulsepass.repository.EventRepository;
import com.pulsepass.repository.TicketRepository;
import com.pulsepass.repository.UserRepository;
import com.pulsepass.service.ArtistService;
import com.pulsepass.service.AuthService;
import com.pulsepass.service.EventService;
import com.pulsepass.service.TicketService;
import com.pulsepass.service.UserService;
import com.pulsepass.service.VenueService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Pruebas de integración de seguridad que utilizan tokens JWT reales firmados y cubren:
 * - Login y endpoint /api/auth/me
 * - Tokens JWT válidos, inválidos (firma alterada, issuer erróneo, malformados) y expirados
 * - Verificación de roles incorrectos (403)
 * - Anti-IDOR y comprobaciones de propiedad de recursos (entradas y datos de usuario)
 */
@WebMvcTest(controllers = {
        AuthController.class, UserController.class, EventController.class,
        TicketController.class, VenueController.class, ArtistController.class
})
@Import({
        SecurityConfig.class, RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class,
        JwtAuthenticationFilter.class, AuthorizationService.class,
        SecurityJwtIntegrationTest.JwtTestConfig.class
})
class SecurityJwtIntegrationTest {

    private static final String SECRET_BASE64 = "dGVzdC1zZWNyZXQtYmFzZTY0LWZvci11bml0LXRlc3RzLTEyMzQ1Njc4OTA=";
    private static final String ISSUER = "pulsepass-api";

    @TestConfiguration(proxyBeanMethods = false)
    static class JwtTestConfig {

        @Bean
        JwtProperties jwtProperties() {
            return new JwtProperties(ISSUER, SECRET_BASE64, Duration.ofMinutes(15));
        }

        @Bean
        JwtService jwtService(JwtProperties jwtProperties) {
            return new JwtService(jwtProperties, Clock.systemUTC());
        }

        @Bean
        CustomUserDetailsService customUserDetailsService() {
            return new CustomUserDetailsService(null, null, null) {
                @Override
                public SecurityPrincipal loadPrincipalById(Long userId) {
                    if (userId == 1L) {
                        return new SecurityPrincipal(1L, "andrea", "hash",
                                List.of(new SimpleGrantedAuthority("ROLE_USER")), true);
                    } else if (userId == 2L) {
                        return new SecurityPrincipal(2L, "carlos", "hash",
                                List.of(new SimpleGrantedAuthority("ROLE_USER")), true);
                    } else if (userId == 3L) {
                        return new SecurityPrincipal(3L, "laura", "hash",
                                List.of(new SimpleGrantedAuthority("ROLE_STAFF")), true);
                    } else if (userId == 4L) {
                        return new SecurityPrincipal(4L, "admin", "hash",
                                List.of(new SimpleGrantedAuthority("ROLE_ADMIN")), true);
                    }
                    throw new UsernameNotFoundException("User not found: " + userId);
                }
            };
        }
    }

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;

    @MockitoBean private AuthService authService;
    @MockitoBean private UserService userService;
    @MockitoBean private TicketService ticketService;
    @MockitoBean private EventService eventService;
    @MockitoBean private VenueService venueService;
    @MockitoBean private ArtistService artistService;

    @MockitoBean private UserRepository userRepository;
    @MockitoBean private TicketRepository ticketRepository;
    @MockitoBean private EventRepository eventRepository;

    private User userAndrea;
    private User userCarlos;

    @BeforeEach
    void setUp() {
        userAndrea = new User("andrea", "andrea@email.com");
        org.springframework.test.util.ReflectionTestUtils.setField(userAndrea, "id", 1L);

        userCarlos = new User("carlos", "carlos@email.com");
        org.springframework.test.util.ReflectionTestUtils.setField(userCarlos, "id", 2L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(userAndrea));
        when(userRepository.findById(2L)).thenReturn(Optional.of(userCarlos));
    }

    // ---------- 1. Login y GET /api/auth/me ----------

    @Test
    void login_validCredentials_returnsJwtToken() throws Exception {
        LoginRequest loginReq = new LoginRequest("andrea", "UnaFraseSeguraLarga2026!");
        String token = jwtService.generateAccessToken(1L);
        when(authService.login(loginReq)).thenReturn(new AuthResponse(token, "Bearer", 900));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"identifier": "andrea", "password": "UnaFraseSeguraLarga2026!"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value(token))
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresIn").value(900));
    }

    @Test
    void login_invalidCredentials_returns401() throws Exception {
        when(authService.login(any())).thenThrow(new InvalidCredentialsException());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"identifier": "andrea", "password": "WrongPassword123!"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("Credenciales inválidas"));
    }

    @Test
    void me_validJwt_returnsAuthenticatedUser() throws Exception {
        String token = jwtService.generateAccessToken(1L);
        when(authService.me()).thenReturn(
                new AuthenticatedUserResponse(1L, "andrea", "andrea@email.com", List.of("ROLE_USER")));

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.username").value("andrea"))
                .andExpect(jsonPath("$.email").value("andrea@email.com"))
                .andExpect(jsonPath("$.roles[0]").value("ROLE_USER"));
    }

    // ---------- 2. Tokens JWT válidos, inválidos y expirados ----------

    @Test
    void protectedEndpoint_validJwt_allowsAccess() throws Exception {
        String token = jwtService.generateAccessToken(1L);
        when(userService.findByEmail("andrea@email.com"))
                .thenReturn(new UserResponse(1L, "andrea", "andrea@email.com", true, "Andrea", "Perez", "3001234567", "Santa Marta", java.time.LocalDate.of(1995, 5, 10)));

        mockMvc.perform(get("/api/users/by-email")
                        .param("email", "andrea@email.com")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("andrea"));
    }

    @Test
    void protectedEndpoint_missingToken_returns401() throws Exception {
        mockMvc.perform(get("/api/users/by-email").param("email", "andrea@email.com"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("WWW-Authenticate", "Bearer"))
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void protectedEndpoint_tamperedSignatureJwt_returns401() throws Exception {
        String token = jwtService.generateAccessToken(1L);
        String tamperedToken = token.substring(0, token.length() - 4) + "XXXX";

        mockMvc.perform(get("/api/users/by-email")
                        .param("email", "andrea@email.com")
                        .header("Authorization", "Bearer " + tamperedToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void protectedEndpoint_wrongIssuerJwt_returns401() throws Exception {
        SecretKey key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(SECRET_BASE64));
        String wrongIssuerToken = Jwts.builder()
                .subject("1")
                .issuer("wrong-issuer")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 900000))
                .id(UUID.randomUUID().toString())
                .signWith(key, Jwts.SIG.HS256)
                .compact();

        mockMvc.perform(get("/api/users/by-email")
                        .param("email", "andrea@email.com")
                        .header("Authorization", "Bearer " + wrongIssuerToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void protectedEndpoint_expiredJwt_returns401() throws Exception {
        SecretKey key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(SECRET_BASE64));
        String expiredToken = Jwts.builder()
                .subject("1")
                .issuer(ISSUER)
                .issuedAt(new Date(System.currentTimeMillis() - 3600000))
                .expiration(new Date(System.currentTimeMillis() - 1800000))
                .id(UUID.randomUUID().toString())
                .signWith(key, Jwts.SIG.HS256)
                .compact();

        mockMvc.perform(get("/api/users/by-email")
                        .param("email", "andrea@email.com")
                        .header("Authorization", "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void protectedEndpoint_malformedJwt_returns401() throws Exception {
        mockMvc.perform(get("/api/users/by-email")
                        .param("email", "andrea@email.com")
                        .header("Authorization", "Bearer not-a-valid-jwt-structure"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    // ---------- 3. Roles incorrectos ----------

    @Test
    void userRole_attemptsCreateEvent_returns403() throws Exception {
        String token = jwtService.generateAccessToken(1L); // Andrea is ROLE_USER

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "eventCode": "NEW-2026", "name": "New Event", "category": "MUSIC",
                                  "eventDate": "2026-12-20T20:00:00", "minimumAge": 18, "venueCode": "VEN-SMR-01"
                                }
                                """)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    void userRole_attemptsMarkTicketUsed_returns403() throws Exception {
        String token = jwtService.generateAccessToken(1L); // ROLE_USER

        mockMvc.perform(patch("/api/tickets/TKT-100/use")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    void staffRole_canAccessStaffEndpoint_returns200() throws Exception {
        String staffToken = jwtService.generateAccessToken(3L); // Laura is ROLE_STAFF
        TicketResponse resp = new TicketResponse(
                1L, "TKT-100", TicketType.GENERAL, BigDecimal.valueOf(100.0), TicketStatus.USED,
                LocalDateTime.now(), "andrea@email.com", "CMF-2026", "Caribbean Music Fest");
        when(ticketService.markAsUsed("TKT-100")).thenReturn(resp);

        mockMvc.perform(patch("/api/tickets/TKT-100/use")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("USED"));
    }

    @Test
    void adminRole_canPublishEvent_returns200() throws Exception {
        String adminToken = jwtService.generateAccessToken(4L); // Admin is ROLE_ADMIN
        EventResponse resp = new EventResponse(
                1L, "CMF-2026", "Caribbean Music Fest", null, EventCategory.MUSIC,
                EventStatus.PUBLISHED, LocalDateTime.now().plusDays(10), 18, "VEN-SMR-01", "Center", List.of());
        when(eventService.publish("CMF-2026")).thenReturn(resp);

        mockMvc.perform(patch("/api/events/CMF-2026/publish")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"));
    }

    // ---------- 4. Propiedad de recursos (Anti-IDOR) ----------

    @Test
    void purchaseTicket_ownEmail_allows() throws Exception {
        String token = jwtService.generateAccessToken(1L); // Andrea
        TicketResponse ticketResp = new TicketResponse(
                1L, "TKT-101", TicketType.GENERAL, BigDecimal.valueOf(100.0), TicketStatus.PAID,
                LocalDateTime.now(), "andrea@email.com", "CMF-2026", "Caribbean Music Fest");
        when(ticketService.purchase(any())).thenReturn(ticketResp);

        mockMvc.perform(post("/api/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "userEmail": "andrea@email.com",
                                  "eventCode": "CMF-2026",
                                  "type": "GENERAL"
                                }
                                """)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.ticketCode").value("TKT-101"));
    }

    @Test
    void purchaseTicket_otherUserEmail_returns403() throws Exception {
        String token = jwtService.generateAccessToken(1L); // Andrea

        mockMvc.perform(post("/api/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "userEmail": "carlos@email.com",
                                  "eventCode": "CMF-2026",
                                  "type": "GENERAL"
                                }
                                """)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message").value("No tiene permisos para realizar esta operación"));
    }

    @Test
    void viewTicket_owner_allows() throws Exception {
        String token = jwtService.generateAccessToken(1L); // Andrea
        Ticket ticket = mock(Ticket.class);
        when(ticket.getUser()).thenReturn(userAndrea);
        when(ticketRepository.findByTicketCode("TKT-ANDREA")).thenReturn(Optional.of(ticket));
        when(ticketService.findByCode("TKT-ANDREA")).thenReturn(new TicketResponse(
                1L, "TKT-ANDREA", TicketType.GENERAL, BigDecimal.valueOf(100.0), TicketStatus.PAID,
                LocalDateTime.now(), "andrea@email.com", "CMF-2026", "Caribbean Music Fest"));

        mockMvc.perform(get("/api/tickets/TKT-ANDREA")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ticketCode").value("TKT-ANDREA"));
    }

    @Test
    void viewTicket_otherUserTicket_returns403() throws Exception {
        String token = jwtService.generateAccessToken(1L); // Andrea
        Ticket ticket = mock(Ticket.class);
        when(ticket.getUser()).thenReturn(userCarlos); // Ticket owned by Carlos
        when(ticketRepository.findByTicketCode("TKT-CARLOS")).thenReturn(Optional.of(ticket));

        mockMvc.perform(get("/api/tickets/TKT-CARLOS")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    void cancelTicket_otherUserTicket_returns403() throws Exception {
        String token = jwtService.generateAccessToken(1L); // Andrea
        Ticket ticket = mock(Ticket.class);
        when(ticket.getUser()).thenReturn(userCarlos); // Owned by Carlos
        when(ticketRepository.findByTicketCode("TKT-CARLOS")).thenReturn(Optional.of(ticket));

        mockMvc.perform(patch("/api/tickets/TKT-CARLOS/cancel")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    void userLookup_otherUserEmail_returns403() throws Exception {
        String token = jwtService.generateAccessToken(1L); // Andrea

        mockMvc.perform(get("/api/users/by-email")
                        .param("email", "carlos@email.com")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    void userLookup_otherUserUsername_returns403() throws Exception {
        String token = jwtService.generateAccessToken(1L); // Andrea

        mockMvc.perform(get("/api/users/by-username")
                        .param("username", "carlos")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }
}
