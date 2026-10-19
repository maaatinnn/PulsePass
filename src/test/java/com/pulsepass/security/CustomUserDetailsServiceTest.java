package com.pulsepass.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.pulsepass.domain.enums.Role;
import com.pulsepass.domain.model.User;
import com.pulsepass.domain.model.UserCredential;
import com.pulsepass.repository.UserCredentialRepository;
import com.pulsepass.repository.UserRepository;
import com.pulsepass.repository.UserRoleRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

class CustomUserDetailsServiceTest {

    private UserRepository userRepository;
    private UserCredentialRepository credentialRepository;
    private UserRoleRepository roleRepository;
    private CustomUserDetailsService userDetailsService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        credentialRepository = mock(UserCredentialRepository.class);
        roleRepository = mock(UserRoleRepository.class);
        userDetailsService = new CustomUserDetailsService(userRepository, credentialRepository, roleRepository);
    }

    @Test
    void loadUserByUsername_success() {
        User user = new User("andrea", "andrea@email.com");
        org.springframework.test.util.ReflectionTestUtils.setField(user, "id", 10L);
        UserCredential credential = new UserCredential(user, "hashedPassword", null);

        when(userRepository.findByUsername("andrea")).thenReturn(Optional.of(user));
        when(credentialRepository.findById(10L)).thenReturn(Optional.of(credential));
        when(roleRepository.findRolesByUserId(10L)).thenReturn(List.of(Role.USER));

        SecurityPrincipal principal = userDetailsService.loadUserByUsername("andrea");

        assertThat(principal.getUserId()).isEqualTo(10L);
        assertThat(principal.getUsername()).isEqualTo("andrea");
        assertThat(principal.getPassword()).isEqualTo("hashedPassword");
        assertThat(principal.getAuthorities()).extracting("authority").containsExactly("ROLE_USER");
        assertThat(principal.isEnabled()).isTrue();
    }

    @Test
    void loadPrincipalById_success() {
        User user = new User("carlos", "carlos@email.com");
        org.springframework.test.util.ReflectionTestUtils.setField(user, "id", 20L);
        UserCredential credential = new UserCredential(user, "hashedPassword2", null);

        when(userRepository.findById(20L)).thenReturn(Optional.of(user));
        when(credentialRepository.findById(20L)).thenReturn(Optional.of(credential));
        when(roleRepository.findRolesByUserId(20L)).thenReturn(List.of(Role.ADMIN, Role.STAFF));

        SecurityPrincipal principal = userDetailsService.loadPrincipalById(20L);

        assertThat(principal.getUserId()).isEqualTo(20L);
        assertThat(principal.getAuthorities()).extracting("authority")
                .containsExactlyInAnyOrder("ROLE_ADMIN", "ROLE_STAFF");
    }

    @Test
    void loadUserByUsername_notFound_throwsException() {
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCase("unknown")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userDetailsService.loadUserByUsername("unknown"))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    @Test
    void loadUserByUsername_noCredentials_throwsException() {
        User user = new User("legacy", "legacy@email.com");
        org.springframework.test.util.ReflectionTestUtils.setField(user, "id", 30L);

        when(userRepository.findByUsername("legacy")).thenReturn(Optional.of(user));
        when(credentialRepository.findById(30L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userDetailsService.loadUserByUsername("legacy"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessageContaining("no credentials");
    }
}
