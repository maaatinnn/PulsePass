package com.pulsepass.dto.response;

/** Respuesta de login (PRD 10.1). expiresIn en segundos. */
public record AuthResponse(String accessToken, String tokenType, long expiresIn) {

    /** El access token es una credencial: no debe aparecer en logs. */
    @Override
    public String toString() {
        return "AuthResponse[accessToken=***, tokenType=" + tokenType + ", expiresIn=" + expiresIn + "]";
    }
}
