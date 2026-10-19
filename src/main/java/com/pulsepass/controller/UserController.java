package com.pulsepass.controller;

import com.pulsepass.dto.request.RegisterUserRequest;
import com.pulsepass.dto.response.UserResponse;
import com.pulsepass.service.AuthService;
import com.pulsepass.service.UserService;
import jakarta.validation.Valid;
import java.net.URI;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final AuthService authService;
    private final com.pulsepass.security.AuthorizationService authorizationService;

    public UserController(UserService userService, AuthService authService,
                          com.pulsepass.security.AuthorizationService authorizationService) {
        this.userService = userService;
        this.authService = authService;
        this.authorizationService = authorizationService;
    }

    @PostMapping
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterUserRequest request) {

        UserResponse created = authService.register(request);
        return ResponseEntity.created(URI.create("/api/users/by-username?username=" + created.username()))
                .body(created);
    }

    @GetMapping("/by-email")
    public ResponseEntity<UserResponse> findByEmail(@RequestParam String email) {
        authorizationService.validateUserResourceAccessByEmail(email);
        return ResponseEntity.ok(userService.findByEmail(email));
    }

    @GetMapping("/by-username")
    public ResponseEntity<UserResponse> findByUsername(@RequestParam String username) {
        authorizationService.validateUserResourceAccessByUsername(username);
        return ResponseEntity.ok(userService.findByUsername(username));
    }
}
