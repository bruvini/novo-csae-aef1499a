#!/usr/bin/env python3
"""Auditoria somente leitura: compara conteúdo clínico real ao pacote CSAE v1.

Não altera documentos. Diferentemente da carga aditiva, não considera título
igual prova de que faixas, componentes, achados e opções estão completos.
Usar: .venv-csae-release/bin/python scripts/reconciliar-catalogo-protocolos.py
"""
import importlib.util
import json
import hashlib
import unicodedata
import re
from pathlib import Path
from datetime import datetime, timezone

BASE = Path(__file__).resolve().parents[1]
ORIGEM = BASE / "scripts" / "popular-catalogo-protocolos.py"
spec = importlib.util.spec_from_file_location("csae_popular_catalogo", ORIGEM)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

def canon(s):
    value = unicodedata.normalize("NFD", str(s or "").casefold())
    return re.sub(r"[^a-z0-9]+", " ", "".join(c for c in value if not unicodedata.combining(c))).strip()

def key_for(collection, item):
    return canon(mod.obter_nome(collection, item))

def nested(collection, value):
    if collection == "SinaisVitais":
        return {"faixas": value.get("valoresDeReferencia", [])}
    if collection == "ExamesLabImagem":
        return {"componentes": value.get("componentes", [])}
    return {"exames": value.get("exames", [])}

def stable(v):
    return json.dumps(v, sort_keys=True, ensure_ascii=False, separators=(",", ":"), default=str)

def diff_rec(current, expected, prefix=""):
    """Mostra lacunas, valores distintos e itens excedentes; não propõe atualização automática."""
    problems=[]
    if isinstance(expected, dict):
        if not isinstance(current, dict):
            return [{"caminho":prefix,"situacao":"tipo_incompativel","esperado":expected,"atual":current}]
        for k,v in expected.items():
            path=f"{prefix}.{k}" if prefix else k
            if k not in current:
                problems.append({"caminho":path,"situacao":"campo_ausente","esperado":v})
            else:
                problems.extend(diff_rec(current[k],v,path))
        return problems
    if isinstance(expected,list):
        if not isinstance(current,list):
            return [{"caminho":prefix,"situacao":"tipo_incompativel","esperado":expected,"atual":current}]
        # Arrays com identidade estável comparados por nome; listas de faixas e
        # opções sem identidade natural são comparadas como multiconjuntos.
        selectors=("nomeExame","componenteAnalisado","descricaoAchado","textoOpcao")
        selector=next((x for x in selectors if all(isinstance(z,dict) and x in z for z in expected)),None)
        if selector:
            lookup={}
            for item in current:
                if isinstance(item,dict):
                    lookup.setdefault(canon(item.get(selector)), []).append(item)
            for item in expected:
                k=canon(item[selector])
                path=prefix+f"[{selector}={item[selector]}]"
                matches=lookup.get(k,[])
                if not matches:
                    problems.append({"caminho":path,"situacao":"item_ausente","esperado":item})
                elif len(matches)>1:
                    problems.append({"caminho":path,"situacao":"duplicidade_atual","quantidade":len(matches)})
                else:
                    problems.extend(diff_rec(matches[0],item,path))
            return problems
        used=set()
        for i,item in enumerate(expected):
            match=next((j for j,c in enumerate(current) if j not in used and stable(c)==stable(item)),None)
            if match is None:
                problems.append({"caminho":f"{prefix}[{i}]","situacao":"item_ausente_ou_diferente","esperado":item})
            else:
                used.add(match)
        return problems
    if stable(current)!=stable(expected):
        return [{"caminho":prefix,"situacao":"valor_divergente","atual":current,"esperado":expected}]
    return []

def main():
    from google.cloud import firestore
    client=firestore.Client(project=mod.PROJECT)
    manifest=json.loads(mod.MANIFEST.read_text(encoding="utf-8"))
    snapshot=mod.snapshot_catalogo(client)
    nhbs={canon(x["data"].get("tituloSubconjunto")) for x in snapshot[mod.NHB_COLLECTION] if canon(x["data"].get("tipoSubconjunto"))=="nhb"}
    mod.validar_manifesto(manifest,nhbs)
    rows=[]
    for collection in mod.COLLECTIONS:
        existing={}
        for doc in snapshot[collection]:
            existing.setdefault(key_for(collection,doc["data"]),[]).append(doc)
        for desired in manifest[collection]:
            name=mod.obter_nome(collection,desired)
            matches=existing.get(key_for(collection,desired),[])
            if len(matches)==0:
                rows.append({"colecao":collection,"nome":name,"situacao":"DOCUMENTO_AUSENTE","divergencias":[]})
            elif len(matches)>1:
                rows.append({"colecao":collection,"nome":name,"situacao":"NOMES_DUPLICADOS","ids":[x["id"] for x in matches]})
            else:
                doc=matches[0]
                changes=diff_rec(nested(collection,doc["data"]),nested(collection,desired))
                rows.append({"colecao":collection,"nome":name,"id":doc["id"],
                             "situacao":"REVISAR_CONTEUDO" if changes else "PACOTE_COMPATIVEL",
                             "divergencias":changes})
    result={"projeto":mod.PROJECT,"geradoEm":datetime.now(timezone.utc).isoformat(),
            "limite":"Comparação com o pacote v1; NÃO equivale à revisão exaustiva dos oito protocolos.",
            "somenteLeitura":True,"itens":rows}
    path=mod.escrever_privado(result,"reconciliacao_detalhada_"+datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S_%f")+".json")
    for r in rows:
        print(f'{r["colecao"]}: {r["nome"]}: {r["situacao"]} ({len(r.get("divergencias",[]))} diferenças)')
    print("RELATORIO:",path)
    print("Nenhuma escrita efetuada; diferenças precisam de revisão clínica e técnica.")

if __name__=="__main__":
    main()
