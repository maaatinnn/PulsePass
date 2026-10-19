-- =====================================================================
-- sec017-grant-staff.sql  —  EXCLUSIVO para la base pulsepass_e2e
-- Concede el rol STAFF al usuario :uname (E2E-SEC-017B).
-- Uso (desde la raíz del proyecto):
--   docker compose exec -T postgres psql -U pulsepass -d pulsepass_e2e -v uname=inj.r01 < tests/e2e/fixtures/sec017-grant-staff.sql
-- PowerShell:
--   Get-Content tests/e2e/fixtures/sec017-grant-staff.sql | docker compose exec -T postgres psql -U pulsepass -d pulsepass_e2e -v uname=inj.r01
-- Sustituye inj.r01 por inj.<tu runId>. No hay endpoint para esto: se hace por SQL a propósito.
-- =====================================================================
SELECT current_database() = 'pulsepass_e2e' AS e2e_ok,
       :{?uname} AS has_uname \gset
\if :e2e_ok
  \if :has_uname
    INSERT INTO user_roles (user_id, role)
    SELECT id, 'STAFF' FROM users WHERE username = :'uname'
    ON CONFLICT (user_id, role) DO NOTHING;
    SELECT u.username, ur.role FROM users u JOIN user_roles ur ON ur.user_id = u.id WHERE u.username = :'uname' ORDER BY ur.role;
  \else
    \echo 'ABORTADO: falta -v uname=<username>'
  \endif
\else
  \echo 'ABORTADO: la base actual NO es pulsepass_e2e.'
\endif
