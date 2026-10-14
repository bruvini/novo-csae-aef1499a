#!/usr/bin/env python3
"""Publica changelog idempotente; somente a coleção changelogs é acessada."""
from google.cloud import firestore
from google.cloud.firestore_v1.base_query import FieldFilter

PROJECT = "csaefloripa"
DOC_ID = "indicadores-suporte-sugestoes-clinicas-20261014"
TITULO = "Indicadores Administrativos e Sugestões Clínicas Mais Organizadas"
DESCRICAO = (
    "As telas de Gestão de Suporte e Gestão de Usuários agora apresentam painéis "
    "com quantitativos e tempos médios calculados a partir dos registros disponíveis. "
    "Quando uma data necessária não está registrada, o tempo aparece como não disponível. "
    "Também ampliamos a aba Sugerir Melhoria: agora você pode propor diagnósticos, "
    "resultados esperados, intervenções e parâmetros de exame físico. Todas as propostas "
    "clínicas serão avaliadas pela CSAE conforme os protocolos municipais e as atribuições profissionais."
)

def main():
    db = firestore.Client(project=PROJECT)
    if db.project != PROJECT:
        raise RuntimeError("Projeto divergente; nenhuma escrita.")
    ref = db.collection("changelogs")
    existing = list(ref.where(filter=FieldFilter("titulo", "==", TITULO)).limit(1).stream())
    if existing:
        print("CHANGELOG JÁ EXISTE:", existing[0].id)
        return
    item = ref.document(DOC_ID)
    if item.get().exists:
        raise RuntimeError("ID ocupado: revisar manualmente sem sobrescrever.")
    try:
        item.create({"titulo": TITULO, "descricao": DESCRICAO,
                     "dataHora": firestore.SERVER_TIMESTAMP})
    except Exception:
        if item.get().exists:
            print("CHANGELOG JÁ INSERIDO POR OUTRA SESSÃO")
            return
        raise
    print("CHANGELOG PUBLICADO:", TITULO)

if __name__ == "__main__":
    main()
