package com.pulsepass.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerExceptionResolver;

/**
 * 401 para requests sin identidad válida. Los errores del filtro de seguridad ocurren antes del
 * DispatcherServlet y no los atrapa @RestControllerAdvice por sí solo: se delegan al
 * HandlerExceptionResolver para reutilizar GlobalExceptionHandler y emitir el mismo ErrorResponse.
 */
@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final HandlerExceptionResolver resolver;

    public RestAuthenticationEntryPoint(@Qualifier("handlerExceptionResolver") HandlerExceptionResolver resolver) {
        this.resolver = resolver;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) {
        if (resolver.resolveException(request, response, null, authException) == null
                && !response.isCommitted()) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        }
    }
}
