#!/usr/bin/env python3
"""Auditoria AGREGADA, estritamente somente leitura, de perfis legados do CSAE.

Não imprime nomes, emails, CPFs, endereços, UIDs nem IDs de documentos.
Utiliza Google Application Default Credentials no Cloud Shell autenticado.
"""
import re
from collections import Counter, defaultdict
from google.cloud import firestore

PROJECT = "csaefloripa"
FIELDS = {
    "uid", "email", "dadosPessoais", "dadosProfissionais", "termoResponsabilidadeAceito",
    "termoResponsabilidadeData", "ehAdmin", "gestorConteudos", "tipoUsuario",
    "statusAcesso", "dataCadastro", "paginasPermitidas", "totalAcessos",
    "ultimoAcesso", "historicoAcesso", "dataAprovacao", "dataRecusa",
    "dataRecusaAcesso", "dataLiberacaoAcesso", "motivoRecusa", "dataRevogacao",
    "revogadoPorUid", "dataRestauracao", "dataAtualizacaoPrivilegios",
    "alteracaoCadastralPendente", "dataAlteracaoCadastral",
    "dadosProfissionaisAnteriores", "justificativaRecusaAlteracao",
}
PAGES = {
    "ProcessoEnfermagem", "GestaoConteudos", "GestaoUsuarios",
    "PainelEstatistico", "GestaoSuporte",
}
SIMPLE = re.compile(r"^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9 _./-]{0,63}$")

def safe_label(value):
    if isinstance(value, str) and SIMPLE.fullmatch(value) and "@" not in value:
        return value
    if isinstance(value, str):
        return f"<valor não exibido; tamanho={len(value)}>"
    return f"<tipo={type(value).__name__}>"

def show_counts(title, c):
    print(f"\n{title}:")
    for key, count in c.most_common():
        print(f"  {safe_label(key)}: {count}")
    if not c:
        print("  nenhum")

def run():
    db = firestore.Client(project=PROJECT)
    docs = list(db.collection("usuarios").stream())
    ids = {d.id for d in docs}
    per_uid = defaultdict(list)
    extra_fields, page_values, invalid_page_types = Counter(), Counter(), Counter()
    stats = Counter()
    mismatched_ids = set()
    for snap in docs:
        data = snap.to_dict() or {}
        uid = data.get("uid")
        if not isinstance(uid, str) or not uid.strip():
            stats["UID ausente ou inválido"] += 1
        else:
            per_uid[uid].append(snap.id)
        for key in data.keys() - FIELDS:
            extra_fields[key] += 1
        pages = data.get("paginasPermitidas")
        if pages is not None:
            if isinstance(pages, list):
                for page in pages:
                    if isinstance(page, str) and page not in PAGES:
                        page_values[page] += 1
                    elif not isinstance(page, str):
                        invalid_page_types[type(page).__name__] += 1
                if len(pages) > 12:
                    stats["Lista de páginas maior que 12"] += 1
            else:
                invalid_page_types[type(pages).__name__] += 1
        if snap.id != uid:
            mismatched_ids.add(snap.id)
            stats["ID Firestore divergente do UID"] += 1
            if isinstance(uid, str) and uid in ids:
                stats["UID canônico já ocupado por outro documento"] += 1
            if data.get("ehAdmin") is True:
                stats["Divergente com privilégio de administrador"] += 1
            if data.get("statusAcesso") in ["Liberado", "Aprovado"]:
                stats["Divergente com acesso liberado"] += 1
    stats["UIDs presentes em mais de um documento"] = sum(
        1 for value in per_uid.values() if len(value) > 1
    )
    stats["Perfis inspecionados"] = len(docs)
    stats["UIDs únicos com formato textual"] = len(per_uid)
    # Apenas contagem; nenhum prontuário é impresso nem alterado.
    patient_references = 0
    for patient in db.collection("pacientesProcessoEnfermagem").stream():
        value = (patient.to_dict() or {}).get("idUsuario")
        if value in mismatched_ids:
            patient_references += 1
    stats["Pacientes com referência idUsuario ao documento legado"] = patient_references
    print("CSAE — auditoria agregada de compatibilidade, SOMENTE LEITURA")
    print("Projeto csaefloripa; nenhuma gravação, exportação de usuários ou alteração de permissão")
    show_counts("Contagens e colisões", stats)
    show_counts("NOMES de campos extras no topo do documento (não seus valores)", extra_fields)
    show_counts("IDs de páginas legadas fora da lista atual (não há dados pessoais)", page_values)
    show_counts("Valores não-textuais / formatos inesperados de paginasPermitidas", invalid_page_types)
    print("\nPRÓXIMO PASSO: compartilhar apenas as contagens acima; não enviar dados pessoais.")

if __name__ == "__main__":
    run()
