package com.pulsepass.repository;

import com.pulsepass.domain.model.UserCredential;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserCredentialRepository extends JpaRepository<UserCredential, Long> {
}
