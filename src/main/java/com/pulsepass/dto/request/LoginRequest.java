package com.pulsepass.dto.request;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** identifier = username o email. En login no se aplica la política de longitud mínima (solo un tope). */
public record LoginRequest(
        @NotBlank(message = "Identifier is required")
        @Size(max = 150, message = "Identifier must have at most 150 characters")
        String identifier,

        @NotBlank(message = "Password is required")
        @Size(max = 72, message = "Password must have at most 72 characters")
        String password
) {

    @AssertTrue(message = "Password must be at most 72 bytes in UTF-8")
    public boolean isPasswordWithinBcryptLimit() {
        return PasswordRules.fitsBcrypt(password);
    }

    @Override
    public String toString() {
        return "LoginRequest[identifier=" + identifier + ", password=***]";
    }
}
