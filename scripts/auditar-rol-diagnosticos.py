#!/usr/bin/env python3
"""CSAE: auditoria EXCLUSIVA do rol diagnóstico, em modo somente leitura.

Executar no Cloud Shell autenticado:
  .venv-csae-release/bin/python scripts/auditar-rol-diagnosticos.py

Não acessa usuários, pacientes ou processos. Não altera o Firestore.
Relatório privado em ~/csae-auditoria-clinica/rol_diagnosticos_*.json.
"""
import json
import os
import re
import unicodedata
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from google.cloud import firestore

PROJECT_ID = "csaefloripa"
DESTINATION = Path.home() / "csae-auditoria-clinica"


def texto(value):
    return value.strip() if isinstance(value, str) else ""


def objetos(value):
    return [x for x in value if isinstance(x, dict)] if isinstance(value, list) else []


def normalizar(value):
    stripped = unicodedata.normalize("NFKD", texto(value).casefold())
    ascii_text = "".join(c for c in stripped if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", " ", ascii_text).strip()


def diagnostico(doc):
    data = doc.to_dict() or {}
    resultados = []
    for r in objetos(data.get("resultadosEsperados")):
        intervencoes = []
        for i in objetos(r.get("intervencoes")):
            intervencoes.append({
                "acaoEnfermeiro": texto(i.get("acaoEnfermeiro")),
                "acaoPrescrita": texto(i.get("acaoPrescrita")),
                "materiaisDeApoio": [{
                    "tituloMaterialApoio": texto(m.get("tituloMaterialApoio")),
                    "urlMaterialApoio": texto(m.get("urlMaterialApoio")),
                } for m in objetos(i.get("materiaisDeApoio"))],
            })
        resultados.append({
            "tituloResultado": texto(r.get("tituloResultado")),
            "descricaoResultado": texto(r.get("descricaoResultado")),
            "intervencoes": intervencoes,
        })
    return {
        "id": doc.id,
        "tituloDiagnostico": texto(data.get("tituloDiagnostico")),
        "descricaoDiagnostico": texto(data.get("descricaoDiagnostico")),
        "subconjuntos": [{
            "tipoSubconjunto": texto(s.get("tipoSubconjunto")),
            "tituloSubconjunto": texto(s.get("tituloSubconjunto")),
        } for s in objetos(data.get("subconjuntos"))],
        "resultadosEsperados": resultados,
    }


def executar():
    db = firestore.Client(project=PROJECT_ID)
    if db.project != PROJECT_ID:
        raise RuntimeError("Projeto inesperado; auditoria cancelada.")

    rol = [diagnostico(x) for x in db.collection("rolEnfermagem").stream()]
    subs = [{
        "id": snap.id,
        "tipoSubconjunto": texto((snap.to_dict() or {}).get("tipoSubconjunto")),
        "tituloSubconjunto": texto((snap.to_dict() or {}).get("tituloSubconjunto")),
    } for snap in db.collection("subconjuntosEnfermagem").stream()]

    nomes = Counter(normalizar(d["tituloDiagnostico"]) for d in rol)
    nomes.pop("", None)
    nhbs = {normalizar(s["tituloSubconjunto"]) for s in subs
            if normalizar(s["tipoSubconjunto"]) == "nhb"}
    alertas = {
        "titulosDuplicados": [{
            "nomeNormalizado": nome,
            "ids": [d["id"] for d in rol if normalizar(d["tituloDiagnostico"]) == nome],
        } for nome, n in sorted(nomes.items()) if n > 1],
        "semTitulo": [d["id"] for d in rol if not normalizar(d["tituloDiagnostico"])],
        "semNHB": [d["id"] for d in rol if not any(
            normalizar(s["tipoSubconjunto"]) == "nhb" for s in d["subconjuntos"]
        )],
        "vinculosNHBNaoLocalizados": [{
            "diagnosticoId": d["id"],
            "nhb": s["tituloSubconjunto"],
        } for d in rol for s in d["subconjuntos"]
            if normalizar(s["tipoSubconjunto"]) == "nhb"
            and normalizar(s["tituloSubconjunto"]) not in nhbs],
        "semResultadosEsperados": [d["id"] for d in rol if not d["resultadosEsperados"]],
    }
    result = {
        "projeto": PROJECT_ID,
        "modo": "somente_leitura",
        "geradoEmUTC": datetime.now(timezone.utc).isoformat(),
        "colecoes": {"rolEnfermagem": rol, "subconjuntosEnfermagem": subs},
        "contagens": {
            "diagnosticos": len(rol),
            "subconjuntos": len(subs),
            "resultadosEsperadosVinculados": sum(len(d["resultadosEsperados"]) for d in rol),
            "intervencoesVinculadas": sum(len(r["intervencoes"])
                                         for d in rol for r in d["resultadosEsperados"]),
        },
        "alertas": alertas,
    }

    DESTINATION.mkdir(mode=0o700, parents=True, exist_ok=True)
    os.chmod(DESTINATION, 0o700)
    dst = DESTINATION / ("rol_diagnosticos_" + datetime.now(timezone.utc)
                         .strftime("%Y%m%d_%H%M%S") + ".json")
    fd = os.open(dst, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as fh:
        json.dump(result, fh, indent=2, ensure_ascii=False)
        fh.write("\n")
    print("CSAE: ROL DIAGNÓSTICO — SOMENTE LEITURA; NENHUM DADO ALTERADO.")
    for key, value in result["contagens"].items():
        print(f"{key}: {value}")
    for key, value in alertas.items():
        print(f"{key}: {len(value)}")
    print("Arquivo privado:", dst)
    print("Não foram acessados profissionais, usuários, pacientes ou processos.")


if __name__ == "__main__":
    executar()
