package com.pulsepass.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerExceptionResolver;

/** 403 para identidad válida sin permiso. Mismo mecanismo que RestAuthenticationEntryPoint. */
@Component
public class RestAccessDeniedHandler implements AccessDeniedHandler {

    private final HandlerExceptionResolver resolver;

    public RestAccessDeniedHandler(@Qualifier("handlerExceptionResolver") HandlerExceptionResolver resolver) {
        this.resolver = resolver;
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException accessDeniedException) {
        if (resolver.resolveException(request, response, null, accessDeniedException) == null
                && !response.isCommitted()) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        }
    }
}
