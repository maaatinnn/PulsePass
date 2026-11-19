#!/usr/bin/env python3
"""
forge_jwt.py — Genera tokens JWT INVÁLIDOS a propósito para las pruebas negativas E2E.
Solo usa la librería estándar de Python 3. NO forma parte del producto ni de la colección Postman.

  python tools/forge_jwt.py wrongkey            # firmado con una clave de PRUEBA propia (TC-AUTH-011)
  python tools/forge_jwt.py expired --sub 3     # ya expirado, firmado con la clave de TU ambiente E2E (TC-AUTH-010)

Pega el resultado en la variable de ambiente de Postman (wrongKeyToken / expiredToken).

Reglas de seguridad:
  * 'wrongkey' usa una clave fija de ejemplo que NO es la de la app: el servidor DEBE rechazarlo.
  * 'expired' lee PULSEPASS_JWT_SECRET_BASE64 de TU terminal (el secreto exclusivo del ambiente E2E).
    No lo imprime, no lo guarda y no lo subas al repositorio. Nunca lo uses con el secreto de otro ambiente.
  * El token generado es de usar y tirar; no lo pegues en la bitácora ni en capturas.
"""
import argparse, base64, hashlib, hmac, json, os, sys, time, uuid

TEST_KEY = b"clave-de-prueba-que-NO-es-la-de-la-app-0123456789"  # >= 32 bytes, solo para 'wrongkey'


def b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def forge(key: bytes, sub: str, issuer: str, iat: int, exp: int) -> str:
    header = {"alg": "HS256"}
    payload = {"sub": sub, "iss": issuer, "iat": iat, "exp": exp, "jti": str(uuid.uuid4())}
    signing_input = b64(json.dumps(header, separators=(",", ":")).encode()) + "." + \
        b64(json.dumps(payload, separators=(",", ":")).encode())
    sig = hmac.new(key, signing_input.encode(), hashlib.sha256).digest()
    return signing_input + "." + b64(sig)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("mode", choices=["wrongkey", "expired"])
    ap.add_argument("--sub", default="1", help="id de usuario (claim sub). Por defecto 1")
    ap.add_argument("--issuer", default="pulsepass-api", help="issuer esperado por la app (expectedIssuer)")
    args = ap.parse_args()
    now = int(time.time())

    if args.mode == "wrongkey":
        print(forge(TEST_KEY, args.sub, args.issuer, now, now + 900))
        return 0

    secret = os.environ.get("PULSEPASS_JWT_SECRET_BASE64")
    if not secret:
        print("Falta PULSEPASS_JWT_SECRET_BASE64 en esta terminal (el mismo valor con el que arrancaste la app E2E).",
              file=sys.stderr)
        return 2
    try:
        key = base64.b64decode(secret, validate=True)
    except Exception:
        print("PULSEPASS_JWT_SECRET_BASE64 no es Base64 válido.", file=sys.stderr)
        return 2
    print(forge(key, args.sub, args.issuer, now - 1800, now - 900))
    return 0


if __name__ == "__main__":
    sys.exit(main())
