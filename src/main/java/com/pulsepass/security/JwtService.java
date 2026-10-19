package com.pulsepass.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.io.DecodingException;
import io.jsonwebtoken.security.Keys;
import java.time.Clock;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    static final int MIN_KEY_BYTES = 32;

    private final JwtProperties properties;
    private final Clock clock;
    private final SecretKey key;

    public JwtService(JwtProperties properties, Clock clock) {
        this.properties = properties;
        this.clock = clock;
        this.key = buildKey(properties.secretBase64());
    }

    public String generateAccessToken(Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("userId is required");
        }
        Instant now = Instant.now(clock);
        return Jwts.builder()
                .subject(userId.toString())
                .issuer(properties.issuer())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(properties.accessTokenTtl())))
                .id(UUID.randomUUID().toString())

                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }

    public long accessTokenTtlSeconds() {
        return properties.accessTokenTtl().toSeconds();
    }

    public Long validateTokenAndGetUserId(String token) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Token cannot be null or empty");
        }
        var claims = Jwts.parser()
                .verifyWith(key)
                .requireIssuer(properties.issuer())
                .clock(() -> Date.from(Instant.now(clock)))
                .build()
                .parseSignedClaims(token)
                .getPayload();

        String sub = claims.getSubject();
        if (sub == null || sub.isBlank()) {
            throw new IllegalArgumentException("Token subject is missing");
        }
        try {
            return Long.parseLong(sub);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid user ID in token subject", e);
        }
    }

    private static SecretKey buildKey(String secretBase64) {
        if (secretBase64 == null || secretBase64.isBlank()) {
            throw new IllegalStateException(
                    "JWT secret is missing: set PULSEPASS_JWT_SECRET_BASE64 (openssl rand -base64 32)");
        }
        byte[] bytes;
        try {
            bytes = Decoders.BASE64.decode(secretBase64);
        } catch (DecodingException | IllegalArgumentException ex) {

            throw new IllegalStateException("JWT secret is not valid Base64");
        }
        if (bytes == null || bytes.length < MIN_KEY_BYTES) {
            throw new IllegalStateException(
                    "JWT secret is too weak: at least " + MIN_KEY_BYTES + " random bytes are required");
        }
        return Keys.hmacShaKeyFor(bytes);
    }
}
