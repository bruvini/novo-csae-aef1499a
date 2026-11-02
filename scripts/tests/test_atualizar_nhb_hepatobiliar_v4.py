"""Testes sem acesso ao Firestore para mudança NHB hepatobiliar V4."""
import copy
import importlib.util
import json
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
SRC=ROOT/"scripts/atualizar-nhb-hepatobiliar-v4.py"
spec=importlib.util.spec_from_file_location("csae_nhb_hepatobiliar_v4",SRC)
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
manifest=json.loads(module.SOURCE.read_text(encoding="utf8"))
source={x["nomeExame"]:x for x in manifest["itens"]}

def fixture():
    return {module.doc_id(name):copy.deepcopy(source[name])
            for name in module.TARGETS}

class NHBHepatobiliarTest(unittest.TestCase):
    def test_todas_as_cinco_entidades_12_alteracoes(self):
        planned=module.plan(manifest,fixture(),{module.NEW_NHB})
        self.assertEqual(len(planned["edits"]),5)
        self.assertEqual(planned["totalResultadosAlterados"],12)
        self.assertEqual(planned["jaAtualizados"],[])
        for edit in planned["edits"]:
            self.assertEqual(len(edit["antes"]),len(edit["depois"]))
            self.assertEqual(edit["id"],module.doc_id(edit["nome"]))
            for previous,new in zip(edit["antes"],edit["depois"]):
                self.assertEqual(previous["componenteAnalisado"],new["componenteAnalisado"])
                self.assertEqual(previous["unidadeMedida"],new["unidadeMedida"])
                for old_rule,new_rule in zip(previous["resultados"],new["resultados"]):
                    self.assertEqual(module.strip_nhb(old_rule),module.strip_nhb(new_rule))
                    if old_rule["interpretacaoClinica"]=="alterado":
                        self.assertEqual(old_rule["subconjuntoNHBVinculado"],module.OLD_NHB)
                        self.assertEqual(new_rule["subconjuntoNHBVinculado"],module.NEW_NHB)
                    else:
                        self.assertEqual(old_rule,new_rule)

    def test_segunda_execucao_nao_muda_nada(self):
        docs=fixture()
        first=module.plan(manifest,docs,{module.NEW_NHB})
        for edit in first["edits"]:
            docs[edit["id"]]["componentes"]=copy.deepcopy(edit["depois"])
        again=module.plan(manifest,docs,{module.NEW_NHB})
        self.assertEqual(again["totalResultadosAlterados"],0)
        self.assertEqual(len(again["jaAtualizados"]),5)
        self.assertEqual(again["edits"],[])

    def test_nhb_de_destino_precisa_existir(self):
        with self.assertRaisesRegex(ValueError,"não cadastrada"):
            module.plan(manifest,fixture(),set())

    def test_regra_modificada_por_usuario_bloqueia_toda_operacao(self):
        docs=fixture()
        a=module.doc_id(module.TARGETS[0])
        docs[a]["componentes"][0]["resultados"][2]["valorMinimo"]=99
        with self.assertRaisesRegex(ValueError,"mudou desde V3"):
            module.plan(manifest,docs,{module.NEW_NHB})

    def test_nhb_original_inesperada_bloqueia(self):
        docs=fixture()
        a=module.doc_id(module.TARGETS[3])
        docs[a]["componentes"][0]["resultados"][2]["subconjuntoNHBVinculado"]="Nutrição"
        with self.assertRaisesRegex(ValueError,"NHB alterada por outro usuário"):
            module.plan(manifest,docs,{module.NEW_NHB})

if __name__=="__main__":
    unittest.main()
