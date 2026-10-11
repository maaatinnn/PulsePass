package com.pulsepass.service;

import com.pulsepass.domain.enums.TicketType;
import com.pulsepass.exception.BusinessRuleException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.EnumMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Estrategia de precios encapsulada (PRD §28).
 *
 * <pre>
 * GENERAL   -> precio base
 * STUDENT   -> 50 % del precio base
 * VIP       -> 2.5 x precio base
 * BACKSTAGE -> 4 x precio base
 * </pre>
 *
 * El precio nunca lo envía el cliente. BR-TICKET-009: jamás se retorna un precio negativo.
 */
@Component
public class TicketPricingPolicy {

    private static final Map<TicketType, BigDecimal> MULTIPLIERS = new EnumMap<>(Map.of(
            TicketType.GENERAL, new BigDecimal("1.00"),
            TicketType.STUDENT, new BigDecimal("0.50"),
            TicketType.VIP, new BigDecimal("2.50"),
            TicketType.BACKSTAGE, new BigDecimal("4.00")
    ));

    private final BigDecimal basePrice;

    public TicketPricingPolicy(@Value("${pulsepass.pricing.base-price:100.00}") BigDecimal basePrice) {
        if (basePrice == null || basePrice.signum() < 0) {
            throw new IllegalArgumentException("Base price must be greater than or equal to 0.");
        }
        this.basePrice = basePrice;
    }

    public BigDecimal priceFor(TicketType type) {
        if (type == null) {
            throw new BusinessRuleException("Ticket type is required.");
        }
        BigDecimal price = basePrice.multiply(MULTIPLIERS.get(type)).setScale(2, RoundingMode.HALF_UP);
        if (price.signum() < 0) {
            throw new BusinessRuleException("Ticket price cannot be negative.");
        }
        return price;
    }
}
