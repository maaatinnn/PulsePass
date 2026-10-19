package com.pulsepass.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.pulsepass.domain.enums.Role;
import com.pulsepass.domain.model.User;
import com.pulsepass.domain.model.UserCredential;
import com.pulsepass.domain.model.UserRole;
import com.pulsepass.dto.request.LoginRequest;
import com.pulsepass.dto.request.RegisterUserRequest;
import com.pulsepass.dto.response.AuthResponse;
import com.pulsepass.dto.response.UserResponse;
import com.pulsepass.exception.BusinessRuleException;
import com.pulsepass.exception.DuplicateResourceException;
import com.pulsepass.exception.InvalidCredentialsException;
import com.pulsepass.repository.UserCredentialRepository;
import com.pulsepass.repository.UserRepository;
import com.pulsepass.repository.UserRoleRepository;
import com.pulsepass.security.JwtService;
import com.pulsepass.security.SecurityPrincipal;
import com.pulsepass.service.impl.AuthServiceImpl;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    private static final String PASSWORD = "UnaFraseSeguraLarga2026!";
    private static final ZoneId ZONE = ZoneId.of("UTC");

    @Mock private UserService userService;
    @Mock private UserRepository userRepository;
    @Mock private UserCredentialRepository credentialRepository;
    @Mock private UserRoleRepository roleRepository;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtService jwtService;

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private AuthServiceImpl service;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(ZonedDateTime.of(2026, 10, 14, 12, 0, 0, 0, ZONE).toInstant(), ZONE);
        service = new AuthServiceImpl(userService, userRepository, credentialRepository, roleRepository,
                passwordEncoder, authenticationManager, jwtService, clock);
    }

    private static RegisterUserRequest registerRequest(String password) {
        return new RegisterUserRequest("andrea", "andrea@email.com", "Andrea", "Perez",
                "3001234567", "Santa Marta", LocalDate.of(2001, 1, 1), password);
    }

    private static UserResponse created() {
        return new UserResponse(5L, "andrea", "andrea@email.com", true, "Andrea", "Perez",
                "3001234567", "Santa Marta", LocalDate.of(2001, 1, 1));
    }

    private static User persistedUser() {
        User user = new User("andrea", "andrea@email.com");
        ReflectionTestUtils.setField(user, "id", 5L);
        return user;
    }

    @Test
    void TEST_SEC_AUTH_001_register_createsBcryptCredentialAndOnlyRoleUser() {
        RegisterUserRequest request = registerRequest(PASSWORD);
        when(userService.register(request)).thenReturn(created());
        when(userRepository.findById(5L)).thenReturn(Optional.of(persistedUser()));

        UserResponse response = service.register(request);

        ArgumentCaptor<UserCredential> credential = ArgumentCaptor.forClass(UserCredential.class);
        verify(credentialRepository).save(credential.capture());
        String hash = credential.getValue().getPasswordHash();
        assertThat(hash).isNotEqualTo(PASSWORD).startsWith("$2");
        assertThat(passwordEncoder.matches(PASSWORD, hash)).isTrue();
        assertThat(credential.getValue().getUser().getId()).isEqualTo(5L);

        ArgumentCaptor<UserRole> role = ArgumentCaptor.forClass(UserRole.class);
        verify(roleRepository).save(role.capture());
        assertThat(role.getValue().getUserId()).isEqualTo(5L);
        assertThat(role.getValue().getRole()).isEqualTo(Role.USER);

        assertThat(response).isEqualTo(created());
    }

    @Test
    void register_duplicateUser_createsNoCredentialNorRole() {
        RegisterUserRequest request = registerRequest(PASSWORD);
        when(userService.register(request))
                .thenThrow(new DuplicateResourceException("Username already exists: andrea"));

        assertThatThrownBy(() -> service.register(request)).isInstanceOf(DuplicateResourceException.class);

        verifyNoInteractions(credentialRepository, roleRepository);
    }

    @Test
    void register_missingPassword_isRejectedBeforeCreatingTheUser() {
        assertThatThrownBy(() -> service.register(registerRequest(null)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("password");

        verifyNoInteractions(userService, credentialRepository, roleRepository);
    }

    @Test
    void TEST_SEC_AUTH_002_login_validCredentials_returnsBearerTokenWithTtl() {
        SecurityPrincipal principal = new SecurityPrincipal(5L, "andrea", null,
                List.of(new SimpleGrantedAuthority("ROLE_USER")), true);
        Authentication authenticated =
                UsernamePasswordAuthenticationToken.authenticated(principal, null, principal.getAuthorities());
        when(authenticationManager.authenticate(any(Authentication.class))).thenReturn(authenticated);
        when(jwtService.generateAccessToken(5L)).thenReturn("jwt-ficticio");
        when(jwtService.accessTokenTtlSeconds()).thenReturn(900L);

        AuthResponse response = service.login(new LoginRequest("  andrea ", PASSWORD));

        assertThat(response.accessToken()).isEqualTo("jwt-ficticio");
        assertThat(response.tokenType()).isEqualTo("Bearer");
        assertThat(response.expiresIn()).isEqualTo(900L);

        ArgumentCaptor<Authentication> sent = ArgumentCaptor.forClass(Authentication.class);
        verify(authenticationManager).authenticate(sent.capture());
        assertThat(sent.getValue().getName()).isEqualTo("andrea");
        assertThat(sent.getValue().isAuthenticated()).isFalse();
    }

    @Test
    void TEST_SEC_AUTH_003_login_wrongPassword_throwsGenericInvalidCredentials_andIssuesNoToken() {
        when(authenticationManager.authenticate(any(Authentication.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThatThrownBy(() -> service.login(new LoginRequest("andrea", "incorrecta")))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessage("Invalid credentials");

        verifyNoInteractions(jwtService);
    }

    @Test
    void TEST_SEC_AUTH_004_login_inactiveUser_getsTheSameGenericError_andNoToken() {
        when(authenticationManager.authenticate(any(Authentication.class)))
                .thenThrow(new DisabledException("User is disabled"));

        assertThatThrownBy(() -> service.login(new LoginRequest("carlos", PASSWORD)))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessage("Invalid credentials");

        verify(jwtService, never()).generateAccessToken(any());
    }
}
