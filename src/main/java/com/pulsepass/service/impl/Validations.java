package com.pulsepass.service.impl;

import com.pulsepass.exception.BusinessRuleException;

final class Validations {

    private Validations() {
    }

    static void requireNonNull(Object value, String fieldName) {
        if (value == null) {
            throw new BusinessRuleException(fieldName + " is required.");
        }
    }

    static void requireText(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new BusinessRuleException(fieldName + " is required.");
        }
    }
}
