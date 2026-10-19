package com.pulsepass.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class JwtServiceTest {

    private static final String SECRET_BASE64 = "dGVzdC1zZWNyZXQtYmFzZTY0LWZvci11bml0LXRlc3RzLTEyMzQ1Njc4OTA=";
    private static final String ISSUER = "pulsepass-api";

    private JwtProperties properties;
    private Clock fixedClock;
    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        properties = new JwtProperties(ISSUER, SECRET_BASE64, Duration.ofMinutes(15));
        fixedClock = Clock.fixed(Instant.parse("2026-10-10T12:00:00Z"), ZoneId.of("UTC"));
        jwtService = new JwtService(properties, fixedClock);
    }

    @Test
    void generateAndValidateToken_success() {
        Long userId = 12345L;
        String token = jwtService.generateAccessToken(userId);

        assertThat(token).isNotBlank();

        Long validatedUserId = jwtService.validateTokenAndGetUserId(token);
        assertThat(validatedUserId).isEqualTo(userId);
    }

    @Test
    void validateToken_expiredToken_throwsException() {
        Long userId = 12345L;
        String token = jwtService.generateAccessToken(userId);

        Clock futureClock = Clock.fixed(Instant.parse("2026-10-10T12:20:00Z"), ZoneId.of("UTC"));
        JwtService validationService = new JwtService(properties, futureClock);

        assertThatThrownBy(() -> validationService.validateTokenAndGetUserId(token))
                .isInstanceOf(ExpiredJwtException.class);
    }

    @Test
    void validateToken_tamperedToken_throwsException() {
        String token = jwtService.generateAccessToken(12345L);
        String tamperedToken = token + "a";

        assertThatThrownBy(() -> jwtService.validateTokenAndGetUserId(tamperedToken))
                .isInstanceOf(JwtException.class);
    }

    @Test
    void validateToken_differentIssuer_throwsException() {
        String token = jwtService.generateAccessToken(12345L);

        JwtProperties badIssuerProperties = new JwtProperties("other-api", SECRET_BASE64, Duration.ofMinutes(15));
        JwtService badIssuerService = new JwtService(badIssuerProperties, fixedClock);

        assertThatThrownBy(() -> badIssuerService.validateTokenAndGetUserId(token))
                .isInstanceOf(JwtException.class);
    }

    @Test
    void validateToken_nullOrEmptyToken_throwsException() {
        assertThatThrownBy(() -> jwtService.validateTokenAndGetUserId(null))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> jwtService.validateTokenAndGetUserId(""))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
