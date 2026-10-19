package com.pulsepass.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.pulsepass.service.VenueService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import com.pulsepass.support.SecurityTestConfig;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/** Cubre los casos del GlobalExceptionHandler que no dependen de un Service concreto (500, 405). */
@WebMvcTest(VenueController.class)
// Fase 4: estos tests verifican comportamiento funcional, no seguridad; por eso corren con una identidad
// que cumple cualquier regla de rol. Las restricciones por rol se prueban en SecurityRulesTest.
@Import(SecurityTestConfig.class)
@WithMockUser(roles = {"USER", "STAFF", "ADMIN"})
class GlobalExceptionHandlerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private VenueService venueService;

    @Test
    void unexpectedError_returns500WithoutLeakingInternalDetails() throws Exception {
        when(venueService.findByCode("BOOM")).thenThrow(new IllegalStateException("db password=secret"));

        mockMvc.perform(get("/api/venues/BOOM"))
                .andExpect(status().isInternalServerError())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(500))
                .andExpect(jsonPath("$.error").value("Internal Server Error"))
                .andExpect(jsonPath("$.message").value("Unexpected internal error"))
                .andExpect(jsonPath("$.details").isEmpty());
    }

    @Test
    void unsupportedMethod_returns405NotAn500() throws Exception {
        mockMvc.perform(delete("/api/venues/VEN-SMR-01"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.status").value(405));
    }
}
