#!/usr/bin/env python3
"""Publica uma novidade após deploy e confirma leitura da coleção usada no Dashboard."""
import argparse
from google.cloud import firestore

PROJECT = 'csaefloripa'
ENTRIES = {
    'processo-indicadores-20261102': (
        'Melhorias no Processo de Enfermagem e nos Indicadores',
        'Atualizamos o Processo de Enfermagem para facilitar o planejamento e a conclusão das consultas com diagnósticos positivos. Também aprimoramos a apresentação dos indicadores do Portal.',
    ),
    'acessos-painel-20261102': (
        'Acessos Mais Confiáveis no Painel Estatístico',
        'Melhoramos o acompanhamento dos logins registrados. O gráfico apresenta apenas os períodos com eventos datados e usa escalas que tornam as barras mais legíveis.',
    ),
}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('entry', choices=ENTRIES)
    parser.add_argument('--publish', action='store_true', help='Gravar somente após deploy e validação funcional')
    args = parser.parse_args()
    db = firestore.Client(project=PROJECT)
    if db.project != PROJECT:
        raise RuntimeError('Projeto divergente')
    title, description = ENTRIES[args.entry]
    ref = db.collection('changelogs').document(args.entry)
    by_title = list(db.collection('changelogs').where('titulo', '==', title).limit(1).stream())
    if by_title:
        print(f'EXISTENTE {by_title[0].id}')
        return
    existing = ref.get()
    if existing.exists:
        if existing.get('titulo') != title:
            raise RuntimeError('ID ocupado por outra publicação')
        print(f'EXISTENTE {existing.id}')
        return
    if not args.publish:
        print(f'PENDENTE {args.entry}: use --publish após deploy e validação')
        return
    ref.create({'titulo': title, 'descricao': description, 'dataHora': firestore.SERVER_TIMESTAMP})
    saved = ref.get()
    if not saved.exists or saved.get('titulo') != title or saved.get('dataHora') is None:
        raise RuntimeError('A publicação não foi confirmada pela leitura do Firestore')
    print(f'PUBLICADO {saved.id} {saved.get("dataHora").isoformat()}')
    print('Conferir o mural e o histórico completo no Dashboard com uma conta aprovada.')


if __name__ == '__main__':
    main()
