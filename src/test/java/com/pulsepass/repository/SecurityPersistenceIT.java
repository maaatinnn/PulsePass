package com.pulsepass.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.pulsepass.domain.enums.Role;
import com.pulsepass.domain.model.User;
import com.pulsepass.domain.model.UserCredential;
import com.pulsepass.domain.model.UserRole;
import com.pulsepass.support.AbstractPostgresIT;
import com.pulsepass.support.TestData;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

class SecurityPersistenceIT extends AbstractPostgresIT {

    private static final String PASSWORD = "UnaFraseSeguraLarga2026!";

    @Autowired UserRepository userRepository;
    @Autowired UserCredentialRepository credentialRepository;
    @Autowired UserRoleRepository roleRepository;

    private final PasswordEncoder encoder = new BCryptPasswordEncoder();

    private Long savedUser(String username) {
        return userRepository.saveAndFlush(TestData.user(username)).getId();
    }

    @Test
    void persistsCredentialWithBcryptHash_andItVerifiesAgainstThePassword() {
        User user = userRepository.saveAndFlush(TestData.user("andrea"));
        credentialRepository.saveAndFlush(
                new UserCredential(user, encoder.encode(PASSWORD), LocalDateTime.of(2026, 10, 14, 12, 0)));
        flushAndClear();

        UserCredential found = credentialRepository.findById(user.getId()).orElseThrow();

        assertThat(found.getUserId()).isEqualTo(user.getId());
        assertThat(found.getPasswordHash()).startsWith("$2").isNotEqualTo(PASSWORD);
        assertThat(encoder.matches(PASSWORD, found.getPasswordHash())).isTrue();
        assertThat(found.getPasswordChangedAt()).isEqualTo(LocalDateTime.of(2026, 10, 14, 12, 0));
    }

    @Test
    void persistsSeveralRolesPerUser() {
        Long userId = savedUser("laura");
        roleRepository.saveAndFlush(new UserRole(userId, Role.USER));
        roleRepository.saveAndFlush(new UserRole(userId, Role.STAFF));
        flushAndClear();

        assertThat(roleRepository.findRolesByUserId(userId))
                .containsExactlyInAnyOrder(Role.USER, Role.STAFF);
    }

    @Test
    void rolesOfOneUserDoNotLeakToAnother() {
        Long andrea = savedUser("andrea");
        Long carlos = savedUser("carlos");
        roleRepository.saveAndFlush(new UserRole(andrea, Role.ADMIN));
        roleRepository.saveAndFlush(new UserRole(carlos, Role.USER));
        flushAndClear();

        assertThat(roleRepository.findRolesByUserId(carlos)).containsExactly(Role.USER);
        assertThat(roleRepository.findRolesByUserId(andrea)).containsExactly(Role.ADMIN);
    }

    @Test
    void passwordHashIsNotStoredInTheUsersTable() {
        List<String> columns = jdbc.queryForList(
                "SELECT column_name FROM information_schema.columns WHERE table_name = 'users'", String.class);

        assertThat(columns).noneMatch(c -> c.contains("password"));
    }

    @Test
    void duplicateRoleForTheSameUserIsRejected() {
        Long userId = savedUser("andrea");
        jdbc.update("INSERT INTO user_roles (user_id, role) VALUES (?, 'USER')", userId);

        assertThatThrownBy(() -> jdbc.update("INSERT INTO user_roles (user_id, role) VALUES (?, 'USER')", userId))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void unknownRoleIsRejectedByTheCheckConstraint() {
        Long userId = savedUser("andrea");

        assertThatThrownBy(() -> jdbc.update("INSERT INTO user_roles (user_id, role) VALUES (?, 'SUPERADMIN')", userId))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void secondCredentialForTheSameUserIsRejected() {
        Long userId = savedUser("andrea");
        jdbc.update("INSERT INTO user_credentials (user_id, password_hash) VALUES (?, ?)", userId, "$2a$10$x");

        assertThatThrownBy(() -> jdbc.update(
                "INSERT INTO user_credentials (user_id, password_hash) VALUES (?, ?)", userId, "$2a$10$y"))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void credentialRequiresAnExistingUser() {
        assertThatThrownBy(() -> jdbc.update(
                "INSERT INTO user_credentials (user_id, password_hash) VALUES (999999, '$2a$10$x')"))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void credentialHashCannotBeNull() {
        Long userId = savedUser("andrea");

        assertThatThrownBy(() -> jdbc.update(
                "INSERT INTO user_credentials (user_id, password_hash) VALUES (?, NULL)", userId))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
