package com.pulsepass.controller;

import com.pulsepass.dto.request.PurchaseTicketRequest;
import com.pulsepass.dto.response.TicketResponse;
import com.pulsepass.service.TicketService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class TicketController {

    private final TicketService ticketService;
    private final com.pulsepass.security.AuthorizationService authorizationService;

    public TicketController(TicketService ticketService,
                            com.pulsepass.security.AuthorizationService authorizationService) {
        this.ticketService = ticketService;
        this.authorizationService = authorizationService;
    }

    @PostMapping("/tickets")
    public ResponseEntity<TicketResponse> purchase(@Valid @RequestBody PurchaseTicketRequest request) {
        authorizationService.validateTicketPurchaseOwnership(request.userEmail());
        TicketResponse created = ticketService.purchase(request);
        return ResponseEntity.created(URI.create("/api/tickets/" + created.ticketCode())).body(created);
    }

    @GetMapping("/tickets/{ticketCode}")
    public ResponseEntity<TicketResponse> findByCode(@PathVariable String ticketCode) {
        authorizationService.validateTicketOwnership(ticketCode);
        return ResponseEntity.ok(ticketService.findByCode(ticketCode));
    }

    @GetMapping("/tickets/by-user")
    public ResponseEntity<List<TicketResponse>> findByUserEmail(@RequestParam String email) {
        authorizationService.validateUserResourceAccessByEmail(email);
        return ResponseEntity.ok(ticketService.findByUserEmail(email));
    }

    @GetMapping("/events/{eventCode}/tickets/paid")
    public ResponseEntity<List<TicketResponse>> findPaidTicketsByEvent(@PathVariable String eventCode) {
        return ResponseEntity.ok(ticketService.findPaidTicketsByEvent(eventCode));
    }

    @PatchMapping("/tickets/{ticketCode}/cancel")
    public ResponseEntity<TicketResponse> cancel(@PathVariable String ticketCode) {
        authorizationService.validateTicketCancelOwnership(ticketCode);
        return ResponseEntity.ok(ticketService.cancel(ticketCode));
    }

    @PatchMapping("/tickets/{ticketCode}/use")
    public ResponseEntity<TicketResponse> markAsUsed(@PathVariable String ticketCode) {
        return ResponseEntity.ok(ticketService.markAsUsed(ticketCode));
    }
}
