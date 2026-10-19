package com.pulsepass.controller;

import com.pulsepass.dto.request.LoginRequest;
import com.pulsepass.dto.response.AuthResponse;
import com.pulsepass.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Endpoints de autenticación. GET /api/auth/me llega con el filtro JWT (etapa 5). */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @org.springframework.web.bind.annotation.GetMapping("/me")
    public ResponseEntity<com.pulsepass.dto.response.AuthenticatedUserResponse> me() {
        return ResponseEntity.ok(authService.me());
    }
}
