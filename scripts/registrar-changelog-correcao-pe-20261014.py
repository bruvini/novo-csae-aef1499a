#!/usr/bin/env python3
"""Registra uma única novidade no mural após a publicação do Hosting.

Não lê pacientes, tickets, diagnósticos ou processos assistenciais.
"""
from google.cloud import firestore
from google.cloud.firestore_v1.base_query import FieldFilter

PROJECT = "csaefloripa"
DOC_ID = "correcao-navegacao-pe-20261014"
TITULO = "Aprimoramento da Navegação entre Diagnóstico e Planejamento"
DESCRICAO = (
    "Aprimoramos a passagem entre as etapas do Processo de Enfermagem. "
    "Agora o Portal reconhece imediatamente os diagnósticos, resultados esperados "
    "e intervenções selecionados, evitando bloqueios indevidos. Também ajustamos "
    "o planejamento para preservar as escolhas e indicar com mais clareza quando "
    "ainda há algum campo obrigatório pendente. "
    "A atualização não altera os registros clínicos já salvos."
)


def main():
    db = firestore.Client(project=PROJECT)
    if db.project != PROJECT:
        raise RuntimeError("Projeto Firebase divergente. Nenhuma escrita efetuada.")
    collection = db.collection("changelogs")
    existing = list(collection.where(filter=FieldFilter("titulo", "==", TITULO)).limit(1).stream())
    if existing:
        print("CHANGELOG JÁ EXISTE:", existing[0].id)
        return
    ref = collection.document(DOC_ID)
    if ref.get().exists:
        raise RuntimeError("ID do changelog ocupado: conferir antes de gravar.")
    try:
        ref.create({
            "titulo": TITULO,
            "descricao": DESCRICAO,
            "dataHora": firestore.SERVER_TIMESTAMP,
        })
    except Exception:
        if ref.get().exists:
            print("CHANGELOG JÁ PUBLICADO POR OUTRA EXECUÇÃO:", DOC_ID)
            return
        raise
    salvo = ref.get()
    if not salvo.exists or (salvo.to_dict() or {}).get("titulo") != TITULO:
        raise RuntimeError("Changelog não confirmado.")
    print("CHANGELOG PUBLICADO:", TITULO)


if __name__ == "__main__":
    main()
