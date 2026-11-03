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
    (
        "portal-historia-indicadores-legais-20261103",
        "Nossa História restaurada e indicadores do portal aprimorados",
        "A página pública Nossa História foi recuperada com linha do tempo e gestão de acontecimentos "
        "para administradores, preservando a coleção antiga de eventos. O painel inicial passou a "
        "exibir quatro indicadores de mesmo tamanho, números maiores e tempo de uso em uma linha. "
        "Os modelos iniciais de Termos de Uso e Política de Privacidade foram atualizados para "
        "facilitar sua revisão pela equipe, sem publicação automática.",
    ),
    (
        "historias-portal-perfil-publicacao-20261103",
        "História do Portal recuperada, perfil acessível e pendências jurídicas detalhadas",
        "Nossa História passou a ler a coleção original historiasPortal, com meses de referência, "
        "autoria e curtidas preservadas. A leitura agora exige conta aprovada porque os registros "
        "contêm UIDs de usuários; administradores mantêm a edição. O cabeçalho oferece consulta "
        "dos dados cadastrais e atualização segura do endereço. Documentos Legais passaram a "
        "identificar o trecho exato que impede a publicação da minuta.",
    ),
    (
        "revisao-cadastral-residentes-documentos-20261103",
        "Revisão de dados profissionais e acompanhamento de residentes",
        "A gestão de usuários ganhou fila exclusiva para alterações profissionais submetidas "
        "à aprovação ou recusa justificada, com suspensão da conta durante a avaliação. "
        "O painel identifica residentes que atingiram dois anos desde o início, sem revogação "
        "automática. O perfil permite manutenção de dados pessoais, autenticação e senha. "
        "O editor dos documentos legais passou a comparar o conteúdo sem depender da ordem "
        "dos campos no Firestore.",
    ),
    (
        "revisao-residentes-decisao-20261103",
        "Revisão de residentes com conversão, revogação e prorrogação",
        "A Gestão de Usuários passou a oferecer três decisões para residentes ativos "
        "após o biênio: converter o perfil para Enfermeiro com revisão do vínculo SMS, "
        "revogar o acesso com justificativa padronizada ou prorrogar a residência "
        "por um período em dias corridos. As decisões ficam registradas para auditoria, "
        "sem eliminar históricos clínicos. O Dashboard passou a sinalizar as revisões "
        "pendentes, inclusive após novas prorrogações.",
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
