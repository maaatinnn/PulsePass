package com.pulsepass.domain.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "user_credentials")
public class UserCredential {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Column(name = "password_changed_at")
    private LocalDateTime passwordChangedAt;

    protected UserCredential() {
    }

    public UserCredential(User user, String passwordHash, LocalDateTime passwordChangedAt) {
        this.user = user;
        this.passwordHash = passwordHash;
        this.passwordChangedAt = passwordChangedAt;
    }

    public Long getUserId() { return userId; }
    public User getUser() { return user; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public LocalDateTime getPasswordChangedAt() { return passwordChangedAt; }
    public void setPasswordChangedAt(LocalDateTime passwordChangedAt) { this.passwordChangedAt = passwordChangedAt; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof UserCredential other)) return false;
        return userId != null && Objects.equals(userId, other.userId);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "UserCredential{userId=" + userId + "}";
    }
}
