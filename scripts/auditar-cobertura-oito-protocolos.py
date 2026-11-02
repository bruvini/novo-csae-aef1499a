#!/usr/bin/env python3
"""Concilia 80 conceitos candidatos dos protocolos 1–8 com TODO o catálogo clínico.
SOMENTE LEITURA. Não altera pacientes, diagnósticos nem dados do Firestore.
Correspondência por nome NÃO equivale a validação clínica ou completude de faixas.
"""
import json, os, re, unicodedata
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
MATRIX=ROOT/"scripts/data/matriz-exploratoria-protocolos-v1-v8.json"
OUT=Path.home()/"csae-auditoria-clinica"
PROJECT="csaefloripa"
COLS=("SinaisVitais","ExamesLabImagem","RevisaoSistemas")

def norm(v):
    s=unicodedata.normalize("NFD",str(v or "").casefold())
    return re.sub(r"[^a-z0-9]+"," ","".join(c for c in s if not unicodedata.combining(c))).strip()

def objs(v):
    return [x for x in v if isinstance(x,dict)] if isinstance(v,list) else []

def matches(alias,name):
    a,n=norm(alias),norm(name)
    return bool(a and n and (a==n or
      re.search(r"(?<![a-z0-9])"+re.escape(a)+r"(?![a-z0-9])",n)))

def index(snapshot):
    rows=[]
    def add(col,level,name,id_,data,parent=""):
        rows.append({"colecao":col,"nivel":level,"nome":str(name or ""),"id":id_,
                     "pai":parent,"dados":data})
    for item in snapshot["SinaisVitais"]:
        d=item["data"];add("SinaisVitais","documento",d.get("sinalVitalNome"),item["id"],d)
    for item in snapshot["ExamesLabImagem"]:
        d=item["data"];add("ExamesLabImagem","documento",d.get("nomeExame"),item["id"],d)
        for c in objs(d.get("componentes")):
            add("ExamesLabImagem","componente",c.get("componenteAnalisado"),item["id"],c,d.get("nomeExame"))
    for item in snapshot["RevisaoSistemas"]:
        d=item["data"];add("RevisaoSistemas","sistema",d.get("nomeSistema"),item["id"],d)
        for e in objs(d.get("exames")):
            add("RevisaoSistemas","exame_fisico",e.get("nomeExame"),item["id"],e,d.get("nomeSistema"))
            for a in objs(e.get("achados")):
                add("RevisaoSistemas","achado",a.get("descricaoAchado"),item["id"],a,e.get("nomeExame"))
    return rows

def refs(row):
    d=row["dados"]
    if row["colecao"]=="SinaisVitais": return objs(d.get("valoresDeReferencia"))
    if row["colecao"]=="ExamesLabImagem":
        if row["nivel"]=="componente":return objs(d.get("resultados"))
        return [r for c in objs(d.get("componentes")) for r in objs(c.get("resultados"))]
    if row["nivel"]=="achado":return [d]
    if row["nivel"]=="exame_fisico":return objs(d.get("achados"))
    return [a for e in objs(d.get("exames")) for a in objs(e.get("achados"))]

def peds(r):
    unit=norm(r.get("idadeUnidade"));lo,hi=r.get("idadeMinima"),r.get("idadeMaxima")
    if unit in ("dias","meses") and (lo is not None or hi is not None):return True
    return unit=="anos" and (isinstance(lo,(int,float)) and lo<18 or
                              isinstance(hi,(int,float)) and hi<18)

def examine(manifest,snap):
    indexed=index(snap)
    allowed={"sinais_vitais":"SinaisVitais","exames_laboratoriais":"ExamesLabImagem",
             "exames_imagem":"ExamesLabImagem","exame_fisico_revisao":"RevisaoSistemas"}
    findings=[]
    for concept in manifest["itens"]:
        potential=[r for r in indexed if r["colecao"]==allowed[concept["categoria"]] and
                   any(matches(alias,r["nome"]) for alias in
                       [concept["nome"],*concept.get("sinonimos",[])])]
        pref={"exame_fisico":0,"componente":0,"documento":1,"achado":1,"sistema":2}
        potential.sort(key=lambda r:pref.get(r["nivel"],3))
        items=[{"id":r["id"],"nome":r["nome"],"nivel":r["nivel"],"pai":r["pai"],
                "totalReferenciasOuAchados":len(refs(r)),"faixasPediatricas":sum(peds(x) for x in refs(r))}
               for r in potential[:20]]
        findings.append({"categoria":concept["categoria"],"conceito":concept["nome"],
                         "fontes":concept["fontes"],
                         "situacao":"CORRESPONDENCIA_NOMINAL" if potential else "SEM_CORRESPONDENCIA_NOMINAL",
                         "ocorrencias":len(potential),"possiveisRegistros":items})
    nhbs={norm(x["data"].get("tituloSubconjunto")) for x in snap["subconjuntosEnfermagem"]
          if norm(x["data"].get("tipoSubconjunto"))=="nhb"}
    warnings=[]
    def flag(col,id_,path,kind,extra=None):
        warnings.append({"colecao":col,"id":id_,"caminho":path,"tipo":kind,"detalhe":extra})
    for col in COLS:
        seen=defaultdict(list)
        for doc in snap[col]:
            d=doc["data"];name=d.get({"SinaisVitais":"sinalVitalNome",
                           "ExamesLabImagem":"nomeExame","RevisaoSistemas":"nomeSistema"}[col],"")
            seen[norm(name)].append(doc["id"])
            if col=="SinaisVitais":groups=[("valoresDeReferencia",objs(d.get("valoresDeReferencia")))]
            elif col=="ExamesLabImagem":
                groups=[("componentes["+str(j)+"].resultados",objs(c.get("resultados")))
                        for j,c in enumerate(objs(d.get("componentes")))]
            else:
                groups=[("exames["+str(j)+"].achados",objs(e.get("achados")))
                        for j,e in enumerate(objs(d.get("exames")))]
                for j,e in enumerate(objs(d.get("exames"))):
                    fields=[norm(a.get("descricaoAchado")) for a in objs(e.get("achados"))]
                    if len(fields)!=len(set(fields)):
                        flag(col,doc["id"],"exames["+str(j)+"]","ACHADOS_DUPLICADOS")
            for base,group in groups:
                for j,r in enumerate(group):
                    path=base+"["+str(j)+"]"
                    lo,hi=r.get("idadeMinima"),r.get("idadeMaxima")
                    if (lo is not None or hi is not None) and norm(r.get("idadeUnidade")) not in ("anos","meses","dias"):
                        flag(col,doc["id"],path,"FAIXA_ETARIA_SEM_UNIDADE")
                    if lo is not None and hi is not None and isinstance(lo,(int,float)) and isinstance(hi,(int,float)) and lo>hi:
                        flag(col,doc["id"],path,"IDADE_INVERTIDA")
                    a,b=r.get("valorMinimo"),r.get("valorMaximo")
                    if isinstance(a,(int,float)) and isinstance(b,(int,float)) and a>b:
                        flag(col,doc["id"],path,"VALORES_INVERTIDOS")
                    nhb=norm(r.get("subconjuntoNHBVinculado"))
                    isalter=r.get("ehAlteracao") is True or norm(r.get("interpretacaoClinica"))=="alterado"
                    if isalter and not nhb:flag(col,doc["id"],path,"ALTERACAO_SEM_NHB")
                    if nhb and nhb not in nhbs:flag(col,doc["id"],path,"NHB_INEXISTENTE",r.get("subconjuntoNHBVinculado"))
                    for k,option in enumerate(objs(r.get("opcoes"))):
                        optnhb=norm(option.get("subconjuntoNHBVinculado"))
                        if option.get("ehAlteracao") is True and not optnhb:
                            flag(col,doc["id"],path+".opcoes["+str(k)+"]","OPCAO_ALTERADA_SEM_NHB")
                        if optnhb and optnhb not in nhbs:
                            flag(col,doc["id"],path+".opcoes["+str(k)+"]","OPCAO_NHB_INEXISTENTE")
        for name,ids in seen.items():
            if name and len(ids)>1:flag(col,",".join(ids),name,"NOME_DUPLICADO")
    return {"projeto":PROJECT,"data":datetime.now(timezone.utc).isoformat(),
            "modo":"SOMENTE_LEITURA",
            "limites":"Matriz exploratória não exaustiva; match por nome não valida conteúdo nem fonte; triagem não é referência geral.",
            "contagemFirestore":{c:len(snap[c]) for c in COLS},
            "totalCandidatos":len(findings),
            "resumoCorrespondencias":dict(Counter(x["situacao"] for x in findings)),
            "alertas":warnings,"alertasPorTipo":dict(Counter(x["tipo"] for x in warnings)),
            "matriz":findings}

def main():
    from google.cloud import firestore
    db=firestore.Client(project=PROJECT)
    if db.project!=PROJECT:raise RuntimeError("Projeto Firestore inesperado")
    matrix=json.loads(MATRIX.read_text(encoding="utf-8"))
    snap={c:[{"id":d.id,"data":d.to_dict() or {}} for d in db.collection(c).stream()]
          for c in (*COLS,"subconjuntosEnfermagem")}
    report=examine(matrix,snap)
    OUT.mkdir(parents=True,exist_ok=True,mode=0o700);os.chmod(OUT,0o700)
    filename="cobertura_protocolos_8v_"+datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S_%f")+".json"
    path=OUT/filename
    fd=os.open(path,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
    with os.fdopen(fd,"w",encoding="utf-8") as f:
        json.dump(report,f,ensure_ascii=False,indent=2,default=str)
    print("AUDITORIA EXPLORATORIA, SOMENTE LEITURA")
    print("Registros:",report["contagemFirestore"])
    print("Candidatos dos 8 protocolos:",report["totalCandidatos"])
    print("Correspondencias:",report["resumoCorrespondencias"])
    print("Alertas:",report["alertasPorTipo"])
    print("SEM CORRESPONDENCIA NOMINAL (nao significa ausencia definitiva):")
    for item in report["matriz"]:
        if item["situacao"]=="SEM_CORRESPONDENCIA_NOMINAL":
            print(" -",item["categoria"],item["conceito"])
    print("FREQUENCIA CARDIACA — ATENCAO A FAIXAS PEDIATRICAS:")
    for item in report["matriz"]:
        if item["conceito"]=="Frequência cardíaca":
            print(json.dumps(item["possiveisRegistros"],ensure_ascii=False))
    print("Vol. 5 p. 11: faixas por idade; Vol. 7 p. 22: limiares de triagem (nao misturar).")
    print("RELATORIO:",path)
    print("Nenhuma escrita efetuada; sem acesso a pacientes, usuarios, diagnosticos.")

if __name__=="__main__":
    main()
