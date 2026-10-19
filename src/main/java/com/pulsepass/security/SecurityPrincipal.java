package com.pulsepass.security;

import java.util.Collection;
import java.util.List;
import java.util.Objects;
import org.springframework.security.core.CredentialsContainer;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

/**
 * Identidad autenticada. Lleva el id persistente del usuario: la autorización de propiedad
 * (fase 4, segunda mitad) compara contra {@link #getUserId()}, nunca contra un email del request.
 */
public class SecurityPrincipal implements UserDetails, CredentialsContainer {

    private final Long userId;
    private final String username;
    private String passwordHash;
    private final List<GrantedAuthority> authorities;
    private final boolean enabled;

    public SecurityPrincipal(Long userId, String username, String passwordHash,
                             Collection<? extends GrantedAuthority> authorities, boolean enabled) {
        this.userId = userId;
        this.username = username;
        this.passwordHash = passwordHash;
        this.authorities = List.copyOf(authorities);
        this.enabled = enabled;
    }

    public Long getUserId() { return userId; }

    @Override public Collection<? extends GrantedAuthority> getAuthorities() { return authorities; }
    @Override public String getPassword() { return passwordHash; }
    @Override public String getUsername() { return username; }
    @Override public boolean isEnabled() { return enabled; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }

    /** Spring Security lo invoca tras autenticar: el hash no debe viajar en el contexto de seguridad. */
    @Override
    public void eraseCredentials() {
        this.passwordHash = null;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof SecurityPrincipal other)) return false;
        return Objects.equals(userId, other.userId);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(userId);
    }

    @Override
    public String toString() {
        return "SecurityPrincipal{userId=" + userId + ", username='" + username + "'}";
    }
}
