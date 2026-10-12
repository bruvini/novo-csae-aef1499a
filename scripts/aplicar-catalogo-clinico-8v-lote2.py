#!/usr/bin/env python3
"""CSAE: publicar em lote novos exames, fundoscopia, leucócitos e mensuração de feridas.

Dry-run:
  .venv-csae-release/bin/python scripts/aplicar-catalogo-clinico-8v-lote2.py
Gravação autorizada:
  .venv-csae-release/bin/python scripts/aplicar-catalogo-clinico-8v-lote2.py --apply --confirm-project csaefloripa

Usa transação única e idempotente (tudo ou nada). Faz backup privado ANTES
de escrever, valida a existência e os vínculos NHB, preserva IDs e conteúdo
existentes. Jamais lê/escreve pacientes, diagnósticos ou intervenções.
Critérios sem valores validados são DESCRITIVOS e indeterminados.
"""
import argparse
import hashlib
import json
import os
import re
import sys
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from copy import deepcopy

PROJECT = "csaefloripa"
COLS = ("SinaisVitais", "ExamesLabImagem", "RevisaoSistemas")
MANIFEST = Path(__file__).resolve().parents[1] / "scripts/data/catalogo-clinico-csae-8v-lote2.json"
OUT = Path.home() / "csae-auditoria-clinica"
IDENTITIES = "identidadesCatalogoClinico"
NHB_COLLECTION = "subconjuntosEnfermagem"

def norm(value):
    text = unicodedata.normalize("NFD",str(value or "").casefold())
    return re.sub(r"[^a-z0-9]+"," ","".join(c for c in text if not unicodedata.combining(c))).strip()

def uid(col,name):
    digest=hashlib.sha256((col+"|"+name).encode("utf8")).hexdigest()[:20]
    return "csae8v-l2-"+digest

def unique_key(kind,name):
    if not norm(name):raise ValueError("Identidade clínica sem nome.")
    return kind+"--"+norm(name).replace(" ","_")

def unique_keys(col,item):
    if col=="ExamesLabImagem":
        return [unique_key("exame",item["nomeExame"])]+[
            unique_key("parametro",x["componenteAnalisado"]) for x in item["componentes"]]
    if col=="RevisaoSistemas":
        return [unique_key("sistema",item["nomeSistema"])]+[
            unique_key("exame-fisico",x["nomeExame"]) for x in item["exames"]]
    raise ValueError("Coleção não permitida")

def title(col,data):
    return data.get("nomeExame" if col=="ExamesLabImagem" else "nomeSistema","")

def private(data,prefix):
    OUT.mkdir(mode=0o700,parents=True,exist_ok=True)
    os.chmod(OUT,0o700)
    path=OUT/(prefix+"_"+datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S_%f")+".json")
    fd=os.open(path,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
    with os.fdopen(fd,"w",encoding="utf8") as f:
        json.dump(data,f,ensure_ascii=False,indent=2,default=str)
        f.write("\n")
    return str(path)

def digest(value):
    return hashlib.sha256(json.dumps(value,ensure_ascii=False,sort_keys=True,
        separators=(",",":"),default=str).encode("utf8")).hexdigest()

def get_catalog(db):
    # Não consultar prontuários, diagnósticos ou identidade de usuários.
    return {col:[{"id":s.id,"data":s.to_dict() or {}} for s in db.collection(col).stream()]
            for col in (*COLS,NHB_COLLECTION,IDENTITIES)}

def validate_new(col,data,nhbs):
    if not title(col,data).strip():raise ValueError("Novo documento sem título.")
    if col=="ExamesLabImagem":
        if data.get("tipoExame") not in ("Laboratorial","Imagem"):
            raise ValueError("Tipo de exame inválido.")
        if not data.get("componentes"):raise ValueError("Exame sem componentes.")
        for comp in data["componentes"]:
            if not comp.get("componenteAnalisado") or not comp.get("resultados"):
                raise ValueError("Componente incompleto de "+title(col,data))
            for row in comp["resultados"]:
                status=row.get("interpretacaoClinica")
                nhb=row.get("subconjuntoNHBVinculado","")
                if status not in ("normal","alterado","indeterminado"):
                    raise ValueError("Interpretação indefinida: "+title(col,data))
                if status=="alterado" and not norm(nhb):
                    raise ValueError("Resultado alterado sem NHB: "+title(col,data))
                if nhb and norm(nhb) not in nhbs:
                    raise ValueError("NHB não cadastrada: "+nhb)
                lo,hi=row.get("valorMinimo"),row.get("valorMaximo")
                if lo is not None and hi is not None and lo>hi:
                    raise ValueError("Faixa numérica invertida em "+title(col,data))
                a,b=row.get("idadeMinima"),row.get("idadeMaxima")
                if (a is not None or b is not None) and row.get("idadeUnidade") not in ("dias","meses","anos"):
                    raise ValueError("Unidade etária ausente.")
                if a is not None and b is not None and a>b:
                    raise ValueError("Faixa etária invertida.")
    elif col=="RevisaoSistemas":
        if not data.get("exames"):raise ValueError("Sistema sem exames.")
        for e in data["exames"]:
            if not e.get("propedeutica") or not e.get("achados"):
                raise ValueError("Exame físico sem propedêutica/achados.")
            for a in e["achados"]:
                for node in [a,*a.get("opcoes",[])]:
                    nhb=node.get("subconjuntoNHBVinculado","")
                    if node.get("ehAlteracao") is True and (not nhb or not node.get("nomeAlteracao")):
                        raise ValueError("Achado alterado sem classificação e NHB.")
                    if nhb and norm(nhb) not in nhbs:
                        raise ValueError("NHB inexistente: "+nhb)

def plan(manifest,snapshot):
    if manifest.get("_meta",{}).get("projeto")!=PROJECT:
        raise ValueError("Projeto divergente no manifesto")
    valid={norm(v["data"].get("tituloSubconjunto")) for v in snapshot[NHB_COLLECTION]
        if norm(v["data"].get("tipoSubconjunto"))=="nhb"}
    existing={c:{} for c in COLS}
    reserved={r["id"] for r in snapshot[IDENTITIES]}
    live_keys=set()
    for col in ("ExamesLabImagem","RevisaoSistemas"):
        for doc in snapshot[col]:
            name=title(col,doc["data"])
            existing[col].setdefault(norm(name),[]).append(doc)
            live_keys.update(unique_keys(col,doc["data"]))
    for v in snapshot["SinaisVitais"]:
        live_keys.add(unique_key("parametro",v["data"]["sinalVitalNome"]))
    creates=[];edits=[];skips=[];conflicts=[];incoming=set()
    for col in ("ExamesLabImagem","RevisaoSistemas"):
        for row in manifest[col]:
            validate_new(col,row,valid)
            name=title(col,row)
            matches=existing[col].get(norm(name),[])
            if matches:
                skips.append({"tipo":"DOCUMENTO_JA_EXISTE","colecao":col,"nome":name,
                              "ids":[x["id"] for x in matches]})
                continue
            keys=unique_keys(col,row)
            collisions=set(keys)&(reserved|live_keys|incoming)
            if collisions:
                conflicts.append({"colecao":col,"nome":name,"chaves":sorted(collisions)})
                continue
            incoming.update(keys)
            creates.append({"colecao":col,"id":uid(col,name),"nome":name,"data":row,"keys":keys})
    c=manifest["complementos"]["hemograma"]
    entries=[x for x in snapshot["ExamesLabImagem"] if x["id"]==c["docId"]]
    if len(entries)!=1:raise ValueError("Hemograma não localizado para complementar")
    d=entries[0]["data"]
    if d.get("nomeExame")!="Hemograma Completo":
        raise ValueError("Documento hemograma inesperado")
    comp=c["componente"]
    validate_new("ExamesLabImagem",{"nomeExame":"Hemograma Completo",
        "tipoExame":"Laboratorial","componentes":[comp]},valid)
    if any(norm(y["componenteAnalisado"]) in (norm(comp["componenteAnalisado"]),norm("Leucócitos"))
           for y in d.get("componentes",[])):
        skips.append({"tipo":"COMPONENTE_JA_EXISTE","nome":comp["componenteAnalisado"]})
    else:
        key=unique_key("parametro",comp["componenteAnalisado"])
        if key in reserved|live_keys|incoming:
            conflicts.append({"nome":comp["componenteAnalisado"],"chaves":[key]})
        else:
            edits.append({"colecao":"ExamesLabImagem","id":c["docId"],
                "campo":"componentes","novo":d.get("componentes",[])+[comp],
                "hashAntes":digest(d.get("componentes",[])),"keys":[key],
                "nome":"Hemograma Completo → Leucócitos Totais"})
            incoming.add(key)
    c=manifest["complementos"]["ferida"]
    entries=[x for x in snapshot["RevisaoSistemas"] if x["id"]==c["docId"]]
    if len(entries)!=1:raise ValueError("Sistema de feridas não localizado")
    d=entries[0]["data"]
    if not norm(d.get("nomeSistema")).startswith(norm("Avaliação de Feridas")):
        raise ValueError("Sistema de feridas inesperado")
    e=c["exame"]
    validate_new("RevisaoSistemas",{"nomeSistema":d["nomeSistema"],"exames":[e]},valid)
    if any(norm(x["nomeExame"])==norm(e["nomeExame"]) for x in d.get("exames",[])):
        skips.append({"tipo":"EXAME_FISICO_JA_EXISTE","nome":e["nomeExame"]})
    else:
        key=unique_key("exame-fisico",e["nomeExame"])
        if key in reserved|live_keys|incoming:
            conflicts.append({"nome":e["nomeExame"],"chaves":[key]})
        else:
            edits.append({"colecao":"RevisaoSistemas","id":c["docId"],"campo":"exames",
                "novo":d.get("exames",[])+[e],"hashAntes":digest(d.get("exames",[])),
                "keys":[key],"nome":"Avaliação de feridas → Mensuração"})
            incoming.add(key)
    return {"creates":creates,"edits":edits,"skips":skips,"conflicts":conflicts,
            "nhbs":sorted(valid),"reservedNew":len(incoming)}

def execute(db,planned):
    from google.cloud import firestore
    operations=planned["creates"]+planned["edits"]
    refs={x["colecao"]+"/"+x["id"]:db.collection(x["colecao"]).document(x["id"]) for x in operations}
    keys=sorted({k for x in operations for k in x["keys"]})
    reservations={k:db.collection(IDENTITIES).document(k) for k in keys}
    @firestore.transactional
    def write(tx):
        # Todos os reads primeiro. Nunca atualizar se houve alteração concorrente.
        docs={path:ref.get(transaction=tx) for path,ref in refs.items()}
        booked={key:ref.get(transaction=tx) for key,ref in reservations.items()}
        if any(s.exists for s in booked.values()):
            raise RuntimeError("Identidade reservada por publicação concorrente. Sem escrita.")
        for x in planned["creates"]:
            if docs[x["colecao"]+"/"+x["id"]].exists:
                raise RuntimeError("ID de documento já ocupado: "+x["nome"])
        for x in planned["edits"]:
            s=docs[x["colecao"]+"/"+x["id"]]
            if not s.exists or digest((s.to_dict() or {}).get(x["campo"],[]))!=x["hashAntes"]:
                raise RuntimeError("Documento alterado após planejamento: "+x["nome"])
        for x in planned["creates"]:
            ref=refs[x["colecao"]+"/"+x["id"]]
            tx.create(ref,{**x["data"],"dataCadastro":firestore.SERVER_TIMESTAMP})
        for x in planned["edits"]:
            ref=refs[x["colecao"]+"/"+x["id"]]
            tx.update(ref,{x["campo"]:x["novo"]})
        for x in operations:
            for key in x["keys"]:
                ref=reservations[key]
                tx.create(ref,{"chave":key,"colecaoOrigem":x["colecao"],
                               "documentoId":x["id"],"criadoEm":firestore.SERVER_TIMESTAMP})
    write(db.transaction())
    # Transação única; falha antes do commit => nada aplicado.
    return len(operations)

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply",action="store_true")
    parser.add_argument("--confirm-project",default="")
    args=parser.parse_args()
    if args.apply and args.confirm_project!=PROJECT:
        parser.error("Para aplicar: --apply --confirm-project csaefloripa")
    manifest=json.loads(MANIFEST.read_text(encoding="utf8"))
    from google.cloud import firestore
    db=firestore.Client(project=PROJECT)
    if db.project!=PROJECT:raise RuntimeError("Projeto Firebase inesperado")
    before=get_catalog(db)
    planned=plan(manifest,before)
    summary={"criarNovosExames":sum(x["colecao"]=="ExamesLabImagem" for x in planned["creates"]),
             "criarSistemas":sum(x["colecao"]=="RevisaoSistemas" for x in planned["creates"]),
             "complementarDocumentos":len(planned["edits"]),"ignorarExistentes":len(planned["skips"]),
             "conflitos":len(planned["conflicts"]),"reservasNovas":planned["reservedNew"]}
    backup={"projeto":PROJECT,"modo":"APPLY" if args.apply else "DRY_RUN",
            "geradoEmUTC":datetime.now(timezone.utc).isoformat(),
            "lote":manifest["_meta"],"resumo":summary,
            "novos":[{"colecao":x["colecao"],"id":x["id"],"nome":x["nome"]}
                     for x in planned["creates"]],
            "complementos":[{"colecao":x["colecao"],"id":x["id"],"nome":x["nome"],
                "campo":x["campo"],"dadosAnteriores":next(
                    y["data"][x["campo"]] for y in before[x["colecao"]] if y["id"]==x["id"]),
                "dadosPropostos":x["novo"]} for x in planned["edits"]],
            "conflitos":planned["conflicts"],"existentes":planned["skips"]}
    path=private(backup,"plano_e_backup_lote2_csae")
    print("PLANO/ BACKUP:",path)
    print(json.dumps(summary,indent=2,ensure_ascii=False))
    for x in planned["creates"]:print("CRIAR:",x["nome"])
    for x in planned["edits"]:print("COMPLEMENTAR:",x["nome"])
    if planned["conflicts"]:
        print(json.dumps(planned["conflicts"],ensure_ascii=False,indent=2))
        raise RuntimeError("CONFLITOS; nada foi gravado. Resolver primeiro.")
    if not args.apply:
        print("DRY-RUN: Firestore inalterado.")
        print("Para gravar tudo em UMA transação: --apply --confirm-project csaefloripa")
        return
    if not planned["creates"] and not planned["edits"]:
        print("Carga já está concluída; não existem novas gravações.")
        return
    total=execute(db,planned)
    final={"projeto":PROJECT,"geradoEmUTC":datetime.now(timezone.utc).isoformat(),
            "modo":"APLICADO","operacoesConfirmadas":total,"resumo":summary,
            "planoBackup":path}
    output=private(final,"resultado_lote2_csae")
    print("FIRESTORE ATUALIZADO:",total,"operações em transação única.")
    print("Relatório:",output)
    print("Diagnósticos, intervenções, processos e prontuários NÃO foram acessados.")

if __name__=="__main__":
    try:main()
    except Exception as exc:
        print("CARGA INCOMPLETA/ABORTADA:",str(exc),file=sys.stderr)
        sys.exit(1)
