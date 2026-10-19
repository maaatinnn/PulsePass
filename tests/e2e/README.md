# PulsePass - Pruebas E2E manuales con Postman (Fase 5)

Guia para ejecutar el taller de la Fase 5. **No se usan scripts de Postman, Runner ni Newman**: cada peticion se envia con el boton **Send** y se compara a mano con lo esperado.

Alcance: **22 rutas** (20 de negocio + `POST /api/auth/login` + `GET /api/auth/me`), **108 casos base** y los roles ANONYMOUS, USER (dueño y ajeno), STAFF y ADMIN.

## Contenido de esta carpeta
| Archivo | Para que sirve |
|---|---|
| `inventario-etapa1.md` | Las 22 rutas contrastadas con el código real (DTO, roles, códigos de error) |
| `fixtures/seed-e2e.sql` + `fixtures/README.md` | Datos de prueba (venues, eventos, ADMIN, STAFF, inactivo) |
| `fixtures/sec017-*.sql`, `fixtures/sec-auth013-*.sql` | Cambios de rol/estado por SQL entre peticiones (casos SEC-017 y AUTH-013) |
| `postman/PulsePass-Manual-E2E.postman_collection.json` | Colección v2.1: carpetas 00–08 (catálogo por módulo) y 09 (Flujos A–E ordenados) |
| `postman/PulsePass-local.postman_environment.json` | Variables del ambiente (plantilla sin secretos) |
| `tools/forge_jwt.py` | Ayuda opcional para fabricar tokens inválidos (expirado / otra clave) |
| `checklist-e2e-manual.md` | Orden exacto de ejecución, con casillas |
| `registro-ejecucion-manual.md` | Bitácora a rellenar + consolidación + acta de cierre |
| `matriz-cobertura.md` | Ruta → casos, roles, casos TC-* del PRD, AC y requisitos → evidencia |

> Si Postman genera una carpeta `postman/` en otro lugar (formato de Postman con Git), es un espejo de esta misma colección y ambiente y no forma parte de la entrega: importa los `.json` de esta carpeta.

## 1. Preparar la base y la app (una sola vez)
Desde la raíz del proyecto (donde está `docker-compose.yml`):

```bash
docker compose up -d
docker compose exec postgres psql -U pulsepass -c "CREATE DATABASE pulsepass_e2e;"
```

Variables de entorno de la app (elige tu terminal):

**Windows PowerShell**
```powershell
$env:DB_URL = "jdbc:postgresql://localhost:5432/pulsepass_e2e"
$env:PULSEPASS_JWT_SECRET_BASE64 = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
mvn spring-boot:run
```
**Linux / macOS / Git Bash**
```bash
export DB_URL=jdbc:postgresql://localhost:5432/pulsepass_e2e
export PULSEPASS_JWT_SECRET_BASE64=$(openssl rand -base64 32)
mvn spring-boot:run
```
Espera a ver `Started PulsePassApplication`. Flyway ya creó las tablas (V1–V4). **Deja esa terminal abierta.**

Con la app arrancada, en OTRA terminal aplica el seed:

**PowerShell**
```powershell
Get-Content tests/e2e/fixtures/seed-e2e.sql | docker compose exec -T postgres psql -U pulsepass -d pulsepass_e2e
```
**Bash**
```bash
docker compose exec -T postgres psql -U pulsepass -d pulsepass_e2e < tests/e2e/fixtures/seed-e2e.sql
```
Debe imprimir varios `INSERT 0 n`. Si imprime `ABORTADO: la base actual NO es pulsepass_e2e` no insertó nada (es la guarda de seguridad): revisa el nombre de la base.

## 2. Postman: instalación e importación
1. Instala **Postman Desktop** (postman.com/downloads) y ábrelo; puedes omitir crear cuenta ("Skip and go to the app" / "Lightweight API Client").
2. Botón **Import** → arrastra los dos `.json` de `postman/`. Aparecen la colección **PulsePass — E2E Manual** y el ambiente **PulsePass local E2E**.
3. Arriba a la derecha abre el selector de ambientes (dice *No environment*) y elige **PulsePass local E2E**.
4. Abre el ambiente (icono de ojo → **Edit**, o menú *Environments*) y rellena la columna **Current value** de: `userAPassword`, `userBPassword` (mín. 12 caracteres, las inventas tú) y `adminPassword`, `staffPassword`, `inactivePassword` (las contraseñas con las que se generaron los hashes del seed; no están en el repositorio). Guarda con **Ctrl+S**.
   - *Initial value* se comparte si sincronizas; *Current value* es solo tuyo y local. Los secretos van siempre en Current.

## 3. Cómo enviar una petición (el ciclo básico)
1. Elige UNA forma de ejecutar: las carpetas **00–08** (por módulo) o la carpeta **09** (los mismos casos ya ordenados en Flujos A–E; recomendada). No mezcles ambas: los tickets cancelados/usados no se pueden reutilizar.
2. Haz clic en una petición y lee la pestaña **Docs** (actor, precondiciones, esperado, qué revisar).
3. Revisa **Authorization**: ¿qué token usa? Si es *No Auth*, no lleva token.
4. Pulsa **Send**.
5. Abajo mira **Status** (ej. `200 OK`), **Body** (JSON) y **Headers**.
6. Compara con el esperado y anota en `registro-ejecucion-manual.md` **con el ID base** (las peticiones de la carpeta 09 indican el ID base en su nombre: `D-07 · E2E-USR-03 — ...`).

## 4. Copiar tokens e IDs a mano
- **Token**: ejecuta `E2E-AUTH-01A` → en *Body* copia SOLO el valor de `accessToken` (sin comillas) → abre el ambiente → pega en `userAToken` (Current value) → **Save**. Igual para B (`userBToken`), STAFF (`staffToken`) y ADMIN (`adminToken`).
- **Códigos**: tras `E2E-TKT-01` copia `ticketCode` a `ticketCancelableCode`; tras `E2E-TKT-01U` a `ticketUsableCode`; de `E2E-ART-03` copia un `id` a `artistId`.
- El token dura **15 minutos**: si recibes 401 inesperado, repite el login y pega de nuevo.

## 5. Reglas del taller
- Usa un ticket distinto para cancelar y para usar.
- Corre los negativos de propiedad (SEC-009, 010, 011, 012A/B) **antes** de cancelar/usar.
- Corre `E2E-SEC-002B` y `E2E-SEC-002` **antes** de `E2E-EVT-04`, para que el "sin cambios" sea comprobable.
- Tras una denegación de mutación, relee el recurso con un actor autorizado para comprobar que no cambió.
- Un `200` solo no es PASS: revisa el JSON y el efecto.
- Si falta un prerrequisito marca **BLOCKED**, no PASS.
- Todo error debe traer `ErrorResponse` con `timestamp`, `status`, `error`, `message`, `details`; `status` igual al HTTP, sin stack trace ni datos sensibles. Un `500` en un caso nominal es FAIL.
- Nunca pegues JWT ni contraseñas en capturas, en la bitácora o en el repositorio.

## 6. Repetir desde cero
Ver `fixtures/README.md` (recrear `pulsepass_e2e` y re-aplicar el seed) o cambiar `runId`, `userA*`, `userB*` y `newEventCode` en el ambiente. Dos casos solo se pueden ejecutar **una vez por base**: `E2E-BIZ-014D1` (agota el aforo de `EVT-E2E-FULL`) y los que cambian el estado de un ticket/evento ya existente.

## 7. Tokens negativos (casos SEC-AUTH-009, 010 y 011)
Estos tres casos necesitan un token "roto". Son los únicos que requieren preparación extra; si no los preparas, márcalos **BLOCKED**.

**Alterado (`tamperedToken`, TC-AUTH-009)** — sin herramientas:
1. Haz login con A y copia el `accessToken`.
2. Pégalo en `tamperedToken` y cambia **un carácter del medio del tercer segmento** (la firma, después del segundo punto). No cambies el último carácter: puede decodificarse igual y el token seguiría siendo válido.
3. Envía `E2E-SEC-AUTH-009` → 401.

**Expirado (`expiredToken`, TC-AUTH-010)** — elige una:
- *Sin herramientas:* haz login con A, copia el token a `expiredToken` y **espera más de 15 minutos**; luego envía `E2E-SEC-AUTH-010` → 401.
- *Con Python 3:* en una terminal donde `PULSEPASS_JWT_SECRET_BASE64` tenga **el mismo valor con el que arrancaste la app E2E**:
  ```bash
  python tests/e2e/tools/forge_jwt.py expired --sub 3     # Windows: py tests\e2e\tools\forge_jwt.py expired --sub 3
  ```
  El script no imprime ni guarda el secreto. Nunca lo ejecutes con el secreto de otro ambiente.

**Otra clave (`wrongKeyToken`, TC-AUTH-011)**:
```bash
python tests/e2e/tools/forge_jwt.py wrongkey
```
Usa una clave de prueba propia (no la de la app), así que el servidor debe rechazarlo: `E2E-SEC-AUTH-011` → 401.

## 8. Cambios por SQL entre peticiones (SEC-017 y AUTH-013)
Probar que un rol revocado o una cuenta desactivada pierden acceso con un JWT que sigue vigente exige tocar la base **fuera de HTTP** (no hay endpoint para eso, a propósito). Usan el usuario `inj.<runId>` que crea `E2E-VAL-04`:

| Después de… | Ejecuta | Luego envía |
|---|---|---|
| `E2E-SEC-017A` (403) | `sec017-grant-staff.sql` | `E2E-SEC-017B` → 200 (mismo token, sin re-login) |
| `E2E-SEC-017B` | `sec017-revoke-staff.sql` | `E2E-SEC-017C` → 403 |
| `E2E-SEC-017C` | `sec-auth013-deactivate-user.sql` | `E2E-SEC-AUTH-013` → 401 |

```bash
docker compose exec -T postgres psql -U pulsepass -d pulsepass_e2e -v uname=inj.r01 < tests/e2e/fixtures/sec017-grant-staff.sql
```
```powershell
Get-Content tests/e2e/fixtures/sec017-grant-staff.sql | docker compose exec -T postgres psql -U pulsepass -d pulsepass_e2e -v uname=inj.r01
```
Cambia `inj.r01` por `inj.<tu runId>`. Los scripts se niegan a correr si la base no es `pulsepass_e2e`.

## 9. Cerrar la entrega
1. Completa `registro-ejecucion-manual.md`: cada fila con HTTP observado y resultado; luego consolidación por módulo, cobertura 22/22 y defectos.
2. Revisa `matriz-cobertura.md` (qué casos cubren cada ruta, rol y caso del PRD).
3. Marca el acta de cierre al final de la bitácora. Lo no ejecutado se queda en NOT RUN y **no** cuenta como aprobado.
4. Antes de compartir o exportar: deja vacías las variables secretas del ambiente (contraseñas y tokens).

## 10. Problemas frecuentes
| Síntoma | Causa probable |
|---|---|
| 401 en un caso que debería pasar | Token vencido (15 min) o variable de token vacía; repite el login |
| 404 en `E2E-VEN-01`/`E2E-EVT-02`… | No se aplicó el seed, o se aplicó a otra base |
| 409 en `E2E-USR-01A/01B` o `E2E-EVT-01` | Ya existen: cambia `runId`, `userA*`, `userB*`, `newEventCode` o recrea la base |
| `E2E-VAL-04` da 409 | `inj.<runId>` ya existe: cambia `runId` |
| `E2E-TKT-06`/`05` dan 409 | Ese ticket ya se usó/canceló; compra otro o recrea la base |
| `E2E-EVT-05` da 409 | El artista ya estaba asociado a ese evento (cuenta como esperado en `E2E-EVT-05R`, no en 05) |
| `500` en cualquier caso nominal | Defecto real: anótalo en "Defectos / hallazgos" con los pasos |
