#!/usr/bin/env python3
"""Registro administrativo idempotente: executar autenticado no Google Cloud Shell."""
from google.api_core.exceptions import AlreadyExists
from google.cloud import firestore

PROJECT = "csaefloripa"
DOC_ID = "gestao-documentos-legais-20261103"
TITLE = "Consulta e gestão de versões dos documentos legais"
DESCRIPTION = (
    "Preparamos os modais de Termos de Uso e Política de Privacidade e uma área administrativa "
    "para criar, revisar, consultar histórico e publicar versões dos documentos. "
    "Enquanto não houver versão aprovada, os modais informam que o documento oficial não foi "
    "publicado. O Termo de Responsabilidade e Sigilo do cadastro foi preservado."
)

def main() -> None:
    client = firestore.Client(project=PROJECT)
    if client.project != PROJECT:
        raise RuntimeError("Projeto de destino incorreto. Nenhuma escrita realizada.")
    ref = client.collection("changelogs").document(DOC_ID)
    try:
        ref.create({"titulo": TITLE, "descricao": DESCRIPTION, "dataHora": firestore.SERVER_TIMESTAMP})
        print(f"Changelog criado em {PROJECT}/changelogs/{DOC_ID}.")
    except AlreadyExists:
        current = (ref.get().to_dict() or {})
        if current.get("titulo") != TITLE or current.get("descricao") != DESCRIPTION:
            raise RuntimeError("Já existe registro com ID igual mas conteúdo divergente. Exige revisão.")
        print("Changelog idêntico já existente; nenhum dado foi alterado.")

if __name__ == "__main__":
    main()
