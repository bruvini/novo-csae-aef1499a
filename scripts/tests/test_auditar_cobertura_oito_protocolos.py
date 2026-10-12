"""Testes sem credencial Firebase para auditoria exploratória dos 8 protocolos."""
import importlib.util
import json
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location("auditar_cobertura_oito_protocolos",ROOT/"scripts/auditar-cobertura-oito-protocolos.py")
audit=importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)

class AuditoriaCoberturaTest(unittest.TestCase):
    def test_nome_e_faixa_pediatrica(self):
        matrix={"itens":[{"categoria":"sinais_vitais","nome":"Frequência cardíaca",
                          "sinonimos":["FC"],"fontes":[{"volume":5,"paginas_pdf":[11]}]},
                         {"categoria":"exames_laboratoriais","nome":"TSH","sinonimos":[],
                          "fontes":[{"volume":8,"paginas_pdf":[20]}]}]}
        snap={"SinaisVitais":[{"id":"id-fc","data":{
              "sinalVitalNome":"Frequência Cardíaca (FC)",
              "valoresDeReferencia":[{"idadeMinima":2,"idadeMaxima":4,
                                     "idadeUnidade":"anos","interpretacaoClinica":"alterado",
                                     "subconjuntoNHBVinculado":"Circulação"}]}}],
              "ExamesLabImagem":[],"RevisaoSistemas":[],
              "subconjuntosEnfermagem":[{"id":"nhb1","data":{"tipoSubconjunto":"NHB",
                                                         "tituloSubconjunto":"Circulação"}}]}
        result=audit.examine(matrix,snap)
        self.assertEqual(result["totalCandidatos"],2)
        self.assertEqual(result["resumoCorrespondencias"]["CORRESPONDENCIA_NOMINAL"],1)
        self.assertEqual(result["resumoCorrespondencias"]["SEM_CORRESPONDENCIA_NOMINAL"],1)
        self.assertEqual(result["matriz"][0]["possiveisRegistros"][0]["faixasPediatricas"],1)
        self.assertEqual(result["alertas"],[])

    def test_sinaliza_anormal_sem_nhb(self):
        snap={"SinaisVitais":[{"id":"x","data":{"sinalVitalNome":"FC","valoresDeReferencia":[
               {"idadeMinima":1,"idadeMaxima":3,"idadeUnidade":"anos",
                "interpretacaoClinica":"alterado","subconjuntoNHBVinculado":""}]}}],
              "ExamesLabImagem":[],"RevisaoSistemas":[],"subconjuntosEnfermagem":[]}
        result=audit.examine({"itens":[]},snap)
        self.assertEqual(result["alertasPorTipo"]["ALTERACAO_SEM_NHB"],1)

    def test_matriz_validade(self):
        matrix=json.loads((ROOT/"scripts/data/matriz-exploratoria-protocolos-v1-v8.json").read_text(encoding="utf8"))
        self.assertEqual(len(matrix["itens"]),80)
        self.assertEqual({i["categoria"] for i in matrix["itens"]},
                         {"sinais_vitais","exames_laboratoriais","exames_imagem","exame_fisico_revisao"})

if __name__=="__main__":
    unittest.main()
