package com.pulsepass.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.pulsepass.domain.model.User;
import com.pulsepass.dto.request.RegisterUserRequest;
import com.pulsepass.dto.response.UserResponse;
import com.pulsepass.exception.BusinessRuleException;
import com.pulsepass.exception.DuplicateResourceException;
import com.pulsepass.exception.ResourceNotFoundException;
import com.pulsepass.mapper.UserMapper;
import com.pulsepass.repository.UserRepository;
import com.pulsepass.service.impl.UserServiceImpl;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    private static final ZoneId ZONE = ZoneId.of("UTC");
    private static final LocalDate TODAY = LocalDate.of(2026, 10, 11);

    @Mock private UserRepository userRepository;
    @Mock private UserMapper userMapper;

    private UserServiceImpl service;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(LocalDateTime.of(TODAY, java.time.LocalTime.NOON).atZone(ZONE).toInstant(), ZONE);
        service = new UserServiceImpl(userRepository, userMapper, clock);
    }

    private static RegisterUserRequest request(LocalDate birthDate) {
        return new RegisterUserRequest("andrea", "andrea@email.com", "Andrea", "Perez",
                "3001234567", "Santa Marta", birthDate, "UnaFraseSeguraLarga2026!");
    }

    private static UserResponse response() {
        return new UserResponse(1L, "andrea", "andrea@email.com", true, "Andrea", "Perez",
                "3001234567", "Santa Marta", LocalDate.of(2001, 1, 1));
    }

    @Test
    void TEST_USER_001_register_validUser_createsActiveUserWithProfile() {

        when(userRepository.existsByUsername("andrea")).thenReturn(false);
        when(userRepository.existsByEmailIgnoreCase("andrea@email.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        UserResponse expected = response();
        when(userMapper.toResponse(any(User.class))).thenReturn(expected);

        UserResponse result = service.register(request(LocalDate.of(2001, 1, 1)));

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();
        assertThat(saved.isActive()).isTrue();
        assertThat(saved.getUsername()).isEqualTo("andrea");
        assertThat(saved.getProfile()).isNotNull();
        assertThat(saved.getProfile().getUser()).isSameAs(saved);
        assertThat(saved.getProfile().getFirstName()).isEqualTo("Andrea");
        assertThat(saved.getProfile().getBirthDate()).isEqualTo(LocalDate.of(2001, 1, 1));
        assertThat(result).isEqualTo(expected);
    }

    @Test
    void TEST_USER_002_register_duplicateUsername_throwsDuplicateResource() {
        when(userRepository.existsByUsername("andrea")).thenReturn(true);

        assertThatThrownBy(() -> service.register(request(LocalDate.of(2001, 1, 1))))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Username already exists");

        verify(userRepository, never()).save(any());
    }

    @Test
    void TEST_USER_003_register_duplicateEmailIgnoringCase_throwsDuplicateResource() {
        when(userRepository.existsByUsername("andrea")).thenReturn(false);
        when(userRepository.existsByEmailIgnoreCase("andrea@email.com")).thenReturn(true);

        assertThatThrownBy(() -> service.register(request(LocalDate.of(2001, 1, 1))))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Email already exists");

        verify(userRepository, never()).save(any());
    }

    @Test
    void TEST_USER_004_register_futureBirthDate_throwsBusinessRule() {
        assertThatThrownBy(() -> service.register(request(TODAY.plusDays(1))))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("future");

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_birthDateToday_isAccepted() {
        when(userRepository.existsByUsername(any())).thenReturn(false);
        when(userRepository.existsByEmailIgnoreCase(any())).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userMapper.toResponse(any(User.class))).thenReturn(response());

        assertThat(service.register(request(TODAY))).isNotNull();
    }

    @Test
    void register_missingUsername_throwsBusinessRule() {
        RegisterUserRequest invalid = new RegisterUserRequest(null, "a@b.com", "A", "B", null, null, null, "UnaFraseSeguraLarga2026!");

        assertThatThrownBy(() -> service.register(invalid))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("username");

        verify(userRepository, never()).save(any());
    }

    @Test
    void findByEmail_existingUser_returnsDto() {
        User user = new User("andrea", "andrea@email.com");
        UserResponse expected = response();
        when(userRepository.findByEmailIgnoreCase("ANDREA@email.com")).thenReturn(Optional.of(user));
        when(userMapper.toResponse(user)).thenReturn(expected);

        assertThat(service.findByEmail("ANDREA@email.com")).isEqualTo(expected);
    }

    @Test
    void findByEmail_unknownUser_throwsResourceNotFound() {
        when(userRepository.findByEmailIgnoreCase("x@x.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findByEmail("x@x.com"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("x@x.com");
    }

    @Test
    void findByUsername_existingUser_returnsDto() {
        User user = new User("andrea", "andrea@email.com");
        UserResponse expected = response();
        when(userRepository.findByUsername("andrea")).thenReturn(Optional.of(user));
        when(userMapper.toResponse(user)).thenReturn(expected);

        assertThat(service.findByUsername("andrea")).isEqualTo(expected);
    }

    @Test
    void findByUsername_unknownUser_throwsResourceNotFound() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findByUsername("ghost"))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
