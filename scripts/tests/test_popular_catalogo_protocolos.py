"""Garantias de escopo, idempotência e prevenção de duplicidade da carga clínica."""
import importlib.util
import json
import unittest
import sys
from types import ModuleType
from unittest.mock import patch
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MODULE = ROOT / "scripts/popular-catalogo-protocolos.py"
spec = importlib.util.spec_from_file_location("catalogo_protocolos", MODULE)
catalogo = importlib.util.module_from_spec(spec)
spec.loader.exec_module(catalogo)
manifesto = json.loads(catalogo.MANIFEST.read_text(encoding="utf-8"))

class CargaClinicaTest(unittest.TestCase):
    def nhbs(self):
        return {catalogo.normalizar(x) for x in (
            "Oxigenação","Integridade física","Sensopercepção","Regulação neurológica",
            "Comunicação","Segurança emocional","Hidratação","Regulação vascular",
            "Eliminações","Nutrição","Regulação térmica","Sono e repouso",
        )}

    def empty(self):
        return {c: [] for c in (*catalogo.COLLECTIONS, catalogo.NHB_COLLECTION)}

    def test_pacote_valido_e_genuinamente_aditivo(self):
        keys=catalogo.validar_manifesto(manifesto,self.nhbs())
        self.assertGreater(len(keys),40)
        total=catalogo.indicadores(manifesto)
        self.assertEqual(total["sistemasNovos"],7)
        self.assertEqual(total["examesFisicos"],22)
        self.assertEqual(total["achados"],70)
        self.assertEqual(total["opcoes"],192)
        self.assertEqual(total["sinaisNovos"],1)
        self.assertEqual(total["examesNovos"],7)
        self.assertNotIn("rolEnfermagem",manifesto)

    def test_cadastra_fr_uma_so_vez_por_idade(self):
        fr=manifesto["SinaisVitais"][0]
        self.assertEqual(fr["sinalVitalNome"],"Frequência Respiratória (FR)")
        self.assertEqual(len(fr["valoresDeReferencia"]),5)
        self.assertTrue(all(r["subconjuntoNHBVinculado"]=="Oxigenação"
            for r in fr["valoresDeReferencia"]))
        self.assertTrue(all(r["valorMaximo"] is None for r in fr["valoresDeReferencia"]))
        self.assertTrue(all(r["interpretacaoClinica"]=="alterado" for r in fr["valoresDeReferencia"]))

    def test_nhb_inexistente_bloqueia_antes_de_gravar(self):
        with self.assertRaisesRegex(ValueError,"NHB inexistente"):
            catalogo.validar_manifesto(manifesto,{"outra"})

    def test_duplicidade_nome_e_idempotencia(self):
        snap=self.empty()
        novas,puladas,conflitos=catalogo.planejar(manifesto,snap)
        self.assertEqual(len(novas),15)
        self.assertFalse(conflitos)
        for entry in novas:
            snap[entry["colecao"]].append({"id":entry["id"],"data":entry["data"]})
        novamente,puladas,conflitos=catalogo.planejar(manifesto,snap)
        self.assertFalse(novamente)
        self.assertEqual(len(puladas),15)
        self.assertFalse(conflitos)

    def test_protege_alias_ao_encontrar_nome_equivalente(self):
        snap=self.empty()
        snap["SinaisVitais"].append({"id":"old-fr", "data":{
            "sinalVitalNome":"Frequência Respiratória — FR",
            "unidadeMedida":"irpm","valoresDeReferencia":[]}})
        novas,puladas,conflitos=catalogo.planejar(manifesto,snap)
        self.assertEqual(len(novas),14)
        self.assertEqual(len(puladas),1)
        self.assertEqual(len(conflitos),0)
        self.assertEqual(puladas[0]["titulo"],"Frequência Respiratória (FR)")

    def test_transacao_cria_documento_e_reservas_em_uma_operacao(self):
        """SDK Python devolve DocumentSnapshot via doc.get(transaction=tx).
        Evita regressao para tx.get(doc) que pode ser um generator.
        """
        class FakeSnapshot:
            def __init__(self, exists):
                self.exists = exists

        class FakeTransaction:
            def __init__(self):
                self.pending = []
                self.reads = []
                self.has_written = False

            def get(self, _reference):
                raise AssertionError("Nao use tx.get(ref): retorna generator neste SDK.")

            def create(self, reference, value):
                self.has_written = True
                self.pending.append((reference.path, value))

        class FakeDocument:
            def __init__(self, path, store):
                self.path = path
                self.id = path.rsplit("/", 1)[-1]
                self.store = store

            def get(self, transaction=None):
                if transaction is None:
                    raise AssertionError("Faltou transaction=tx.")
                if transaction.has_written:
                    raise AssertionError("Leitura apos escrita na transacao.")
                transaction.reads.append(self.path)
                return FakeSnapshot(self.path in self.store)

        class FakeCollection:
            def __init__(self, name, store):
                self.name = name
                self.store = store

            def document(self, document_id):
                return FakeDocument(self.name + "/" + document_id, self.store)

        class FakeClient:
            def __init__(self, store=None):
                self.store = store if store is not None else {}
                self.tx = FakeTransaction()

            def collection(self, name):
                return FakeCollection(name, self.store)

            def transaction(self):
                return self.tx

        mock_firestore = ModuleType("google.cloud.firestore")
        mock_firestore.SERVER_TIMESTAMP = object()
        mock_firestore.transactional = lambda fn: fn
        mock_cloud = ModuleType("google.cloud")
        mock_cloud.firestore = mock_firestore
        mock_google = ModuleType("google")
        mock_google.cloud = mock_cloud
        modules = {
            "google": mock_google, "google.cloud": mock_cloud,
            "google.cloud.firestore": mock_firestore,
        }
        item = {
            "colecao": "SinaisVitais", "id": "teste-fr",
            "titulo": "Frequencia Respiratoria (FR)",
            "data": {"sinalVitalNome": "Frequencia Respiratoria (FR)"},
            "chaves": ["parametro--frequencia-respiratoria"],
        }
        with patch.dict(sys.modules, modules):
            client = FakeClient()
            catalogo.gravar_documento(client, item)
            self.assertEqual(len(client.tx.reads), 2)
            self.assertEqual(len(client.tx.pending), 2)
            paths = {path for path, _ in client.tx.pending}
            self.assertEqual(paths, {
                "SinaisVitais/teste-fr",
                "identidadesCatalogoClinico/parametro--frequencia-respiratoria",
            })
            for ocupado in paths:
                blocked = FakeClient({ocupado: {"jaExiste": True}})
                with self.assertRaisesRegex(RuntimeError, "ocupado|reservada"):
                    catalogo.gravar_documento(blocked, item)
                self.assertEqual(blocked.tx.pending, [])

    def test_nao_havera_exclusao_de_nomes_da_base(self):
        self.assertTrue(all(isinstance(item["nomeSistema"],str)
            for item in manifesto["RevisaoSistemas"]))
        self.assertTrue(all("exames" in s for s in manifesto["RevisaoSistemas"]))

if __name__=="__main__":
    unittest.main()
