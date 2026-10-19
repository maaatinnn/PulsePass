package com.pulsepass.domain.model;

import com.pulsepass.domain.enums.Role;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.Objects;

/** Un rol asignado a un usuario. Referencia al usuario por id (sin cargar la entidad User). */
@Entity
@Table(name = "user_roles")
public class UserRole {

    @EmbeddedId
    private UserRoleId id;

    protected UserRole() {
    }

    public UserRole(Long userId, Role role) {
        this.id = new UserRoleId(userId, role);
    }

    public UserRoleId getId() { return id; }
    public Long getUserId() { return id.getUserId(); }
    public Role getRole() { return id.getRole(); }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof UserRole other)) return false;
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }

    @Override
    public String toString() {
        return "UserRole{userId=" + id.getUserId() + ", role=" + id.getRole() + "}";
    }
}
