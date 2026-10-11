#!/usr/bin/env python3
"""Auditoria somente leitura de datas/títulos do mural do CSAE (sem dados pessoais)."""
from google.cloud import firestore
from google.cloud.firestore_v1 import Query

db = firestore.Client(project="csaefloripa")
print("Projeto:", db.project)
print("Últimas atualizações registradas no Firestore:")
for item in db.collection("changelogs").order_by(
    "dataHora", direction=Query.DESCENDING
).limit(8).stream():
    data = item.to_dict() or {}
    timestamp = data.get("dataHora")
    data_legivel = timestamp.isoformat() if hasattr(timestamp, "isoformat") else "sem data"
    print("-", data_legivel, "|", data.get("titulo", "sem título"))
