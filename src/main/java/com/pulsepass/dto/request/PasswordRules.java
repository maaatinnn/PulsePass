package com.pulsepass.dto.request;

import java.nio.charset.StandardCharsets;

final class PasswordRules {

    static final int BCRYPT_MAX_BYTES = 72;

    private PasswordRules() {
    }

    static boolean fitsBcrypt(String password) {
        return password == null || password.getBytes(StandardCharsets.UTF_8).length <= BCRYPT_MAX_BYTES;
    }
}
