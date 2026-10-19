package com.pulsepass.security;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Registra JwtProperties. Está separado de SecurityConfig para que los tests @WebMvcTest puedan
 * importar SecurityConfig sin necesitar el secreto JWT.
 */
@Configuration
@EnableConfigurationProperties(JwtProperties.class)
public class JwtPropertiesConfig {
}
