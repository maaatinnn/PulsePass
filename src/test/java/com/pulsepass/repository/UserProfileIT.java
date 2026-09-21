package com.pulsepass.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.pulsepass.domain.model.User;
import com.pulsepass.domain.model.UserProfile;
import com.pulsepass.support.AbstractPostgresIT;
import com.pulsepass.support.TestData;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;

class UserProfileIT extends AbstractPostgresIT {

    @Autowired UserRepository userRepository;
    @Autowired UserProfileRepository userProfileRepository;

    @Test
    void persistsUserWithItsProfile() {
        User user = TestData.user("andrea");
        UserProfile profile = new UserProfile("Andrea", "Gómez");
        profile.setPhone("3001234567");
        profile.setCity("Santa Marta");
        profile.setBirthDate(LocalDate.of(1998, 5, 14));
        user.setProfile(profile);
        userRepository.saveAndFlush(user);
        flushAndClear();

        User found = userRepository.findByUsername("andrea").orElseThrow();

        assertThat(found.isActive()).isTrue();
        assertThat(found.getProfile()).isNotNull();
        assertThat(found.getProfile().getFirstName()).isEqualTo("Andrea");
        assertThat(found.getProfile().getLastName()).isEqualTo("Gómez");
        assertThat(found.getProfile().getPhone()).isEqualTo("3001234567");
        assertThat(found.getProfile().getCity()).isEqualTo("Santa Marta");
        assertThat(found.getProfile().getBirthDate()).isEqualTo(LocalDate.of(1998, 5, 14));
    }

    @Test
    void profileNavigatesBackToItsUser() {
        User user = TestData.user("carlos");
        user.setProfile(new UserProfile("Carlos", "Pérez"));
        Long userId = userRepository.saveAndFlush(user).getId();
        flushAndClear();

        UserProfile profile = userProfileRepository.findByUserId(userId).orElseThrow();

        assertThat(profile.getUser().getUsername()).isEqualTo("carlos");
    }

    @Test
    void userMayExistWithoutProfile() {
        userRepository.saveAndFlush(TestData.user("laura"));
        flushAndClear();

        assertThat(userRepository.findByUsername("laura").orElseThrow().getProfile()).isNull();
    }

    @Test
    void findsUserByEmailIgnoringCase() {
        userRepository.save(TestData.user("miguel"));
        flushAndClear();

        assertThat(userRepository.findByEmailIgnoreCase("MIGUEL@PulsePass.TEST")).isPresent();
        assertThat(userRepository.findByEmailIgnoreCase("nadie@pulsepass.test")).isEmpty();
    }

    @Test
    void rejectsDuplicateUsername() {
        userRepository.saveAndFlush(TestData.user("andrea"));

        assertThatThrownBy(() -> userRepository.saveAndFlush(new User("andrea", "otro@pulsepass.test")))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void rejectsDuplicateEmail() {
        userRepository.saveAndFlush(TestData.user("andrea"));

        assertThatThrownBy(() -> userRepository.saveAndFlush(new User("otro", "andrea@pulsepass.test")))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void databaseRejectsSecondProfileForTheSameUser() {
        User user = TestData.user("andrea");
        user.setProfile(new UserProfile("Andrea", "Gómez"));
        Long userId = userRepository.saveAndFlush(user).getId();

        assertThatThrownBy(() -> jdbc.update(
                "INSERT INTO user_profiles (first_name, last_name, user_id) VALUES (?, ?, ?)",
                "Otra", "Persona", userId))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
