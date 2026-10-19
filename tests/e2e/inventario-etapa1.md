# Etapa 1 — Inventario de rutas contra el código real (pulsepass-seguridad.zip)

Reglas de acceso tomadas de `SecurityConfig` + `AuthorizationService`. Enums reales:
`EventCategory` = MUSIC, SPORTS, TECHNOLOGY, EDUCATION, CULTURE, ENTERTAINMENT ·
`TicketType` = GENERAL, VIP, BACKSTAGE, STUDENT · `TicketStatus` = RESERVED, PAID, CANCELLED, USED ·
`EventStatus` = DRAFT, PUBLISHED, SOLD_OUT, CANCELLED, FINISHED.

| # | Método y ruta | Acceso | Éxito | Respuesta (DTO) |
|---|---|---|---|---|
| 1 | GET /api/venues/{code} | público | 200 | VenueResponse(id, code, name, city, address, capacity, active) |
| 2 | GET /api/venues/active | público | 200 | List<VenueResponse> |
| 3 | GET /api/artists/{id} | público | 200 | ArtistResponse(id, stageName, country, genre, active) |
| 4 | GET /api/artists/by-stage-name?stageName= | público | 200 | ArtistResponse |
| 5 | GET /api/artists/active | público | 200 | List<ArtistResponse> |
| 6 | POST /api/users | público | 201 | UserResponse(id, username, email, active, firstName, lastName, phone, city, birthDate) |
| 7 | GET /api/users/by-email?email= | propio o ADMIN | 200 | UserResponse |
| 8 | GET /api/users/by-username?username= | propio o ADMIN | 200 | UserResponse |
| 9 | POST /api/events | ADMIN | 201 | EventResponse(…, status=DRAFT, artists) |
| 10 | GET /api/events/{eventCode} | público si PUBLISHED; borrador solo STAFF/ADMIN | 200 | EventResponse |
| 11 | GET /api/events/published | público | 200 | List<EventSummaryResponse> |
| 12 | PATCH /api/events/{eventCode}/publish | ADMIN | 200 | EventResponse |
| 13 | POST /api/events/{eventCode}/artists/{artistId} | ADMIN | 200 | EventResponse |
| 14 | GET /api/events/by-artist?stageName= | público (solo PUBLISHED); STAFF/ADMIN ven todos | 200 | List<EventSummaryResponse> |
| 15 | POST /api/tickets | rol USER; userEmail debe ser el del token | 201 | TicketResponse(id, ticketCode, type, price, status, purchaseDate, userEmail, eventCode, eventName) |
| 16 | GET /api/tickets/{ticketCode} | dueño, STAFF o ADMIN | 200 | TicketResponse |
| 17 | GET /api/tickets/by-user?email= | propio o ADMIN | 200 | List<TicketResponse> |
| 18 | GET /api/events/{eventCode}/tickets/paid | STAFF o ADMIN | 200 | List<TicketResponse> |
| 19 | PATCH /api/tickets/{ticketCode}/cancel | dueño o ADMIN | 200 | TicketResponse |
| 20 | PATCH /api/tickets/{ticketCode}/use | STAFF o ADMIN | 200 | TicketResponse |
| 21 | POST /api/auth/login | público | 200 | AuthResponse(accessToken, tokenType, expiresIn) |
| 22 | GET /api/auth/me | autenticado | 200 | AuthenticatedUserResponse(id, username, email, roles) |

**22/22 rutas existen y `/api/auth/me` está implementado** (no hay dependencia bloqueante).

## Códigos de error reales (GlobalExceptionHandler)
400 validación/JSON malformado · 401 credenciales o token inválido · 403 AccessDenied · 404 no encontrado ·
**409 para duplicados Y para reglas de negocio** (evento no publicado, edad, aforo, cancelar dos veces…) ·
500 inesperado (nunca debería salir en casos nominales).

## Decisiones de política (PRD cap. 26) según el código
- Recurso ajeno: el código responde **403** (no 404). → `expectedForeignResourceStatus = 403`.
- Borrador pedido por anónimo: 403 (lanzado por `validateEventVisibility`). Si observas 401, anótalo como hallazgo.
- Un ticket inexistente consultado por un USER da 404; por STAFF/ADMIN también 404.

## Particularidades útiles
- ADMIN **no puede comprar** tickets: `POST /api/tickets` exige rol USER.
- Contraseña de registro: 12–72 caracteres.
- Precio base 100.00 × multiplicador: GENERAL 1.0, STUDENT 0.5, VIP 2.5, BACKSTAGE 4.0.
- La compra deja el ticket directamente en `PAID`.
- Los códigos de evento admiten máx. 30 caracteres.

## Comportamientos verificados en el código para las etapas 5–8
- **Token inválido en ruta pública**: `JwtAuthenticationFilter` rechaza con 401 cualquier `Bearer` presente e inválido, aunque la ruta sea pública (`E2E-SEC-AUTH-015`). Un token ausente sí se trata como anónimo.
- **Roles recargados en cada petición**: el filtro carga el principal desde la base con el `sub` del JWT; conceder/revocar un rol o desactivar la cuenta surte efecto con el mismo token (`E2E-SEC-017*`, `E2E-SEC-AUTH-013`).
- **Token por query string**: no se lee; solo `Authorization: Bearer` (`E2E-SEC-AUTH-012`).
- **Rutas protegidas sin token**: 401 (`anyRequest().authenticated()`); rol insuficiente: 403.
- **Publicar dos veces** → 409 (solo `DRAFT`); **asociar el mismo artista dos veces** → 409; **evento/venue/artista inexistente** → 404.
- **Crear evento**: se valida primero duplicado (409), luego venue inexistente (404), luego venue inactivo (409), fecha futura (409). `minimumAge < 0` se rechaza antes con 400 (Bean Validation).
- **Compra**: usuario inactivo / evento no `PUBLISHED` / fecha pasada / edad insuficiente / sin aforo → 409. El último cupo deja el evento en `SOLD_OUT`.
- **Cancelar**: solo `PAID` (ya `CANCELLED` o `USED` → 409). **Usar**: solo `PAID` (`CANCELLED` o `USED` → 409).
- **STAFF no puede**: comprar, cancelar tickets ajenos, ni consultar usuarios/tickets por email (solo ADMIN o dueño).

## Fixtures añadidos
`VEN-E2E-03` (capacidad 1), `EVT-E2E-FULL` (aforo 1) y `EVT-E2E-AGE99` (edad mínima 99), más tres scripts SQL de cambio de rol/estado. Ver `fixtures/README.md`.
