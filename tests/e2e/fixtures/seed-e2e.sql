-- =====================================================================
-- seed-e2e.sql  —  EXCLUSIVO para la base de pruebas  pulsepass_e2e
-- NUNCA ejecutar contra desarrollo, QA o producción.
--
-- Orden de uso:
--   1) Arrancar la app UNA vez para que Flyway cree las tablas (V1..V4).
--   2) Ejecutar este script en la base pulsepass_e2e.
--   3) Es re-ejecutable: usa ON CONFLICT DO NOTHING.
--
-- Qué crea (fixtures del PRD, sección 5.1):
--   Venues     : VEN-E2E-01 (activo, cap. 500), VEN-E2E-02 (inactivo) y VEN-E2E-03 (activo, cap. 1)
--   Eventos    : EVT-E2E-DRAFT (borrador), EVT-E2E-PUB (publicado),
--                EVT-E2E-TOPUB (borrador listo para PATCH /publish),
--                EVT-E2E-FULL (publicado, aforo 1) y EVT-E2E-AGE99 (publicado, edad mínima 99)
--   Usuarios   : e2e.admin (ADMIN), e2e.staff (STAFF), e2e.inactive (USER inactivo)
--   Los hashes son BCrypt (cost 10). Las contraseñas en claro NO están aquí.
-- Las fechas usan now() + intervalo, así nunca quedan en el pasado.
-- =====================================================================


-- ---------- Guarda de seguridad: solo corre en la base pulsepass_e2e ----------
SELECT current_database() = 'pulsepass_e2e' AS e2e_ok \gset
\if :e2e_ok

-- ---------- Venues ----------
INSERT INTO venues (code, name, city, address, capacity, active) VALUES
    ('VEN-E2E-01', 'Arena E2E Santa Marta',   'Santa Marta', 'Calle 1 # 1-01', 500, TRUE),
    ('VEN-E2E-02', 'Sala E2E Inactiva',       'Santa Marta', 'Calle 2 # 2-02', 100, FALSE),
    ('VEN-E2E-03', 'Sala E2E Aforo 1',        'Santa Marta', 'Calle 3 # 3-03',   1, TRUE)
ON CONFLICT (code) DO NOTHING;

-- ---------- Eventos ----------
INSERT INTO events (event_code, name, description, category, status, event_date, minimum_age, venue_id)
SELECT 'EVT-E2E-DRAFT', 'E2E Evento Borrador', 'Borrador: invisible para el público',
       'MUSIC', 'DRAFT', now() + interval '90 days', 0, v.id
FROM venues v WHERE v.code = 'VEN-E2E-01'
ON CONFLICT (event_code) DO NOTHING;

INSERT INTO events (event_code, name, description, category, status, event_date, minimum_age, venue_id)
SELECT 'EVT-E2E-PUB', 'E2E Evento Publicado', 'Publicado: se pueden comprar tickets',
       'MUSIC', 'PUBLISHED', now() + interval '90 days', 0, v.id
FROM venues v WHERE v.code = 'VEN-E2E-01'
ON CONFLICT (event_code) DO NOTHING;

INSERT INTO events (event_code, name, description, category, status, event_date, minimum_age, venue_id)
SELECT 'EVT-E2E-TOPUB', 'E2E Evento Por Publicar', 'Borrador para probar PATCH /publish',
       'TECHNOLOGY', 'DRAFT', now() + interval '120 days', 0, v.id
FROM venues v WHERE v.code = 'VEN-E2E-01'
ON CONFLICT (event_code) DO NOTHING;


-- Publicado con venue de capacidad 1: el primer ticket lo deja SOLD_OUT (E2E-BIZ-014D1/D2)
INSERT INTO events (event_code, name, description, category, status, event_date, minimum_age, venue_id)
SELECT 'EVT-E2E-FULL', 'E2E Evento Aforo 1', 'Publicado, aforo 1: para probar SOLD_OUT',
       'MUSIC', 'PUBLISHED', now() + interval '90 days', 0, v.id
FROM venues v WHERE v.code = 'VEN-E2E-03'
ON CONFLICT (event_code) DO NOTHING;

-- Publicado con edad mínima 99: ningún usuario de prueba la cumple (E2E-BIZ-014C)
INSERT INTO events (event_code, name, description, category, status, event_date, minimum_age, venue_id)
SELECT 'EVT-E2E-AGE99', 'E2E Evento +99', 'Publicado, edad mínima 99',
       'MUSIC', 'PUBLISHED', now() + interval '90 days', 99, v.id
FROM venues v WHERE v.code = 'VEN-E2E-01'
ON CONFLICT (event_code) DO NOTHING;

-- ---------- Usuarios privilegiados e inactivo ----------
INSERT INTO users (username, email, active) VALUES
    ('e2e.admin',    'e2e.admin@example.test',    TRUE),
    ('e2e.staff',    'e2e.staff@example.test',    TRUE),
    ('e2e.inactive', 'e2e.inactive@example.test', FALSE)
ON CONFLICT (username) DO NOTHING;

INSERT INTO user_credentials (user_id, password_hash, password_changed_at)
SELECT u.id, h.hash, now()
FROM users u
JOIN (VALUES
    ('e2e.admin',    '$2a$10$Q9cPZccUcvkAUSrX1T21je4bJa9BMfLgDOOpJzjUYd5my4r.nZNOK'),
    ('e2e.staff',    '$2a$10$tYltXgvz9IjNANimsAYlbu7oaYPWOaXqPMMJiYP/nPdzFEJnd6Yrq'),
    ('e2e.inactive', '$2a$10$zk0wYyiFTLgwrikT22d11OJBBSppwt6d/TJOHsILJOjbsld8.QEqS')
) AS h(username, hash) ON h.username = u.username
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_roles (user_id, role)
SELECT u.id, r.role
FROM users u
JOIN (VALUES
    ('e2e.admin',    'ADMIN'),
    ('e2e.staff',    'STAFF'),
    ('e2e.inactive', 'USER')
) AS r(username, role) ON r.username = u.username
ON CONFLICT (user_id, role) DO NOTHING;

\else
\echo 'ABORTADO: la base actual NO es pulsepass_e2e. No se insertó nada.'
\endif

-- ---------- Verificación rápida ----------
-- SELECT code, active, capacity FROM venues WHERE code LIKE 'VEN-E2E-%';
-- SELECT event_code, status FROM events WHERE event_code LIKE 'EVT-E2E-%';
-- SELECT u.username, ur.role, u.active FROM users u JOIN user_roles ur ON ur.user_id = u.id WHERE u.username LIKE 'e2e.%';
