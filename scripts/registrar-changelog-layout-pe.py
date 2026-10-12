#!/usr/bin/env python3
"""Publica o changelog do layout do PE, sem consultar registros de pacientes.

Execução prevista SOMENTE após deploy do Hosting. Idempotente por título e ID.
Coleção: changelogs (titulo, descricao, dataHora). Projeto: csaefloripa.
"""
from google.cloud import firestore
from google.cloud.firestore_v1.base_query import FieldFilter

PROJECT = "csaefloripa"
DOC_ID = "pe-coluna-unica-introducao-compacta-20261012"
TITLE = "Mais Espaço para Indicadores e Pacientes no Processo de Enfermagem"
DESCRIPTION = (
    "A tela do Processo de Enfermagem ficou mais prática: as orientações iniciais foram "
    "reorganizadas em um painel compacto, sem perder os fundamentos e as cinco etapas. "
    "O Dashboard e a lista de pacientes voltaram a ocupar toda a largura disponível. "
    "A visualização se adapta automaticamente a computadores, tablets e celulares, "
    "sem alterar dados ou registros assistenciais."
)

def main() -> None:
    db = firestore.Client(project=PROJECT)
    if db.project != PROJECT:
        raise RuntimeError("Projeto Firebase incorreto; nenhuma escrita realizada.")
    changes = db.collection("changelogs")
    existing = list(changes.where(filter=FieldFilter("titulo", "==", TITLE)).limit(1).stream())
    if existing:
        print("CHANGELOG JA EXISTIA:", existing[0].id)
        return
    ref = changes.document(DOC_ID)
    if ref.get().exists:
        raise RuntimeError("ID de changelog ocupado por outra entrada; revisar sem sobrescrever.")
    try:
        ref.create({
            "titulo": TITLE,
            "descricao": DESCRIPTION,
            "dataHora": firestore.SERVER_TIMESTAMP,
        })
    except Exception:
        # Em publicação concorrente, não criar uma segunda entrada.
        if ref.get().exists:
            print("CHANGELOG JA INSERIDO EM PUBLICACAO CONCORRENTE:", DOC_ID)
            return
        raise
    after = ref.get()
    if not after.exists or (after.to_dict() or {}).get("titulo") != TITLE:
        raise RuntimeError("Changelog não confirmado; verificar a coleção.")
    print("CHANGELOG PUBLICADO:", TITLE, "| id:", DOC_ID)

if __name__ == "__main__":
    main()
