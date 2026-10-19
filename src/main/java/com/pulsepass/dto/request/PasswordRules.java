package com.pulsepass.dto.request;

import java.nio.charset.StandardCharsets;

/** Reglas de contraseña compartidas por los requests de registro y login. */
final class PasswordRules {

    static final int BCRYPT_MAX_BYTES = 72;

    private PasswordRules() {
    }

    /** null se considera válido: la obligatoriedad la valida @NotBlank. */
    static boolean fitsBcrypt(String password) {
        return password == null || password.getBytes(StandardCharsets.UTF_8).length <= BCRYPT_MAX_BYTES;
    }
}
