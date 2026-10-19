package com.pulsepass.service;

import com.pulsepass.dto.request.LoginRequest;
import com.pulsepass.dto.request.RegisterUserRequest;
import com.pulsepass.dto.response.AuthResponse;
import com.pulsepass.dto.response.UserResponse;

/** Orquesta autenticación y alta de credenciales. No reemplaza a UserService. */
public interface AuthService {

    /** Crea User + credencial BCrypt + ROLE_USER en una única transacción (FR-SECAUTH-001). */
    UserResponse register(RegisterUserRequest request);

    /** Autentica (username o email + contraseña) y emite un access token. */
    AuthResponse login(LoginRequest request);

    /** Obtiene los datos del principal autenticado para GET /api/auth/me (FR-SECAUTH-010). */
    com.pulsepass.dto.response.AuthenticatedUserResponse me();
}
