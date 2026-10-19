package com.pulsepass.dto.response;

import java.util.List;

/**
 * Respuesta para GET /api/auth/me (PRD 10.1). Retorna información mínima del principal sin secretos.
 */
public record AuthenticatedUserResponse(Long id, String username, String email, List<String> roles) {
}
