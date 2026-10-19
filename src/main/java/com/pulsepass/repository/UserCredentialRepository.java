package com.pulsepass.repository;

import com.pulsepass.domain.model.UserCredential;
import org.springframework.data.jpa.repository.JpaRepository;

/** El id de la credencial es el id del usuario (@MapsId). */
public interface UserCredentialRepository extends JpaRepository<UserCredential, Long> {
}
