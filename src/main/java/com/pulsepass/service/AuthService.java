package com.pulsepass.service;

import com.pulsepass.dto.request.LoginRequest;
import com.pulsepass.dto.request.RegisterUserRequest;
import com.pulsepass.dto.response.AuthResponse;
import com.pulsepass.dto.response.UserResponse;

public interface AuthService {

    UserResponse register(RegisterUserRequest request);

    AuthResponse login(LoginRequest request);

    com.pulsepass.dto.response.AuthenticatedUserResponse me();
}
