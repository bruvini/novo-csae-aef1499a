#!/usr/bin/env python3
"""Confere se o build local corresponde aos documentos servidos, sem acessar pacientes."""
from pathlib import Path
from urllib.request import Request, urlopen
import re
import sys

local = Path("dist/index.html")
if not local.is_file():
    sys.exit("FALHA: dist/index.html não encontrado; build não confirmado.")
content = local.read_text(encoding="utf-8")
assets = set(re.findall(r'/assets/[a-zA-Z0-9_.-]+\.(?:js|css)', content))
if not assets:
    sys.exit("FALHA: nenhum asset JS/CSS de build identificado no HTML.")

for url in ("https://csaefloripa.web.app/", "https://csae.com.br/"):
    request = Request(url, headers={"Cache-Control": "no-cache", "User-Agent": "CSAE-deploy-check/1.0"})
    try:
        with urlopen(request, timeout=25) as response:
            body = response.read(512_000).decode("utf-8", errors="replace")
            final = response.url
    except Exception as exc:
        sys.exit(f"FALHA: não foi possível consultar {url}: {type(exc).__name__}: {exc}")
    missing = sorted(asset for asset in assets if asset not in body)
    if missing:
        sys.exit(f"FALHA: {url} não apresenta o build enviado. Assets divergentes: {', '.join(missing)}")
    print(f"OK: {url} disponibiliza os {len(assets)} assets do build atual. URL final: {final}")
