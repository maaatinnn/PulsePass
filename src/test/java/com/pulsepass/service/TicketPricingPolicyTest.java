package com.pulsepass.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.pulsepass.domain.enums.TicketType;
import com.pulsepass.exception.BusinessRuleException;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class TicketPricingPolicyTest {

    private final TicketPricingPolicy policy = new TicketPricingPolicy(new BigDecimal("100.00"));

    @Test
    void priceFor_appliesMultiplierPerTicketType() {
        assertThat(policy.priceFor(TicketType.GENERAL)).isEqualByComparingTo("100.00");
        assertThat(policy.priceFor(TicketType.STUDENT)).isEqualByComparingTo("50.00");
        assertThat(policy.priceFor(TicketType.VIP)).isEqualByComparingTo("250.00");
        assertThat(policy.priceFor(TicketType.BACKSTAGE)).isEqualByComparingTo("400.00");
    }

    @Test
    void priceFor_isNeverNegativeAndHasScale2() {
        for (TicketType type : TicketType.values()) {
            BigDecimal price = policy.priceFor(type);
            assertThat(price.signum()).isGreaterThanOrEqualTo(0);
            assertThat(price.scale()).isEqualTo(2);
        }
    }

    @Test
    void priceFor_nullType_throwsBusinessRule() {
        assertThatThrownBy(() -> policy.priceFor(null)).isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void constructor_negativeBasePrice_isRejected() {
        assertThatThrownBy(() -> new TicketPricingPolicy(new BigDecimal("-1")))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void codeGenerator_producesUniqueCodesWithinSchemaLimit() {
        TicketCodeGenerator generator = new TicketCodeGenerator();
        String a = generator.generate();
        String b = generator.generate();

        assertThat(a).isNotEqualTo(b).startsWith("TKT-");
        assertThat(a.length()).isLessThanOrEqualTo(40);
    }
}
