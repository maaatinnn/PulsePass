package com.pulsepass.service;

import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class TicketCodeGenerator {

    public String generate() {
        return "TKT-" + UUID.randomUUID().toString().replace("-", "").toUpperCase();
    }
}
