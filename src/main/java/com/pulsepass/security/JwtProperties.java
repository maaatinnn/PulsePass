package com.pulsepass.security;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "pulsepass.security.jwt")
public record JwtProperties(String issuer, String secretBase64, Duration accessTokenTtl) {

    public JwtProperties {
        if (issuer == null || issuer.isBlank()) {
            throw new IllegalStateException("pulsepass.security.jwt.issuer is required");
        }
        if (accessTokenTtl == null || accessTokenTtl.isZero() || accessTokenTtl.isNegative()) {
            throw new IllegalStateException("pulsepass.security.jwt.access-token-ttl must be positive");
        }
    }

    @Override
    public String toString() {
        return "JwtProperties[issuer=" + issuer + ", secretBase64=***, accessTokenTtl=" + accessTokenTtl + "]";
    }
}
