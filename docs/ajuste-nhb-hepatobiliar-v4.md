# Ajuste V4 — NHB nos exames hepatobiliares

## Decisão de nomenclatura

Utilizar o subconjunto **já existente** no Firestore:
`Regulação - crescimento celular e desenvolvimento funcional`.
Não criar outro subconjunto, nem substituir por Nutrição ou Eliminações.

**Escopo exclusivamente clínico:** cinco exames de `ExamesLabImagem`
(cadastrados no lote 2 e atualizados na V3):
TGO/AST, TGP/ALT, Fosfatase Alcalina, GGT e Bilirrubinas Totais e Frações.

## Mudança proposta

- Trocar `subconjuntoNHBVinculado` de `Eliminações` para
  `Regulação - crescimento celular e desenvolvimento funcional`
  em **12 regras existentes marcadas como `alterado`**.
- Preservar **todos** os limites de referência, nomes de componentes,
  estados `normal` e `informativo`, IDs e histórico clínico.
- Não mexer nos 8 outros exames da V3, fundoscopia, hemograma,
  sinais vitais, prontuários, diagnósticos, intervenções ou usuários.
- A NHB é um vínculo potencial a ser ponderado pelo enfermeiro, **não**
  diagnóstico de enfermagem nem evidência isolada de necessidade prejudicada.
- Atenção: valores baixos de AST/ALT/GGT/FA e de bilirrubina total já
  estavam rotulados como `alterado` na V3; este ajuste **não valida**
  a relevância clínica desses limites. Revisar posteriormente a
  classificação inferior conforme laboratório e protocolo institucional,
  sem criar alterações automáticas sem evidência.

## Aplicação no Cloud Shell

Após atualizar a `main`, executar este comando para gravar os 12 vínculos:

```bash
cd ~/novo-csae-aef1499a &&
git pull --ff-only origin main &&
.venv-csae-release/bin/python -m unittest discover -s scripts/tests -p 'test_atualizar_nhb_hepatobiliar_v4.py' &&
.venv-csae-release/bin/python scripts/atualizar-nhb-hepatobiliar-v4.py --apply --confirm-project csaefloripa
```

O script confirma previamente que o subconjunto NHB de destino existe,
cria backup local privado (permissão 0600) e executa a atualização
**dos cinco documentos em uma única transação Firestore**. Também cria
cinco documentos de auditoria em `auditoriaCatalogoClinicoNHBV4`, separados
dos documentos clínicos para preservar a compatibilidade com as
Firestore Rules da Gestão de Conteúdos.

É idempotente: depois de aplicado, uma segunda execução não fará
alterações adicionais. Se alguém editou uma referência ou NHB de origem
desde a V3, a operação é abortada em vez de sobrescrever.

Ao terminar, esperar mensagem:
`FIRESTORE ATUALIZADO COM SUCESSO: 5 exames e 12 vínculos NHB.`

A Gestão de Conteúdos já lê a coleção `ExamesLabImagem` em tempo real;
portanto **não há deploy de Hosting necessário** para esta alteração de
dados. Nenhuma escrita no Firebase foi efetuada a partir do GitHub.
