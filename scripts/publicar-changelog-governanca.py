#!/usr/bin/env python3
"""Publicação idempotente após merge, regras, Hosting e verificação funcional."""
import argparse
from google.cloud import firestore

PROJECT = 'csaefloripa'
ENTRY_ID = 'governanca-intervencoes-20261102'
TITLE = 'Novidades na Gestão das Intervenções de Enfermagem'
DESCRIPTION = (
    'Seguimos aprimorando o Portal com as contribuições dos enfermeiros! '
    'Agora ficou mais fácil registrar intervenções individualizadas, organizar '
    'sugestões semelhantes e revisar propostas com múltiplas ações. A Gestão de '
    'Conteúdos ganhou recursos de curadoria, e o Painel Estatístico reúne '
    'indicadores para acompanhar as contribuições e apoiar a melhoria contínua.'
)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--publish', action='store_true', help='Gravar após validação funcional')
    args = parser.parse_args()
    client = firestore.Client(project=PROJECT)
    if client.project != PROJECT:
        raise RuntimeError('Projeto Firebase divergente')
    ref = client.collection('changelogs').document(ENTRY_ID)
    existing = ref.get()
    if existing.exists:
        if existing.get('titulo') != TITLE or existing.get('descricao') != DESCRIPTION:
            raise RuntimeError('ID de changelog ocupado com conteúdo diferente; revisar manualmente')
        if not existing.get('dataHora'):
            raise RuntimeError('Changelog existente sem timestamp confirmado')
        print(f'EXISTENTE {existing.id} {existing.get("dataHora").isoformat()}')
        return
    if not args.publish:
        print(f'PENDENTE {ENTRY_ID}: usar --publish após a validação')
        return
    ref.create({'titulo': TITLE, 'descricao': DESCRIPTION, 'dataHora': firestore.SERVER_TIMESTAMP})
    saved = ref.get()
    if not saved.exists or saved.get('titulo') != TITLE or saved.get('descricao') != DESCRIPTION or not saved.get('dataHora'):
        raise RuntimeError('Gravação não confirmada por leitura do Firestore')
    print(f'PUBLICADO {saved.id} {saved.get("dataHora").isoformat()}')
    print('O Dashboard lê a coleção changelogs; confirmar visualmente com conta autorizada.')


if __name__ == '__main__':
    main()
