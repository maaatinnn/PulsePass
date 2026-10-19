-- =====================================================================
-- sec-auth013-deactivate-user.sql  —  EXCLUSIVO para la base pulsepass_e2e
-- Desactiva la cuenta :uname (E2E-SEC-AUTH-013).
-- Uso (desde la raíz del proyecto):
--   docker compose exec -T postgres psql -U pulsepass -d pulsepass_e2e -v uname=inj.r01 < tests/e2e/fixtures/sec-auth013-deactivate-user.sql
-- PowerShell:
--   Get-Content tests/e2e/fixtures/sec-auth013-deactivate-user.sql | docker compose exec -T postgres psql -U pulsepass -d pulsepass_e2e -v uname=inj.r01
-- Sustituye inj.r01 por inj.<tu runId>. No hay endpoint para esto: se hace por SQL a propósito.
-- =====================================================================
SELECT current_database() = 'pulsepass_e2e' AS e2e_ok,
       :{?uname} AS has_uname \gset
\if :e2e_ok
  \if :has_uname
    UPDATE users SET active = FALSE WHERE username = :'uname';
    SELECT username, active FROM users WHERE username = :'uname';
  \else
    \echo 'ABORTADO: falta -v uname=<username>'
  \endif
\else
  \echo 'ABORTADO: la base actual NO es pulsepass_e2e.'
\endif
