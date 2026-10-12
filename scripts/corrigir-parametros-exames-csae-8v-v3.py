#!/usr/bin/env python3
"""Correção V3 dos componentes incompletos de 13 exames já publicados no Firestore.

Executar: python scripts/corrigir-parametros-exames-csae-8v-v3.py --apply --confirm-project csaefloripa

Atualiza valores de referência e classificações no lugar certo, sem recriar documentos
ou modificar prontuários, pacientes, diagnósticos ou intervenções.
Preserva os resultados substituídos em historicoResultadosClinicos e backup JSON 0600.
Dry-run por padrão; --apply grava os 13 documentos em UMA transação idempotente.
Valida não haver intervenções concorrentes nem nomes de componentes repetidos.
"""
import argparse
import copy
import hashlib
import json
import os
import re
import sys
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

PROJECT = "csaefloripa"
COL = "ExamesLabImagem"
OUT = Path.home() / "csae-auditoria-clinica"
ROOT = Path(__file__).resolve().parents[1]
PATCH = ROOT / "scripts/data/correcoes-parametros-exames-csae-8v-v3.json"
BASE = ROOT / "scripts/data/catalogo-clinico-csae-8v-lote2.json"
IDENTITIES = "identidadesCatalogoClinico"
NHBS = "subconjuntosEnfermagem"
VERSION = "csae-clinico-8v-v3"

def norm(value):
    text=unicodedata.normalize("NFD",str(value or "").casefold())
    return re.sub(r"[^a-z0-9]+"," ","".join(x for x in text if not unicodedata.combining(x))).strip()

def digest(value):
    return hashlib.sha256(json.dumps(value,sort_keys=True,ensure_ascii=False,
        separators=(",",":"),default=str).encode("utf8")).hexdigest()

def id_for(name):
    return "csae8v-l2-" + hashlib.sha256((COL+"|"+name).encode("utf8")).hexdigest()[:20]

def private(data,prefix):
    OUT.mkdir(mode=0o700,parents=True,exist_ok=True)
    os.chmod(OUT,0o700)
    path=OUT/(prefix+"_"+datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S_%f")+".json")
    fd=os.open(path,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
    with os.fdopen(fd,"w",encoding="utf8") as f:
        json.dump(data,f,ensure_ascii=False,indent=2,default=str)
        f.write("\n")
    return str(path)

def validate_row(row,nhbs):
    if row.get("interpretacaoClinica") not in ("normal","alterado","informativo"):
        raise ValueError("Não admite classificação vazia/indeterminada: "+str(row))
    if not row.get("nomeAlteracao", "").strip():
        raise ValueError("Resultado sem interpretação legível")
    nhb=row.get("subconjuntoNHBVinculado","")
    if row["interpretacaoClinica"]=="alterado" and not nhb:
        raise ValueError("Achado alterado sem NHB: "+row["nomeAlteracao"])
    if nhb and norm(nhb) not in nhbs:
        raise ValueError("NHB inexistente: "+nhb)
    a,b=row.get("valorMinimo"),row.get("valorMaximo")
    if a is not None and b is not None and a>b:
        raise ValueError("Referência numérica invertida: "+row["nomeAlteracao"])
    amin,amax=row.get("idadeMinima"),row.get("idadeMaxima")
    if (amin is not None or amax is not None) and row.get("idadeUnidade") not in ("dias","meses","anos"):
        raise ValueError("Unidade etária não especificada: "+row["nomeAlteracao"])
    if amin is not None and amax is not None and amin>amax:
        raise ValueError("Idade invertida")
    if "resultadoClassificatorio" not in row and a is None and b is None:
        raise ValueError("Resultado numérico sem limite ou categoria: "+row["nomeAlteracao"])

def validate_comp(comp,nhbs):
    name=comp.get("componenteAnalisado","")
    if not name.strip() or not comp.get("unidadeMedida","").strip():
        raise ValueError("Componente sem nome/unidade.")
    results=comp.get("resultados")
    if not isinstance(results,list) or not results:
        raise ValueError("Componente sem resultados: "+name)
    kval=[norm(x.get("resultadoClassificatorio")) for x in results if x.get("resultadoClassificatorio")]
    if len(kval)!=len(set(kval)):
        raise ValueError("Opções classificatórias duplicadas: "+name)
    # Numerico nunca mistura opcoes qualitativas na mesma lista.
    if kval and len(kval)!=len(results):
        raise ValueError("Não misturar resultados numéricos e categóricos: "+name)
    for row in results:
        validate_row(row,nhbs)

def build_plan(patch,base,current_docs,nhbs,all_names,all_reserved):
    if patch.get("meta",{}).get("projeto")!=PROJECT or patch["meta"].get("versao")!=VERSION:
        raise ValueError("Manifesto inválido.")
    baseline={x["nomeExame"]:x for x in base["ExamesLabImagem"]}
    edits=[];skips=[];incoming=set()
    for entry in patch["itens"]:
        name=entry["nomeExame"]
        if name not in baseline:
            raise ValueError("Exame não pertence ao lote original: "+name)
        docid=id_for(name)
        if docid not in current_docs:
            raise ValueError("Documento real não encontrado: "+name)
        current=current_docs[docid]
        if current.get("nomeExame")!=name:
            raise ValueError("Identificação do documento alterada: "+name)
        before=current.get("componentes",[])
        base_comps=baseline[name]["componentes"]
        existing={norm(c.get("componenteAnalisado")):c for c in before}
        original={norm(c["componenteAnalisado"]):c for c in base_comps}
        if len(existing)!=len(before):
            raise ValueError("Componentes duplicados no Firestore: "+name)
        desired=copy.deepcopy(before)
        changed=[]
        additions=[]
        for proposal in entry["componentes"]:
            validate_comp(proposal,nhbs)
            title=proposal["componenteAnalisado"]
            key=norm(title)
            matches=[i for i,c in enumerate(desired) if norm(c.get("componenteAnalisado"))==key]
            if matches:
                i=matches[0]
                old=desired[i]
                if old==proposal:
                    continue
                oldbase=original.get(key)
                if oldbase is None or old!=oldbase:
                    raise ValueError("Componente alterado manualmente desde o lote 2: "+name+" / "+title)
                changed.append({"nomeComponente":title,"regrasAnteriores":copy.deepcopy(old["resultados"]),
                    "unidadeAnterior":old.get("unidadeMedida","")})
                desired[i]=copy.deepcopy(proposal)
            else:
                # Impede criar sinônimo indevido ou colidir com cadastros de outros exames.
                identity="parametro--"+key.replace(" ","_")
                if identity in incoming or identity in all_reserved or key in all_names:
                    raise ValueError("Colisão de identidade de componente: "+name+" / "+title)
                incoming.add(identity)
                additions.append(identity)
                desired.append(copy.deepcopy(proposal))
        if desired==before and current.get("versaoCatalogoClinico")==VERSION:
            skips.append(name)
            continue
        if desired==before:
            # Evita alterações sem conteúdo novo.
            skips.append(name)
            continue
        if current.get("versaoCatalogoClinico") and current.get("versaoCatalogoClinico")!=VERSION:
            raise ValueError("Documento recebeu outra migração; revisar manualmente: "+name)
        source=entry["fonteClinica"]
        olddesc=current.get("descricaoExame","")
        desc=olddesc.split(" [Atualização clínica V3:")[0].strip()+" [Atualização clínica V3: "+source+"]"
        hist=list(current.get("historicoResultadosClinicos",[]))
        hist.append({"versaoAnterior":"csae8v-lote2","versaoNova":VERSION,
            "data":"2026-10-12","fonte":source,
            "componentesSubstituidos":changed})
        edits.append({"id":docid,"nome":name,"antes":copy.deepcopy(before),"depois":desired,
            "hashAntes":digest(before),"descricaoAntes":olddesc,
            "descricaoDepois":desc,"historico":hist,"chavesNovas":additions})
    return {"edits":edits,"skips":skips,"reservas":sorted(incoming)}

def apply(db,planned):
    from google.cloud import firestore
    docs={x["id"]:db.collection(COL).document(x["id"]) for x in planned["edits"]}
    reservation_refs={key:db.collection(IDENTITIES).document(key) for key in planned["reservas"]}
    @firestore.transactional
    def run(tx):
        # Ler TUDO antes de escrever. A transação falha sem alterações se algo mudar.
        snapshots={i:ref.get(transaction=tx) for i,ref in docs.items()}
        booked={key:ref.get(transaction=tx) for key,ref in reservation_refs.items()}
        if any(x.exists for x in booked.values()):
            raise RuntimeError("Uma identidade foi reservada por outra operação.")
        for row in planned["edits"]:
            snap=snapshots[row["id"]]
            if not snap.exists:
                raise RuntimeError("Documento apagado durante a carga: "+row["nome"])
            current=snap.to_dict() or {}
            if digest(current.get("componentes",[]))!=row["hashAntes"] or current.get("descricaoExame","")!=row["descricaoAntes"]:
                raise RuntimeError("Mudança concorrente detectada: "+row["nome"])
            if current.get("versaoCatalogoClinico")==VERSION:
                raise RuntimeError("Migração já executada em outra operação: "+row["nome"])
        for row in planned["edits"]:
            tx.update(docs[row["id"]],{
                "componentes":row["depois"],
                "descricaoExame":row["descricaoDepois"],
                "historicoResultadosClinicos":row["historico"],
                "versaoCatalogoClinico":VERSION,
                "dataAtualizacaoClinica":firestore.SERVER_TIMESTAMP,
            })
        for row in planned["edits"]:
            for key in row["chavesNovas"]:
                tx.create(reservation_refs[key],{
                    "chave":key,"colecaoOrigem":COL,"documentoId":row["id"],
                    "criadoEm":firestore.SERVER_TIMESTAMP
                })
    run(db.transaction())

def main():
    a=argparse.ArgumentParser(description=__doc__)
    a.add_argument("--apply",action="store_true")
    a.add_argument("--confirm-project",default="")
    args=a.parse_args()
    if args.apply and args.confirm_project!=PROJECT:
        a.error("Aplicação requer --confirm-project csaefloripa")
    patch=json.loads(PATCH.read_text(encoding="utf8"))
    base=json.loads(BASE.read_text(encoding="utf8"))
    from google.cloud import firestore
    db=firestore.Client(project=PROJECT)
    if db.project!=PROJECT:raise RuntimeError("Projeto Firebase inesperado.")
    docs={d.id:d.to_dict() or {} for d in db.collection(COL).stream()}
    nhbs={norm(x.to_dict().get("tituloSubconjunto")) for x in
        db.collection(NHBS).stream()
        if norm(x.to_dict().get("tipoSubconjunto"))=="nhb"}
    all_names={norm(c.get("componenteAnalisado")) for d in docs.values()
        for c in d.get("componentes",[])}
    all_reserved={s.id for s in db.collection(IDENTITIES).stream()}
    plan=build_plan(patch,base,docs,nhbs,all_names,all_reserved)
    report={"projeto":PROJECT,"modo":"APPLY" if args.apply else "DRY_RUN",
        "geradoEmUTC":datetime.now(timezone.utc).isoformat(),
        "versao":VERSION,
        "editar":[{"id":x["id"],"nome":x["nome"],"componentesAntes":x["antes"],
            "componentesDepois":x["depois"],"descricaoAntes":x["descricaoAntes"],
            "descricaoDepois":x["descricaoDepois"]} for x in plan["edits"]],
        "ignorados":plan["skips"],"reservasNovas":plan["reservas"]}
    backup=private(report,"backup_correcao_clinica_v3")
    print("BACKUP:",backup)
    print("EXAMES A CORRIGIR:",len(plan["edits"]))
    print("JA CORRIGIDOS / SEM ALTERACAO:",len(plan["skips"]))
    for x in plan["edits"]:
        print("CORRIGIR:",x["nome"],"| componentes:",len(x["depois"]),
              "| novas identidades:",len(x["chavesNovas"]))
    if not args.apply:
        print("SIMULACAO: nenhuma escrita. Para aplicar utilize --apply --confirm-project csaefloripa.")
        return
    if not plan["edits"]:
        print("CATALOGO V3 JA APLICADO. Nenhuma escrita.")
        return
    apply(db,plan)
    for row in plan["edits"]:
        snap=db.collection(COL).document(row["id"]).get()
        latest=snap.to_dict() or {}
        if latest.get("versaoCatalogoClinico")!=VERSION or latest.get("componentes")!=row["depois"]:
            raise RuntimeError("PÓS-VALIDAÇÃO FALHOU: "+row["nome"])
    result=private({"versao":VERSION,"projeto":PROJECT,"aplicadoEmUTC":
        datetime.now(timezone.utc).isoformat(),
        "examesCorrigidos":[x["nome"] for x in plan["edits"]],
        "ignorados":plan["skips"],"backup":backup},"resultado_correcao_clinica_v3")
    print("FIRESTORE ATUALIZADO COM SUCESSO:",len(plan["edits"]),"exames.")
    print("RESULTADO:",result)
    print("Sem alterações em pacientes, prontuários, diagnósticos ou intervenções.")

if __name__=="__main__":
    try:
        main()
    except Exception as exc:
        print("CORREÇÃO NÃO CONCLUÍDA:",str(exc),file=sys.stderr)
        sys.exit(1)
