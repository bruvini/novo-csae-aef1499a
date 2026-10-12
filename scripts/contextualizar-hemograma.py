#!/usr/bin/env python3
"""Contextualiza as regras LEGADAS do Hemograma Completo sem mudar limiares.

Hemoglobina (Hb): gestação, Protocolo CSAE Vol. 3, p. 115 do PDF.
Hematócrito/plaquetas: triagem de dengue, Vol. 2, p. 99 do PDF.
Apenas propõe ou inclui 'contextoClinico' em resultados existentes:
NÃO exclui/renomeia componentes, regras ou NHBs. Dry-run por padrão.
"""
import argparse,copy,hashlib,json,os,sys
from pathlib import Path
from datetime import datetime,timezone
PROJECT="csaefloripa"
COLLECTION="ExamesLabImagem"
DOC_ID="hemograma-completo-81dd0b7182"
OUT=Path.home()/"csae-auditoria-clinica"
CONTEXTS={"Hemoglobina (Hb)":"gestante",
          "Hematócrito":"dengue","Plaquetas":"dengue"}
COUNTS={"Hemoglobina (Hb)":3,"Hematócrito":6,"Plaquetas":2}

def digest(v):
    return hashlib.sha256(json.dumps(v,sort_keys=True,ensure_ascii=False,
      separators=(",",":"),default=str).encode("utf8")).hexdigest()

def planejar(d):
    if d.get("nomeExame")!="Hemograma Completo" or d.get("tipoExame")!="Laboratorial":
        raise RuntimeError("Documento não é Hemograma Completo laboratorial.")
    cs=d.get("componentes")
    if not isinstance(cs,list) or set(c.get("componenteAnalisado") for c in cs)!=set(CONTEXTS):
        raise RuntimeError("Estrutura de componentes alterada; conferir manualmente.")
    proposed=copy.deepcopy(cs)
    all_done=True
    for c in proposed:
        n=c["componenteAnalisado"]
        results=c.get("resultados")
        if not isinstance(results,list) or len(results)!=COUNTS[n]:
            raise RuntimeError("Quantidade de resultados alterada para "+n)
        for row in results:
            now=row.get("contextoClinico")
            if now not in (None,"",CONTEXTS[n]):
                raise RuntimeError("Contexto já personalizado: "+n+"="+str(now))
            if now!=CONTEXTS[n]:
                all_done=False
                row["contextoClinico"]=CONTEXTS[n]
    # Confere que somente contextoClinico foi adicionado.
    for old,new in zip(cs,proposed):
        for before,after in zip(old["resultados"],new["resultados"]):
            check=dict(after);check.pop("contextoClinico",None)
            original=dict(before);original.pop("contextoClinico",None)
            if check!=original:
                raise RuntimeError("Mudança inesperada de referência clínica.")
    return proposed,all_done

def private(payload,prefix):
    OUT.mkdir(mode=0o700,parents=True,exist_ok=True);os.chmod(OUT,0o700)
    path=OUT/(prefix+"_"+datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S_%f")+".json")
    fd=os.open(path,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
    with os.fdopen(fd,"w",encoding="utf8") as f:
        json.dump(payload,f,indent=2,ensure_ascii=False,default=str)
    return path

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply",action="store_true")
    parser.add_argument("--confirm-project",default="")
    args=parser.parse_args()
    if args.apply and args.confirm_project!=PROJECT:
        parser.error("Aplicação exige --confirm-project csaefloripa")
    from google.cloud import firestore
    client=firestore.Client(project=PROJECT)
    if client.project!=PROJECT:raise RuntimeError("Projeto diferente.")
    ref=client.collection(COLLECTION).document(DOC_ID)
    current=ref.get()
    if not current.exists:raise RuntimeError("Hemograma ausente.")
    data=current.to_dict() or {}
    proposed,done=planejar(data)
    if done:
        print("Contextos já aplicados; nenhuma escrita.")
        return
    report={"projeto":PROJECT,"id":DOC_ID,"antes":data["componentes"],
            "proposto":proposed,"hashAntes":digest(data["componentes"]),
            "fontes":{"gestante":"Protocolo CSAE Vol. 3, PDF p. 115",
                      "dengue":"Protocolo CSAE Vol. 2, PDF p. 99"},
            "modo":"APPLY" if args.apply else "DRY_RUN"}
    path=private(report,"plano_contextos_hemograma")
    print("PLANO:",path)
    print("Hb: 3 regras em contexto gestante.")
    print("Hematócrito: 6 regras em contexto dengue.")
    print("Plaquetas: 2 regras em contexto dengue.")
    print("Nomes, limites, interpretações e NHBs permanecem inalterados.")
    if not args.apply:
        print("DRY-RUN: nenhuma escrita.")
        return
    if not sys.stdin.isatty():
        raise RuntimeError("Somente terminal interativo autoriza aplicar.")
    confirm=input("Após homologação, digite HOMOLOGO CONTEXTOS HEMOGRAMA: ").strip()
    if confirm!="HOMOLOGO CONTEXTOS HEMOGRAMA":
        raise RuntimeError("Aplicação não autorizada.")
    @firestore.transactional
    def write(tx):
        snap=ref.get(transaction=tx)
        if not snap.exists:raise RuntimeError("Documento não encontrado na transação.")
        actual=snap.to_dict() or {}
        if digest(actual.get("componentes"))!=report["hashAntes"]:
            raise RuntimeError("Hemograma modificado desde o dry-run; abortando.")
        check,already=planejar(actual)
        if already or check!=proposed:
            raise RuntimeError("Plano não é mais válido; abortando.")
        tx.update(ref,{"componentes":proposed})
    write(client.transaction())
    final=ref.get().to_dict()
    if final.get("componentes")!=proposed:
        raise RuntimeError("Conferência após atualização falhou.")
    result=private({"antes":report,"depois":final["componentes"]},
                   "resultado_contextos_hemograma")
    print("HEMOGRAMA ATUALIZADO. Comprovante:",result)
    print("Nenhum outro documento do Firestore foi modificado.")

if __name__=="__main__":
    try:main()
    except Exception as exc:
        print("CONCILIAÇÃO HEMOGRAMA NÃO CONCLUÍDA:",str(exc),file=sys.stderr)
        sys.exit(1)
