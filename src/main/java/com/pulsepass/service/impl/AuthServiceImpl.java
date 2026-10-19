package com.pulsepass.service.impl;

import static com.pulsepass.service.impl.Validations.requireNonNull;
import static com.pulsepass.service.impl.Validations.requireText;

import com.pulsepass.domain.enums.Role;
import com.pulsepass.domain.model.User;
import com.pulsepass.domain.model.UserCredential;
import com.pulsepass.domain.model.UserRole;
import com.pulsepass.dto.request.LoginRequest;
import com.pulsepass.dto.request.RegisterUserRequest;
import com.pulsepass.dto.response.AuthResponse;
import com.pulsepass.dto.response.UserResponse;
import com.pulsepass.exception.InvalidCredentialsException;
import com.pulsepass.repository.UserCredentialRepository;
import com.pulsepass.repository.UserRepository;
import com.pulsepass.repository.UserRoleRepository;
import com.pulsepass.security.JwtService;
import com.pulsepass.security.SecurityPrincipal;
import com.pulsepass.service.AuthService;
import com.pulsepass.service.UserService;
import java.time.Clock;
import java.time.LocalDateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);
    private static final String TOKEN_TYPE = "Bearer";

    private final UserService userService;
    private final UserRepository userRepository;
    private final UserCredentialRepository credentialRepository;
    private final UserRoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final Clock clock;

    public AuthServiceImpl(UserService userService,
                           UserRepository userRepository,
                           UserCredentialRepository credentialRepository,
                           UserRoleRepository roleRepository,
                           PasswordEncoder passwordEncoder,
                           AuthenticationManager authenticationManager,
                           JwtService jwtService,
                           Clock clock) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.credentialRepository = credentialRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.clock = clock;
    }

    /**
     * Atómico: UserService.register (REQUIRED) se une a esta transacción, de modo que si fallan el
     * hash, la credencial o el rol se revierte también el usuario (NFR-SEC004 / UC-SEC-01).
     */
    @Override
    @Transactional
    public UserResponse register(RegisterUserRequest request) {
        requireNonNull(request, "request");
        requireText(request.password(), "password");

        // Unicidad y reglas de negocio siguen siendo responsabilidad de UserService.
        UserResponse created = userService.register(request);

        User user = userRepository.findById(created.id())
                .orElseThrow(() -> new IllegalStateException("User was not persisted: " + created.id()));

        credentialRepository.save(new UserCredential(
                user, passwordEncoder.encode(request.password()), LocalDateTime.now(clock)));

        // NFR-SEC009: el rol inicial es SIEMPRE USER; el request no tiene ningún campo de rol.
        roleRepository.save(new UserRole(user.getId(), Role.USER));

        return created;
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        requireNonNull(request, "request");

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(
                            request.identifier().trim(), request.password()));
        } catch (AuthenticationException ex) {
            // Se registra el tipo de fallo, nunca el identificador ni la contraseña (NFR-SEC006).
            log.warn("Login failed: {}", ex.getClass().getSimpleName());
            throw new InvalidCredentialsException();
        }

        SecurityPrincipal principal = (SecurityPrincipal) authentication.getPrincipal();
        String token = jwtService.generateAccessToken(principal.getUserId());
        log.info("Login succeeded for userId={}", principal.getUserId());

        return new AuthResponse(token, TOKEN_TYPE, jwtService.accessTokenTtlSeconds());
    }

    @Override
    @Transactional(readOnly = true)
    public com.pulsepass.dto.response.AuthenticatedUserResponse me() {
        Authentication authentication = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || !(authentication.getPrincipal() instanceof SecurityPrincipal principal)) {
            throw new InvalidCredentialsException();
        }

        User user = userRepository.findById(principal.getUserId())
                .orElseThrow(() -> new InvalidCredentialsException());

        java.util.List<String> roles = principal.getAuthorities().stream()
                .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                .toList();

        return new com.pulsepass.dto.response.AuthenticatedUserResponse(user.getId(), user.getUsername(), user.getEmail(), roles);
    }
}
