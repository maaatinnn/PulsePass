# Checklist de ejecución manual (orden obligatorio)

Marca cada casilla SOLO cuando hayas comparado HTTP + JSON con lo esperado y anotado el resultado en `registro-ejecucion-manual.md`.
Antes de cada petición protegida mira la pestaña **Authorization** y confirma qué token usa. El token dura 15 min: si ves un 401 inesperado, repite el login.

Hay dos formas equivalentes de ejecutar (elige UNA): las carpetas `00–08` (catálogo por módulo) o la carpeta `09` (los mismos casos ya ordenados en Flujos A–E). Esta lista sigue el orden de la carpeta `09`.

## Preparación
- [x] Base `pulsepass_e2e` creada y app arriba en :8080 (README §1)
- [x] `seed-e2e.sql` aplicado (debe imprimir `INSERT 0 n`, no "ABORTADO")
- [x] Colección y ambiente importados; ambiente **PulsePass local E2E** seleccionado; contraseñas en *Current value*
- [x] Ajustar `runId`, `userA*`, `userB*` y `newEventCode` si ya corriste antes sin reiniciar la base


## Flujo A — Descubrimiento público (sin token)
_PRD 9.1. Todo sin Authorization. Copia un id de E2E-ART-03 a artistId antes de E2E-ART-01._

- [x] **E2E-PREP-01** — Conectividad (GET venues activos) → 200
- [x] **E2E-VEN-02** — Venues activos → 200
- [x] **E2E-VEN-01** — Venue por código → 200
- [x] **E2E-VEN-01N** — Venue inexistente → 404
- [x] **E2E-ART-03** — Artistas activos → 200  _copia un `id` a `artistId` y el nombre a `artistStageName` si no usas Solar Beat_
- [x] **E2E-ART-01** — Artista por ID → 200
- [x] **E2E-ART-01N** — Artista inexistente → 404
- [x] **E2E-ART-02** — Artista por nombre artístico → 200
- [x] **E2E-ART-02N** — Artista por nombre inexistente → 404
- [x] **E2E-EVT-03** — Eventos publicados → 200
- [x] **E2E-EVT-02** — Evento publicado (público) → 200
- [x] **E2E-SEC-004** — Borrador sin token → 403
- [x] **E2E-EVT-06** — Eventos por artista → 200
- [x] **E2E-SEC-AUTH-015** — Bearer inválido en endpoint público → 401

## Flujo B — Registro y JWT
_PRD 9.2. Tras cada login copia accessToken al ambiente. El token dura 15 min. E2E-SEC-AUTH-010/011 son opcionales hasta preparar sus tokens (README §7)._

- [x] **E2E-USR-01A** — Registrar USER_A → 201
- [x] **E2E-USR-01B** — Registrar USER_B → 201
- [x] **E2E-VAL-04** — Registro con role=ADMIN inyectado → 201  _el usuario `inj.<runId>` se usa luego en SEC-016/017/AUTH-013_
- [x] **E2E-AUTH-01A** — Login USER_A (username) → 200  _copia `accessToken` → `userAToken`_
- [x] **E2E-AUTH-01A2** — Login USER_A (email) → 200
- [x] **E2E-AUTH-01B** — Login USER_B → 200  _→ `userBToken`_
- [x] **E2E-AUTH-01S** — Login STAFF → 200  _→ `staffToken`_
- [x] **E2E-AUTH-01M** — Login ADMIN → 200  _→ `adminToken`_
- [x] **E2E-AUTH-02A** — Me con token de USER_A → 200
- [x] **E2E-AUTH-02B** — Me con token de USER_B → 200
- [x] **E2E-AUTH-02S** — Me con token de STAFF → 200
- [x] **E2E-AUTH-02M** — Me con token de ADMIN → 200
- [x] **E2E-AUTH-01N** — Login con contraseña incorrecta → 401
- [x] **E2E-AUTH-01X** — Login con usuario inexistente → 401
- [x] **E2E-AUTH-01I** — Login de cuenta inactiva → 401
- [x] **E2E-AUTH-02N** — Me sin token → 401
- [x] **E2E-SEC-AUTH-008** — Bearer inventado → 401
- [x] **E2E-SEC-AUTH-009** — JWT alterado (un carácter cambiado) → 401  _antes: `userAToken` → `tamperedToken` con 1 carácter del medio de la firma cambiado_
- [x] **E2E-SEC-AUTH-010** — JWT expirado → 401  _opcional: requiere `expiredToken` (README §7)_
- [x] **E2E-SEC-AUTH-011** — JWT firmado con otra clave → 401  _opcional: requiere `wrongKeyToken` (README §7)_
- [x] **E2E-SEC-AUTH-012** — Token enviado por query string → 401
- [x] **E2E-VAL-05** — Login con cuerpo vacío → 400
- [x] **E2E-VAL-11** — Login con JSON malformado → 400

## Flujo C — Catálogo (ADMIN)
_PRD 9.3. Usa un newEventCode NUEVO en cada corrida. Luego confirma que USER y STAFF no pueden crear/publicar/asociar._

- [x] **E2E-EVT-01** — Crear evento (ADMIN) → 201  _usa un `newEventCode` NUEVO; el `eventCode` del 201 debe coincidir_
- [x] **E2E-EVT-02D** — Evento borrador (ADMIN) → 200
- [x] **E2E-EVT-05D** — Asociar artista al borrador (ADMIN) → 200
- [x] **E2E-EVT-05** — Asociar artista (ADMIN) → 200
- [x] **E2E-EVT-06A** — Eventos por artista (ADMIN ve borradores) → 200  _el borrador SÍ aparece (ADMIN)_
- [x] **E2E-SEC-005** — Eventos por artista: anónimo no ve borradores → 200  _el borrador `newEventCode` NO debe aparecer_
- [x] **E2E-SEC-001A** — Crear evento sin token → 401
- [x] **E2E-SEC-001B** — Crear evento como USER_A → 403
- [x] **E2E-SEC-002** — Publicar como STAFF → 403
- [x] **E2E-SEC-002B** — Publicar como USER_A → 403  _antes de publicar con E2E-EVT-04_
  - releer el evento con ADMIN: sigue DRAFT
- [x] **E2E-SEC-003** — Asociar artista como USER_A → 403
- [x] **E2E-EVT-04** — Publicar evento (ADMIN) → 200
- [x] **E2E-EVT-02** — Evento publicado (público) → 200
- [x] **E2E-EVT-03** — Eventos publicados → 200
- [x] **E2E-EVT-06** — Eventos por artista → 200
- [x] **E2E-EVT-04R** — Publicar evento ya publicado (ADMIN) → 409
- [x] **E2E-EVT-05R** — Asociar el mismo artista otra vez (ADMIN) → 409
- [x] **E2E-EVT-05N** — Asociar artista inexistente (ADMIN) → 404

## Flujo D — Compra, propiedad, cancelación y uso
_PRD 9.4. Los negativos de propiedad van ANTES de cancelar/usar. T1 = ticketCancelableCode (se cancela); T2 = ticketUsableCode (se usa)._

- [x] **E2E-TKT-01** — Comprar ticket (USER_A) → 201  _copia `ticketCode` → `ticketCancelableCode`_
- [x] **E2E-TKT-01U** — Comprar 2.º ticket (para usar) → 201  _copia `ticketCode` → `ticketUsableCode`_
- [x] **E2E-TKT-02** — Ticket por código (propietario) → 200
- [x] **E2E-TKT-02S** — Ticket por código (STAFF) → 200
- [x] **E2E-TKT-03** — Tickets por usuario (propio) → 200  _**FAIL**: respondió 500; ver defecto #1 en el registro_
- [x] **E2E-USR-02** — Usuario por email (propio) → 200
- [x] **E2E-USR-02M** — Usuario por email (ADMIN consulta a A) → 200
- [x] **E2E-USR-03** — Usuario por username (propio) → 200
- [x] **E2E-SEC-006** — USER_B consulta a A por email → 403
- [x] **E2E-SEC-007** — USER_B consulta a A por username → 403
- [x] **E2E-SEC-008** — USER_A compra con email de B → 403
- [x] **E2E-SEC-009** — USER_B lee ticket de A → 403
- [x] **E2E-SEC-010** — USER_B lista tickets de A → 403
- [x] **E2E-SEC-011** — USER_B cancela ticket de A → 403
- [x] **E2E-SEC-012A** — USER_B marca uso del ticket de A → 403
- [x] **E2E-SEC-012B** — USER_A (dueño) intenta marcar uso → 403
- [x] **E2E-SEC-013** — USER_A ve tickets pagados → 403
- [x] **E2E-SEC-018** — ADMIN intenta comprar ticket → 403
- [x] **E2E-SEC-019A** — Comprar ticket sin token → 401
- [x] **E2E-SEC-019B** — Leer ticket sin token → 401
- [x] **E2E-SEC-019C** — Tickets pagados sin token → 401
- [x] **E2E-SEC-019D** — Usuario por email sin token → 401
- [x] **E2E-TKT-04** — Tickets pagados por evento (STAFF) → 200
- [x] **E2E-TKT-05** — Cancelar ticket (propietario) → 200
- [x] **E2E-TKT-02** — Ticket por código (propietario) → 200
- [x] **E2E-TKT-05R** — Cancelar ticket ya cancelado (propietario) → 409
- [x] **E2E-TKT-06C** — Usar un ticket cancelado (STAFF) → 409  _solo negativo, sobre el ticket ya cancelado_
- [x] **E2E-TKT-06** — Marcar ticket usado (STAFF) → 200
- [x] **E2E-TKT-06R** — Marcar usado por segunda vez (STAFF) → 409
- [x] **E2E-TKT-05U** — Cancelar un ticket ya usado (propietario) → 409
- [x] **E2E-TKT-04** — Tickets pagados por evento (STAFF) → 200

## Flujo E — Regresión de errores y seguridad avanzada
_PRD 9.5. Los pasos SEC-017/AUTH-013 requieren ejecutar un script SQL entre peticiones (fixtures/README.md). Ningún caso nominal debe dar 500._

- [x] **E2E-VAL-01** — Registro con email mal formado → 400
- [x] **E2E-VAL-02** — Registro con contraseña corta → 400
- [x] **E2E-VAL-03** — Registro duplicado → 409
- [x] **E2E-VAL-17** — Registro sin password → 400
- [x] **E2E-VAL-06** — Evento inexistente → 404
- [x] **E2E-VAL-07** — Crear evento con categoría inválida → 400
- [x] **E2E-VAL-08** — Crear evento con código duplicado → 409
- [x] **E2E-VAL-09** — Crear evento con venue inexistente → 404
- [x] **E2E-VAL-10** — Crear evento sin name → 400
- [x] **E2E-VAL-12** — Crear evento con minimumAge negativo → 400
- [x] **E2E-VAL-13** — Compra con tipo de ticket inválido → 400
- [x] **E2E-VAL-14** — Compra sin eventCode → 400
- [x] **E2E-VAL-16** — Crear evento en venue inactivo → 409
- [x] **E2E-TKT-02N** — Ticket inexistente (USER_A) → 404
- [x] **E2E-USR-02N** — Usuario por email inexistente (ADMIN) → 404
- [x] **E2E-BIZ-014A** — Compra en evento borrador → 409
- [x] **E2E-BIZ-014B** — Compra en evento inexistente → 404
- [x] **E2E-BIZ-014C** — Compra con edad mínima insuficiente → 409
- [x] **E2E-BIZ-014D1** — Compra del último cupo (aforo 1) → 201  _una sola vez por base de datos_
- [x] **E2E-BIZ-014E** — Evento agotado: estado SOLD_OUT (ADMIN) → 200
- [x] **E2E-BIZ-014D2** — Compra sin aforo (USER_B) → 409
- [x] **E2E-SEC-016A** — Login del usuario registrado con role=ADMIN inyectado → 200
- [x] **E2E-SEC-016B** — Me del usuario inyectado: solo ROLE_USER → 200
- [x] **E2E-SEC-017A** — Pagados con injToken (USER, antes del SQL) → 403
  - **SQL →** `sec017-grant-staff.sql` (uname = `inj.<runId>`)
- [x] **E2E-SEC-017B** — Pagados con el MISMO token tras conceder STAFF (SQL) → 200
  - **SQL →** `sec017-revoke-staff.sql` (uname = `inj.<runId>`)
- [x] **E2E-SEC-017C** — Pagados con el MISMO token tras revocar STAFF (SQL) → 403
  - **SQL →** `sec-auth013-deactivate-user.sql` (uname = `inj.<runId>`)
- [x] **E2E-SEC-AUTH-013** — Token previo de usuario desactivado → 401

## Después de cada mutación (cancelar, usar, publicar, asociar, comprar)
- [x] Releí el recurso con un actor autorizado y el estado coincide con lo esperado
- [x] En toda denegación (401/403) comprobé que el recurso **no** cambió

## Cierre
- [x] Bitácora completa (sin casillas vacías en "Resultado")
- [x] Consolidación por módulo y cobertura 22/22 rellenadas  _cobertura obtenida: 21/22_
- [x] Defectos y bloqueos registrados  _1 defecto (E2E-TKT-03), 0 bloqueos_
- [x] Ambiente de Postman sin secretos antes de compartir o exportar  _verificado: contraseñas y tokens vacíos_
