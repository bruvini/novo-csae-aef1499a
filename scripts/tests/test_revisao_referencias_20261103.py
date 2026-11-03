#!/usr/bin/env python3
"""Testes de contrato do lote clínico; nunca acessam serviços externos."""
import importlib.util
import json
import pathlib
import subprocess
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "scripts/data/revisao-referencias-2026-11-03.json"
SCRIPT = ROOT / "scripts/aplicar-revisao-referencias-20261103.py"
spec = importlib.util.spec_from_file_location("csae_batch", SCRIPT)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
data = json.loads(MANIFEST.read_text(encoding="utf-8"))
docs = {(r["colecao"], r["id"]): r for r in data["documentos"]}

def refs(col, id, name=None):
    d = docs[(col,id)]["conteudoProposto"]
    if name is None:
        return d
    return next(c["resultados"] for c in d if c["componenteAnalisado"] == name)

class TestClinica(unittest.TestCase):
    def test_validade_manifesto(self):
        loaded, sha = mod.load_and_validate(MANIFEST)
        self.assertEqual(len(loaded["documentos"]), 12)
        self.assertEqual(len(sha), 64)
        self.assertEqual(set(k[0] for k in docs), {"SinaisVitais","ExamesLabImagem"})
        self.assertTrue(all(r["validacaoClinica"] == "PENDENTE_VALIDACAO_CLINICA" for r in loaded["documentos"]))

    def test_regras_nao_alteram_documentos_fora_escopo(self):
        self.assertTrue(all(r["campo"] == ("valoresDeReferencia" if r["colecao"] == "SinaisVitais" else "componentes")
                            for r in data["documentos"]))
        self.assertEqual(len([r for r in data["documentos"] if r["colecao"] == "SinaisVitais"]),3)
        self.assertEqual(len([r for r in data["documentos"] if r["colecao"] == "ExamesLabImagem"]),9)

    def test_fc_pediatrica_sem_interpolacao(self):
        r=refs("SinaisVitais","frequencia-cardiaca-fc-09c0fe7869")
        self.assertEqual(len(r),24)
        children=[x for x in r if x.get("idadeMinima") is not None and x["idadeUnidade"] != "anos"
                  or x.get("idadeUnidade") == "anos" and x.get("idadeMinima",99) < 18]
        self.assertEqual(len(children),21)
        for label,unit,age,a,b in [("RN","dias",0,70,170),("11 meses","meses",11,80,160),
                                  ("2 anos","anos",2,80,130),("4 anos","anos",4,80,120),
                                  ("6 anos","anos",6,75,115),("8 anos","anos",8,70,110),
                                  ("10 anos","anos",10,70,110)]:
            matches=[x for x in children if x["idadeUnidade"]==unit and x["idadeMinima"]==age
                     and x["valorMinimo"]==a and x["valorMaximo"]==b]
            self.assertEqual(len(matches),1,label)
            self.assertEqual(matches[0]["interpretacaoClinica"],"normal")

    def test_numericos_volume_6(self):
        mapping={
          "protocolo-csae-v1-056a653e4ea4e10a844b":(3.5,5.2),
          "protocolo-csae-v1-2b46d10f20a2415c30b4":(300,900),
          "protocolo-csae-v1-757a337639cf211b7b8b":(70,120),
          "protocolo-csae-v1-ce59ca012e8f6b7129db":(30,100),
        }
        for id,(minimum,maximum) in mapping.items():
            row=next(x for x in refs("ExamesLabImagem",id)[0]["resultados"]
                     if x["interpretacaoClinica"]=="normal")
            self.assertEqual((row["valorMinimo"],row["valorMaximo"]),(minimum,maximum))

    def test_dengue_nao_equivale_a_normalidade(self):
        c=refs("ExamesLabImagem","hemograma-completo-81dd0b7182")
        for name in ("Hematócrito","Plaquetas"):
            for x in next(i["resultados"] for i in c if i["componenteAnalisado"]==name):
                self.assertEqual(x["contextoClinico"],"dengue")
                if not x["subconjuntoNHBVinculado"]:
                    self.assertEqual(x["interpretacaoClinica"],"informativo")

    def test_tsh_gestante_sem_substituir_protocolo(self):
        c=refs("ExamesLabImagem","tsh-gestante-valores-por-trimestre-e1ec205bc5")
        for comp,minimum,maximum in zip(c,(0.1,0.2,0.3),(2.5,3.0,3.0)):
            rows=comp["resultados"]
            self.assertTrue(any(x["valorMinimo"]==minimum and x["valorMaximo"]==maximum
                                and x["interpretacaoClinica"]=="normal" for x in rows))
            self.assertTrue(any(x["valorMinimo"] is None and x["interpretacaoClinica"]=="alterado"
                                for x in rows))
            self.assertTrue(all(x["contextoClinico"]=="gestante" for x in rows))

    def test_rh_nao_cria_nhb(self):
        rows=refs("ExamesLabImagem","tipagem-sanguinea-com-fator-rh-a08f93b239")[0]["resultados"]
        self.assertTrue(all(r["interpretacaoClinica"]=="informativo" and
                            not r["subconjuntoNHBVinculado"] for r in rows))

    def test_diagnostico_403_informa_fase_e_iam_sem_expor_secret(self):
        for fase in ("inicialização da transação (BeginTransaction)",
                     "confirmação das atualizações na transação (Commit)"):
            mensagem = mod.mensagem_permissao_firestore(
                fase, "conta-csae@csaefloripa.iam.gserviceaccount.com")
            self.assertIn("PERMISSAO_FIRESTORE_403", mensagem)
            self.assertIn(fase, mensagem)
            self.assertIn("roles/datastore.user", mensagem)
            self.assertIn("datastore.entities.update", mensagem)
            self.assertIn("conta-csae@csaefloripa.iam.gserviceaccount.com", mensagem)
            self.assertNotIn("private_key", mensagem)

    def test_aplicar_sem_aprovacao_aborta_antes_de_acesso_remoto(self):
        p=subprocess.run([sys.executable,str(SCRIPT),"--manifest",str(MANIFEST),
            "--apply","--confirm-project","csaefloripa"],text=True,capture_output=True)
        self.assertNotEqual(p.returncode,0)
        self.assertIn("BLOQUEADA",p.stderr)

if __name__ == "__main__":
    unittest.main()
