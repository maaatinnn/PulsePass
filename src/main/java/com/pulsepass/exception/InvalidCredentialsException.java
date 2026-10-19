package com.pulsepass.exception;

/**
 * Login fallido. Mensaje deliberadamente genérico: no revela si el usuario existe, si está
 * inactivo o si la contraseña era incorrecta (FR-SECAUTH-003 / FR-SECAUTH-004).
 */
public class InvalidCredentialsException extends RuntimeException {

    public InvalidCredentialsException() {
        super("Invalid credentials");
    }
}
