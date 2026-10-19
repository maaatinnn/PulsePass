package com.pulsepass.security;

import com.pulsepass.domain.enums.Role;
import com.pulsepass.domain.model.User;
import com.pulsepass.domain.model.UserCredential;
import com.pulsepass.repository.UserCredentialRepository;
import com.pulsepass.repository.UserRepository;
import com.pulsepass.repository.UserRoleRepository;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Carga identidad, hash, roles actuales y estado desde PostgreSQL.
 * Solo carga datos: no valida reglas comerciales (PRD 7.1).
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final UserCredentialRepository credentialRepository;
    private final UserRoleRepository roleRepository;

    public CustomUserDetailsService(UserRepository userRepository,
                                    UserCredentialRepository credentialRepository,
                                    UserRoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.credentialRepository = credentialRepository;
        this.roleRepository = roleRepository;
    }

    /** Usado por el login: el identificador puede ser username o email (FR-SECAUTH-002). */
    @Override
    @Transactional(readOnly = true)
    public SecurityPrincipal loadUserByUsername(String identifier) {
        String value = identifier == null ? "" : identifier.trim();
        User user = userRepository.findByUsername(value)
                .or(() -> userRepository.findByEmailIgnoreCase(value))
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return toPrincipal(user);
    }

    /** Usado por el filtro JWT (etapa 5): el claim "sub" es el id inmutable del usuario. */
    @Transactional(readOnly = true)
    public SecurityPrincipal loadPrincipalById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return toPrincipal(user);
    }

    private SecurityPrincipal toPrincipal(User user) {
        // Usuarios legados sin credencial no pueden autenticarse (V4: sin contraseñas inventadas).
        UserCredential credential = credentialRepository.findById(user.getId())
                .orElseThrow(() -> new UsernameNotFoundException("User has no credentials"));

        List<GrantedAuthority> authorities = roleRepository.findRolesByUserId(user.getId()).stream()
                .map(Role::name)
                .map(name -> (GrantedAuthority) new SimpleGrantedAuthority("ROLE_" + name))
                .toList();

        return new SecurityPrincipal(user.getId(), user.getUsername(),
                credential.getPasswordHash(), authorities, user.isActive());
    }
}
