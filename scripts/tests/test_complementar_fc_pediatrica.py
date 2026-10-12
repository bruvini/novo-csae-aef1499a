"""Testes unitários offline do plano FC pediátrica, sem Firebase remoto."""
import importlib.util
import unittest
from pathlib import Path

source=Path(__file__).resolve().parents[1]/"complementar-fc-pediatrica.py"
spec=importlib.util.spec_from_file_location("csae_fc_pediatrica",source)
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

class PlanoFCPediatricaTest(unittest.TestCase):
    def base(self):
        return {"sinalVitalNome":"Frequência Cardíaca (FC)","unidadeMedida":"bpm",
                "valoresDeReferencia":[
                    {"idadeMinima":None,"idadeMaxima":None,"idadeUnidade":"",
                     "criterioSexo":"Ambos","valorMinimo":60,"valorMaximo":100,
                     "nomeAlteracao":"Frequência Cardíaca Normal","subconjuntoNHBVinculado":""},
                    {"idadeMinima":None,"idadeMaxima":None,"idadeUnidade":"",
                     "criterioSexo":"Ambos","valorMinimo":101,"valorMaximo":None,
                     "nomeAlteracao":"Taquicardia","subconjuntoNHBVinculado":"Oxigenação"}]}

    def test_preserva_adulto_e_acrescenta_21_faixas(self):
        new,already=mod.preparar(self.base())
        self.assertFalse(already)
        self.assertEqual(len(new),23)
        self.assertEqual(len(mod.BANDS),7)
        self.assertEqual(new[0]["idadeMinima"],18)
        self.assertEqual(new[1]["idadeMinima"],18)
        self.assertEqual(new[0]["idadeUnidade"],"anos")
        for i,(_,unit,lo,hi,a,b) in enumerate(mod.BANDS):
            low,normal,high=new[2+i*3:5+i*3]
            self.assertEqual(normal["valorMinimo"],a)
            self.assertEqual(normal["valorMaximo"],b)
            self.assertEqual(normal["idadeUnidade"],unit)
            self.assertEqual(normal["idadeMinima"],lo)
            self.assertEqual(normal["idadeMaxima"],hi)
            self.assertEqual(low["valorMaximo"],a-1)
            self.assertEqual(high["valorMinimo"],b+1)
            self.assertEqual(normal["interpretacaoClinica"],"normal")
            self.assertEqual(low["interpretacaoClinica"],"alterado")
            self.assertEqual(high["interpretacaoClinica"],"alterado")
            self.assertEqual(low["subconjuntoNHBVinculado"],mod.NHB)
            self.assertEqual(high["subconjuntoNHBVinculado"],mod.NHB)

    def test_nao_aceita_mudanca_no_registro(self):
        doc=self.base()
        doc["valoresDeReferencia"][0]["valorMaximo"]=110
        with self.assertRaisesRegex(RuntimeError,"Regras originais mudaram"):
            mod.preparar(doc)

    def test_idempotente(self):
        d=self.base();refs,_=mod.preparar(d)
        d["valoresDeReferencia"]=refs
        proposed,already=mod.preparar(d)
        self.assertTrue(already)
        self.assertEqual(proposed,[])

    def test_rejeita_faixa_adulta_ja_customizada(self):
        d=self.base();d["valoresDeReferencia"][0]["idadeMinima"]=18
        with self.assertRaisesRegex(RuntimeError,"recorte etário"):
            mod.preparar(d)

if __name__=="__main__":
    unittest.main()
