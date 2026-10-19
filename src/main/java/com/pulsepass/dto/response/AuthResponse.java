package com.pulsepass.dto.response;

public record AuthResponse(String accessToken, String tokenType, long expiresIn) {

    @Override
    public String toString() {
        return "AuthResponse[accessToken=***, tokenType=" + tokenType + ", expiresIn=" + expiresIn + "]";
    }
}
