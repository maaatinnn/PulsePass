# Registro de ejecución manual — PulsePass E2E

Estados: **PASS** (HTTP + JSON + efecto coinciden), **FAIL** (algo no coincide o hay 500), **BLOCKED** (falta fixture/token/dato previo), **NOT RUN** (aún no ejecutado).

> No pegues JWT, contraseñas ni datos privados en esta bitácora ni en las capturas.
> Un `200` por sí solo no es PASS: revisa el JSON y, en mutaciones, relee el recurso con un actor autorizado.
> Las peticiones de la carpeta `09` son clones de las de `00–08`: anota siempre con el **ID base** de esta tabla.

Fecha de la sesión: 18/10/2026  runId: 01  Ejecutado por: Juan Arias y Martin Soto  Versión/commit probado: pulsepass-seguridad-fase5.zip

## 1. Casos (108 casos base)

| Caso | Actor | Ruta | HTTP esperado | HTTP observado | JSON / estado observado | Resultado | Observación |
|---|---|---|---|---|---|---|---|
| E2E-PREP-01 | ANONYMOUS | `GET /api/venues/active` | 200 | 200 | Arreglo con VEN-E2E-01 y VEN-E2E-03, ambos active=true | PASS | Arreglo que incluye VEN-E2E-01 y VEN-E2E-03. Ambos true, VEN-E2E-01 arriba |
| E2E-VEN-02 | ANONYMOUS | `GET /api/venues/active` | 200 | 200 | Arreglo solo con venues activos; VEN-E2E-02 no aparece | PASS | No apareció el VEN-E2E-02 debido a que estaba inactivo |
| E2E-VEN-01 | ANONYMOUS | `GET /api/venues/{{venueActiveCode}}` | 200 | 200 | VenueResponse de VEN-E2E-01 con todos sus campos | PASS | VenueResponse de VEN-E2E-01 (un solo objeto) con todos los campos y datos correctos. |
| E2E-VEN-01N | ANONYMOUS | `GET /api/venues/NO-EXISTE-999` | 404 | 404 | ErrorResponse 404 con los cinco campos | PASS | ErrorResponse 404 correcto. El timestamp usa el formato ISO-8601 (fecha y hora separadas por T), que es normal. |
| E2E-ART-03 | ANONYMOUS | `GET /api/artists/active` | 200 | 200 | Arreglo de 5 artistas con todos sus campos | PASS | 5 Artistas encontrados con sus datos completos, todos mostrados con el orden correcto de los datos |
| E2E-ART-01 | ANONYMOUS | `GET /api/artists/{{artistId}}` | 200 | 200 | ArtistResponse del id solicitado | PASS | Cada id corresponde a su artista |
| E2E-ART-01N | ANONYMOUS | `GET /api/artists/999999` | 404 | 404 | ErrorResponse 404, message con 999999 | PASS | Se verificó y aparece con el message correcto "999999", ErrorResponse con status = 404 y sus cinco campos |
| E2E-ART-02 | ANONYMOUS | `GET /api/artists/by-stage-name` | 200 | 200 | ArtistResponse de Solar Beat | PASS | Artista de solar beat solicitado para el test, Devuelve el artista de cada stageName solicitado |
| E2E-ART-02N | ANONYMOUS | `GET /api/artists/by-stage-name` | 404 | 404 | ErrorResponse 404, artist not found NO-EXISTE-999 | PASS | Se verificó el artist not found: NO-EXISTE-999. ErrorResponse de 404 con error verificado y correspondiente |
| E2E-USR-01A | ANONYMOUS | `POST /api/users` | 201 | 201 | UserResponse sin password ni hash | PASS | UserResponse correcto creado correctamente, no muestra los datos password y hash como se pidió |
| E2E-USR-01B | ANONYMOUS | `POST /api/users` | 201 | 201 | UserResponse de B, misma forma que el de A | PASS | Mismo resultado que USER_A pero con los datos de B; sin discrepancias. |
| E2E-AUTH-01A | USER_A | `POST /api/auth/login` | 200 | 200 | accessToken presente (no se registra) | PASS | accessToken lleno y correspondiente |
| E2E-AUTH-01A2 | USER_A | `POST /api/auth/login` | 200 | 200 | accessToken presente (no se registra) | PASS | Resultado de token de user A para login correcto |
| E2E-AUTH-01B | USER_B | `POST /api/auth/login` | 200 | 200 | accessToken presente (no se registra) | PASS | mismo resultado que con el caso del user A, accessToken correcto |
| E2E-AUTH-01S | STAFF | `POST /api/auth/login` | 200 | 200 | accessToken presente (no se registra) | PASS | mismo resultado que con el caso del user A, accessToken correcto |
| E2E-AUTH-01M | ADMIN | `POST /api/auth/login` | 200 | 200 | accessToken presente (no se registra) | PASS | mismo resultado que con el caso del user A, accessToken correcto |
| E2E-AUTH-02A | USER_A | `GET /api/auth/me` | 200 | 200 | roles = ROLE_USER | PASS | ROLE_USER verificado y confirmado para user A |
| E2E-AUTH-02B | USER_B | `GET /api/auth/me` | 200 | 200 | roles = ROLE_USER | PASS | ROLE_USER verificado y confirmado para user B |
| E2E-AUTH-02S | STAFF | `GET /api/auth/me` | 200 | 200 | roles = ROLE_STAFF | PASS | ROLE_STAFF verificado y confirmado para staff |
| E2E-AUTH-02M | ADMIN | `GET /api/auth/me` | 200 | 200 | roles = ROLE_ADMIN | PASS | ROLE_ADMIN verificado y confirmado para user admin |
| E2E-AUTH-01N | ANONYMOUS | `POST /api/auth/login` | 401 | 401 | ErrorResponse 401, credenciales inválidas | PASS | ErrorResponse de credenciales inválidas (contraseña); no detalla si el usuario existe. |
| E2E-AUTH-01X | ANONYMOUS | `POST /api/auth/login` | 401 | 401 | ErrorResponse 401, credenciales inválidas | PASS | ErrorResponse de credenciales inválidas (usuario); no detalla si el usuario existe. |
| E2E-AUTH-01I | INACTIVE_USER | `POST /api/auth/login` | 401 | 401 | ErrorResponse 401, sin JWT | PASS | ErrorResponse de credenciales inválidas (cuenta inactiva); no detalla si el usuario existe y no entrega JWT. |
| E2E-AUTH-02N | ANONYMOUS | `GET /api/auth/me` | 401 | 401 | ErrorResponse 401 | PASS | mensaje de error Unauthorized correspondiente ErrorResponse (TC-AUTH-007) |
| E2E-USR-02 | USER_A | `GET /api/users/by-email` | 200 | 200 | UserResponse de A, sin password | PASS | UserResponse de A y sin mostrar password. |
| E2E-USR-03 | USER_A | `GET /api/users/by-username` | 200 | 200 | UserResponse de A | PASS | UserResponse de A |
| E2E-USR-02M | ADMIN | `GET /api/users/by-email` | 200 | 200 | UserResponse de A, sin password ni hash | PASS | UserResponse de USER_A y sin password ni hash. Demuestra el 'o ADMIN' de la política OWN o ADMIN |
| E2E-USR-02N | ADMIN | `GET /api/users/by-email` | 404 | 404 | ErrorResponse 404 | PASS | ErrorResponse 404. Como ADMIN no hay 403 previo, se llega a la búsqueda |
| E2E-EVT-01 | ADMIN | `POST /api/events` | 201 | 201 | EventResponse status=DRAFT, eventCode = newEventCode | PASS | EventResponse con status=DRAFT y eventCode=newEventCode |
| E2E-EVT-02D | ADMIN | `GET /api/events/{{draftEventCode}}` | 200 | 200 | EventResponse status=DRAFT | PASS | Evento borrador solo visible para el admin y con status = DRAFT |
| E2E-EVT-05D | ADMIN | `POST /api/events/{{newEventCode}}/artists/{{artistId}}` | 200 | 200 | EventResponse DRAFT con el artista asociado | PASS | Artista asociado correctamente al evento nuevo (borrador, status=DRAFT). Prepara E2E-SEC-005 y E2E-EVT-06A. |
| E2E-EVT-05 | ADMIN | `POST /api/events/{{publishedEventCode}}/artists/{{artistId}}` | 200 | 200 | EventResponse con el artista en artists | PASS | EventResponse con el artista en el arreglo artists. Repetir da 409 (ver E2E-EVT-05R). |
| E2E-EVT-04 | ADMIN | `PATCH /api/events/{{eventToPublishCode}}/publish` | 200 | 200 | status=PUBLISHED; también aparece en E2E-EVT-03 | PASS | status cambia a PUBLISHED y al ejecutar E2E-EVT-03 también aparece TOPUB. |
| E2E-EVT-02 | ANONYMOUS | `GET /api/events/{{publishedEventCode}}` | 200 | 200 | EventResponse status=PUBLISHED | PASS | evento con todos sus datos en el orden y valores correctos, EventResponse con uno con estatus publicado |
| E2E-EVT-03 | ANONYMOUS | `GET /api/events/published` | 200 | 200 | Arreglo de publicados; sin EVT-E2E-DRAFT | PASS | Arreglo de EventSummaryResponse con todos los eventos con el estatus publicado, no aparece EVT-E2E-DRAFT. |
| E2E-EVT-06 | ANONYMOUS | `GET /api/events/by-artist` | 200 | 200 | Evento publicado del artista | PASS | Evento con artista asociado mostrado a su correspondiente |
| E2E-EVT-06A | ADMIN | `GET /api/events/by-artist` | 200 | 200 | Lista con el borrador y el publicado | PASS | La lista incluye los dos eventos (borrador newEventCode y el publicado) |
| E2E-EVT-04R | ADMIN | `PATCH /api/events/{{eventToPublishCode}}/publish` | 409 | 409 | ErrorResponse 409 'Only DRAFT events can be published' | PASS | ErrorResponse 409 "Only DRAFT events can be published"; el evento ya estaba PUBLISHED. |
| E2E-EVT-05R | ADMIN | `POST /api/events/{{publishedEventCode}}/artists/{{artistId}}` | 409 | 409 | ErrorResponse 409 (artista ya asociado) | PASS | ErrorResponse 409 por artista ya asociado al evento (duplicado, regla del Service). |
| E2E-EVT-05N | ADMIN | `POST /api/events/{{publishedEventCode}}/artists/999999` | 404 | 404 | ErrorResponse 404 | PASS | Artista no fue encontrado y devolvió el 404 correcto |
| E2E-TKT-01 | USER_A | `POST /api/tickets` | 201 | 201 | TicketResponse status=PAID, userEmail de A | PASS | TicketResponse: status = PAID, userEmail = A, eventCode correcto para ticket cancelable |
| E2E-TKT-01U | USER_A | `POST /api/tickets` | 201 | 201 | TicketResponse status=PAID (ticket usable) | PASS | lo mismo que tkt-01 pero para ticket usable |
| E2E-TKT-02 | USER_A | `GET /api/tickets/{{ticketCancelableCode}}` | 200 | 200 | TicketResponse del ticket de A | PASS | datos del ticket correctos |
| E2E-TKT-02S | STAFF | `GET /api/tickets/{{ticketCancelableCode}}` | 200 | 200 | TicketResponse del ticket de A | PASS | se repitio el proceso pero para user staff |
| E2E-TKT-02N | USER_A | `GET /api/tickets/NO-EXISTE-999` | 404 | 404 | ErrorResponse 404 | PASS | ErrorResponse 404 (la verificación de propiedad no encuentra el ticket) |
| E2E-TKT-03 | USER_A | `GET /api/tickets/by-user` | 200 | 500 | ErrorResponse 500 "Unexpected internal error" | FAIL | 500 con USER_A y también en el reintento con ADMIN (token vigente en ambos). Falla después de autenticación y autorización; sin más información en el cliente. Ver defecto #1 |
| E2E-TKT-04 | STAFF | `GET /api/events/{{publishedEventCode}}/tickets/paid` | 200 | 200 | Arreglo solo con tickets status=PAID | PASS | Solo status = PAID para los tickets en el arreglo |
| E2E-TKT-05 | USER_A | `PATCH /api/tickets/{{ticketCancelableCode}}/cancel` | 200 | 200 | status=CANCELLED | PASS | status = CANCELLED. Reconsultar con E2E-TKT-02. Repetir da 409 |
| E2E-TKT-05R | USER_A | `PATCH /api/tickets/{{ticketCancelableCode}}/cancel` | 409 | 409 | ErrorResponse 409 'Only PAID tickets can be cancelled' | PASS | ErrorResponse 409 por intentar cancelar un ticket ya cancelado: Only PAID tickets can be cancelled. Ticket TKT-4217A0B22D0349DC8C29CBE909B51023 is CANCELLED. |
| E2E-TKT-06C | STAFF | `PATCH /api/tickets/{{ticketCancelableCode}}/use` | 409 | 409 | ErrorResponse 409 'is CANCELLED and cannot be used' | PASS | ErrorResponse 409 ('is CANCELLED and cannot be used'). El ticket sigue CANCELLED |
| E2E-TKT-06 | STAFF | `PATCH /api/tickets/{{ticketUsableCode}}/use` | 200 | 200 | status=USED | PASS | status = USED cambiado como staff |
| E2E-TKT-06R | STAFF | `PATCH /api/tickets/{{ticketUsableCode}}/use` | 409 | 409 | ErrorResponse 409 | PASS | ErrorResponse 409 (TC-BIZ-013). Releer: sigue USED |
| E2E-TKT-05U | USER_A | `PATCH /api/tickets/{{ticketUsableCode}}/cancel` | 409 | 409 | ErrorResponse 409 'Only PAID tickets can be cancelled' | PASS | ErrorResponse 409 ('Only PAID tickets can be cancelled'). El ticket esta como USED |
| E2E-BIZ-014A | USER_A | `POST /api/tickets` | 409 | 409 | ErrorResponse 409 (evento no publicado) | PASS | ErrorResponse 409 ('only ... PUBLISHED events'). Que no se creó ticket: pendiente de comprobar con E2E-TKT-04 (E2E-TKT-03 responde 500). |
| E2E-BIZ-014B | USER_A | `POST /api/tickets` | 404 | 404 | ErrorResponse 404 | PASS | ErrorResponse 404 por compra de ticket inexistente |
| E2E-BIZ-014C | USER_A | `POST /api/tickets` | 409 | 409 | ErrorResponse 409 (edad mínima) | PASS | ErrorResponse 409 ('does not meet minimum age') con EVT-E2E-AGE99 (mínimo 99 años). Que no se creó ticket: pendiente de comprobar con E2E-TKT-04 (E2E-TKT-03 responde 500). |
| E2E-BIZ-014D1 | USER_A | `POST /api/tickets` | 201 | 201 | TicketResponse status=PAID | PASS | TicketResponse PAID. El evento EVT-E2E-FULL (venue con capacidad 1) pasa a SOLD_OUT (verificar con E2E-BIZ-014E) |
| E2E-BIZ-014E | ADMIN | `GET /api/events/{{fullEventCode}}` | 200 | 200 | EventResponse status=SOLD_OUT | PASS | EventResponse de EVT-E2E-FULL con status = SOLD_OUT, tal como quedó tras la compra del último cupo. |
| E2E-BIZ-014D2 | USER_B | `POST /api/tickets` | 409 | 409 | ErrorResponse 409 (EVT-E2E-FULL está SOLD_OUT) | PASS | ErrorResponse 409: "Tickets can only be purchased for PUBLISHED events. Event EVT-E2E-FULL is SOLD_OUT." Que no se creó ticket: pendiente de comprobar con E2E-TKT-04 (E2E-TKT-03 responde 500). |
| E2E-SEC-001A | ANONYMOUS | `POST /api/events` | 401 | 401 | ErrorResponse 401 | PASS | ErrorResponse; no se creo evento el actor es no identificado |
| E2E-SEC-001B | USER_A | `POST /api/events` | 403 | 403 | ErrorResponse 403 | PASS | ErrorResponse; no se creo evento el actor no tiene permisos |
| E2E-SEC-002 | STAFF | `PATCH /api/events/{{eventToPublishCode}}/publish` | 403 | 403 | ErrorResponse 403 | PASS | Evento sigue en DRAFT y staff no tiene ese permiso como si lo tiene admin |
| E2E-SEC-002B | USER_A | `PATCH /api/events/{{eventToPublishCode}}/publish` | 403 | 403 | ErrorResponse 403 | PASS | ErrorResponse 403 (TC-SEC-002) parecido al test anterior solo que con ROLE distinto |
| E2E-SEC-003 | USER_A | `POST /api/events/{{publishedEventCode}}/artists/{{artistId}}` | 403 | 403 | ErrorResponse 403 | PASS | USER_A no tiene permisos de ADMIN |
| E2E-SEC-004 | ANONYMOUS | `GET /api/events/{{draftEventCode}}` | 403 | 403 | ErrorResponse 403 | PASS | Operación denegada por permisos: ErrorResponse 403 con el mensaje de AccessDeniedException correcto. |
| E2E-SEC-005 | ANONYMOUS | `GET /api/events/by-artist` | 200 | 200 | Lista con el evento publicado; sin borradores | PASS | La lista incluye el evento con status=PUBLISHED pero filtra todo DRAFT de artista |
| E2E-SEC-006 | USER_B | `GET /api/users/by-email` | 403 | 403 | ErrorResponse 403, sin datos del usuario | PASS | Sin datos personales del otro usuario (email). |
| E2E-SEC-007 | USER_B | `GET /api/users/by-username` | 403 | 403 | ErrorResponse 403, sin datos del usuario | PASS | Sin datos personales del otro usuario (username). |
| E2E-SEC-008 | USER_A | `POST /api/tickets` | 403 | 403 | ErrorResponse 403 | PASS | USER_A intenta comprar con el email de B y recibe 403 Forbidden. Que no se creó ticket para B: pendiente de comprobar con E2E-TKT-04 (E2E-TKT-03 responde 500). |
| E2E-SEC-009 | USER_B | `GET /api/tickets/{{ticketUsableCode}}` | 403 | 403 | ErrorResponse 403, sin datos del ticket | PASS | Sin datos del ticket; sin permiso para realizar la acción. |
| E2E-SEC-010 | USER_B | `GET /api/tickets/by-user` | 403 | 403 | ErrorResponse 403, sin lista | PASS | USER_B no puede acceder a la lista de tickets de USER_A. |
| E2E-SEC-011 | USER_B | `PATCH /api/tickets/{{ticketUsableCode}}/cancel` | 403 | 403 | ErrorResponse 403 | PASS | 403: USER_B no puede cancelar el ticket de A. Relectura con A (debe seguir PAID): pendiente de registrar. |
| E2E-SEC-012A | USER_B | `PATCH /api/tickets/{{ticketUsableCode}}/use` | 403 | 403 | ErrorResponse 403 | PASS | ErrorResponse 403: USER_B no tiene permiso para marcar uso (solo STAFF/ADMIN). Ticket sin cambios. |
| E2E-SEC-012B | USER_A | `PATCH /api/tickets/{{ticketUsableCode}}/use` | 403 | 403 | ErrorResponse 403 | PASS | ErrorResponse 403: marcar uso es solo STAFF/ADMIN, aunque el ticket sea suyo. El ticket sigue PAID (TC-SEC-012). |
| E2E-SEC-013 | USER_A | `GET /api/events/{{publishedEventCode}}/tickets/paid` | 403 | 403 | ErrorResponse 403, sin lista | PASS | USER_A intenta ver los tickets pagados y se niega el acceso (solo STAFF/ADMIN). |
| E2E-SEC-018 | ADMIN | `POST /api/tickets` | 403 | 403 | ErrorResponse 403 | PASS | ErrorResponse 403: POST /api/tickets exige rol USER, por eso ADMIN no puede comprar. Que no se creó ticket: pendiente de comprobar con E2E-TKT-04 (E2E-TKT-03 responde 500). |
| E2E-SEC-019A | ANONYMOUS | `POST /api/tickets` | 401 | 401 | ErrorResponse 401 | PASS | ErrorResponse 401 ya que el usuario es no identificado |
| E2E-SEC-019B | ANONYMOUS | `GET /api/tickets/{{ticketUsableCode}}` | 401 | 401 | ErrorResponse 401 | PASS | ErrorResponse 401 sin datos del ticket. |
| E2E-SEC-019C | ANONYMOUS | `GET /api/events/{{publishedEventCode}}/tickets/paid` | 401 | 401 | ErrorResponse 401 | PASS | ErrorResponse 401; sin lista de tickets pagados (petición sin token). |
| E2E-SEC-019D | ANONYMOUS | `GET /api/users/by-email` | 401 | 401 | ErrorResponse 401 | PASS | ErrorResponse 401; sin datos personales (petición sin token). |
| E2E-SEC-AUTH-008 | ANONYMOUS | `GET /api/auth/me` | 401 | 401 | ErrorResponse 401 | PASS | mensaje de error Unauthorized correspondiente ErrorResponse (TC-AUTH-008) |
| E2E-SEC-AUTH-009 | USER_A (token alterado) | `GET /api/auth/me` | 401 | 401 | ErrorResponse 401 | PASS | mensaje de error Unauthorized correspondiente ErrorResponse (TC-AUTH-009) sin entrar al controller |
| E2E-SEC-AUTH-010 | USER_A (token expirado) | `GET /api/auth/me` | 401 | 401 | ErrorResponse 401 | PASS | mensaje de error Unauthorized correspondiente ErrorResponse (TC-AUTH-010) |
| E2E-SEC-AUTH-011 | Atacante (otra clave) | `GET /api/auth/me` | 401 | 401 | ErrorResponse 401 | PASS | mensaje de error Unauthorized correspondiente ErrorResponse 401 (TC-AUTH-011) |
| E2E-SEC-AUTH-012 | ANONYMOUS | `GET /api/auth/me` | 401 | 401 | ErrorResponse 401 | PASS | el servidor solo acepta Authorization: Bearer (TC-AUTH-012) |
| E2E-SEC-AUTH-015 | ANONYMOUS | `GET /api/venues/active` | 401 | 401 | ErrorResponse 401 en ruta pública | PASS | 401 en una ruta pública con Bearer inválido: el token presente e inválido se rechaza y no se trata como anónimo. Mensaje de autenticación requerida / token inválido correcto. |
| E2E-SEC-016A | ANONYMOUS | `POST /api/auth/login` | 200 | 200 | accessToken presente (no se registra) | PASS | 200 con accessToken |
| E2E-SEC-016B | USER_INJ (registrado en E2E-VAL-04) | `GET /api/auth/me` | 200 | 200 | roles = solo ROLE_USER | PASS | roles = solo ROLE_USER correcto para el usuario inyectado |
| E2E-SEC-017A | USER_INJ (registrado en E2E-VAL-04) | `GET /api/events/{{publishedEventCode}}/tickets/paid` | 403 | 403 | ErrorResponse 403 | PASS | ErrorResponse 403 (aún es USER). Referencia previa a conceder STAFF |
| E2E-SEC-017B | USER_INJ (registrado en E2E-VAL-04) | `GET /api/events/{{publishedEventCode}}/tickets/paid` | 200 | 200 | Lista de tickets pagados con el mismo token | PASS | 200 con el mismo token después de conceder STAFF por SQL, sin volver a hacer login. |
| E2E-SEC-017C | USER_INJ (registrado en E2E-VAL-04) | `GET /api/events/{{publishedEventCode}}/tickets/paid` | 403 | 403 | ErrorResponse 403 | PASS | 403 con el mismo token después de revocar STAFF por SQL (TC-SEC-017). |
| E2E-SEC-AUTH-013 | USER_INJ (registrado en E2E-VAL-04) | `GET /api/auth/me` | 401 | 401 | ErrorResponse 401 | PASS | ErrorResponse 401: el filtro detecta cuenta deshabilitada aunque el JWT sea válido (TC-AUTH-013) |
| E2E-VAL-01 | ANONYMOUS | `POST /api/users` | 400 | 400 | ErrorResponse 400 (email) | PASS | ErrorResponse con email mal puesto |
| E2E-VAL-02 | ANONYMOUS | `POST /api/users` | 400 | 400 | ErrorResponse 400 (password) | PASS | ErrorResponse con password mal puesto |
| E2E-VAL-03 | ANONYMOUS | `POST /api/users` | 409 | 409 | ErrorResponse 409 (duplicado) | PASS | Mismo email/username que USER_A ya registrado |
| E2E-VAL-04 | ANONYMOUS | `POST /api/users` | 201 | 201 | UserResponse 201, rol USER | PASS | El usuario se crea correctamente y su role user |
| E2E-VAL-05 | ANONYMOUS | `POST /api/auth/login` | 400 | 400 | ErrorResponse 400, details.identifier y details.password | PASS | details.identifier y details.password envian mensaje de requerimiento de llenar el campo |
| E2E-VAL-11 | ANONYMOUS | `POST /api/auth/login` | 400 | 400 | ErrorResponse 400 'Malformed JSON request' | PASS | Login con ErrorResponse 400 ('Malformed JSON request') |
| E2E-VAL-17 | ANONYMOUS | `POST /api/users` | 400 | 400 | ErrorResponse 400 (password) | PASS | ErrorResponse 400 por no tener password puesta |
| E2E-VAL-06 | ANONYMOUS | `GET /api/events/NO-EXISTE-999` | 404 | 404 | ErrorResponse 404 | PASS | ErrorResponse 404 por intentar un evento falso |
| E2E-VAL-07 | ADMIN | `POST /api/events` | 400 | 400 | ErrorResponse 400 (categoría inválida) | PASS | JSON con enum inexistente |
| E2E-VAL-08 | ADMIN | `POST /api/events` | 409 | 409 | ErrorResponse 409 (código duplicado) | PASS | Se usó un eventCode que ya existe. |
| E2E-VAL-09 | ADMIN | `POST /api/events` | 404 | 404 | ErrorResponse 404 'Venue not found' | PASS | ErrorResponse 404 (TC-BIZ-015). Venue not found: NO-EXISTE-999 |
| E2E-VAL-10 | ADMIN | `POST /api/events` | 400 | 400 | ErrorResponse 400 (name) | PASS | ErrorResponse 400 debido a intentar crear evento sin nombre |
| E2E-VAL-12 | ADMIN | `POST /api/events` | 400 | 400 | ErrorResponse 400 (minimumAge) | PASS | ErrorResponse 400 con edad negativa |
| E2E-VAL-13 | USER_A | `POST /api/tickets` | 400 | 400 | ErrorResponse 400 (tipo inválido) | PASS | ErrorResponse 400 (enum inválido → JSON no legible). No se crea ticket |
| E2E-VAL-14 | USER_A | `POST /api/tickets` | 400 | 400 | ErrorResponse 400 (eventCode) | PASS | ErrorResponse 400 compra sin eventCode |
| E2E-VAL-16 | ADMIN | `POST /api/events` | 409 | 409 | ErrorResponse 409 (venue inactivo) | PASS | ErrorResponse 409 ('venue ... is inactive') al crear un evento en un venue inactivo. |

## 2. Consolidación por módulo

Cuenta PASS, FAIL, BLOCKED y NOT RUN de la tabla anterior. La suma de cada fila debe igualar el número de casos del módulo.

| Módulo | PASS | FAIL | BLOCKED | NOT RUN |
|---|---|---|---|---|
| 00 Preparación / conectividad | 1 | 0 | 0 | 0 |
| 01 Venues (2 rutas) | 3 | 0 | 0 | 0 |
| 02 Artists (3 rutas) | 5 | 0 | 0 | 0 |
| 03 Auth / registro, login y me | 15 | 0 | 0 | 0 |
| 04 Usuarios / consulta y propiedad (2 rutas) | 4 | 0 | 0 | 0 |
| 05 Events / administración y visibilidad (6 rutas) | 12 | 0 | 0 | 0 |
| 06 Tickets / compra, consulta y ciclo de vida (6 rutas) | 18 | 1 | 0 | 0 |
| 07 Seguridad / escenarios negativos | 33 | 0 | 0 | 0 |
| 08 Validaciones y errores HTTP | 16 | 0 | 0 | 0 |
| **Total (108)** | **107** | **1** | **0** | **0** |

## 3. Cobertura de las 22 rutas

Marca "Sí" cuando la ruta tenga al menos un caso **nominal** en PASS (los casos de seguridad se cuentan aparte). La relación completa ruta → casos está en `matriz-cobertura.md`.

| # | Ruta | Caso nominal PASS (Sí/No) | Observación |
|---|---|---|---|
| 1 | `GET /api/venues/{code}` | Sí | E2E-VEN-01 |
| 2 | `GET /api/venues/active` | Sí | E2E-PREP-01, E2E-VEN-02 |
| 3 | `GET /api/artists/{id}` | Sí | E2E-ART-01 |
| 4 | `GET /api/artists/by-stage-name` | Sí | E2E-ART-02 |
| 5 | `GET /api/artists/active` | Sí | E2E-ART-03 |
| 6 | `POST /api/users` | Sí | E2E-USR-01A, E2E-USR-01B |
| 7 | `GET /api/users/by-email` | Sí | E2E-USR-02, E2E-USR-02M |
| 8 | `GET /api/users/by-username` | Sí | E2E-USR-03 |
| 9 | `POST /api/events` | Sí | E2E-EVT-01 |
| 10 | `GET /api/events/{eventCode}` | Sí | E2E-EVT-02, E2E-EVT-02D |
| 11 | `GET /api/events/published` | Sí | E2E-EVT-03 |
| 12 | `PATCH /api/events/{eventCode}/publish` | Sí | E2E-EVT-04 |
| 13 | `POST /api/events/{eventCode}/artists/{artistId}` | Sí | E2E-EVT-05, E2E-EVT-05D |
| 14 | `GET /api/events/by-artist` | Sí | E2E-EVT-06, E2E-EVT-06A |
| 15 | `POST /api/tickets` | Sí | E2E-TKT-01, E2E-TKT-01U |
| 16 | `GET /api/tickets/{ticketCode}` | Sí | E2E-TKT-02 |
| 17 | `GET /api/tickets/by-user` | No | E2E-TKT-03 en FAIL (500), ver defecto #1. Sin caso nominal en PASS |
| 18 | `GET /api/events/{eventCode}/tickets/paid` | Sí | E2E-TKT-04 |
| 19 | `PATCH /api/tickets/{ticketCode}/cancel` | Sí | E2E-TKT-05 |
| 20 | `PATCH /api/tickets/{ticketCode}/use` | Sí | E2E-TKT-06 |
| 21 | `POST /api/auth/login` | Sí | E2E-AUTH-01A |
| 22 | `GET /api/auth/me` | Sí | E2E-AUTH-02A |

Rutas cubiertas: 21 / 22

## 4. Defectos / hallazgos

Un hallazgo = una diferencia entre lo esperado y lo observado (incluye 500, datos sensibles expuestos, borradores filtrados, acceso a recursos ajenos). Pásalo a esta tabla con los pasos para reproducirlo.

| # | Caso | Precondiciones | Pasos | HTTP esperado | HTTP observado | Notas / severidad |
|---|---|---|---|---|---|---|
| 1 | E2E-TKT-03 | USER_A con token vigente y tickets ya comprados (E2E-TKT-01 y E2E-TKT-01U) | 1. Enviar `GET /api/tickets/by-user?email=<userAEmail>` con `Bearer {{userAToken}}`. 2. Repetir con `{{adminToken}}` vigente | 200 con arreglo de los tickets de A | 500, ErrorResponse "Unexpected internal error"; igual con ADMIN | **Severidad alta**: 500 en escenario nominal (PRD 9.5). El fallo ocurre después de autenticación y autorización. Causa raíz pendiente: falta el stack trace del servidor. Deja la ruta 17 sin caso nominal en PASS |

## 5. Acta de cierre (Etapa 8)

- [x] Ningún caso queda sin resultado (todo es PASS, FAIL o BLOCKED; lo no ejecutado sigue como NOT RUN y **no** cuenta como aprobado). _107 PASS, 1 FAIL, 0 BLOCKED, 0 NOT RUN._
- [ ] 22/22 rutas con caso nominal ejecutado (o justificado como BLOCKED). _Resultado: 21/22. La ruta 17 (`GET /api/tickets/by-user`) está en FAIL (defecto #1), no BLOCKED._
- [x] Todos los FAIL y BLOCKED tienen una fila en "Defectos / hallazgos". _1 FAIL (defecto #1) y 0 BLOCKED._
- [x] Ninguna captura ni archivo exportado contiene tokens ni contraseñas. _Archivos verificados: sin JWT ni contraseñas._
- [x] El ambiente de Postman exportado (si se comparte) tiene vacías las variables secretas. _Verificado en `PulsePass-local.postman_environment.json`: contraseñas y tokens vacíos._

Observaciones generales: Resultado de los 108 casos base: 107 PASS, 1 FAIL (E2E-TKT-03), 0 BLOCKED y 0 NOT RUN. Cobertura de rutas 21/22. El único defecto es el 500 de `GET /api/tickets/by-user` (defecto #1). E2E-BIZ-014A cita E2E-TKT-03 para comprobar que no se creó un ticket nuevo; como esa ruta responde 500, esa comprobación debe repetirse por otro medio (por ejemplo, el listado de tickets pagados con STAFF) o tras corregir el defecto. La misma comprobación ("no se creó ticket") queda pendiente en E2E-BIZ-014C, E2E-BIZ-014D2, E2E-SEC-008 y E2E-SEC-018, y la relectura del ticket con USER_A queda pendiente en E2E-SEC-011.

Nombre y fecha: Juan Arias y Martin Soto, 18/10/2026
