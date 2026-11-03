#!/usr/bin/env python3
"""Aplicador transacional do lote clínico CSAE: offline default, backup, CAS, sem prontuários.

Offline: python aplicar_lote_csae.py --manifest csae-lote-validacao-clinica-2026-11-03.json
Remote preview: python aplicar_lote_csae.py --manifest ... --remote
Apply (somente após homologação clínica):
  python aplicar_lote_csae.py --manifest ... --apply --confirm-project csaefloripa --approve-sha256 <SHA do manifesto> \
    --confirm-text 'HOMOLOGO LOTE CLINICO CSAE 2026-11-03'

Exige `pip install google-cloud-firestore` e credencial ADC, ou a variável de GitHub Actions
FIREBASE_SERVICE_ACCOUNT_CSAE com JSON da conta de serviço. Roles de Hosting/Rules não
conferem automaticamente permissão de leitura/escrita de documentos Firestore.
"""
import argparse, datetime, hashlib, json, os, pathlib, sys, tempfile
EXPECTED_PROJECT='csaefloripa'
CONFIRM='HOMOLOGO LOTE CLINICO CSAE 2026-11-03'
ALLOWED={'SinaisVitais':'valoresDeReferencia','ExamesLabImagem':'componentes'}

def digest(value):
    return hashlib.sha256(json.dumps(value,ensure_ascii=False,sort_keys=True,
        separators=(',',':')).encode('utf-8')).hexdigest()

def load_and_validate(path):
    raw=pathlib.Path(path).read_bytes()
    data=json.loads(raw)
    if data.get('projetoFirebase')!=EXPECTED_PROJECT or data.get('situacao')!='AGUARDANDO_HOMOLOGACAO':
        raise ValueError('Projeto ou estado do lote inesperado')
    seen=set()
    docs=data.get('documentos',[])
    if not docs or len(docs)>50:raise ValueError('Lote vazio ou excessivamente amplo')
    for x in docs:
        key=(x.get('colecao'),x.get('id'))
        if key in seen:raise ValueError('Documento repetido: '+str(key))
        seen.add(key)
        if key[0] not in ALLOWED or x.get('campo')!=ALLOWED[key[0]]:
            raise ValueError('Tentativa de atualizar coleção ou campo fora do escopo')
        if '/' in str(key[1]) or not key[1]:raise ValueError('ID Firestore inválido')
        if x.get('validacaoClinica')!='PENDENTE_VALIDACAO_CLINICA':
            raise ValueError('Estado de homologação inesperado: '+str(key))
        if digest(x.get('conteudoProposto'))!=x.get('sha256Proposto'):
            raise ValueError('Integridade SHA do proposto não confere: '+str(key))
        if not isinstance(x['conteudoProposto'],list):raise ValueError('Campo deve ser lista')
        if key[0]=='ExamesLabImagem':
            if len({c.get('componenteAnalisado') for c in x['conteudoProposto']})!=len(x['conteudoProposto']):
                raise ValueError('Componentes repetidos')
            rows=[r for c in x['conteudoProposto'] for r in c.get('resultados',[])]
        else:rows=x['conteudoProposto']
        for r in rows:
            lo,hi=r.get('valorMinimo'),r.get('valorMaximo')
            if lo is not None and hi is not None and lo>hi:raise ValueError('Intervalo invertido')
            if r.get('interpretacaoClinica') not in ('normal','alterado','informativo','indeterminado',None):
                raise ValueError('Interpretação inválida')
            if r.get('interpretacaoClinica')=='alterado' and not r.get('subconjuntoNHBVinculado'):
                raise ValueError('Alteração sem NHB; homologar ou corrigir previamente')
    return data, hashlib.sha256(raw).hexdigest()

def mensagem_permissao_firestore(fase, conta=''):
    """Explica um 403 da API sem expor o JSON de credenciais nem alterar dados."""
    principal = (' para ' + conta) if conta else ''
    return (f'PERMISSAO_FIRESTORE_403 durante {fase}{principal}. '
            'Confirme no IAM de csaefloripa as permissões datastore.databases.get '
            '(iniciar transação), datastore.entities.get (ler) e '
            'datastore.entities.update (gravar). O papel roles/datastore.user '
            'inclui essas permissões. Verifique se o vínculo é para a conta '
            'do secret FIREBASE_SERVICE_ACCOUNT_CSAE, sem condições restritivas. '
            'Firestore Security Rules não resolvem esse erro de credencial '
            'de servidor. Nenhum sucesso de gravação foi confirmado.')


def save_private(payload, prefix):
    base=pathlib.Path.home()/'csae-auditoria-clinica';base.mkdir(parents=True,exist_ok=True,mode=0o700)
    os.chmod(base,0o700)
    file=base/(prefix+'_'+datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S_%fZ')+'.json')
    fd=os.open(str(file), os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
    with os.fdopen(fd,'w',encoding='utf-8') as f:json.dump(payload,f,indent=2,ensure_ascii=False,default=str)
    return file

def client_from_env():
    from google.cloud import firestore
    from google.oauth2 import service_account
    value=os.getenv('FIREBASE_SERVICE_ACCOUNT_CSAE','').strip()
    if value:
        import base64
        try: obj=json.loads(value)
        except ValueError:obj=json.loads(base64.b64decode(value,validate=True).decode('utf-8'))
        if obj.get('project_id')!=EXPECTED_PROJECT:raise RuntimeError('Secret pertence a outro projeto')
        creds=service_account.Credentials.from_service_account_info(obj)
        # E-mail da identidade (não a chave privada) para conferir o principal IAM.
        print('Conta de serviço autenticada:', obj.get('client_email', '(sem client_email)'))
        db=firestore.Client(project=EXPECTED_PROJECT,credentials=creds)
    else:db=firestore.Client(project=EXPECTED_PROJECT)
    if db.project!=EXPECTED_PROJECT:raise RuntimeError('Cliente Firebase em projeto diferente')
    return db,firestore

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--manifest',required=True)
    p.add_argument('--remote',action='store_true',help='Preview contra os documentos remotos, somente leitura')
    p.add_argument('--apply',action='store_true',help='Escrita em transação, bloqueada sem homologação')
    p.add_argument('--confirm-project',default='')
    p.add_argument('--approve-sha256',default='')
    p.add_argument('--confirm-text',default='')
    args=p.parse_args()
    manifest,raw_sha=load_and_validate(args.manifest)
    print('Projeto:',EXPECTED_PROJECT,'| documentos:',len(manifest['documentos']))
    print('SHA256 arquivo:',raw_sha)
    for x in manifest['documentos']:
        print(' -',x['colecao']+'/'+x['id'], '->',x['campo'])
    if not args.remote and not args.apply:
        print('OFFLINE: integridade validada. Nenhum acesso ao Firebase.')
        return
    if args.apply and (args.confirm_project!=EXPECTED_PROJECT or args.approve_sha256!=raw_sha or args.confirm_text!=CONFIRM):
        raise RuntimeError('Publicação BLOQUEADA: homologação e confirmações insuficientes')
    db,firestore=client_from_env()
    refs=[db.collection(x['colecao']).document(x['id']) for x in manifest['documentos']]
    snaps=db.get_all(refs)
    bypath={s.reference.path:s for s in snaps}
    before=[];updates=[];already=[]
    for x,ref in zip(manifest['documentos'],refs):
        snap=bypath.get(ref.path)
        if not snap or not snap.exists:raise RuntimeError('Documento remoto ausente: '+ref.path)
        old=(snap.to_dict() or {}).get(x['campo'])
        actual_hash=digest(old)
        if actual_hash==x['sha256Proposto']:already.append(ref.path)
        elif actual_hash==x['sha256Anterior']:updates.append((x,ref))
        else:raise RuntimeError('Versão remota divergiu do backup. Abortado: '+ref.path)
        before.append({'caminho':ref.path,'campo':x['campo'],'conteudoAnterior':old,'sha256':actual_hash})
    print('Resultado da conciliação: atualizáveis:',len(updates),'já aplicados:',len(already))
    if not args.apply:
        print('REMOTE DRY-RUN: nenhuma escrita em produção.')
        return
    backup=save_private({'projeto':EXPECTED_PROJECT,'manifestoSha256':raw_sha,'documentos':before},'backup_lote_clinico')
    print('BACKUP PRIVADO ANTERIOR À ESCRITA:',backup)
    fase={'valor':'inicialização da transação (BeginTransaction)'}
    @firestore.transactional
    def commit(tx):
        # Todas as leituras devem ocorrer ANTES das escritas numa transação Firestore.
        fase['valor']='leitura dos documentos dentro da transação'
        currents=[ref.get(transaction=tx) for ref in refs]
        actions=[]
        fase['valor']='validação de pré-condições e preparação da escrita'
        for x,ref,snap in zip(manifest['documentos'],refs,currents):
            if not snap.exists:raise RuntimeError('Documento apagado durante transação: '+ref.path)
            current_hash=digest((snap.to_dict() or {}).get(x['campo']))
            if current_hash==x['sha256Proposto']:continue
            if current_hash!=x['sha256Anterior']:raise RuntimeError('Concorrência: '+ref.path)
            actions.append((x,ref))
        for x,ref in actions:tx.update(ref,{x['campo']:x['conteudoProposto']})
        fase['valor']='confirmação das atualizações na transação (Commit)'
        return [ref.path for _,ref in actions]
    from google.api_core.exceptions import PermissionDenied
    try:
        updated=commit(db.transaction())
    except PermissionDenied as exc:
        raise RuntimeError(mensagem_permissao_firestore(
            fase['valor'],
            db._credentials.service_account_email if hasattr(db._credentials, 'service_account_email') else ''
        )) from exc
    check={s.reference.path:s for s in db.get_all(refs)}
    for x,ref in zip(manifest['documentos'],refs):
        if digest((check[ref.path].to_dict() or {}).get(x['campo']))!=x['sha256Proposto']:
            raise RuntimeError('Leitura posterior divergiu; verificar publicação: '+ref.path)
    proof=save_private({'projeto':EXPECTED_PROJECT,'arquivoSha256':raw_sha,'atualizados':updated,
        'jaAplicados':already,'backup':str(backup),'verificacao':'OK'},'comprovante_lote_clinico')
    print('CONCLUÍDO:',len(updated),'documentos atualizados. Comprovante:',proof)

if __name__=='__main__':
    try:main()
    except Exception as e:
        print('SEM PUBLICAÇÃO CONFIRMADA:',e,file=sys.stderr);sys.exit(1)