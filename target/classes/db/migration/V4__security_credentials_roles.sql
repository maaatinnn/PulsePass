-- Fase 4 - Seguridad: credenciales y roles (PRD 9.1 / 9.2).
-- Las migraciones V1..V3 no se tocan: este cambio es incremental.

-- Credencial 1:1 con users. El hash vive aquí y NO en users para que ningún mapper
-- ni DTO de negocio pueda serializarlo por accidente.
CREATE TABLE user_credentials (
    user_id             BIGINT       NOT NULL,
    password_hash       VARCHAR(100) NOT NULL,
    password_changed_at TIMESTAMP,
    CONSTRAINT pk_user_credentials PRIMARY KEY (user_id),
    CONSTRAINT fk_user_credentials_user FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Roles N:1 con users. PK compuesta: un rol no se repite por usuario.
CREATE TABLE user_roles (
    user_id BIGINT      NOT NULL,
    role    VARCHAR(20) NOT NULL,
    CONSTRAINT pk_user_roles PRIMARY KEY (user_id, role),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT ck_user_roles_role CHECK (role IN ('USER', 'STAFF', 'ADMIN'))
);

-- Estrategia para usuarios legados (creados antes de la Fase 4):
--   * Reciben ROLE_USER para no quedar sin rol.
--   * NO reciben credencial: no se inventa ninguna contraseña por defecto ni compartida.
--     Hasta una activación segura (fuera del flujo de registro) no pueden iniciar sesión.
--   * STAFF y ADMIN nunca se asignan aquí: se provisionan por proceso administrativo controlado.
INSERT INTO user_roles (user_id, role)
SELECT id, 'USER' FROM users;
