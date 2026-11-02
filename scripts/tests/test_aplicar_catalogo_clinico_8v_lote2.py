"""Testes offline do lote 2 sem Firebase, credenciais nem pacientes."""
import copy
import importlib.util
import json
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
SRC=ROOT/"scripts/aplicar-catalogo-clinico-8v-lote2.py"
MANIFEST=ROOT/"scripts/data/catalogo-clinico-csae-8v-lote2.json"
spec=importlib.util.spec_from_file_location("csae_lote2",SRC)
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

NHB=["Segurança física e meio ambiente","Sexualidade e reprodução",
 "Terapêutica e de Prevenção","Integridade física","Regulação térmica",
 "Oxigenação","Hidratação","Regulação hormonal","Regulação neurológica",
 "Eliminações","Nutrição","Regulação vascular",
 "Regulação - crescimento celular e desenvolvimento funcional",
 "Sensopercepção"]

def fixture():
    return {
      "SinaisVitais":[],
      "ExamesLabImagem":[{
       "id":"hemograma-completo-81dd0b7182",
       "data":{"nomeExame":"Hemograma Completo","tipoExame":"Laboratorial",
         "componentes":[{"componenteAnalisado":"Hemoglobina (Hb)",
           "unidadeMedida":"g/dL","resultados":[{"nomeAlteracao":"normal"}]}]}}],
      "RevisaoSistemas":[{
       "id":"protocolo-csae-v1-96fe0dc1169704d679cf",
       "data":{"nomeSistema":"Avaliação de Feridas — Leito, Exsudato e Pele Perilesional",
          "exames":[{"nomeExame":"Inspeção da Ferida — Leito e Tecido",
                     "propedeutica":"Inspeção",
                     "achados":[{"descricaoAchado":"Tipo de tecido"}]}]}}],
      "subconjuntosEnfermagem":[{"id":"nhb-"+str(i),
          "data":{"tituloSubconjunto":n,"tipoSubconjunto":"nhb"}} for i,n in enumerate(NHB)],
      "identidadesCatalogoClinico":[]}

class Lote2Test(unittest.TestCase):
 def setUp(self):
  self.manifest=json.loads(MANIFEST.read_text(encoding="utf8"))
 def test_21_operacoes_sem_colisao(self):
  result=mod.plan(self.manifest,fixture())
  self.assertEqual(len(result["creates"]),19)
  self.assertEqual(len(result["edits"]),2)
  self.assertEqual(len(result["conflicts"]),0)
  self.assertEqual(len(result["skips"]),0)
  self.assertEqual(len({r["nome"] for r in result["creates"]}),19)
  self.assertEqual(sum(x["colecao"]=="ExamesLabImagem" for x in result["creates"]),18)
 def test_sem_excluir_componentes_existentes(self):
  result=mod.plan(self.manifest,fixture())
  hemo=next(x for x in result["edits"] if x["colecao"]=="ExamesLabImagem")
  self.assertEqual(hemo["novo"][0]["componenteAnalisado"],"Hemoglobina (Hb)")
  self.assertEqual(hemo["novo"][1]["componenteAnalisado"],"Leucócitos Totais")
  ferida=next(x for x in result["edits"] if x["colecao"]=="RevisaoSistemas")
  self.assertEqual(ferida["novo"][0]["nomeExame"],"Inspeção da Ferida — Leito e Tecido")
  self.assertEqual(ferida["novo"][1]["nomeExame"],"Mensuração da Ferida — Dimensões e Solapamento")
 def test_idempotente(self):
  snap=fixture()
  plan=mod.plan(self.manifest,snap)
  for x in plan["creates"]:
   snap[x["colecao"]].append({"id":x["id"],"data":copy.deepcopy(x["data"])})
  for x in plan["edits"]:
   target=next(y for y in snap[x["colecao"]] if y["id"]==x["id"])
   target["data"][x["campo"]]=copy.deepcopy(x["novo"])
  repeat=mod.plan(self.manifest,snap)
  self.assertEqual(len(repeat["creates"]),0)
  self.assertEqual(len(repeat["edits"]),0)
  self.assertEqual(len(repeat["conflicts"]),0)
 def test_invalid_nhb_blocked(self):
  m=copy.deepcopy(self.manifest)
  m["ExamesLabImagem"][0]["componentes"][0]["resultados"][0]["subconjuntoNHBVinculado"]="NHB_INEXISTENTE"
  with self.assertRaisesRegex(ValueError,"NHB"):
   mod.plan(m,fixture())
 def test_collision_blocks(self):
  snap=fixture()
  snap["identidadesCatalogoClinico"].append({
    "id":"exame--ureia_serica","data":{"colecaoOrigem":"ExamesLabImagem"}})
  result=mod.plan(self.manifest,snap)
  self.assertTrue(result["conflicts"])
 def test_indeterminados_nao_sao_anormais_sem_nhb(self):
  for e in self.manifest["ExamesLabImagem"]:
   for c in e["componentes"]:
    for row in c["resultados"]:
     if row["interpretacaoClinica"]=="alterado":
      self.assertTrue(row.get("subconjuntoNHBVinculado"))
     if row["interpretacaoClinica"]=="indeterminado":
      self.assertEqual(row.get("subconjuntoNHBVinculado",""),"")

if __name__=="__main__": unittest.main()
