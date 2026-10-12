"""Testes offline da atualização V3; exercitam o mesmo planejamento de produção."""
import copy
import importlib.util
import json
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
file=ROOT/"scripts/corrigir-parametros-exames-csae-8v-v3.py"
spec=importlib.util.spec_from_file_location("csae_v3_migration",file)
migration=importlib.util.module_from_spec(spec)
spec.loader.exec_module(migration)
base=json.loads((ROOT/"scripts/data/catalogo-clinico-csae-8v-lote2.json").read_text(encoding="utf8"))
patch=json.loads((ROOT/"scripts/data/correcoes-parametros-exames-csae-8v-v3.json").read_text(encoding="utf8"))
nhbs={
"Segurança física e meio ambiente","Sexualidade e reprodução",
"Terapêutica e de Prevenção","Integridade física","Regulação térmica",
"Oxigenação","Hidratação","Regulação hormonal","Regulação neurológica",
"Eliminações","Nutrição","Regulação vascular",
"Regulação - crescimento celular e desenvolvimento funcional","Sensopercepção"
}

def fixture():
    return {migration.id_for(e["nomeExame"]):copy.deepcopy(e)
            for e in base["ExamesLabImagem"]}

def planning(docs=None, reservations=None):
    d=docs if docs is not None else fixture()
    names={migration.norm(c["componenteAnalisado"])
           for e in d.values() for c in e["componentes"]}
    return migration.build_plan(patch,base,d,{migration.norm(n) for n in nhbs},
                                names,set(reservations or []))

class MigrationTest(unittest.TestCase):
    def test_expected_13_and_compatibility(self):
        p=planning()
        self.assertEqual(len(p["edits"]),13)
        self.assertEqual(len(p["skips"]),0)
        self.assertEqual(len(p["reservas"]),3)
        for e in p["edits"]:
            self.assertEqual(len(set(migration.norm(x["componenteAnalisado"]) for x in e["depois"])),len(e["depois"]))
            for c in e["depois"]:
                self.assertTrue(c["resultados"])
                if any(x["componenteAnalisado"]==c["componenteAnalisado"]
                       for item in patch["itens"] if item["nomeExame"]==e["nome"]
                       for x in item["componentes"]):
                    for r in c["resultados"]:
                        self.assertIn(r["interpretacaoClinica"],("normal","alterado","informativo"))
                        if r["interpretacaoClinica"]=="alterado":
                            self.assertIn(r["subconjuntoNHBVinculado"],nhbs)
                        self.assertNotEqual(r.get("resultadoClassificatorio"),"Descritivo")
            self.assertIn("https://",e["descricaoDepois"])

    def test_idempotent(self):
        docs=fixture()
        plan=planning(docs)
        for e in plan["edits"]:
            docs[e["id"]]["componentes"]=copy.deepcopy(e["depois"])
            docs[e["id"]]["descricaoExame"]=e["descricaoDepois"]
            docs[e["id"]]["versaoCatalogoClinico"]=migration.VERSION
        p=planning(docs)
        self.assertEqual(p["edits"],[])
        self.assertEqual(len(p["skips"]),13)

    def test_no_overwrite_concurrent_edit(self):
        docs=fixture()
        id_=migration.id_for("Gama Glutamiltransferase (GGT)")
        docs[id_]["componentes"][0]["resultados"][0]["nomeAlteracao"]="Editado por usuário"
        with self.assertRaisesRegex(ValueError,"alterado manualmente"):
            planning(docs)

    def test_new_component_collision(self):
        with self.assertRaisesRegex(ValueError,"Colisão de identidade"):
            planning(reservations={"parametro--rna_hiv_qualitativo"})

    def test_one_source_per_exam(self):
        self.assertEqual(len(patch["itens"]),13)
        for item in patch["itens"]:
            self.assertTrue(item["fonteClinica"].startswith("https://"))
            self.assertTrue(item["justificativa"])
            for c in item["componentes"]:
                self.assertGreaterEqual(len(c["resultados"]),2)
                migration.validate_comp(c,{migration.norm(n) for n in nhbs})

    def test_numeric_and_categorical_separated(self):
        for item in patch["itens"]:
            for c in item["componentes"]:
                results=c["resultados"]
                self.assertTrue(all(bool(r.get("resultadoClassificatorio"))
                                    for r in results) or
                                all(not r.get("resultadoClassificatorio")
                                    for r in results))
                self.assertFalse(any(r.get("interpretacaoClinica")=="indeterminado"
                                    for r in results))
        mam=next(x for x in patch["itens"] if x["nomeExame"]=="Ultrassonografia das Mamas")
        categories={r["resultadoClassificatorio"] for r in mam["componentes"][0]["resultados"]}
        for n in ["BI-RADS 0","BI-RADS 1","BI-RADS 2","BI-RADS 3","BI-RADS 4A",
                  "BI-RADS 4B","BI-RADS 4C","BI-RADS 5","BI-RADS 6"]:
            self.assertTrue(any(x.startswith(n+" ") for x in categories))

if __name__=="__main__":
    unittest.main()
