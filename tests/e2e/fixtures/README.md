# Fixtures E2E

`seed-e2e.sql` carga los datos mínimos del PRD (sección 5.1) y los necesarios para los casos de negocio, en la base **`pulsepass_e2e`**.
No existe endpoint para crear venues ni usuarios STAFF/ADMIN, por eso se siembran por SQL. El script es re-ejecutable (`ON CONFLICT DO NOTHING`) y **se niega a correr** si la base actual no es `pulsepass_e2e`.

| Fixture | Código / usuario | Notas |
|---|---|---|
| Venue activo | `VEN-E2E-01` | capacidad 500 |
| Venue inactivo | `VEN-E2E-02` | para `E2E-VAL-16` (crear evento en venue inactivo) |
| Venue de aforo 1 | `VEN-E2E-03` | capacidad 1, para el caso de aforo agotado |
| Evento borrador | `EVT-E2E-DRAFT` | invisible al público |
| Evento publicado | `EVT-E2E-PUB` | se compran tickets aquí |
| Evento por publicar | `EVT-E2E-TOPUB` | solo se puede publicar una vez |
| Evento aforo 1 | `EVT-E2E-FULL` | publicado; el primer ticket lo deja `SOLD_OUT` (`E2E-BIZ-014D1/D2`) |
| Evento +99 años | `EVT-E2E-AGE99` | publicado, edad mínima 99 (`E2E-BIZ-014C`) |
| ADMIN | `e2e.admin` | rol ADMIN |
| STAFF | `e2e.staff` | rol STAFF |
| Inactivo | `e2e.inactive` | `active = false` |

Los artistas ya vienen de la migración V2 (Solar Beat, Neon Waves, Caribbean Sound, Ocean Drive, Digital Pulse).
Las contraseñas **no** están en el repositorio; los hashes del seed son BCrypt.

## Scripts de cambio de estado (uso puntual, entre peticiones)
Reciben el usuario con `-v uname=<username>` y comprueban que la base sea `pulsepass_e2e`. Detalle en `../README.md` §8.

| Script | Efecto | Caso |
|---|---|---|
| `sec017-grant-staff.sql` | Agrega el rol STAFF al usuario | `E2E-SEC-017B` |
| `sec017-revoke-staff.sql` | Quita el rol STAFF | `E2E-SEC-017C` |
| `sec-auth013-deactivate-user.sql` | `active = false` | `E2E-SEC-AUTH-013` |

## Repetir la prueba desde cero
```bash
docker compose exec postgres psql -U pulsepass -c "DROP DATABASE pulsepass_e2e;"
docker compose exec postgres psql -U pulsepass -c "CREATE DATABASE pulsepass_e2e;"
```
Detén la app antes de borrar (tiene conexiones abiertas). Luego arrancar la app (Flyway recrea tablas) y volver a aplicar el seed. **Verifica siempre que el nombre sea `pulsepass_e2e`** antes de borrar.
Alternativa sin borrar: cambia `runId`, `userA*`, `userB*` y `newEventCode` en el ambiente de Postman (no repite `E2E-BIZ-014D1`, que solo funciona una vez).
