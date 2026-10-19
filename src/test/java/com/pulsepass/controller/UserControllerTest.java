package com.pulsepass.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.pulsepass.dto.request.RegisterUserRequest;
import com.pulsepass.dto.response.UserResponse;
import com.pulsepass.exception.DuplicateResourceException;
import com.pulsepass.exception.ResourceNotFoundException;
import com.pulsepass.service.AuthService;
import com.pulsepass.service.UserService;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import com.pulsepass.support.SecurityTestConfig;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(UserController.class)
// Fase 4: estos tests verifican comportamiento funcional, no seguridad; por eso corren con una identidad
// que cumple cualquier regla de rol. Las restricciones por rol se prueban en SecurityRulesTest.
@Import(SecurityTestConfig.class)
@WithMockUser(roles = {"USER", "STAFF", "ADMIN"})
class UserControllerTest {

    private static final String VALID_BODY = """
            {
              "username": "andrea",
              "email": "andrea@email.com",
              "firstName": "Andrea",
              "lastName": "Perez",
              "phone": "3001234567",
              "city": "Santa Marta",
              "birthDate": "2001-01-01",
              "password": "UnaFraseSeguraLarga2026!"
            }
            """;

    @Autowired private MockMvc mockMvc;
    @MockitoBean private UserService userService;
    @MockitoBean private AuthService authService;

    private static UserResponse user() {
        return new UserResponse(1L, "andrea", "andrea@email.com", true, "Andrea", "Perez",
                "3001234567", "Santa Marta", LocalDate.of(2001, 1, 1));
    }

    @Test
    void TEST_CTRL_USR_001_register_valid_returns201() throws Exception {
        when(authService.register(any(RegisterUserRequest.class))).thenReturn(user());

        mockMvc.perform(post("/api/users").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.username").value("andrea"))
                .andExpect(jsonPath("$.active").value(true));

        verify(authService).register(any(RegisterUserRequest.class));
    }

    @Test
    void TEST_CTRL_USR_002_register_invalidEmail_returns400AndDoesNotCallService() throws Exception {
        String invalid = VALID_BODY.replace("andrea@email.com", "no-es-un-email");

        mockMvc.perform(post("/api/users").contentType(MediaType.APPLICATION_JSON).content(invalid))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.details.email").value("Email must be a valid email address"));

        verify(authService, never()).register(any());
    }

    @Test
    void TEST_CTRL_USR_002b_register_missingRequiredFields_returns400() throws Exception {
        mockMvc.perform(post("/api/users").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.details.username").exists())
                .andExpect(jsonPath("$.details.email").exists())
                .andExpect(jsonPath("$.details.firstName").exists())
                .andExpect(jsonPath("$.details.lastName").exists())
                .andExpect(jsonPath("$.details.birthDate").exists())
                .andExpect(jsonPath("$.details.password").exists());

        verify(authService, never()).register(any());
    }

    @Test
    void TEST_CTRL_USR_003_register_duplicateUsername_returns409() throws Exception {
        when(authService.register(any(RegisterUserRequest.class)))
                .thenThrow(new DuplicateResourceException("Username already exists: andrea"));

        mockMvc.perform(post("/api/users").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value("Username already exists: andrea"));
    }

    @Test
    void TEST_CTRL_USR_003b_register_duplicateEmail_returns409() throws Exception {
        when(authService.register(any(RegisterUserRequest.class)))
                .thenThrow(new DuplicateResourceException("Email already exists: andrea@email.com"));

        mockMvc.perform(post("/api/users").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.details").isEmpty());
    }

    @Test
    void TEST_CTRL_USR_004_findByEmail_returns200() throws Exception {
        when(userService.findByEmail("andrea@email.com")).thenReturn(user());

        mockMvc.perform(get("/api/users/by-email").param("email", "andrea@email.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("andrea@email.com"));

        verify(userService).findByEmail("andrea@email.com");
    }

    @Test
    void TEST_CTRL_USR_004b_findByEmail_unknown_returns404() throws Exception {
        when(userService.findByEmail("x@email.com")).thenThrow(ResourceNotFoundException.of("User", "x@email.com"));

        mockMvc.perform(get("/api/users/by-email").param("email", "x@email.com"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("User not found: x@email.com"));
    }

    @Test
    void TEST_CTRL_USR_005_findByUsername_returns200() throws Exception {
        when(userService.findByUsername("andrea")).thenReturn(user());

        mockMvc.perform(get("/api/users/by-username").param("username", "andrea"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("andrea"));

        verify(userService).findByUsername("andrea");
    }

    @Test
    void TEST_CTRL_USR_005b_findByUsername_unknown_returns404() throws Exception {
        when(userService.findByUsername("nadie")).thenThrow(ResourceNotFoundException.of("User", "nadie"));

        mockMvc.perform(get("/api/users/by-username").param("username", "nadie"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }
    @Test
    void TEST_SEC_USR_001_register_shortPassword_returns400AndDoesNotCallService() throws Exception {
        String shortPassword = VALID_BODY.replace("UnaFraseSeguraLarga2026!", "corta");

        mockMvc.perform(post("/api/users").contentType(MediaType.APPLICATION_JSON).content(shortPassword))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.details.password").value("Password must have between 12 and 72 characters"));

        verify(authService, never()).register(any());
    }

    @Test
    void TEST_SEC_USR_002_register_passwordOver72Bytes_returns400() throws Exception {
        // 40 caracteres de 2 bytes = 80 bytes: pasa @Size(max = 72) pero BCrypt truncaría.
        String multibyte = VALID_BODY.replace("UnaFraseSeguraLarga2026!", "é".repeat(40));

        mockMvc.perform(post("/api/users").contentType(MediaType.APPLICATION_JSON).content(multibyte))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.details.passwordWithinBcryptLimit").exists());

        verify(authService, never()).register(any());
    }

    @Test
    void TEST_SEC_USR_003_register_response_neverContainsPasswordOrHash() throws Exception {
        when(authService.register(any(RegisterUserRequest.class))).thenReturn(user());

        mockMvc.perform(post("/api/users").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }
}
