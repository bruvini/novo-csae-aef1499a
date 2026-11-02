#!/usr/bin/env python3
"""CSAE Floripa — ajuste pontual de NHB dos cinco exames hepatobiliares (V4).

Troca apenas o vínculo NHB "Eliminações" pelo nome EXATO do subconjunto
já cadastrado "Regulação - crescimento celular e desenvolvimento funcional"
nas 12 regras explicitamente marcadas como ALTERADAS no lote V3.

Não altera os limites, interpretações, nomes, componentes, diagnósticos,
prontuários nem outras NHBs. Por padrão só simula; --apply executa a
gravação atômica de 5 documentos, com backup privado e auditoria separada.

Uma NHB vinculada a um resultado alterado representa um POSSÍVEL aspecto
para avaliação do enfermeiro, não confirmação automática de necessidade
prejudicada ou diagnóstico clínico.
"""
import argparse
import copy
import hashlib
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

PROJECT = "csaefloripa"
COLLECTION = "ExamesLabImagem"
NHB_COLLECTION = "subconjuntosEnfermagem"
AUDIT_COLLECTION = "auditoriaCatalogoClinicoNHBV4"
OLD_NHB = "Eliminações"
NEW_NHB = "Regulação - crescimento celular e desenvolvimento funcional"
SOURCE = Path(__file__).resolve().parent / "data" / "correcoes-parametros-exames-csae-8v-v3.json"
OUT = Path.home() / "csae-auditoria-clinica"
TARGETS = (
    "Transaminase Oxalacética — TGO (AST)",
    "Transaminase Pirúvica — TGP (ALT)",
    "Fosfatase Alcalina (FA)",
    "Gama Glutamiltransferase (GGT)",
    "Bilirrubinas Totais e Frações",
)
EXPECTED_RULES = {
    "Transaminase Oxalacética — TGO (AST)": 2,
    "Transaminase Pirúvica — TGP (ALT)": 2,
    "Fosfatase Alcalina (FA)": 2,
    "Gama Glutamiltransferase (GGT)": 2,
    "Bilirrubinas Totais e Frações": 4,
}

def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True,
        ensure_ascii=False, separators=(",", ":"), default=str).encode("utf8")).hexdigest()

def doc_id(name):
    return "csae8v-l2-" + hashlib.sha256((COLLECTION+"|"+name).encode("utf8")).hexdigest()[:20]

def strip_nhb(item):
    d=copy.deepcopy(item)
    d.pop("subconjuntoNHBVinculado", None)
    return d

def plan(manifest, documents, nhb_names):
    if NEW_NHB not in nhb_names:
        raise ValueError("NHB de destino não cadastrada exatamente como esperada: " + NEW_NHB)
    expected_by_name={x["nomeExame"]:x for x in manifest["itens"]}
    changes=[]
    skips=[]
    for name in TARGETS:
        source=expected_by_name.get(name)
        if not source:
            raise ValueError("Manifesto V3 não contém "+name)
        id_=doc_id(name)
        original=documents.get(id_)
        if original is None or original.get("nomeExame")!=name:
            raise ValueError("Documento no Firestore não corresponde ao manifesto: "+name)
        comps=original.get("componentes")
        if not isinstance(comps,list):
            raise ValueError("Componentes indisponíveis: "+name)
        proposed=copy.deepcopy(comps)
        modified=[]
        matched=0
        for expected_comp in source["componentes"]:
            cname=expected_comp["componenteAnalisado"]
            matches=[(index,c) for index,c in enumerate(proposed)
                     if c.get("componenteAnalisado")==cname]
            if len(matches)!=1:
                raise ValueError("Componente alterado/duplicado: "+name+" / "+cname)
            ci,current_comp=matches[0]
            actual_rows=current_comp.get("resultados")
            expected_rows=expected_comp["resultados"]
            if not isinstance(actual_rows,list) or len(actual_rows)!=len(expected_rows):
                raise ValueError("Quantidade de regras divergiu: "+name+" / "+cname)
            for ri,(actual,expected) in enumerate(zip(actual_rows,expected_rows)):
                # Protege a ordem, os limites clínicos e qualquer edição recente.
                if strip_nhb(actual)!=strip_nhb(expected):
                    raise ValueError("Regra mudou desde V3: "+name+" / "+cname+" / "+str(ri))
                if expected.get("interpretacaoClinica")!="alterado":
                    # Nenhum resultado normal ou informativo é modificado.
                    continue
                if expected.get("subconjuntoNHBVinculado")!=OLD_NHB:
                    raise ValueError("A NHB de origem mudou no manifesto V3: "+name+" / "+cname)
                matched+=1
                nhb=actual.get("subconjuntoNHBVinculado","")
                if nhb==NEW_NHB:
                    continue
                if nhb!=OLD_NHB:
                    raise ValueError("NHB alterada por outro usuário: "+name+" / "+cname)
                proposed[ci]["resultados"][ri]["subconjuntoNHBVinculado"]=NEW_NHB
                modified.append({"componente":cname,"resultado":expected["nomeAlteracao"],
                    "valorMinimo":expected.get("valorMinimo"),
                    "valorMaximo":expected.get("valorMaximo"),
                    "nhbAnterior":OLD_NHB,"nhbNova":NEW_NHB})
        if matched != EXPECTED_RULES[name]:
            raise ValueError("Número inesperado de resultados alterados: "+name)
        if modified:
            changes.append({"id":id_,"nome":name,"antes":comps,"depois":proposed,
                            "hashAnterior":digest(comps),"regrasAlteradas":modified})
        else:
            skips.append(name)
    return {"edits":changes,"jaAtualizados":skips,
            "totalResultadosAlterados":sum(len(x["regrasAlteradas"]) for x in changes)}

def backup_private(data, prefix):
    OUT.mkdir(parents=True, exist_ok=True, mode=0o700)
    os.chmod(OUT,0o700)
    path=OUT/(prefix+"_"+datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S_%f")+".json")
    fd=os.open(path, os.O_WRONLY|os.O_CREAT|os.O_EXCL, 0o600)
    with os.fdopen(fd,"w",encoding="utf8") as stream:
        json.dump(data,stream,ensure_ascii=False,indent=2,default=str)
        stream.write("\n")
    return str(path)

def apply(db, planned):
    from google.cloud import firestore
    edits=planned["edits"]
    refs={x["id"]:db.collection(COLLECTION).document(x["id"]) for x in edits}
    audits={x["id"]:db.collection(AUDIT_COLLECTION).document(x["id"]) for x in edits}
    @firestore.transactional
    def write(tx):
        snapshots={id_:ref.get(transaction=tx) for id_,ref in refs.items()}
        prior_audits={id_:ref.get(transaction=tx) for id_,ref in audits.items()}
        if any(x.exists for x in prior_audits.values()):
            raise RuntimeError("Auditoria V4 já existente: interrompido sem escrita")
        for entry in edits:
            s=snapshots[entry["id"]]
            if not s.exists or digest((s.to_dict() or {}).get("componentes"))!=entry["hashAnterior"]:
                raise RuntimeError("Alteração concorrente em "+entry["nome"]+"; sem escrita")
        for entry in edits:
            tx.update(refs[entry["id"]],{"componentes":entry["depois"]})
            tx.create(audits[entry["id"]],{
                "versao":"nhb-hepatobiliar-v4",
                "colecaoOrigem":COLLECTION,"documentoId":entry["id"],
                "nomeExame":entry["nome"],"campoAlterado":"subconjuntoNHBVinculado",
                "nhbAnterior":OLD_NHB,"nhbNova":NEW_NHB,
                "regrasAlteradas":entry["regrasAlteradas"],
                "componentesAntes":entry["antes"],
                "componentesDepois":entry["depois"],
                "registroEm":firestore.SERVER_TIMESTAMP,
                "nota":"Vínculo potencial para análise de enfermagem; não determina diagnóstico."
            })
    write(db.transaction())

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply",action="store_true")
    parser.add_argument("--confirm-project",default="")
    args=parser.parse_args()
    if args.apply and args.confirm_project!=PROJECT:
        parser.error("Confirmação necessária: --apply --confirm-project csaefloripa")
    manifest=json.loads(SOURCE.read_text(encoding="utf8"))
    if manifest.get("meta",{}).get("projeto")!=PROJECT:
        raise RuntimeError("Manifesto em projeto errado.")
    from google.cloud import firestore
    db=firestore.Client(project=PROJECT)
    if db.project!=PROJECT:
        raise RuntimeError("Projeto Google diferente de "+PROJECT)
    targets={doc_id(n):n for n in TARGETS}
    documents={}
    for id_ in targets:
        snapshot=db.collection(COLLECTION).document(id_).get()
        if snapshot.exists:
            documents[id_]=snapshot.to_dict() or {}
    nhbs={doc.to_dict().get("tituloSubconjunto") for doc in
          db.collection(NHB_COLLECTION).stream()
          if doc.to_dict().get("tipoSubconjunto","").strip().casefold()=="nhb"}
    proposal=plan(manifest,documents,nhbs)
    report={"projeto":PROJECT,"versao":"nhb-hepatobiliar-v4",
            "modo":"APLICAÇÃO" if args.apply else "SOMENTE_LEITURA",
            "documentosParaAtualizar":len(proposal["edits"]),
            "regrasParaAtualizar":proposal["totalResultadosAlterados"],
            "nhbAnterior":OLD_NHB,"nhbDestino":NEW_NHB,
            "documentosJaAtualizados":proposal["jaAtualizados"],
            "alteracoes":[{"exame":r["nome"],"id":r["id"],
                "componentesAntes":r["antes"],
                "componentesDepois":r["depois"],
                "regrasAlteradas":r["regrasAlteradas"]} for r in proposal["edits"]]}
    path=backup_private(report,"backup_nhb_hepatica_v4")
    print("BACKUP:",path)
    print("EXAMES:",len(proposal["edits"]),
          "| RESULTADOS ALTERADOS:",proposal["totalResultadosAlterados"])
    for entry in proposal["edits"]:
        print("ATUALIZAR:",entry["nome"],"("+str(len(entry["regrasAlteradas"]))+" regras)")
    if not args.apply:
        print("SOMENTE LEITURA. Use --apply --confirm-project csaefloripa para gravar.")
        return
    if not proposal["edits"]:
        print("NHB V4 JÁ APLICADA. Firestore inalterado.")
        return
    apply(db,proposal)
    for entry in proposal["edits"]:
        latest=db.collection(COLLECTION).document(entry["id"]).get().to_dict() or {}
        if latest.get("componentes")!=entry["depois"]:
            raise RuntimeError("Pós-verificação falhou para "+entry["nome"])
    receipt=backup_private({
        "projeto":PROJECT,"versao":"nhb-hepatobiliar-v4",
        "aplicadoEmUTC":datetime.now(timezone.utc).isoformat(),
        "examesAtualizados":[entry["nome"] for entry in proposal["edits"]],
        "regrasAtualizadas":proposal["totalResultadosAlterados"],
        "backup":path},"resultado_nhb_hepatica_v4")
    print("FIRESTORE ATUALIZADO COM SUCESSO:",
          len(proposal["edits"]),"exames e",proposal["totalResultadosAlterados"],"vínculos NHB.")
    print("COMPROVANTE:",receipt)
    print("Nenhumas outras coleções clínicas ou prontuários foram alterados.")

if __name__=="__main__":
    try:main()
    except Exception as error:
        print("ATUALIZAÇÃO NHB CANCELADA:",str(error),file=sys.stderr)
        sys.exit(1)
