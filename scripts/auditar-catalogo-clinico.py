#!/usr/bin/env python3
"""CSAE Floripa: inventário clínico SOMENTE LEITURA.

Executar no Cloud Shell após autenticação ADC:
  .venv-csae-release/bin/python scripts/auditar-catalogo-clinico.py

Lê exclusivamente coleções de CATÁLOGO, sem dados de usuários/pacientes.
Salva JSON em ~/csae-auditoria-clinica/ com permissão privada.
NUNCA escreve, altera, exclui ou aprova conteúdo no Firebase.
"""
import json
import os
import re
import unicodedata
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from google.cloud import firestore

PROJECT = "csaefloripa"
COLLECTIONS = (
    "SinaisVitais", "RevisaoSistemas", "ExamesLabImagem",
    "rolEnfermagem", "diagnosticosEnfermagem", "subconjuntosEnfermagem",
)
OUT = Path.home() / "csae-auditoria-clinica"

def norm(v):
    if not isinstance(v, str):
        return ""
    v = "".join(x for x in unicodedata.normalize("NFKD", v.casefold())
                if not unicodedata.combining(x))
    return re.sub(r"[^a-z0-9]+", " ", v).strip()

def string(v):
    return v.strip() if isinstance(v, str) else ""

def objects(v):
    return [x for x in v if isinstance(x, dict)] if isinstance(v, list) else []

def vital(doc_id, d):
    return {
        "id": doc_id, "nome": string(d.get("sinalVitalNome")),
        "unidade": string(d.get("unidadeMedida")),
        "descricao": string(d.get("sinalVitalDescricao")),
        "referencias": [{
            "idadeMinima": r.get("idadeMinima"),
            "idadeMaxima": r.get("idadeMaxima"),
            "idadeUnidade": string(r.get("idadeUnidade")),
            "sexo": string(r.get("criterioSexo")),
            "condicao": string(r.get("criterioCondicao")),
            "valorMinimo": r.get("valorMinimo"),
            "valorMaximo": r.get("valorMaximo"),
            "alteracao": string(r.get("nomeAlteracao")),
            "nhb": string(r.get("subconjuntoNHBVinculado")),
        } for r in objects(d.get("valoresDeReferencia"))],
    }

def systems(doc_id, d):
    exames = []
    for exam in objects(d.get("exames")):
        achados = []
        for a in objects(exam.get("achados")):
            achados.append({
                "nome": string(a.get("descricaoAchado")),
                "idadeMinima": a.get("idadeMinima"),
                "idadeMaxima": a.get("idadeMaxima"),
                "idadeUnidade": string(a.get("idadeUnidade")),
                "sexo": string(a.get("criterioSexo")),
                "alteracao": string(a.get("nomeAlteracao")),
                "ehAlteracao": a.get("ehAlteracao"),
                "nhb": string(a.get("subconjuntoNHBVinculado")),
                "exigeDescricao": a.get("exigeDescricao"),
                "tipo": string(a.get("tipoAchado")),
                "opcoes": [{
                    "texto": string(o.get("textoOpcao")),
                    "alteracao": string(o.get("nomeAlteracao")),
                    "ehAlteracao": o.get("ehAlteracao"),
                    "nhb": string(o.get("subconjuntoNHBVinculado")),
                    "exigeDescricao": o.get("exigeDescricao"),
                } for o in objects(a.get("opcoes"))],
            })
        exames.append({
            "nome": string(exam.get("nomeExame")),
            "propedeutica": string(exam.get("propedeutica")),
            "achados": achados,
        })
    return {"id": doc_id, "nome": string(d.get("nomeSistema")), "exames": exames}

def exams(doc_id, d):
    components = []
    for c in objects(d.get("componentes")):
        results = []
        for r in objects(c.get("resultados")):
            results.append({
                "idadeMinima": r.get("idadeMinima"),
                "idadeMaxima": r.get("idadeMaxima"),
                "idadeUnidade": string(r.get("idadeUnidade")),
                "sexo": string(r.get("criterioSexo")),
                "valorMinimo": r.get("valorMinimo"),
                "valorMaximo": r.get("valorMaximo"),
                "resultadoClassificatorio": string(r.get("resultadoClassificatorio")),
                "nomeAlteracao": string(r.get("nomeAlteracao")),
                "nhb": string(r.get("subconjuntoNHBVinculado")),
                "permiteValorTexto": r.get("permiteValorTexto"),
                "tipoValorTexto": string(r.get("tipoValorTexto")),
                "opcoesValorTexto": [v for v in r.get("opcoesValorTexto", [])
                                     if isinstance(v, str)] if isinstance(r.get("opcoesValorTexto"), list) else [],
            })
        components.append({
            "nome": string(c.get("componenteAnalisado")),
            "unidade": string(c.get("unidadeMedida")),
            "resultados": results,
        })
    return {"id": doc_id, "nome": string(d.get("nomeExame")),
            "tipo": string(d.get("tipoExame")), "componentes": components}

def diagnostic(doc_id, d):
    subset = d.get("subconjuntos") if "subconjuntos" in d else d.get("subconjuntosVinculados")
    return {"id": doc_id, "nome": string(d.get("tituloDiagnostico")),
            "subconjuntos": [{
                "tipo": string(s.get("tipoSubconjunto")),
                "nome": string(s.get("tituloSubconjunto")),
            } for s in objects(subset)]}

def subset(doc_id, d):
    return {"id": doc_id, "nome": string(d.get("tituloSubconjunto")),
            "tipo": string(d.get("tipoSubconjunto")),
            "volumeProtocolo": d.get("volumeProtocolo"),
            "versaoProtocolo": d.get("versaoProtocolo")}

CONVERT = {
    "SinaisVitais": vital, "RevisaoSistemas": systems,
    "ExamesLabImagem": exams, "rolEnfermagem": diagnostic,
    "diagnosticosEnfermagem": diagnostic, "subconjuntosEnfermagem": subset,
}

def audit(data):
    same = defaultdict(list)
    shared_keys = defaultdict(list)
    review_keys = defaultdict(list)
    nhb_names = {norm(x["nome"]) for x in data["subconjuntosEnfermagem"]
                 if norm(x["tipo"]) == "nhb"}
    unresolved_nhbs = Counter()
    def check_nhb(value):
        if value and norm(value) not in nhb_names:
            unresolved_nhbs[value] += 1

    for col, rows in data.items():
        for row in rows:
            if norm(row["nome"]):
                same[(col, norm(row["nome"]))].append(row["id"])
            if col == "SinaisVitais":
                shared_keys[norm(row["nome"])].append("SinaisVitais/" + row["id"])
                for ref in row["referencias"]:
                    check_nhb(ref["nhb"])
            if col == "ExamesLabImagem":
                for c in row["componentes"]:
                    shared_keys[norm(c["nome"])].append("ExamesLabImagem/" + row["id"])
                    for r in c["resultados"]:
                        check_nhb(r["nhb"])
            if col == "RevisaoSistemas":
                for exam in row["exames"]:
                    review_keys[norm(exam["nome"])].append(row["id"])
                    for a in exam["achados"]:
                        check_nhb(a["nhb"])
                        for o in a["opcoes"]:
                            check_nhb(o["nhb"])

    return {
        "duplicadosPorNomeNormalizado": [
            {"colecao": c, "nome": n, "ids": ids}
            for (c, n), ids in same.items() if len(ids) > 1],
        "colisoesDeChaveNumerica": [
            {"chave": n, "referencias": ids}
            for n, ids in shared_keys.items() if n and len(ids) > 1],
        "colisoesDeChaveDeExameFisico": [
            {"chave": n, "idsSistemas": ids}
            for n, ids in review_keys.items() if n and len(ids) > 1],
        "vinculosNHBInexistentesOuDivergentes": [
            {"nhb": n, "ocorrencias": qty} for n, qty in unresolved_nhbs.items()],
        "registrosPressaoArterial": [
            x for x in data["SinaisVitais"]
            if any(w in norm(x["nome"]) for w in
                   ("pressao", "sistol", "diastol", " pas ", " pad "))],
    }

def main():
    client = firestore.Client(project=PROJECT)
    if client.project != PROJECT:
        raise RuntimeError("Projeto Firebase inesperado.")
    data = {}
    for col in COLLECTIONS:
        data[col] = [CONVERT[col](snap.id, snap.to_dict() or {})
                     for snap in client.collection(col).stream()]
    issues = audit(data)
    report = {
        "projeto": PROJECT,
        "geradoEmUTC": datetime.now(timezone.utc).isoformat(),
        "modo": "somente_leitura",
        "colecoes": data,
        "contagens": {c: len(rows) for c, rows in data.items()},
        "alertas": issues,
    }
    OUT.mkdir(mode=0o700, parents=True, exist_ok=True)
    os.chmod(OUT, 0o700)
    dst = OUT / ("inventario_clinico_" + datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S") + ".json")
    fd = os.open(dst, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2, default=str)
    print("CSAE: CATÁLOGO CLÍNICO, APENAS LEITURA. Nenhum dado alterado.")
    for c, n in report["contagens"].items():
        print(c + ":", n)
    for label in ("duplicadosPorNomeNormalizado", "colisoesDeChaveNumerica",
                  "colisoesDeChaveDeExameFisico", "vinculosNHBInexistentesOuDivergentes",
                  "registrosPressaoArterial"):
        print(label + ":", len(issues[label]))
    print("Arquivo:", dst)
    print("Não foram acessados usuários, pacientes, prontuários ou processos de enfermagem.")

if __name__ == "__main__":
    main()
