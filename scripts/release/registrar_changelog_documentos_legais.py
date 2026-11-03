#!/usr/bin/env python3
"""Registro administrativo idempotente: executar autenticado no Google Cloud Shell."""
from google.api_core.exceptions import AlreadyExists
from google.cloud import firestore

PROJECT = "csaefloripa"
ENTRIES = (
    (
        "gestao-documentos-legais-20261103",
        "Consulta e gestão de versões dos documentos legais",
        "Preparamos os modais de Termos de Uso e Política de Privacidade e uma área administrativa "
        "para criar, revisar, consultar histórico e publicar versões dos documentos. "
        "Enquanto não houver versão aprovada, os modais informam que o documento oficial não foi "
        "publicado. O Termo de Responsabilidade e Sigilo do cadastro foi preservado.",
    ),
    (
        "dashboard-grade-aplicativos-20261103",
        "Dashboard com navegação em grade e melhor aproveitamento da tela",
        "O Dashboard agora utiliza a largura disponível e apresenta as ferramentas em uma grade "
        "de aplicativos com ícones, títulos e descrições. Em computadores, mantém 60% do espaço "
        "para ferramentas e 40% para atualizações; em telas pequenas, adapta as seções automaticamente. "
        "Permissões dos módulos e notificações foram preservadas.",
    ),
)

def main() -> None:
    client = firestore.Client(project=PROJECT)
    if client.project != PROJECT:
        raise RuntimeError("Projeto de destino incorreto. Nenhuma escrita realizada.")
    for doc_id, title, description in ENTRIES:
        ref = client.collection("changelogs").document(doc_id)
        try:
            ref.create({"titulo": title, "descricao": description, "dataHora": firestore.SERVER_TIMESTAMP})
            print(f"Changelog criado em {PROJECT}/changelogs/{doc_id}.")
        except AlreadyExists:
            current = (ref.get().to_dict() or {})
            if current.get("titulo") != title or current.get("descricao") != description:
                raise RuntimeError(f"Registro {doc_id} já existe com conteúdo divergente; revisar.")
            print(f"Registro idêntico já existente: {doc_id}; nenhum dado alterado.")

if __name__ == "__main__":
    main()
