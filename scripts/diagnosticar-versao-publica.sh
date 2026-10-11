#!/usr/bin/env bash
# Compara a versão pública do domínio personalizado à hospedagem Firebase.
# SOMENTE LEITURA: não acessa dados pessoais nem muda Firebase.
set -Eeuo pipefail
python3 - <<'PY'
from html.parser import HTMLParser
import sys
from urllib.request import Request, urlopen
from urllib.error import URLError
class Assets(HTMLParser):
    def __init__(self):
        super().__init__(); self.scripts=[]; self.styles=[]
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag=='script' and a.get('src'): self.scripts.append(a['src'])
        if tag=='link' and a.get('rel')=='stylesheet' and a.get('href'): self.styles.append(a['href'])
results={}
for domain in ('https://csae.com.br/', 'https://csaefloripa.web.app/'):
    try:
        req=Request(domain,headers={'Cache-Control':'no-cache','User-Agent':'CSAE-version-check/1.0'})
        with urlopen(req,timeout=20) as r:
            html=r.read(250000).decode('utf8','replace')
            parser=Assets();parser.feed(html)
            signature=(tuple(parser.scripts),tuple(parser.styles))
            results[domain]=signature
            print(domain, '\n  status:',r.status,'\n  scripts:',parser.scripts,'\n  estilos:',parser.styles)
    except (OSError, URLError) as e:
        print(domain,'\n  Não foi possível consultar:',str(e)[:160])
if len(results)!=2:
    print('ATENÇÃO: não foi possível comparar ambos os endereços.')
    sys.exit(2)
mesmo=len(set(results.values()))==1
print('\nMESMO BUNDLE:', 'SIM' if mesmo else 'NÃO — confira configuração do domínio csae.com.br')
if not mesmo:
    sys.exit(3)
PY
