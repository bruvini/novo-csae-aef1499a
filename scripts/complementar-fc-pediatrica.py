#!/usr/bin/env python3
"""Conciliação idempotente de FC pediátrica (proposta clínica para homologação).

Dry-run por padrão. --apply requer confirmação do projeto, TTY e frase explícita.
Somente SinaisVitais/frequencia-cardiaca-fc-09c0fe7869 pode ser alterado.
Base clínica: Protocolo CSAE Volume 5, Quadro 2.3, p. 11 do PDF.
RN = dias 0..27 (definição OMS); demais idades são idades PONTUAIS do quadro:
11 meses, 2, 4, 6, 8 e 10 anos. Não interpolar intervalos ausentes.
NHB proposta para FC fora do intervalo: Regulação vascular — exigir homologação.
"""
import argparse
import hashlib
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

PROJECT="csaefloripa"
COLLECTION="SinaisVitais"
DOC_ID="frequencia-cardiaca-fc-09c0fe7869"
NHB="Regulação vascular"
OUT=Path.home()/"csae-auditoria-clinica"
# Fonte: quadro 2.3, Vol.5; cada idade é ponto de aferição, não faixa contínua.
BANDS=[
    ("Recém-nato (0–27 dias)","dias",0,27,70,170),
    ("11 meses","meses",11,11,80,160),
    ("2 anos","anos",2,2,80,130),
    ("4 anos","anos",4,4,80,120),
    ("6 anos","anos",6,6,75,115),
    ("8 anos","anos",8,8,70,110),
    ("10 anos","anos",10,10,70,110),
]

def digest(value):
    return hashlib.sha256(json.dumps(value,sort_keys=True,ensure_ascii=False,
        separators=(",",":"),default=str).encode("utf-8")).hexdigest()

def preparar(registro):
    if registro.get("sinalVitalNome")!="Frequência Cardíaca (FC)":
        raise RuntimeError("Nome do documento inesperado; nenhum registro será atualizado.")
    if registro.get("unidadeMedida")!="bpm":
        raise RuntimeError("Unidade não é bpm; revisar antes de atualizar.")
    original=registro.get("valoresDeReferencia")
    if not isinstance(original,list):
        raise RuntimeError("Referências ausentes ou formato incorreto.")
    if len(original)!=2:
        # Não duplicar se já foi corrigido por outra publicação.
        if len(original)==23 and all(any(
                r.get("idadeUnidade")==unit and r.get("idadeMinima")==lo
                and r.get("idadeMaxima")==hi and r.get("valorMinimo")==vmin
                and r.get("valorMaximo")==vmax and
                r.get("interpretacaoClinica")=="normal"
                for r in original) for _,unit,lo,hi,vmin,vmax in BANDS):
            return [],True
        raise RuntimeError("FC não possui mais duas regras originais: plano inválido; revisar.")
    normal,alta=original
    if not (normal.get("valorMinimo")==60 and normal.get("valorMaximo")==100 and
            alta.get("valorMinimo")==101 and alta.get("valorMaximo") is None):
        raise RuntimeError("Regras originais mudaram; não atualizar automaticamente.")
    if any(x.get("idadeMinima") is not None or x.get("idadeMaxima") is not None
           for x in original):
        raise RuntimeError("Regras atuais já possuem recorte etário; plano deve ser revisto.")
    fromcopy=lambda x:{**x,"idadeMinima":18,"idadeMaxima":None,"idadeUnidade":"anos"}
    result=[fromcopy(normal),fromcopy(alta)]
    for label,unit,lo,hi,minimum,maximum in BANDS:
        common=dict(idadeMinima=lo,idadeMaxima=hi,idadeUnidade=unit,
            criterioSexo="Ambos",
            criterioCondicao="FC em repouso; "+label+
                "; Protocolo CSAE Volume 5, quadro 2.3, p. 11; idade pontual.",
            contextoClinico="geral")
        # Intervalo fechado; referências acima e abaixo sem espaços numéricos.
        result.append({**common,"interpretacaoClinica":"alterado",
            "valorMinimo":None,"valorMaximo":minimum-1,
            "nomeAlteracao":"FC abaixo da faixa pediátrica de referência",
            "subconjuntoNHBVinculado":NHB})
        result.append({**common,"interpretacaoClinica":"normal",
            "valorMinimo":minimum,"valorMaximo":maximum,
            "nomeAlteracao":"FC dentro da faixa pediátrica de referência",
            "subconjuntoNHBVinculado":""})
        result.append({**common,"interpretacaoClinica":"alterado",
            "valorMinimo":maximum+1,"valorMaximo":None,
            "nomeAlteracao":"FC acima da faixa pediátrica de referência",
            "subconjuntoNHBVinculado":NHB})
    if len(result)!=23:raise AssertionError("Deveriam ser 23 referências.")
    return result,False

def save_private(data,prefix):
    OUT.mkdir(mode=0o700,parents=True,exist_ok=True)
    os.chmod(OUT,0o700)
    path=OUT/(prefix+"_"+datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S_%f")+".json")
    fd=os.open(path,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
    with os.fdopen(fd,"w",encoding="utf-8") as f:
        json.dump(data,f,ensure_ascii=False,indent=2,default=str)
    return path

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--apply",action="store_true")
    p.add_argument("--confirm-project",default="")
    args=p.parse_args()
    if args.apply and args.confirm_project!=PROJECT:
        p.error("Para aplicar: --apply --confirm-project csaefloripa")
    from google.cloud import firestore
    client=firestore.Client(project=PROJECT)
    if client.project!=PROJECT:raise RuntimeError("Projeto Firestore divergente.")
    ref=client.collection(COLLECTION).document(DOC_ID)
    snap=ref.get()
    if not snap.exists:raise RuntimeError("Documento FC não encontrado.")
    previous=snap.to_dict() or {}
    new,already=preparar(previous)
    if already:
        print("FC já contém as 21 regras propostas; nenhuma escrita.")
        return
    nhbs={str(d.to_dict().get("tituloSubconjunto","")) for d in
         client.collection("subconjuntosEnfermagem").stream()
         if str(d.to_dict().get("tipoSubconjunto","")).strip().lower()=="nhb"}
    if NHB not in nhbs:
        raise RuntimeError("NHB proposta não está cadastrada; sem escrita.")
    report={"projeto":PROJECT,"colecao":COLLECTION,"documento":DOC_ID,
            "fonte":"Protocolo de Enfermagem Vol. 5, quadro 2.3, p. 11 do PDF",
            "nhbProposta":NHB,"observacao":"NHB deve ser homologada clinicamente",
            "sha256Antes":digest(previous["valoresDeReferencia"]),
            "regrasAntes":previous["valoresDeReferencia"],
            "regrasPropostas":new,"modo":"APPLY" if args.apply else "DRY_RUN"}
    path=save_private(report,"proposta_fc_pediatrica")
    print("PLANO:",path)
    print("Adultos: duas referências existentes passam a valer para idade >=18 anos.")
    for label,_,_,_,a,b in BANDS:print("  "+label+": "+str(a)+"–"+str(b)+" bpm")
    print("NHB alterada (proposta):",NHB)
    print("Regras antes:",len(previous["valoresDeReferencia"]),
          "| regras depois:",len(new),"| novos itens:",len(new)-len(previous["valoresDeReferencia"]))
    if not args.apply:
        print("DRY-RUN: nenhuma alteração. Revisar aprovação clínica antes de --apply.")
        return
    if not sys.stdin.isatty():
        raise RuntimeError("Aplicação requer terminal interativo; sem escrita.")
    print("ATENÇÃO: há idades pediátricas não cobertas pelo quadro; ficam sem classificação automática.")
    approval=input("Para aplicar após homologação, digite HOMOLOGO FC PEDIATRICA CSAE: ").strip()
    if approval!="HOMOLOGO FC PEDIATRICA CSAE":
        raise RuntimeError("Confirmação ausente: Firestore inalterado.")
    @firestore.transactional
    def write(tx):
        fresh=ref.get(transaction=tx)
        if not fresh.exists:raise RuntimeError("Documento removido; abortado.")
        current=fresh.to_dict() or {}
        if digest(current.get("valoresDeReferencia"))!=report["sha256Antes"]:
            raise RuntimeError("FC foi alterada desde o plano; sem escrita.")
        recomputed,changed=preparar(current)
        if changed or recomputed!=new:
            raise RuntimeError("Plano perdeu validade; sem escrita.")
        tx.update(ref,{"valoresDeReferencia":new})
    write(client.transaction())
    result=ref.get().to_dict() or {}
    if result.get("valoresDeReferencia")!=new:
        raise RuntimeError("Pós-conferência diferente do esperado. Investigar imediatamente.")
    final=save_private({"antes":report,"sha256Depois":digest(new),
       "regrasDepois":result["valoresDeReferencia"]},"resultado_fc_pediatrica")
    print("ATUALIZADO:",ref.path,"| regras:",len(new))
    print("Rastreabilidade:",final)
    print("Diagnósticos, exames, demais sinais e prontuários inalterados.")

if __name__=="__main__":
    try:main()
    except Exception as exc:
        print("CONCILIAÇÃO FC NÃO CONCLUÍDA:",str(exc),file=sys.stderr)
        sys.exit(1)
