#!/usr/bin/env python3
"""Verificação pós-deploy com tolerância à propagação do Firebase Hosting.

Somente leitura HTTP. Confirma que os HTMLs servidos referenciam os mesmos
assets versionados do build local, sem consultar dados de pacientes.
"""
from __future__ import annotations

import hashlib
from pathlib import Path
import re
import sys
import time
from urllib.request import Request, urlopen

URLS = ("https://csaefloripa.web.app/", "https://csae.com.br/")
PRAZO_SEGUNDOS = 150
INTERVALO_SEGUNDOS = 5
ASSET_PATTERN = re.compile(r"/assets/[a-zA-Z0-9_.-]+\.(?:js|css)")


def assets_html(html: str) -> set[str]:
    """Extrai nomes dos recursos com hash; não depende de ordem no HTML."""
    return set(ASSET_PATTERN.findall(html))


def obter_html(url: str, marcador: str) -> tuple[str, str]:
    separador = "&" if "?" in url else "?"
    request = Request(
        f"{url}{separador}verificacao_csae={marcador}",
        headers={
            "Cache-Control": "no-cache, no-store, max-age=0",
            "Pragma": "no-cache",
            "User-Agent": "CSAE-Hosting-Release-Check/2.0",
        },
    )
    with urlopen(request, timeout=20) as response:
        if response.status != 200:
            raise RuntimeError(f"HTTP {response.status}")
        return response.read(512_000).decode("utf-8", errors="replace"), response.url


def verificar_urls(
    urls: tuple[str, ...], assets_esperados: set[str], marcador: str,
    prazo: float = PRAZO_SEGUNDOS, intervalo: float = INTERVALO_SEGUNDOS,
) -> bool:
    """Tenta até que todos os domínios estejam servindo o build novo."""
    pendentes = set(urls)
    ultimo_erro: dict[str, str] = {}
    limite = time.monotonic() + prazo
    tentativa = 0
    while pendentes:
        tentativa += 1
        for url in tuple(sorted(pendentes)):
            try:
                html, final = obter_html(url, f"{marcador}-{tentativa}")
                assets_atuais = assets_html(html)
                faltantes = assets_esperados - assets_atuais
                if faltantes:
                    ultimo_erro[url] = (
                        f"assets do novo build ausentes: {sorted(faltantes)}; "
                        f"assets servidos agora: {sorted(assets_atuais)}"
                    )
                    print(f"Aguardando propagação em {url} (tentativa {tentativa}).", flush=True)
                else:
                    print(
                        f"OK: {url} apresenta o build esperado "
                        f"({len(assets_esperados)} assets); resposta: {final}",
                        flush=True,
                    )
                    pendentes.remove(url)
                    ultimo_erro.pop(url, None)
            except Exception as error:
                ultimo_erro[url] = f"{type(error).__name__}: {error}"
                print(f"Aguardando resposta válida de {url} (tentativa {tentativa}).", flush=True)
        if not pendentes:
            return True
        restante = limite - time.monotonic()
        if restante <= 0:
            break
        time.sleep(min(intervalo, restante))
    for url in sorted(pendentes):
        print(f"FALHA na verificação de {url}: {ultimo_erro.get(url, 'sem resposta')}", file=sys.stderr)
    return False


def main() -> int:
    local = Path("dist/index.html")
    if not local.is_file():
        print("FALHA: dist/index.html não encontrado.", file=sys.stderr)
        return 1
    content = local.read_text(encoding="utf-8")
    assets = assets_html(content)
    if not assets:
        print("FALHA: nenhum JS/CSS versionado encontrado no build local.", file=sys.stderr)
        return 1
    marcador = hashlib.sha256(content.encode()).hexdigest()[:12]
    print(f"Verificando {len(assets)} assets do build {marcador} nos domínios do CSAE.", flush=True)
    if verificar_urls(URLS, assets, marcador):
        print("SUCESSO: todos os domínios servem os recursos do build verificado.", flush=True)
        return 0
    print(
        "A versão do Hosting pode ter sido publicada, mas ainda não foi confirmada "
        "nos domínios. Verifique cache/CDN e configuração do domínio.",
        file=sys.stderr,
    )
    return 1


if __name__ == "__main__":
    sys.exit(main())
