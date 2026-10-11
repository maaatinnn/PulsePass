package com.pulsepass.service;

import java.util.UUID;
import org.springframework.stereotype.Component;

/** Genera códigos únicos de ticket (máx. 40 caracteres según el esquema). */
@Component
public class TicketCodeGenerator {

    public String generate() {
        return "TKT-" + UUID.randomUUID().toString().replace("-", "").toUpperCase();
    }
}
