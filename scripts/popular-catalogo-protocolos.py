#!/usr/bin/env python3
"""Carga exclusivamente ADITIVA do catálogo clínico CSAE (protocolo volumes 4–8).

Dry-run por padrão:
    .venv-csae-release/bin/python scripts/popular-catalogo-protocolos.py

Publicação explícita, após revisar relatório:
    .venv-csae-release/bin/python scripts/popular-catalogo-protocolos.py --apply --confirm-project csaefloripa

- Lê apenas SinaisVitais, ExamesLabImagem, RevisaoSistemas,
  subconjuntosEnfermagem e identidadesCatalogoClinico.
- Nunca lê prontuários, pacientes ou usuários.
- Nunca modifica, apaga ou renomeia documentos existentes.
- NÃO toca no rol de diagnósticos/intervenções.
- Se uma chave já existe, pula a inclusão; se houver colisão não equivalente,
  bloqueia a carga antes de gravar.
- Registra relatório privado do plano e das inclusões. Não faz modificações em documentos antigos.
"""
import argparse
import hashlib
import json
import os
import re
import sys
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

PROJECT = "csaefloripa"
ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "scripts/data/catalogo-protocolos-csae-v1.json"
COLLECTIONS = ("SinaisVitais", "ExamesLabImagem", "RevisaoSistemas")
OUTDIR = Path.home() / "csae-auditoria-clinica"
NHB_COLLECTION = "subconjuntosEnfermagem"
IDENTITIES = "identidadesCatalogoClinico"

def normalizar(value):
    value = unicodedata.normalize("NFD", str(value or "").casefold())
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    return re.sub(r"[^a-z0-9]+", " ", value).strip()

def identidade_parametro(name):
    n = normalizar(name)
    if n.startswith("frequencia respiratoria ") or n in ("fr", "frequencia respiratoria"):
        return "frequencia-respiratoria"
    if n.startswith("frequencia cardiaca ") or n in ("fc", "frequencia cardiaca"):
        return "frequencia-cardiaca"
    if n.startswith("pressao arterial sistolica "):
        return "pressao-arterial-pas"
    if n.startswith("pressao arterial diastolica "):
        return "pressao-arterial-pad"
    return n

def documento_id(colecao, titulo):
    digest = hashlib.sha256((colecao + "|" + titulo).encode("utf-8")).hexdigest()[:20]
    return "protocolo-csae-v1-" + digest

def obter_nome(colecao, data):
    return data[{"SinaisVitais":"sinalVitalNome",
                 "ExamesLabImagem":"nomeExame",
                 "RevisaoSistemas":"nomeSistema"}[colecao]]

def chaves_identidade(colecao, data):
    if colecao == "SinaisVitais":
        return ["parametro--" + identidade_parametro(data["sinalVitalNome"]).replace(" ", "_")]
    if colecao == "ExamesLabImagem":
        nomes = ["exame--" + normalizar(data["nomeExame"]).replace(" ", "_")]
        nomes += ["parametro--" + identidade_parametro(c["componenteAnalisado"]).replace(" ", "_")
                  for c in data["componentes"]]
        return nomes
    nomes = ["sistema--" + normalizar(data["nomeSistema"]).replace(" ", "_")]
    nomes += ["exame-fisico--" + normalizar(ex["nomeExame"]).replace(" ", "_")
              for ex in data["exames"]]
    return nomes

def todas_nhbs(colecao, item):
    if colecao == "SinaisVitais":
        return [r.get("subconjuntoNHBVinculado", "") for r in item.get("valoresDeReferencia", [])]
    if colecao == "ExamesLabImagem":
        return [r.get("subconjuntoNHBVinculado", "") for c in item["componentes"]
                for r in c["resultados"]]
    return [n for e in item["exames"] for a in e["achados"] for n in (
        [a.get("subconjuntoNHBVinculado", "")] +
        [o.get("subconjuntoNHBVinculado", "") for o in a.get("opcoes", [])])]

def verificar_faixas(colecao, item):
    if colecao == "SinaisVitais":
        regras = item.get("valoresDeReferencia", [])
    elif colecao == "ExamesLabImagem":
        regras = [r for c in item["componentes"] for r in c["resultados"]]
    else:
        regras = [a for e in item["exames"] for a in e["achados"]]
    for regra in regras:
        mn, mx = regra.get("idadeMinima"), regra.get("idadeMaxima")
        if mn is not None and (not isinstance(mn, (int,float)) or mn < 0):
            raise ValueError("Idade mínima inválida em " + obter_nome(colecao, item))
        if mx is not None and (not isinstance(mx, (int,float)) or mx < 0):
            raise ValueError("Idade máxima inválida em " + obter_nome(colecao, item))
        if mn is not None and mx is not None and mn > mx:
            raise ValueError("Faixa etária invertida em " + obter_nome(colecao, item))
        if mn is not None or mx is not None:
            if regra.get("idadeUnidade") not in ("dias","meses","anos"):
                raise ValueError("Unidade etária faltante em " + obter_nome(colecao,item))

def validar_manifesto(manifest, nhbs):
    if manifest.get("_meta",{}).get("projeto") != PROJECT:
        raise ValueError("Projeto do manifesto inválido")
    if manifest.get("_meta",{}).get("modo") != "SOMENTE_ADITIVO":
        raise ValueError("Manifesto só pode ser SOMENTE_ADITIVO")
    required = set(COLLECTIONS)
    if not required.issubset(manifest):
        raise ValueError("Manifesto não apresenta as três coleções clínicas")
    unicas = {}
    for colecao in COLLECTIONS:
        for item in manifest[colecao]:
            titulo = obter_nome(colecao,item)
            if not titulo.strip():
                raise ValueError("Campo clínico com título vazio")
            verificar_faixas(colecao,item)
            for nhb in todas_nhbs(colecao,item):
                if nhb and normalizar(nhb) not in nhbs:
                    raise ValueError("NHB inexistente em catálogo: " + nhb)
            if colecao=="RevisaoSistemas":
                for ex in item["exames"]:
                    if not ex["achados"]:
                        raise ValueError("Exame físico sem achados: "+ex["nomeExame"])
                    names=[normalizar(a["descricaoAchado"]) for a in ex["achados"]]
                    if len(set(names))!=len(names):
                        raise ValueError("Achados repetidos em "+ex["nomeExame"])
                    for a in ex["achados"]:
                        opts = a.get("opcoes", [])
                        labels = [normalizar(o["textoOpcao"]) for o in opts]
                        if not opts or len(labels)!=len(set(labels)):
                            raise ValueError("Opções vazias ou repetidas em "+a["descricaoAchado"])
                        for o in opts:
                            if o.get("ehAlteracao") and (not o.get("nomeAlteracao")
                                or not o.get("subconjuntoNHBVinculado")):
                                raise ValueError("Achado alterado sem classificação/NHB: "+o["textoOpcao"])
            for key in chaves_identidade(colecao,item):
                if not key or key.endswith("--"):
                    raise ValueError("Chave vazia do manifesto")
                if key in unicas:
                    raise ValueError("Colisão interna "+key+": "+titulo+" / "+unicas[key])
                unicas[key]=titulo
    return unicas

def indicadores(manifest):
    sistemas=manifest["RevisaoSistemas"]
    return {"sinaisNovos":len(manifest["SinaisVitais"]),
            "examesNovos":len(manifest["ExamesLabImagem"]),
            "sistemasNovos":len(sistemas),
            "examesFisicos":sum(len(s["exames"]) for s in sistemas),
            "achados":sum(len(e["achados"]) for s in sistemas for e in s["exames"]),
            "opcoes":sum(len(a.get("opcoes",[])) for s in sistemas for e in s["exames"] for a in e["achados"])}

def escrever_privado(data, name):
    OUTDIR.mkdir(parents=True,exist_ok=True,mode=0o700)
    os.chmod(OUTDIR,0o700)
    path=OUTDIR / name
    fd=os.open(path,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
    with os.fdopen(fd,"w",encoding="utf-8") as out:
        json.dump(data,out,ensure_ascii=False,indent=2,default=str)
        out.write("\n")
    return path

def snapshot_catalogo(client):
    data={}
    for colecao in (*COLLECTIONS,NHB_COLLECTION,IDENTITIES):
        data[colecao]=[{"id":s.id,"data":s.to_dict()} for s in client.collection(colecao).stream()]
    return data

def planejar(manifest,snapshot):
    """Não confunde PA/dengue com novo parâmetro; nunca altera conteúdos existentes."""
    existentes={}
    keys={}
    for colecao in COLLECTIONS:
        for row in snapshot[colecao]:
            data=row["data"]
            titulo=obter_nome(colecao,data)
            key=normalizar(titulo)
            existentes[(colecao,key)]=row["id"]
            for ident in chaves_identidade(colecao,data):
                keys.setdefault(ident,[]).append((colecao,titulo))
    # Verifica também reservas já existentes (não basta checar só títulos).
    for reserva in snapshot.get(IDENTITIES,[]):
        keys.setdefault(reserva["id"],[]).append(
            (IDENTITIES, reserva["data"].get("colecaoOrigem", "índice")))
    to_create=[]; skips=[]; conflicts=[]
    for colecao in COLLECTIONS:
        for item in manifest[colecao]:
            titulo=obter_nome(colecao,item)
            same=existentes.get((colecao,normalizar(titulo)))
            if same:
                skips.append({"colecao":colecao,"titulo":titulo,"idExistente":same,
                              "motivo":"nome já cadastrado; registro preservado"})
                continue
            cross=sorted({k for k in chaves_identidade(colecao,item) if k in keys})
            if cross:
                conflicts.append({"colecao":colecao,"titulo":titulo,"colisoes":cross})
                continue
            to_create.append({"colecao":colecao,"titulo":titulo,
                              "id":documento_id(colecao,titulo),"data":item,
                              "chaves":chaves_identidade(colecao,item)})
    return to_create,skips,conflicts

def gravar_documento(client,registro):
    """Criação com reservas na MESMA transação; nenhuma atualização em documentos legados."""
    from google.cloud import firestore
    target=client.collection(registro["colecao"]).document(registro["id"])
    reservations=[client.collection(IDENTITIES).document(k) for k in registro["chaves"]]

    @firestore.transactional
    def cadastrar(tx):
        # Todas as leituras antes de qualquer gravação.
        # DocumentReference.get(transaction=tx) retorna DocumentSnapshot.
        # Transaction.get(ref) pode retornar um iterador/generator nesta versao
        # do SDK Python, o que quebrava a consulta a .exists.
        check=target.get(transaction=tx)
        busy=[(ref,ref.get(transaction=tx)) for ref in reservations]
        if check.exists:
            raise RuntimeError("ID de documento já ocupado: "+target.path)
        if any(snap.exists for _,snap in busy):
            raise RuntimeError("Identidade já reservada; reexecute dry-run antes de prosseguir: "+registro["titulo"])
        tx.create(target,{**registro["data"],"dataCadastro":firestore.SERVER_TIMESTAMP})
        for ref,_ in busy:
            tx.create(ref,{"chave":ref.id,"colecaoOrigem":registro["colecao"],
                           "documentoId":registro["id"],"criadoEm":firestore.SERVER_TIMESTAMP})

    cadastrar(client.transaction())

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply",action="store_true",
                        help="grava SOMENTE novos documentos após confirmação explícita")
    parser.add_argument("--confirm-project",default="")
    args=parser.parse_args()
    if args.apply and args.confirm_project!=PROJECT:
        parser.error("Para gravar, forneça --confirm-project csaefloripa")
    manifest=json.loads(MANIFEST.read_text(encoding="utf-8"))
    from google.cloud import firestore
    client=firestore.Client(project=PROJECT)
    if client.project!=PROJECT:
        raise RuntimeError("Projeto Firebase inesperado")
    original=snapshot_catalogo(client)
    nhbs={normalizar(x["data"].get("tituloSubconjunto","")) for x in original[NHB_COLLECTION]
          if normalizar(x["data"].get("tipoSubconjunto",""))=="nhb"}
    validar_manifesto(manifest,nhbs)
    creates,skips,conflicts=planejar(manifest,original)
    stamp=datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S_%f")
    report={"modo":"APPLY" if args.apply else "DRY_RUN",
            "projeto":PROJECT,"geradoEmUTC":datetime.now(timezone.utc).isoformat(),
            "itensPacote":indicadores(manifest),
            "contagensAntes":{c:len(original[c]) for c in COLLECTIONS},
            "novos":[{"colecao":v["colecao"],"titulo":v["titulo"],"id":v["id"]} for v in creates],
            "jaExistentes":skips,"conflitos":conflicts,
            "escritasRealizadas":[]}
    preview=escrever_privado(report,"plano_catalogo_csae_"+stamp+".json")
    print("PLANO SOMENTE ADITIVO:",str(preview))
    print(json.dumps({k:report[k] for k in ("itensPacote","contagensAntes","novos","jaExistentes","conflitos")},
                     ensure_ascii=False,indent=2))
    if conflicts:
        raise RuntimeError("COLISÕES detectadas. Carga abortada sem escrita; revisar relatório e resolver nomes.")
    if not args.apply:
        print("DRY-RUN concluído. Firestore inalterado. Para aplicar, use --apply --confirm-project csaefloripa.")
        return
    if not sys.stdin.isatty():
        raise RuntimeError("Carga precisa de terminal interativo. Nenhum registro foi gravado.")
    approval=input('Digite INSERIR CATALOGO CSAE para criar somente os itens NOVOS: ').strip()
    if approval!="INSERIR CATALOGO CSAE":
        raise RuntimeError("Confirmação recusada; nenhum dado gravado.")
    # Sem sobrescrever: cada inclusão tem transação própria; operação retomável.
    for registro in creates:
        gravar_documento(client,registro)
        report["escritasRealizadas"].append(
            {"colecao":registro["colecao"],"titulo":registro["titulo"],"id":registro["id"]})
        print("CRIOU:",registro["colecao"],registro["titulo"])
    report["contagensDepois"]={c:len(list(client.collection(c).stream())) for c in COLLECTIONS}
    saida=escrever_privado(report,"resultado_carga_catalogo_"+stamp+".json")
    print("Carga finalizada. Relatório privado:",saida)
    print("NENHUM documento existente foi alterado, excluído ou renomeado.")

if __name__=="__main__":
    try:
        main()
    except Exception as exc:
        print("CARGA CLÍNICA INTERROMPIDA:",str(exc),file=sys.stderr)
        sys.exit(1)
