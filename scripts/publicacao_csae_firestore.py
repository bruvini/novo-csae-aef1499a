#!/usr/bin/env python3
"""Preflight seguro e finalização idempotente do deploy CSAE; requer ADC no Cloud Shell."""
import argparse
import sys
import unicodedata
from collections import Counter

from google.cloud import firestore
from google.cloud.firestore_v1.base_query import FieldFilter

PROJECT = "csaefloripa"
EXAM_ID = "ygN3AA8HKdHAz89F1Fdn"
REQUIRED_PROFILE = {
    "uid", "email", "dadosPessoais", "dadosProfissionais",
    "termoResponsabilidadeAceito", "termoResponsabilidadeData",
    "ehAdmin", "gestorConteudos", "tipoUsuario", "statusAcesso", "dataCadastro",
}
OPTIONAL_PROFILE = {
    "paginasPermitidas", "totalAcessos", "ultimoAcesso", "historicoAcesso",
    "dataAprovacao", "dataRecusa", "dataRecusaAcesso", "dataLiberacaoAcesso",
    "motivoRecusa", "dataRevogacao", "revogadoPorUid", "dataRestauracao",
    "dataAtualizacaoPrivilegios", "alteracaoCadastralPendente",
    "dataAlteracaoCadastral", "dadosProfissionaisAnteriores",
    "justificativaRecusaAlteracao", "versaoPermissoes", "historicoRevisoes",
    "analisadoPor", "analisadoPorUid", "dataAtualizacaoDadosPessoais",
}
REQUIRED_PERSONAL = {
    "nomeCompleto", "rg", "cpf", "rua", "numero", "bairro",
    "cidade", "uf", "cep",
}
OPTIONAL_PROFESSIONAL = {
    "formacao", "atuaSMS", "numeroCoren", "ufCoren", "dataInicioResidencia",
    "iesEnfermagem", "lotacao", "matricula", "cidadeTrabalho", "localCargo",
}
ALLOWED_STATUS = {
    "Aguardando", "Liberado", "Aprovado", "Recusado", "Rejeitado",
    "Revogado", "AguardandoRevisaoCadastro",
}
ALLOWED_PAGES = {
    "ProcessoEnfermagem", "GestaoConteudos", "GestaoUsuarios",
    "PainelEstatistico", "GestaoSuporte", "Dashboard", "CentralAjuda",
}

UPDATES = (
    (
        "Avaliação de Enfermagem aprimorada",
        "Melhoramos o preenchimento da Avaliação de Enfermagem! Agora, sinais vitais e achados "
        "da Revisão de Sistemas são reconhecidos corretamente. Também ficou mais fácil "
        "identificar informações pendentes antes de avançar para o Diagnóstico.",
    ),
    (
        "Resultados dos exames mais claros",
        "Aprimoramos a apresentação dos exames no Processo de Enfermagem. Testes laboratoriais, "
        "como os de sífilis, aparecem com a identificação correta, e a titulação do VDRL "
        "é apresentada quando registrada.",
    ),
    (
        "Cadastro de profissionais mais confiável",
        "Melhoramos o cadastro de novos profissionais! O Portal agora confirma o envio "
        "das informações com mais segurança, orienta quando ocorre alguma dificuldade "
        "e facilita a análise das solicitações pela equipe responsável.",
    ),
    (
        "Filtros de produção e tempo de uso restaurados",
        "O Painel Estatístico voltou a oferecer filtros por unidade, profissional "
        "e datas inicial e final, além da exportação em Excel. O painel inicial "
        "também voltou a mostrar o tempo registrado no Processo de Enfermagem.",
    ),
)


def without_accents(text):
    return "".join(
        letter for letter in unicodedata.normalize("NFKD", text.casefold())
        if not unicodedata.combining(letter)
    )


def check_profiles(client):
    counts = Counter()
    total = 0
    for snap in client.collection("usuarios").stream():
        total += 1
        data = snap.to_dict() or {}
        if snap.id != data.get("uid"):
            counts["ID do documento diferente do UID (login pode falhar)"] += 1
        if REQUIRED_PROFILE - set(data):
            counts["perfil sem campos obrigatórios das regras novas"] += 1
        if set(data) - REQUIRED_PROFILE - OPTIONAL_PROFILE:
            counts["perfil com campos não previstos nas regras novas"] += 1
        personal = data.get("dadosPessoais")
        if not isinstance(personal, dict) or set(personal) != REQUIRED_PERSONAL:
            counts["dados pessoais incompatíveis com regras novas"] += 1
        prof = data.get("dadosProfissionais")
        if (not isinstance(prof, dict)
            or not {"formacao", "atuaSMS"} <= set(prof)
            or set(prof) - OPTIONAL_PROFESSIONAL):
            counts["dados profissionais incompatíveis com regras novas"] += 1
        if data.get("statusAcesso") not in ALLOWED_STATUS:
            counts["status de acesso incompatível"] += 1
        pages = data.get("paginasPermitidas", [])
        if not isinstance(pages, list) or len(pages) > 12 or set(pages) - ALLOWED_PAGES:
            counts["páginas permitidas incompatíveis"] += 1

    print(f"Perfis examinados: {total}. Problemas de compatibilidade (somente contagens):")
    for reason, amount in sorted(counts.items()):
        print(f"  {reason}: {amount}")
    if total == 0 or counts:
        print("BLOQUEADO: revisar compatibilidade dos dados legados antes de publicar regras.", file=sys.stderr)
        return 2
    print("Preflight dos perfis aprovado. Nenhuma informação pessoal foi impressa.")
    return 0


def finish(client):
    doc = client.collection("ExamesLabImagem").document(EXAM_ID)
    snap = doc.get()
    if not snap.exists:
        raise RuntimeError("Documento específico de sífilis não encontrado. Sem escrita de changelog.")
    data = snap.to_dict() or {}
    name = without_accents(str(data.get("nomeExame", "")))
    current = data.get("tipoExame")
    if "sifil" not in name or "vdrl" not in name or current not in {"Imagem", "Laboratorial"}:
        raise RuntimeError("Exame/categoria não corresponde ao esperado. Não alterar sem revisão.")
    if current == "Imagem":
        doc.update(
            {"tipoExame": "Laboratorial"},
            option=client.write_option(last_update_time=snap.update_time),
        )
        print("Classificação do exame corrigida (somente tipoExame).")
    else:
        print("Classificação do exame já está correta; nenhuma mudança necessária.")

    changelogs = client.collection("changelogs")
    for title, description in UPDATES:
        already = list(
            changelogs.where(filter=FieldFilter("titulo", "==", title)).limit(1).stream()
        )
        if already:
            print(f"Changelog já existente, mantido: {title}")
            continue
        changelogs.add({
            "titulo": title,
            "descricao": description,
            "dataHora": firestore.SERVER_TIMESTAMP,
        })
        print(f"Changelog registrado: {title}")

    print("Finalização concluída. Confira as três notícias no Dashboard.")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=("preflight", "finish"))
    args = parser.parse_args()
    try:
        client = firestore.Client(project=PROJECT)
        if args.action == "preflight":
            sys.exit(check_profiles(client))
        finish(client)
    except Exception as error:
        print(f"Falha {args.action}: {type(error).__name__}: {error}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
