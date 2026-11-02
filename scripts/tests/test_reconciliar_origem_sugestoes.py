import unittest
from datetime import datetime, timedelta, timezone

from scripts.reconciliar_origem_sugestoes import resolution


NOW = datetime(2026, 11, 2, 15, tzinfo=timezone.utc)


def suggestion(**extra):
    return {'autorId': 'u1', 'textoIntervencao': 'Orientar caminhada',
            'tituloResultadoVinculado': 'Mobilidade', 'dataCriacao': NOW, **extra}


def process(process_id='p1', diag_id='d1', result='Mobilidade', action='Orientar caminhada', **extra):
    return {'id': process_id, 'enfermeiroId': 'u1', 'status': 'concluido',
            'dataConclusao': NOW - timedelta(minutes=5),
            'diagnostico': {'diagnosticosSelecionados': [{'id': diag_id, 'tituloDiagnostico': f'Diagnóstico {diag_id}'}]},
            'planejamento': {'diagnosticosPlanejados': [{
                'diagnosticoId': diag_id, 'tituloDiagnostico': f'Diagnóstico {diag_id}',
                'resultadoEsperadoSelecionado': result,
                'intervencoesSelecionadas': [{'tipo': 'autoral', 'acaoPrescrita': action}],
            }]}, **extra}


class ReconciliationTests(unittest.TestCase):
    def test_unique_match_confirms_without_patient_fields(self):
        result = resolution(suggestion(), [process()])
        self.assertEqual(result['diagnosticoOrigemId'], 'd1')
        self.assertEqual(result['origemStatus'], 'confirmada')
        self.assertEqual(set(result), {'origemStatus', 'diagnosticoOrigemId', 'tituloDiagnosticoOrigem', 'tituloResultadoOrigem'})

    def test_same_result_in_two_diagnoses_is_ambiguous(self):
        self.assertEqual(resolution(suggestion(), [process(), process('p2', 'd2')]), {'origemStatus': 'ambigua'})

    def test_same_text_different_process_is_ambiguous(self):
        self.assertEqual(resolution(suggestion(), [process(), process('p2')]), {'origemStatus': 'ambigua'})

    def test_missing_or_wrong_context_is_not_recovered(self):
        self.assertEqual(resolution(suggestion(), [process(result='Outro')]), {'origemStatus': 'nao_recuperavel'})
        self.assertEqual(resolution(suggestion(dataCriacao=None), [process()]), {'origemStatus': 'nao_recuperavel'})
        self.assertEqual(resolution(suggestion(), [process(enfermeiroId='outro')]), {'origemStatus': 'nao_recuperavel'})


if __name__ == '__main__':
    unittest.main()
