package com.pulsepass.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.pulsepass.domain.enums.EventStatus;
import com.pulsepass.domain.model.Event;
import com.pulsepass.domain.model.Ticket;
import com.pulsepass.domain.model.User;
import com.pulsepass.repository.EventRepository;
import com.pulsepass.repository.TicketRepository;
import com.pulsepass.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

class AuthorizationServiceTest {

    private UserRepository userRepository;
    private TicketRepository ticketRepository;
    private EventRepository eventRepository;
    private AuthorizationService authorizationService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        ticketRepository = mock(TicketRepository.class);
        eventRepository = mock(EventRepository.class);
        authorizationService = new AuthorizationService(userRepository, ticketRepository, eventRepository);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void setSecurityContext(Long userId, String role) {
        SecurityPrincipal principal = new SecurityPrincipal(
                userId, "user" + userId, "hash", List.of(new SimpleGrantedAuthority("ROLE_" + role)), true);
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    void validateTicketPurchaseOwnership_userSameEmail_allows() {
        setSecurityContext(1L, "USER");
        User user = new User("andrea", "andrea@email.com");
        org.springframework.test.util.ReflectionTestUtils.setField(user, "id", 1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        authorizationService.validateTicketPurchaseOwnership("andrea@email.com");
    }

    @Test
    void validateTicketPurchaseOwnership_userDifferentEmail_throwsAccessDenied() {
        setSecurityContext(1L, "USER");
        User user = new User("andrea", "andrea@email.com");
        org.springframework.test.util.ReflectionTestUtils.setField(user, "id", 1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authorizationService.validateTicketPurchaseOwnership("carlos@email.com"))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void validateTicketPurchaseOwnership_adminDifferentEmail_throwsAccessDenied() {
        setSecurityContext(4L, "ADMIN");
        User admin = new User("admin", "admin@email.com");
        org.springframework.test.util.ReflectionTestUtils.setField(admin, "id", 4L);
        when(userRepository.findById(4L)).thenReturn(Optional.of(admin));

        assertThatThrownBy(() -> authorizationService.validateTicketPurchaseOwnership("carlos@email.com"))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void validateTicketOwnership_ownerUser_allows() {
        setSecurityContext(1L, "USER");
        User user = new User("andrea", "andrea@email.com");
        org.springframework.test.util.ReflectionTestUtils.setField(user, "id", 1L);
        Ticket ticket = mock(Ticket.class);
        when(ticket.getUser()).thenReturn(user);
        when(ticketRepository.findByTicketCode("TKT-100")).thenReturn(Optional.of(ticket));

        authorizationService.validateTicketOwnership("TKT-100");
    }

    @Test
    void validateTicketOwnership_otherUser_throwsAccessDenied() {
        setSecurityContext(2L, "USER");
        User owner = new User("andrea", "andrea@email.com");
        org.springframework.test.util.ReflectionTestUtils.setField(owner, "id", 1L);
        Ticket ticket = mock(Ticket.class);
        when(ticket.getUser()).thenReturn(owner);
        when(ticketRepository.findByTicketCode("TKT-100")).thenReturn(Optional.of(ticket));

        assertThatThrownBy(() -> authorizationService.validateTicketOwnership("TKT-100"))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void validateTicketOwnership_staff_allows() {
        setSecurityContext(3L, "STAFF");

        authorizationService.validateTicketOwnership("TKT-100");
    }

    @Test
    void validateEventVisibility_draftEvent_user_throwsAccessDenied() {
        setSecurityContext(1L, "USER");
        Event event = mock(Event.class);
        when(event.getStatus()).thenReturn(EventStatus.DRAFT);
        when(eventRepository.findByEventCode("CMF-DRAFT")).thenReturn(Optional.of(event));

        assertThatThrownBy(() -> authorizationService.validateEventVisibility("CMF-DRAFT"))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void validateEventVisibility_draftEvent_admin_allows() {
        setSecurityContext(4L, "ADMIN");
        Event event = mock(Event.class);
        when(event.getStatus()).thenReturn(EventStatus.DRAFT);
        when(eventRepository.findByEventCode("CMF-DRAFT")).thenReturn(Optional.of(event));

        authorizationService.validateEventVisibility("CMF-DRAFT");
    }
}
