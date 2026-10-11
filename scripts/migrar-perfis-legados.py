#!/usr/bin/env python3
"""Migração explícita, conservadora e idempotente dos documentos legados usuarios/{id}.

Não altera Firebase Auth, permissões, históricos, pacientes ou dados de perfil.
Cada documento é movido atomicamente de seu ID legado para usuarios/{uid}.
Requer ADC autorizado no Cloud Shell. Não publica regras ou Hosting.

Uso:
  python scripts/migrar-perfis-legados.py plan
  python scripts/migrar-perfis-legados.py apply --expected 42 --confirm "MIGRAR 42 PERFIS"
  python scripts/migrar-perfis-legados.py verify
"""
import argparse
import json
import os
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from google.cloud import firestore

PROJECT = "csaefloripa"
COLLECTION = "usuarios"
EXPECTED_COUNT = 42
PRIVATE_DIR = Path.home() / ".config" / "csae-perfis-legados"
MANIFEST_FILE = PRIVATE_DIR / "mapa-migracao.json"


def stop(message):
    raise RuntimeError(message)


def database():
    db = firestore.Client(project=PROJECT)
    if db.project != PROJECT:
        stop("Projeto Firebase inesperado. Nenhuma alteração executada.")
    return db


def load_profiles(db):
    documents = list(db.collection(COLLECTION).stream())
    if not documents:
        stop("Nenhum documento de usuário encontrado.")
    by_uid = {}
    old = []
    ids = {doc.id for doc in documents}
    issues = Counter()

    for snap in documents:
        data = snap.to_dict() or {}
        uid = data.get("uid")
        if not isinstance(uid, str) or not uid or "/" in uid:
            issues["UID inválido"] += 1
            continue
        by_uid.setdefault(uid, []).append(snap.id)
        if snap.id != uid:
            old.append((snap, uid))
            if uid in ids:
                issues["ID de destino já ocupado"] += 1
            if data.get("ehAdmin") is True:
                issues["Administradores em documentos legados"] += 1
    issues["UID duplicado"] = sum(1 for values in by_uid.values() if len(values) > 1)

    # Contadores informativos separados de bloqueadores: administrador legado é permitido,
    # mas deve ser preservado exatamente; não é um erro em si.
    blockers = {key: value for key, value in issues.items()
                if key != "Administradores em documentos legados" and value}
    print(f"Total atual de perfis: {len(documents)}")
    print(f"Documentos com identificador legado: {len(old)}")
    print(f"Administradores legados a preservar: {issues['Administradores em documentos legados']}")
    print(f"Colisões de destino: {issues['ID de destino já ocupado']}")
    print(f"UIDs duplicados: {issues['UID duplicado']}")
    print(f"UIDs inválidos: {issues['UID inválido']}")
    if blockers:
        stop("Foram encontradas inconsistências: não realizar migração.")
    # Subcoleções NÃO são movidas automaticamente pelo Firestore.
    nested = sum(bool(list(snap.reference.collections())) for snap, _ in old)
    print(f"Documentos legados com subcoleções: {nested}")
    if nested:
        stop("Existem subcoleções: migração exige planejamento específico.")
    return documents, old


def manifest_items(old):
    return [{"origem": snap.id, "destino": uid} for snap, uid in old]


def write_manifest(items, count):
    PRIVATE_DIR.mkdir(mode=0o700, parents=True, exist_ok=True)
    os.chmod(PRIVATE_DIR, 0o700)
    if MANIFEST_FILE.exists():
        stop("Já existe um manifesto de migração. Execute verify antes de tentar novamente.")
    data = {
        "projeto": PROJECT,
        "criadoEm": datetime.now(timezone.utc).isoformat(),
        "totalAntes": count,
        "documentos": items,
        "descricao": "Mapeamento reservado de IDs, sem informações pessoais de perfil.",
    }
    # IDs são pseudônimos: arquivo local, fora do Git, com permissões restritas.
    fd = os.open(MANIFEST_FILE, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("Manifesto privado salvo no Cloud Shell (nenhum ID exibido).")


@firestore.transactional
def move_one(tx, old_ref, new_ref, uid):
    source = old_ref.get(transaction=tx)
    target = new_ref.get(transaction=tx)
    if not source.exists:
        stop("Documento de origem desapareceu antes da migração.")
    if target.exists:
        stop("Destino passou a existir: nenhuma sobrescrita permitida.")
    data = source.to_dict() or {}
    if data.get("uid") != uid or old_ref.id == new_ref.id:
        stop("UID não corresponde à origem: operação cancelada.")
    tx.create(new_ref, data)
    tx.delete(old_ref)


def apply(db, expected, confirmation):
    if expected != EXPECTED_COUNT or confirmation != f"MIGRAR {EXPECTED_COUNT} PERFIS":
        stop("Confirmação divergente; operação exige quantidade e frase exatas.")
    docs, old = load_profiles(db)
    if len(old) != expected:
        stop("Quantidade divergente da auditoria inicial. Não migrar sem nova revisão.")
    if len(docs) != 138:
        stop("Total de perfis mudou desde a auditoria: revisar antes de continuar.")
    items = manifest_items(old)
    write_manifest(items, len(docs))
    moved = 0
    for snap, uid in old:
        move_one(db.transaction(), snap.reference, db.collection(COLLECTION).document(uid), uid)
        moved += 1
        print(f"Concluídos: {moved}/{expected}", flush=True)
    print("Migração transacional executada. Rodar verify imediatamente.")


def verify(db):
    if not MANIFEST_FILE.exists():
        stop("Manifesto não encontrado: não é possível verificar uma migração.")
    with MANIFEST_FILE.open(encoding="utf-8") as f:
        data = json.load(f)
    if data.get("projeto") != PROJECT:
        stop("Manifesto corresponde a outro projeto.")
    missing = 0
    still_old = 0
    bad_uid = 0
    for item in data["documentos"]:
        old_ref = db.collection(COLLECTION).document(item["origem"])
        new_ref = db.collection(COLLECTION).document(item["destino"])
        source, target = old_ref.get(), new_ref.get()
        still_old += int(source.exists)
        missing += int(not target.exists)
        bad_uid += int(target.exists and (target.to_dict() or {}).get("uid") != item["destino"])
    current = list(db.collection(COLLECTION).stream())
    print(f"Total atual de perfis: {len(current)}")
    print(f"Documentos antigos ainda existentes: {still_old}")
    print(f"Destinos ausentes: {missing}")
    print(f"Destinos com UID incorreto: {bad_uid}")
    if still_old or missing or bad_uid or len(current) != data["totalAntes"]:
        stop("Verificação incompleta. NÃO publicar regras ou Hosting; preservar manifesto.")
    print("Migração validada. Perfis preservados; executar preflight do deploy.")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["plan", "apply", "verify"])
    parser.add_argument("--expected", type=int, default=0)
    parser.add_argument("--confirm", default="")
    args = parser.parse_args()
    try:
        db = database()
        if args.action == "plan":
            load_profiles(db)
            print("PLANEJAMENTO SOMENTE LEITURA. Nenhum documento alterado.")
        elif args.action == "apply":
            apply(db, args.expected, args.confirm)
        else:
            verify(db)
    except Exception as exc:
        print(f"BLOQUEADO: {type(exc).__name__}: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
