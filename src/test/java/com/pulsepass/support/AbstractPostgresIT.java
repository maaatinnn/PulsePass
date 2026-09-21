package com.pulsepass.support;

import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(PostgresContainerConfig.class)
public abstract class AbstractPostgresIT {

    @Autowired
    protected EntityManager em;

    @Autowired
    protected JdbcTemplate jdbc;

    protected void flushAndClear() {
        em.flush();
        em.clear();
    }
}
