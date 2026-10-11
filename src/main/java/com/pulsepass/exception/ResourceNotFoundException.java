package com.pulsepass.exception;

/** El recurso solicitado no existe. Ej.: "Event not found: CMF-2026". */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public static ResourceNotFoundException of(String resource, Object identifier) {
        return new ResourceNotFoundException(resource + " not found: " + identifier);
    }
}
