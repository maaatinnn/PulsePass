package com.pulsepass.service.impl;

import static com.pulsepass.service.impl.Validations.requireNonNull;
import static com.pulsepass.service.impl.Validations.requireText;

import com.pulsepass.domain.model.User;
import com.pulsepass.domain.model.UserProfile;
import com.pulsepass.dto.request.RegisterUserRequest;
import com.pulsepass.dto.response.UserResponse;
import com.pulsepass.exception.BusinessRuleException;
import com.pulsepass.exception.DuplicateResourceException;
import com.pulsepass.exception.ResourceNotFoundException;
import com.pulsepass.mapper.UserMapper;
import com.pulsepass.repository.UserRepository;
import com.pulsepass.service.UserService;
import java.time.Clock;
import java.time.LocalDate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final Clock clock;

    public UserServiceImpl(UserRepository userRepository, UserMapper userMapper, Clock clock) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.clock = clock;
    }

    @Override
    @Transactional
    public UserResponse register(RegisterUserRequest request) {
        requireNonNull(request, "request");
        requireText(request.username(), "username");
        requireText(request.email(), "email");
        requireText(request.firstName(), "firstName");
        requireText(request.lastName(), "lastName");

        if (request.birthDate() != null && request.birthDate().isAfter(LocalDate.now(clock))) {
            throw new BusinessRuleException("Birth date cannot be in the future: " + request.birthDate());
        }

        if (userRepository.existsByUsername(request.username())) {
            throw new DuplicateResourceException("Username already exists: " + request.username());
        }

        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new DuplicateResourceException("Email already exists: " + request.email());
        }

        User user = new User(request.username().trim(), request.email().trim());
        user.setActive(true);

        UserProfile profile = new UserProfile(request.firstName(), request.lastName());
        profile.setPhone(request.phone());
        profile.setCity(request.city());
        profile.setBirthDate(request.birthDate());
        user.setProfile(profile);

        return userMapper.toResponse(userRepository.save(user));
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse findByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .map(userMapper::toResponse)
                .orElseThrow(() -> ResourceNotFoundException.of("User", email));
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse findByUsername(String username) {
        return userRepository.findByUsername(username)
                .map(userMapper::toResponse)
                .orElseThrow(() -> ResourceNotFoundException.of("User", username));
    }
}
