#!/usr/bin/env python3
"""Exporta SOMENTE catálogo clínico e nomes das NHBs para conciliação dos 8 volumes.

Leituras: SinaisVitais, ExamesLabImagem, RevisaoSistemas, subconjuntosEnfermagem.
NÃO consulta pacientes, usuários, processos nem diagnósticos.
NÃO grava no Firestore. A saída JSON local tem permissão 0600.
O inventário preserva valores, unidades, contexto e achados para revisão humana.
"""
import json
import os
import re
import unicodedata
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

PROJECT = "csaefloripa"
OUT = Path.home() / "csae-auditoria-clinica"
REF_FIELDS = (
    "idadeMinima", "idadeMaxima", "idadeUnidade", "criterioSexo",
    "criterioCondicao", "contextoClinico", "interpretacaoClinica",
    "valorMinimo", "valorMaximo", "nomeAlteracao",
    "subconjuntoNHBVinculado", "resultadoClassificatorio",
    "permiteValorTexto", "rotuloValorTexto", "valorTextoObrigatorio",
    "tipoValorTexto", "opcoesValorTexto",
)
OPTION_FIELDS = (
    "textoOpcao", "ehAlteracao", "nomeAlteracao", "subconjuntoNHBVinculado",
    "exigeDescricao",
)
FINDING_FIELDS = (
    "idadeMinima", "idadeMaxima", "idadeUnidade", "criterioSexo",
    "descricaoAchado", "ehAlteracao", "nomeAlteracao",
    "subconjuntoNHBVinculado", "dicaAchado", "exigeDescricao", "tipoAchado",
)

def normalizar(value):
    value = unicodedata.normalize("NFD", str(value or "").casefold())
    return re.sub(r"[^a-z0-9]+", " ", "".join(
        c for c in value if not unicodedata.combining(c))).strip()

def pick(value, keys):
    if not isinstance(value, dict):
        return {}
    # Whitelist estrita: não exporta metadados pessoais ou campos arbitrários.
    return {key: value[key] for key in keys if key in value}

def objects(value):
    return [x for x in value if isinstance(x, dict)] if isinstance(value, list) else []

def vital(doc_id, data):
    return {
        "id": doc_id,
        **pick(data, ("sinalVitalNome", "sinalVitalDescricao", "unidadeMedida")),
        "valoresDeReferencia": [pick(x, REF_FIELDS) for x in objects(
            data.get("valoresDeReferencia"))],
    }

def exame(doc_id, data):
    return {
        "id": doc_id,
        **pick(data, ("nomeExame", "descricaoExame", "tipoExame")),
        "componentes": [
            {**pick(c, ("componenteAnalisado", "unidadeMedida")),
             "resultados": [pick(r, REF_FIELDS) for r in objects(c.get("resultados"))]}
            for c in objects(data.get("componentes"))
        ],
    }

def sistema(doc_id, data):
    return {
        "id": doc_id,
        **pick(data, ("nomeSistema", "descricaoSistema")),
        "exames": [
            {**pick(e, ("nomeExame", "propedeutica")),
             "achados": [
                 {**pick(a, FINDING_FIELDS),
                  "opcoes": [pick(o, OPTION_FIELDS) for o in objects(a.get("opcoes"))]}
                 for a in objects(e.get("achados"))
             ]}
            for e in objects(data.get("exames"))
        ],
    }

def nhb(doc_id, data):
    return {"id": doc_id, **pick(data, ("tituloSubconjunto", "tipoSubconjunto"))}

def resumo(data):
    vitals = data["SinaisVitais"]
    exames = data["ExamesLabImagem"]
    sistemas = data["RevisaoSistemas"]
    fisicos = [e for s in sistemas for e in s["exames"]]
    achados = [a for e in fisicos for a in e["achados"]]
    referencias = [r for v in vitals for r in v["valoresDeReferencia"]]
    referencias += [r for e in exames for c in e["componentes"] for r in c["resultados"]]
    total_componentes = sum(len(e["componentes"]) for e in exames)
    return {
        "documentosSinaisVitais": len(vitals),
        "documentosExamesLabImagem": len(exames),
        "documentosRevisaoSistemas": len(sistemas),
        "componentesDeExames": total_componentes,
        "regrasNumericasOuClassificatorias": len(referencias),
        "examesFisicosAninhados": len(fisicos),
        "achadosFisicos": len(achados),
        "opcoesDeAchados": sum(len(a["opcoes"]) for a in achados),
        "nhbsCadastradas": len(data["nhbs"]),
    }

def montar(snapshot):
    result = {
        "SinaisVitais": [vital(x["id"], x["data"]) for x in snapshot["SinaisVitais"]],
        "ExamesLabImagem": [exame(x["id"], x["data"]) for x in snapshot["ExamesLabImagem"]],
        "RevisaoSistemas": [sistema(x["id"], x["data"]) for x in snapshot["RevisaoSistemas"]],
        "nhbs": [nhb(x["id"], x["data"]) for x in snapshot["subconjuntosEnfermagem"]
                 if normalizar(x["data"].get("tipoSubconjunto")) == "nhb"],
    }
    return {"projeto": PROJECT,
            "geradoEmUTC": datetime.now(timezone.utc).isoformat(),
            "modo": "INVENTARIO_SOMENTE_LEITURA",
            "objetivo": "Conciliação com protocolos 1–8, sem aprovação automática de referências",
            "resumo": resumo(result),
            "catalogo": result}

def gravar_privado(data):
    OUT.mkdir(parents=True, exist_ok=True, mode=0o700)
    os.chmod(OUT, 0o700)
    path = OUT / ("inventario_clinico_completo_8v_" +
        datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S_%f") + ".json")
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False, default=str)
        f.write("\n")
    return path

def main():
    from google.cloud import firestore
    db = firestore.Client(project=PROJECT)
    if db.project != PROJECT:
        raise RuntimeError("Projeto Firebase inesperado")
    collections = ("SinaisVitais", "ExamesLabImagem", "RevisaoSistemas",
                   "subconjuntosEnfermagem")
    snapshot = {
        name: [{"id": doc.id, "data": doc.to_dict() or {}}
               for doc in db.collection(name).stream()]
        for name in collections
    }
    report = montar(snapshot)
    path = gravar_privado(report)
    print("INVENTÁRIO CLÍNICO COMPLETO — SOMENTE LEITURA")
    print(json.dumps(report["resumo"], indent=2, ensure_ascii=False))
    print("RELATORIO_JSON:", path)
    print("Sem leitura de pacientes, usuários, processos ou diagnósticos.")
    print("Nenhuma escrita efetuada no Firestore.")

if __name__ == "__main__":
    main()
