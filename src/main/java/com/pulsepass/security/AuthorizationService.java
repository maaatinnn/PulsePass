package com.pulsepass.security;

import com.pulsepass.domain.enums.EventStatus;
import com.pulsepass.domain.model.Event;
import com.pulsepass.domain.model.Ticket;
import com.pulsepass.domain.model.User;
import com.pulsepass.exception.BusinessRuleException;
import com.pulsepass.exception.ResourceNotFoundException;
import com.pulsepass.repository.EventRepository;
import com.pulsepass.repository.TicketRepository;
import com.pulsepass.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Servicio de autorización y verificación de propiedad (anti-IDOR) y visibilidad (PRD 3.2, 11.1).
 */
@Service
public class AuthorizationService {

    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;
    private final EventRepository eventRepository;

    public AuthorizationService(UserRepository userRepository,
                                TicketRepository ticketRepository,
                                EventRepository eventRepository) {
        this.userRepository = userRepository;
        this.ticketRepository = ticketRepository;
        this.eventRepository = eventRepository;
    }

    /** Obtiene el SecurityPrincipal actual o lanza AccessDeniedException (403/401). */
    public SecurityPrincipal getCurrentPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof SecurityPrincipal principal)) {
            throw new AccessDeniedException("Usuario no autenticado");
        }
        return principal;
    }

    /** Comprueba si el usuario autenticado posee un rol dado ("ADMIN", "STAFF", "USER"). */
    public boolean hasRole(String roleName) {
        SecurityPrincipal principal = getCurrentPrincipal();
        String expectedAuthority = roleName.startsWith("ROLE_") ? roleName : "ROLE_" + roleName;
        return principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(expectedAuthority));
    }

    /**
     * Valida que en la compra de ticket (POST /api/tickets), si el usuario tiene rol USER,
     * el userEmail enviado en el DTO coincida exactamente con el email de su cuenta persistida (anti-IDOR).
     */
    @Transactional(readOnly = true)
    public void validateTicketPurchaseOwnership(String userEmailInDto) {
        SecurityPrincipal principal = getCurrentPrincipal();
        User current = userRepository.findById(principal.getUserId())
                .orElseThrow(() -> ResourceNotFoundException.of("User", principal.getUserId()));

        if (!current.getEmail().equalsIgnoreCase(userEmailInDto == null ? "" : userEmailInDto.trim())) {
            throw new AccessDeniedException("No tiene permiso para comprar entradas a nombre de otro usuario");
        }
    }

    /**
     * Valida propiedad para la consulta de ticket por código (GET /api/tickets/{ticketCode}).
     * STAFF y ADMIN tienen acceso. El rol USER sólo puede consultar sus propios tickets.
     */
    @Transactional(readOnly = true)
    public void validateTicketOwnership(String ticketCode) {
        SecurityPrincipal principal = getCurrentPrincipal();
        if (hasRole("ADMIN") || hasRole("STAFF")) {
            return;
        }
        Ticket ticket = ticketRepository.findByTicketCode(ticketCode)
                .orElseThrow(() -> ResourceNotFoundException.of("Ticket", ticketCode));

        if (!ticket.getUser().getId().equals(principal.getUserId())) {
            throw new AccessDeniedException("No tiene permiso para acceder a esta entrada");
        }
    }

    /**
     * Valida propiedad para la cancelación de ticket (PATCH /api/tickets/{ticketCode}/cancel).
     * ADMIN puede cancelar. USER solo puede cancelar su propia entrada.
     */
    @Transactional(readOnly = true)
    public void validateTicketCancelOwnership(String ticketCode) {
        SecurityPrincipal principal = getCurrentPrincipal();
        if (hasRole("ADMIN")) {
            return;
        }
        Ticket ticket = ticketRepository.findByTicketCode(ticketCode)
                .orElseThrow(() -> ResourceNotFoundException.of("Ticket", ticketCode));

        if (!ticket.getUser().getId().equals(principal.getUserId())) {
            throw new AccessDeniedException("No tiene permiso para cancelar esta entrada");
        }
    }

    /**
     * Valida que la consulta de tickets por usuario (GET /api/tickets/by-user?email=) o datos de usuario
     * sea realizada por el propio usuario o por un ADMIN.
     */
    @Transactional(readOnly = true)
    public void validateUserResourceAccessByEmail(String email) {
        SecurityPrincipal principal = getCurrentPrincipal();
        if (hasRole("ADMIN")) {
            return;
        }
        User current = userRepository.findById(principal.getUserId())
                .orElseThrow(() -> ResourceNotFoundException.of("User", principal.getUserId()));

        if (!current.getEmail().equalsIgnoreCase(email == null ? "" : email.trim())) {
            throw new AccessDeniedException("No tiene permiso para acceder a datos de otro usuario");
        }
    }

    /**
     * Valida la consulta de usuario por username (GET /api/users/by-username?username=).
     */
    @Transactional(readOnly = true)
    public void validateUserResourceAccessByUsername(String username) {
        SecurityPrincipal principal = getCurrentPrincipal();
        if (hasRole("ADMIN")) {
            return;
        }
        User current = userRepository.findById(principal.getUserId())
                .orElseThrow(() -> ResourceNotFoundException.of("User", principal.getUserId()));

        if (!current.getUsername().equalsIgnoreCase(username == null ? "" : username.trim())) {
            throw new AccessDeniedException("No tiene permiso para acceder a datos de otro usuario");
        }
    }

    /**
     * Retorna true si el principal actual posee rol STAFF o ADMIN, permitiéndole ver eventos no publicados.
     */
    public boolean canViewNonPublishedEvents() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof SecurityPrincipal principal)) {
            return false;
        }
        return principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_STAFF"));
    }

    /**
     * Verifica la visibilidad de un evento (GET /api/events/{eventCode}).
     * Si no está PUBLISHED, sólo STAFF y ADMIN pueden consultarlo.
     */
    @Transactional(readOnly = true)
    public void validateEventVisibility(String eventCode) {
        Event event = eventRepository.findByEventCode(eventCode)
                .orElseThrow(() -> ResourceNotFoundException.of("Event", eventCode));

        if (event.getStatus() != EventStatus.PUBLISHED && !canViewNonPublishedEvents()) {
            throw new AccessDeniedException("El evento solicitado no está publicado");
        }
    }
}
