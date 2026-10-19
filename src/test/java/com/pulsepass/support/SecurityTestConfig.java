package com.pulsepass.support;

import com.pulsepass.security.RestAccessDeniedHandler;
import com.pulsepass.security.RestAuthenticationEntryPoint;
import com.pulsepass.security.SecurityConfig;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

/**
 * Aplica la SecurityConfig REAL en los tests @WebMvcTest (no se desactivan filtros: PRD 17.2).
 * El UserDetailsService es un stub vacío porque en MockMvc la identidad se simula con @WithMockUser.
 */
@TestConfiguration(proxyBeanMethods = false)
@Import({SecurityConfig.class, RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class,
        com.pulsepass.security.JwtAuthenticationFilter.class})
public class SecurityTestConfig {

    @Bean
    com.pulsepass.security.AuthorizationService authorizationService() {
        return org.mockito.Mockito.mock(com.pulsepass.security.AuthorizationService.class);
    }

    @Bean
    com.pulsepass.security.JwtProperties jwtProperties() {
        return new com.pulsepass.security.JwtProperties("pulsepass-api", "dGVzdC1zZWNyZXQtYmFzZTY0LWZvci11bml0LXRlc3RzLTEyMzQ1Njc4OTA=", java.time.Duration.ofMinutes(15));
    }

    @Bean
    com.pulsepass.security.JwtService jwtService(com.pulsepass.security.JwtProperties jwtProperties) {
        return new com.pulsepass.security.JwtService(jwtProperties, java.time.Clock.systemUTC());
    }

    @Bean
    com.pulsepass.security.CustomUserDetailsService customUserDetailsService() {
        return new com.pulsepass.security.CustomUserDetailsService(null, null, null) {
            @Override
            public com.pulsepass.security.SecurityPrincipal loadUserByUsername(String identifier) {
                throw new UsernameNotFoundException(identifier);
            }
            @Override
            public com.pulsepass.security.SecurityPrincipal loadPrincipalById(Long userId) {
                throw new UsernameNotFoundException("User not found: " + userId);
            }
        };
    }

    @Bean
    UserDetailsService userDetailsService() {
        return username -> {
            throw new UsernameNotFoundException(username);
        };
    }
}
