"""Garante exportação clínica restrita e sem dados de pacientes (sem Firebase)."""
import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location(
    "csae_exportacao", ROOT / "scripts/exportar-inventario-clinico-8v.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

class ExportacaoClinicaTest(unittest.TestCase):
    def snapshot(self):
        return {
            "SinaisVitais": [{"id":"fc-1","data":{
                "sinalVitalNome":"Frequência Cardíaca (FC)","unidadeMedida":"bpm",
                "usuarioEmail":"nao_exportar@example.com",
                "valoresDeReferencia":[{"idadeMinima":2,"idadeMaxima":4,
                    "idadeUnidade":"anos","valorMinimo":80,"valorMaximo":120,
                    "contextoClinico":"geral","interpretacaoClinica":"normal",
                    "subconjuntoNHBVinculado":"Regulação vascular",
                    "idPaciente":"PACIENTE_SECRETO"}]}}],
            "ExamesLabImagem": [{"id":"e-1","data":{
                "nomeExame":"Hemograma","tipoExame":"Laboratorial",
                "componentes":[{"componenteAnalisado":"Leucócitos",
                    "unidadeMedida":"/mm³",
                    "resultados":[{"valorMinimo":4000,"valorMaximo":11000,
                        "criterioSexo":"Ambos"}]}],
                "cpf":"CPF_SECRETO"}}],
            "RevisaoSistemas":[{"id":"r-1","data":{
                "nomeSistema":"Respiratório","exames":[{
                    "nomeExame":"Ausculta pulmonar","propedeutica":"Ausculta",
                    "achados":[{"descricaoAchado":"Ruídos adventícios",
                        "tipoAchado":"opcoes","opcoes":[{
                            "textoOpcao":"Sibilos", "ehAlteracao":True,
                            "subconjuntoNHBVinculado":"Oxigenação"}]}]}],
                "usuario":"NOME_SECRETO"}}],
            "subconjuntosEnfermagem":[
                {"id":"nhb-1","data":{"tipoSubconjunto":"NHB",
                    "tituloSubconjunto":"Oxigenação","email":"EMAIL_SECRETO"}},
                {"id":"sub-1","data":{"tipoSubconjunto":"Outro",
                    "tituloSubconjunto":"Nao incluir"}}
            ],
        }

    def test_sem_campos_pessoais_ou_subconjuntos_nao_nhb(self):
        result = mod.montar(self.snapshot())
        data = json.dumps(result, ensure_ascii=False)
        for secret in ("nao_exportar@example.com","PACIENTE_SECRETO",
                       "CPF_SECRETO","NOME_SECRETO","EMAIL_SECRETO","Nao incluir"):
            self.assertNotIn(secret,data)
        self.assertEqual(len(result["catalogo"]["nhbs"]),1)
        self.assertEqual(result["modo"],"INVENTARIO_SOMENTE_LEITURA")

    def test_valores_e_itens_aninhados_preservados(self):
        result = mod.montar(self.snapshot())["catalogo"]
        self.assertEqual(result["SinaisVitais"][0]["valoresDeReferencia"][0]["idadeUnidade"],"anos")
        self.assertEqual(result["ExamesLabImagem"][0]["componentes"][0]["resultados"][0]["valorMinimo"],4000)
        self.assertEqual(result["RevisaoSistemas"][0]["exames"][0]["achados"][0]["opcoes"][0]["textoOpcao"],"Sibilos")

    def test_resumo(self):
        result = mod.montar(self.snapshot())["resumo"]
        self.assertEqual(result["documentosSinaisVitais"],1)
        self.assertEqual(result["componentesDeExames"],1)
        self.assertEqual(result["examesFisicosAninhados"],1)
        self.assertEqual(result["achadosFisicos"],1)
        self.assertEqual(result["opcoesDeAchados"],1)

if __name__ == "__main__":
    unittest.main()
