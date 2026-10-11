package com.pulsepass.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.pulsepass.domain.enums.TicketStatus;
import com.pulsepass.domain.enums.TicketType;
import com.pulsepass.dto.request.PurchaseTicketRequest;
import com.pulsepass.dto.response.TicketResponse;
import com.pulsepass.exception.BusinessRuleException;
import com.pulsepass.exception.ResourceNotFoundException;
import com.pulsepass.service.TicketService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(TicketController.class)
class TicketControllerTest {

    private static final String VALID_BODY = """
            {
              "userEmail": "andrea@email.com",
              "eventCode": "CMF-2026",
              "type": "GENERAL"
            }
            """;

    @Autowired private MockMvc mockMvc;
    @MockitoBean private TicketService ticketService;

    private static TicketResponse ticket(TicketStatus status) {
        return new TicketResponse(1L, "TKT-ABC123", TicketType.GENERAL, new BigDecimal("100.00"), status,
                LocalDateTime.of(2026, 10, 11, 12, 0), "andrea@email.com", "CMF-2026",
                "Caribbean Music Fest 2026");
    }

    @Test
    void TEST_CTRL_TKT_001_purchase_valid_returns201() throws Exception {
        when(ticketService.purchase(any(PurchaseTicketRequest.class))).thenReturn(ticket(TicketStatus.PAID));

        mockMvc.perform(post("/api/tickets").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/tickets/TKT-ABC123"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.ticketCode").value("TKT-ABC123"))
                .andExpect(jsonPath("$.status").value("PAID"))
                .andExpect(jsonPath("$.price").value(100.00));

        verify(ticketService).purchase(any(PurchaseTicketRequest.class));
    }

    @Test
    void TEST_CTRL_TKT_002_purchase_invalidRequest_returns400AndDoesNotCallService() throws Exception {
        String invalid = """
                { "userEmail": "no-es-email", "eventCode": "" }
                """;

        mockMvc.perform(post("/api/tickets").contentType(MediaType.APPLICATION_JSON).content(invalid))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.details.userEmail").exists())
                .andExpect(jsonPath("$.details.eventCode").value("Event code is required"))
                .andExpect(jsonPath("$.details.type").value("Ticket type is required"));

        verify(ticketService, never()).purchase(any());
    }

    @Test
    void TEST_CTRL_TKT_002b_purchase_invalidTicketType_returns400() throws Exception {
        String invalid = VALID_BODY.replace("GENERAL", "PLATINUM");

        mockMvc.perform(post("/api/tickets").contentType(MediaType.APPLICATION_JSON).content(invalid))
                .andExpect(status().isBadRequest());

        verify(ticketService, never()).purchase(any());
    }

    @Test
    void TEST_CTRL_TKT_003_purchase_unknownUser_returns404() throws Exception {
        when(ticketService.purchase(any(PurchaseTicketRequest.class)))
                .thenThrow(ResourceNotFoundException.of("User", "andrea@email.com"));

        mockMvc.perform(post("/api/tickets").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("User not found: andrea@email.com"));
    }

    @Test
    void TEST_CTRL_TKT_004_purchase_businessRuleViolation_returns409() throws Exception {
        when(ticketService.purchase(any(PurchaseTicketRequest.class)))
                .thenThrow(new BusinessRuleException("User does not meet the minimum age: 18"));

        mockMvc.perform(post("/api/tickets").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value("User does not meet the minimum age: 18"));
    }

    @Test
    void TEST_CTRL_TKT_005_findByCode_returns200() throws Exception {
        when(ticketService.findByCode("TKT-ABC123")).thenReturn(ticket(TicketStatus.PAID));

        mockMvc.perform(get("/api/tickets/TKT-ABC123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ticketCode").value("TKT-ABC123"));

        verify(ticketService).findByCode("TKT-ABC123");
    }

    @Test
    void TEST_CTRL_TKT_005b_findByCode_unknown_returns404() throws Exception {
        when(ticketService.findByCode("NOPE")).thenThrow(ResourceNotFoundException.of("Ticket", "NOPE"));

        mockMvc.perform(get("/api/tickets/NOPE"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Ticket not found: NOPE"));
    }

    @Test
    void TEST_CTRL_TKT_006_findByUserEmail_returns200() throws Exception {
        when(ticketService.findByUserEmail("andrea@email.com")).thenReturn(List.of(ticket(TicketStatus.PAID)));

        mockMvc.perform(get("/api/tickets/by-user").param("email", "andrea@email.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].userEmail").value("andrea@email.com"));

        verify(ticketService).findByUserEmail("andrea@email.com");
    }

    @Test
    void TEST_CTRL_TKT_007_findPaidTicketsByEvent_returns200() throws Exception {
        when(ticketService.findPaidTicketsByEvent("CMF-2026")).thenReturn(List.of(ticket(TicketStatus.PAID)));

        mockMvc.perform(get("/api/events/CMF-2026/tickets/paid"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].status").value("PAID"));

        verify(ticketService).findPaidTicketsByEvent("CMF-2026");
    }

    @Test
    void TEST_CTRL_TKT_008_cancel_valid_returns200() throws Exception {
        when(ticketService.cancel("TKT-ABC123")).thenReturn(ticket(TicketStatus.CANCELLED));

        mockMvc.perform(patch("/api/tickets/TKT-ABC123/cancel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        verify(ticketService).cancel("TKT-ABC123");
    }

    @Test
    void TEST_CTRL_TKT_009_cancel_invalidTransition_returns409() throws Exception {
        when(ticketService.cancel("TKT-ABC123"))
                .thenThrow(new BusinessRuleException("Only PAID tickets can be cancelled."));

        mockMvc.perform(patch("/api/tickets/TKT-ABC123/cancel"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Only PAID tickets can be cancelled."));
    }

    @Test
    void TEST_CTRL_TKT_010_markAsUsed_valid_returns200() throws Exception {
        when(ticketService.markAsUsed("TKT-ABC123")).thenReturn(ticket(TicketStatus.USED));

        mockMvc.perform(patch("/api/tickets/TKT-ABC123/use"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("USED"));

        verify(ticketService).markAsUsed("TKT-ABC123");
    }

    @Test
    void TEST_CTRL_TKT_011_markAsUsed_invalidTransition_returns409() throws Exception {
        when(ticketService.markAsUsed("TKT-ABC123"))
                .thenThrow(new BusinessRuleException("Only PAID tickets can be used."));

        mockMvc.perform(patch("/api/tickets/TKT-ABC123/use"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Only PAID tickets can be used."));
    }
}
