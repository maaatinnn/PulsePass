package com.pulsepass.dto.response;

import java.time.LocalDateTime;
import java.util.Map;

/** Contrato uniforme de errores HTTP (PRD §13). */
public record ErrorResponse(
        LocalDateTime timestamp,
        int status,
        String error,
        String message,
        Map<String, String> details
) {}
