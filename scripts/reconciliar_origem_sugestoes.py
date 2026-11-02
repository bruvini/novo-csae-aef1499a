#!/usr/bin/env python3
"""Reconciliação aditiva de autoria e origem de sugestões; dry-run por padrão.

Requer credenciais administrativas ADC e --apply para escrita. Lê somente
processos dos UIDs autores com origem ausente. Nunca imprime dados assistenciais.
"""
import argparse
from collections import Counter, defaultdict
from datetime import timedelta

PROJECT = 'csaefloripa'


def _text(value):
    return ' '.join(str(value or '').casefold().split())


def _date(value):
    if hasattr(value, 'to_datetime'):
        return value.to_datetime()
    return value


def candidates(suggestion, processes):
    """Exige autor, ação autoral, resultado, diagnóstico presente e data próxima."""
    created = _date(suggestion.get('dataCriacao'))
    uid = suggestion.get('autorId')
    action = _text(suggestion.get('textoIntervencao'))
    result = _text(suggestion.get('tituloResultadoOrigem') or suggestion.get('tituloResultadoVinculado'))
    if not (uid and created and action and result):
        return []
    found = []
    for process in processes:
        if process.get('enfermeiroId') != uid or process.get('status') != 'concluido':
            continue
        process_id = process.get('id') or process.get('idProcesso')
        if not process_id:
            continue
        completed = _date(process.get('dataConclusao'))
        if not completed or not timedelta(0) <= created - completed <= timedelta(hours=24):
            continue
        diagnosed = {d.get('id'): d.get('tituloDiagnostico') for d in
                     process.get('diagnostico', {}).get('diagnosticosSelecionados', [])}
        for planned in process.get('planejamento', {}).get('diagnosticosPlanejados', []):
            diag_id = planned.get('diagnosticoId')
            if not diag_id or diag_id not in diagnosed or _text(planned.get('resultadoEsperadoSelecionado')) != result:
                continue
            if any(i.get('tipo') == 'autoral' and _text(i.get('acaoPrescrita')) == action
                   for i in planned.get('intervencoesSelecionadas', [])):
                found.append((process_id, diag_id,
                              planned.get('tituloDiagnostico') or diagnosed[diag_id]))
    return list(dict.fromkeys(found))


def resolution(suggestion, processes):
    matches = candidates(suggestion, processes)
    if len(matches) == 1:
        _, diag_id, title = matches[0]
        return {'origemStatus': 'confirmada', 'diagnosticoOrigemId': diag_id,
                'tituloDiagnosticoOrigem': title,
                'tituloResultadoOrigem': suggestion.get('tituloResultadoOrigem') or suggestion.get('tituloResultadoVinculado') or ''}
    return {'origemStatus': 'ambigua' if matches else 'nao_recuperavel'}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true', help='Executar apenas atualização aditiva')
    args = parser.parse_args()
    from google.cloud import firestore
    from google.cloud.firestore_v1.base_query import FieldFilter
    db = firestore.Client(project=PROJECT)
    if db.project != PROJECT:
        raise RuntimeError('Projeto inesperado')
    suggestions = list(db.collection('intervencoesAutorais').stream())
    pending = defaultdict(list)
    for snap in suggestions:
        data = snap.to_dict() or {}
        if data.get('autorId') and not data.get('diagnosticoOrigemId'):
            pending[data['autorId']].append(snap)
    counts = Counter()
    profile_names = {}
    def profile_name(uid):
        if uid not in profile_names:
            profile = db.collection('usuarios').document(uid).get()
            profile_names[uid] = ((profile.to_dict() or {}).get('dadosPessoais') or {}).get('nomeCompleto')
        return profile_names[uid]
    for uid, records in pending.items():
        name = profile_name(uid)
        docs = db.collection('pacientesProcessoEnfermagem').where(filter=FieldFilter('uidUsuario', '==', uid)).select(['uidUsuario', 'processosEnfermagem']).stream()
        processes = [process for doc in docs for process in (doc.to_dict() or {}).get('processosEnfermagem', [])]
        for snap in records:
            data = snap.to_dict() or {}
            patch = resolution(data, processes)
            counts[patch['origemStatus']] += 1
            if isinstance(name, str) and name.strip() and not data.get('autorNomeResolvido'):
                patch['autorNomeResolvido'] = name.strip()
                counts['nomes_resolvidos'] += 1
            patch = {key: value for key, value in patch.items() if data.get(key) != value}
            if args.apply and patch:
                snap.reference.update(patch, option=db.write_option(last_update_time=snap.update_time))
                counts['atualizados'] += 1
    # Perfis dos autores com origem já registrada também recebem resolução aditiva.
    for snap in suggestions:
        data = snap.to_dict() or {}
        if not data.get('diagnosticoOrigemId') or data.get('autorNomeResolvido') or not data.get('autorId'):
            continue
        name = profile_name(data['autorId'])
        if isinstance(name, str) and name.strip():
            counts['nomes_resolvidos'] += 1
            if args.apply:
                snap.reference.update({'autorNomeResolvido': name.strip()}, option=db.write_option(last_update_time=snap.update_time))
                counts['atualizados'] += 1
    print('Modo:', 'APPLY' if args.apply else 'DRY-RUN')
    print('Sugestões lidas:', len(suggestions))
    for key in ('confirmada', 'ambigua', 'nao_recuperavel', 'nomes_resolvidos', 'atualizados'):
        print(f'{key}: {counts[key]}')


if __name__ == '__main__':
    main()
