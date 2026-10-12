"""Testes sem Firestore: contextos clínicos do hemograma."""
import importlib.util
import unittest
from pathlib import Path
src=Path(__file__).resolve().parents[1]/"contextualizar-hemograma.py"
spec=importlib.util.spec_from_file_location("contextualizar_hemograma",src)
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

class HemogramaContextosTest(unittest.TestCase):
    def base(self):
        return {"nomeExame":"Hemograma Completo","tipoExame":"Laboratorial",
                "componentes":[{
                    "componenteAnalisado":name,
                    "unidadeMedida":"unidade",
                    "resultados":[{"nomeAlteracao":"Normal","valorMinimo":1+i,
                                  "subconjuntoNHBVinculado":""} for i in range(n)]
                } for name,n in m.COUNTS.items()]}

    def test_apenas_contextos_alterados(self):
        doc=self.base()
        proposal,done=m.planejar(doc)
        self.assertFalse(done)
        for original,changed in zip(doc["componentes"],proposal):
            self.assertEqual(original["componenteAnalisado"],changed["componenteAnalisado"])
            for a,b in zip(original["resultados"],changed["resultados"]):
                self.assertEqual(a, {k:v for k,v in b.items() if k!="contextoClinico"})
                expected=m.CONTEXTS[original["componenteAnalisado"]]
                self.assertEqual(b["contextoClinico"],expected)
        self.assertNotIn("contextoClinico",doc["componentes"][0]["resultados"][0])

    def test_idempotente(self):
        doc=self.base()
        proposal,_=m.planejar(doc)
        doc["componentes"]=proposal
        second,done=m.planejar(doc)
        self.assertTrue(done)
        self.assertEqual(second,proposal)

    def test_rejeita_contexto_divergente(self):
        doc=self.base()
        doc["componentes"][0]["resultados"][0]["contextoClinico"]="geral"
        with self.assertRaisesRegex(RuntimeError,"personalizado"):
            m.planejar(doc)

if __name__=="__main__": unittest.main()
