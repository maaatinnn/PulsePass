package com.pulsepass.security;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** Configuración JWT (PRD 14.2). El secreto llega por variable de entorno, nunca del código fuente. */
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

    /** NFR-SEC001: el secreto no debe salir en logs aunque alguien imprima el objeto. */
    @Override
    public String toString() {
        return "JwtProperties[issuer=" + issuer + ", secretBase64=***, accessTokenTtl=" + accessTokenTtl + "]";
    }
}
