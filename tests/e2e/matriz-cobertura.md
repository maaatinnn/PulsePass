# Matriz de cobertura y trazabilidad — PulsePass E2E

Generada a partir de la colección (108 casos base en las carpetas 00–08; la carpeta 09 son clones ordenados y no suman casos nuevos).
**Cobertura de diseño, no de ejecución:** que un caso exista aquí no significa que haya pasado. El resultado real se anota en `registro-ejecucion-manual.md`.

## 1. Rutas → casos (22/22)

| # | Ruta | Casos (nominal primero, luego negativos/seguridad/validación) |
|---|---|---|
| 1 | `GET /api/venues/{code}` | E2E-VEN-01, E2E-VEN-01N |
| 2 | `GET /api/venues/active` | E2E-VEN-02, E2E-PREP-01 |
| 3 | `GET /api/artists/{id}` | E2E-ART-01, E2E-ART-01N |
| 4 | `GET /api/artists/by-stage-name` | E2E-ART-02, E2E-ART-02N |
| 5 | `GET /api/artists/active` | E2E-ART-03 |
| 6 | `POST /api/users` | E2E-USR-01A, E2E-USR-01B, E2E-VAL-01, E2E-VAL-02, E2E-VAL-03, E2E-VAL-04, E2E-VAL-17 |
| 7 | `GET /api/users/by-email` | E2E-USR-02, E2E-USR-02M, E2E-USR-02N, E2E-SEC-006, E2E-SEC-019D |
| 8 | `GET /api/users/by-username` | E2E-USR-03, E2E-SEC-007 |
| 9 | `POST /api/events` | E2E-EVT-01, E2E-SEC-001A, E2E-SEC-001B, E2E-VAL-07, E2E-VAL-08, E2E-VAL-09, E2E-VAL-10, E2E-VAL-12, E2E-VAL-16 |
| 10 | `GET /api/events/{eventCode}` | E2E-EVT-02, E2E-EVT-02D, E2E-SEC-004, E2E-VAL-06, E2E-BIZ-014E |
| 11 | `GET /api/events/published` | E2E-EVT-03 |
| 12 | `PATCH /api/events/{eventCode}/publish` | E2E-EVT-04, E2E-EVT-04R, E2E-SEC-002, E2E-SEC-002B |
| 13 | `POST /api/events/{eventCode}/artists/{artistId}` | E2E-EVT-05, E2E-EVT-05D, E2E-EVT-05R, E2E-EVT-05N, E2E-SEC-003 |
| 14 | `GET /api/events/by-artist` | E2E-EVT-06, E2E-EVT-06A, E2E-SEC-005 |
| 15 | `POST /api/tickets` | E2E-TKT-01, E2E-TKT-01U, E2E-SEC-008, E2E-SEC-018, E2E-SEC-019A, E2E-BIZ-014A, E2E-BIZ-014B, E2E-BIZ-014C, E2E-BIZ-014D1, E2E-BIZ-014D2, E2E-VAL-13, E2E-VAL-14 |
| 16 | `GET /api/tickets/{ticketCode}` | E2E-TKT-02, E2E-TKT-02S, E2E-TKT-02N, E2E-SEC-009, E2E-SEC-019B |
| 17 | `GET /api/tickets/by-user` | E2E-TKT-03, E2E-SEC-010 |
| 18 | `GET /api/events/{eventCode}/tickets/paid` | E2E-TKT-04, E2E-SEC-013, E2E-SEC-019C, E2E-SEC-017A, E2E-SEC-017B, E2E-SEC-017C |
| 19 | `PATCH /api/tickets/{ticketCode}/cancel` | E2E-TKT-05, E2E-TKT-05R, E2E-TKT-05U, E2E-SEC-011 |
| 20 | `PATCH /api/tickets/{ticketCode}/use` | E2E-TKT-06, E2E-TKT-06R, E2E-TKT-06C, E2E-SEC-012A, E2E-SEC-012B |
| 21 | `POST /api/auth/login` | E2E-AUTH-01A, E2E-AUTH-01A2, E2E-AUTH-01B, E2E-AUTH-01S, E2E-AUTH-01M, E2E-AUTH-01N, E2E-AUTH-01X, E2E-AUTH-01I, E2E-VAL-05, E2E-VAL-11, E2E-SEC-016A |
| 22 | `GET /api/auth/me` | E2E-AUTH-02A, E2E-AUTH-02B, E2E-AUTH-02S, E2E-AUTH-02M, E2E-AUTH-02N, E2E-SEC-AUTH-008, E2E-SEC-AUTH-009, E2E-SEC-AUTH-010, E2E-SEC-AUTH-011, E2E-SEC-AUTH-012, E2E-SEC-AUTH-013, E2E-SEC-016B |

## 2. Roles vs capacidades (esperado según `SecurityConfig` + `AuthorizationService`)

| Capacidad | ANONYMOUS | USER (dueño) | USER ajeno | STAFF | ADMIN |
|---|---|---|---|---|---|
| Catálogo público (venues, artistas, publicados) | 200 | 200 | 200 | 200 | 200 |
| Evento borrador por código | 403 (SEC-004) | 403 | 403 | 200 | 200 (EVT-02D) |
| Eventos por artista (incluye borradores) | no | no | no | sí | sí (EVT-06A) |
| Crear / publicar / asociar artista | 401 (SEC-001A) | 403 (SEC-001B, 002B, 003) | 403 | 403 (SEC-002) | 200/201 |
| Consultar usuario por email/username | 401 (SEC-019D) | 200 (USR-02/03) | 403 (SEC-006/007) | 403 | 200 (USR-02M) |
| Comprar ticket | 401 (SEC-019A) | 201 (TKT-01) | 403 (SEC-008) | 403 | 403 (SEC-018) |
| Leer ticket | 401 (SEC-019B) | 200 (TKT-02) | 403 (SEC-009) | 200 (TKT-02S) | 200 |
| Tickets por email | 401 | 200 (TKT-03) | 403 (SEC-010) | 403 | 200 |
| Tickets pagados de un evento | 401 (SEC-019C) | 403 (SEC-013) | 403 | 200 (TKT-04) | 200 |
| Cancelar ticket | 401 | 200 (TKT-05) | 403 (SEC-011) | 403 | 200* |
| Marcar uso | 401 | 403 (SEC-012B) | 403 (SEC-012A) | 200 (TKT-06) | 200* |

\* El código lo permite (`AuthorizationService`), pero la colección no incluye un caso con ADMIN para cancelar/usar; se deja como ampliación opcional.

Política de recurso ajeno confirmada en el código: **403** (no 404), por lo que `expectedForeignResourceStatus = 403`. Si observas 404 en esos casos, regístralo como hallazgo.

## 3. Casos TC-AUTH del PRD

| Caso PRD | Qué comprueba | Casos de la colección |
|---|---|---|
| TC-AUTH-001 | Registrar USER_A válido | E2E-USR-01A |
| TC-AUTH-002 | Login con username | E2E-AUTH-01A |
| TC-AUTH-003 | Login con email | E2E-AUTH-01A2 |
| TC-AUTH-004 | Login con contraseña errónea | E2E-AUTH-01N |
| TC-AUTH-005 | Login con identificador inexistente | E2E-AUTH-01X |
| TC-AUTH-006 | /me con token de USER_A | E2E-AUTH-02A |
| TC-AUTH-007 | Ruta protegida sin header | E2E-AUTH-02N, E2E-SEC-019A, E2E-SEC-019B, E2E-SEC-019C, E2E-SEC-019D |
| TC-AUTH-008 | Bearer inventado o malformado | E2E-SEC-AUTH-008 |
| TC-AUTH-009 | JWT alterado | E2E-SEC-AUTH-009 |
| TC-AUTH-010 | JWT expirado | E2E-SEC-AUTH-010 |
| TC-AUTH-011 | JWT firmado con otra clave | E2E-SEC-AUTH-011 |
| TC-AUTH-012 | Token por query string | E2E-SEC-AUTH-012 |
| TC-AUTH-013 | Usuario inactivo con token previo | E2E-SEC-AUTH-013, E2E-AUTH-01I (login de inactivo) |
| TC-AUTH-014 | Token de USER en endpoint ADMIN | E2E-SEC-001B, E2E-SEC-002B |
| TC-AUTH-015 | JWT inválido en endpoint público | E2E-SEC-AUTH-015 |

## 4. Casos TC-SEC del PRD

| Caso PRD | Qué comprueba | Casos de la colección |
|---|---|---|
| TC-SEC-001 | Crear evento anónimo / USER_A | E2E-SEC-001A, E2E-SEC-001B |
| TC-SEC-002 | Publicar evento USER_A / STAFF | E2E-SEC-002B, E2E-SEC-002 |
| TC-SEC-003 | Asociar artista USER_A | E2E-SEC-003 |
| TC-SEC-004 | Consultar borrador anónimo | E2E-SEC-004 |
| TC-SEC-005 | Buscar eventos de artista con borrador (anónimo) | E2E-SEC-005, E2E-EVT-06A |
| TC-SEC-006 | USER_B consulta a A por email | E2E-SEC-006 |
| TC-SEC-007 | USER_B consulta a A por username | E2E-SEC-007 |
| TC-SEC-008 | USER_A compra con email de B | E2E-SEC-008 |
| TC-SEC-009 | USER_B lee ticket de A | E2E-SEC-009 |
| TC-SEC-010 | USER_B lista tickets de A | E2E-SEC-010 |
| TC-SEC-011 | USER_B cancela ticket de A | E2E-SEC-011 |
| TC-SEC-012 | USER_B marca uso de ticket de A | E2E-SEC-012A, E2E-SEC-012B |
| TC-SEC-013 | USER_A ve tickets pagados | E2E-SEC-013 |
| TC-SEC-014 | STAFF marca uso (200) | E2E-TKT-06 |
| TC-SEC-015 | ADMIN consulta borrador (200) | E2E-EVT-02D |
| TC-SEC-016 | Registro con role=ADMIN inyectado | E2E-VAL-04, E2E-SEC-016A, E2E-SEC-016B |
| TC-SEC-017 | Rol revocado con JWT antiguo | E2E-SEC-017A, E2E-SEC-017B, E2E-SEC-017C |

## 5. Casos TC-BIZ del PRD

| Caso PRD | Qué comprueba | Casos de la colección |
|---|---|---|
| TC-BIZ-001 | Venues activos y por código | E2E-VEN-02, E2E-VEN-01 |
| TC-BIZ-002 | Artistas activos, por ID y stage name | E2E-ART-03, E2E-ART-01, E2E-ART-02 |
| TC-BIZ-003 | Crear evento válido (ADMIN) | E2E-EVT-01, E2E-EVT-02D |
| TC-BIZ-004 | Publicar evento | E2E-EVT-04, E2E-EVT-03 |
| TC-BIZ-005 | Añadir artista al evento | E2E-EVT-05, E2E-EVT-06 |
| TC-BIZ-006 | Registrar dos usuarios; duplicado 409 | E2E-USR-01A, E2E-USR-01B, E2E-VAL-03 |
| TC-BIZ-007 | Comprar ticket para evento publicado | E2E-TKT-01, E2E-TKT-01U |
| TC-BIZ-008 | Consultar ticket por código y usuario | E2E-TKT-02, E2E-TKT-03 |
| TC-BIZ-009 | Listar tickets pagados con STAFF | E2E-TKT-04 |
| TC-BIZ-010 | Cancelar ticket elegible (propietario) | E2E-TKT-05, E2E-TKT-02 (relectura) |
| TC-BIZ-011 | Cancelar un ticket otra vez (409) | E2E-TKT-05R, E2E-TKT-05U |
| TC-BIZ-012 | Marcar usado con STAFF | E2E-TKT-06 |
| TC-BIZ-013 | Marcar usado por segunda vez (409) | E2E-TKT-06R, E2E-TKT-06C |
| TC-BIZ-014 | Compra con evento no publicado / aforo agotado / edad insuficiente | E2E-BIZ-014A, E2E-BIZ-014B, E2E-BIZ-014C, E2E-BIZ-014D1, E2E-BIZ-014E, E2E-BIZ-014D2 |
| TC-BIZ-015 | Datos de evento inválidos / códigos inexistentes | E2E-VAL-07, E2E-VAL-08, E2E-VAL-09, E2E-VAL-10, E2E-VAL-12, E2E-VAL-16, E2E-EVT-05N, E2E-EVT-04R, E2E-EVT-05R |

## 6. Criterios de aceptación (Given/When/Then)

| AC | Tema | Casos |
|---|---|---|
| AC-01 | Registro y login | E2E-USR-01A, E2E-AUTH-01A, E2E-AUTH-02A |
| AC-02 | ADMIN publica | E2E-EVT-01, E2E-EVT-05, E2E-EVT-04, E2E-EVT-02, E2E-EVT-06 |
| AC-03 | USER sin privilegio | E2E-SEC-001B, E2E-SEC-002B |
| AC-04 | Protección de propiedad | E2E-SEC-009, E2E-SEC-011, E2E-TKT-02 |
| AC-05 | Compra ajena | E2E-SEC-008, E2E-TKT-03 |
| AC-06 | Uso por STAFF | E2E-TKT-06, E2E-TKT-06R |
| AC-07 | JWT inválido | E2E-SEC-AUTH-008, E2E-SEC-AUTH-009, E2E-SEC-AUTH-010, E2E-SEC-AUTH-011 |
| AC-08 | Borradores | E2E-SEC-004, E2E-SEC-005, E2E-EVT-02D, E2E-EVT-06A |
| AC-09 | ErrorResponse | todos los casos 400/401/403/404/409 (ver 08 y 07) |
| AC-10 | Verificación manual completa | las 22 rutas (tabla 1) + bitácora |

## 7. Requisitos → evidencia

| Requisito | Evidencia | Dónde |
|---|---|---|
| FR-E2E-001/002 | Importación de colección, variables y 22 rutas identificables | Carpetas 00–06 + tabla 1; `PulsePass-local.postman_environment.json` |
| FR-E2E-003/004 | Logins y /me con cada actor; tokens locales | E2E-AUTH-01A/B/S/M, E2E-AUTH-02A/B/S/M |
| FR-E2E-005/006 | HTTP/JSON esperados e IDs copiados entre solicitudes | Descripción de cada petición + README §4 |
| FR-E2E-007/008 | Matriz de acceso y consultas antes/después | Carpeta 07 + relecturas del Flujo D |
| FR-E2E-009 | Inspección de ErrorResponse | Carpeta 08 y todos los negativos |
| FR-E2E-010/016 | Fixtures y repetición sin colisiones | `fixtures/seed-e2e.sql`, `fixtures/README.md`, README §6 |
| FR-E2E-011/012 | Checklist de ejecución y bitácora | `checklist-e2e-manual.md`, `registro-ejecucion-manual.md` |
| FR-E2E-013 | Archivos exportados sin tokens ni contraseñas | Variables secretas vacías; `.gitignore` de esta carpeta |
| FR-E2E-014/015 | Defectos y bloqueos registrados | Bitácora §4; estado BLOCKED |
| FR-E2E-017 | Coherencia con contratos de Fase 3 y 4 | `inventario-etapa1.md` |

## 8. Lo que NO se cubre (decisión explícita)

- **Cancelar/usar con ADMIN** y **ADMIN lee ticket ajeno**: permitidos por el código, sin caso dedicado.
- **TC-HTTP** sobre cabeceras exactas (`Content-Type`, `Location`): se revisan visualmente en cada caso, sin caso aparte.
- **Refresh tokens, revocación instantánea por logout, OAuth2, carga y pentesting exhaustivo**: fuera de alcance (PRD 2.4).
- **STAFF global**: es una limitación del MVP (no hay control por evento); no se interpreta como control correcto para producción.

## 9. Definition of Done (PRD cap. 24) — estado del paquete

| Criterio | Estado |
|---|---|
| Colección v2.1 importable, sin scripts Pre-request/Tests | Hecho (verificado: sin `event` ni `pm.`) |
| 22/22 rutas incluidas | Hecho (tabla 1) |
| Logins de A, B, STAFF y ADMIN; JWT copiados sin hardcodear | Hecho (variables secretas vacías) |
| Casos 400, 401, 403, 404, 409 | Hecho (10×400, 16×401, 17×403, 9×404, 12×409) |
| Borradores y propiedad verificados | Casos incluidos (SEC-004/005, SEC-006…012) |
| Compra ajena bloqueada y sin mutación | SEC-008 + relectura TKT-03 |
| Estados de eventos/tickets tras operaciones | Relecturas en el Flujo D, BIZ-014E |
| Bitácora, README, checklist | Entregados y ejecutados contra la API real (108 casos base: 107 PASS, 1 FAIL) |
| Defectos y bloqueos registrados | Hecho: 1 defecto (E2E-TKT-03, 500 en `GET /api/tickets/by-user`), 0 bloqueos; ver bitácora §4. Cobertura nominal: 21/22 rutas |
