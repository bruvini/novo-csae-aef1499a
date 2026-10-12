# Conciliação clínica dos 8 protocolos — estado e critérios de publicação

## Escopo

Somente **SinaisVitais**, **ExamesLabImagem** e **RevisaoSistemas**, com leitura das
NHBs já cadastradas em \`subconjuntosEnfermagem\`. Diagnósticos, intervenções,
resultados esperados, pacientes, prontuários e usuários ficam fora do escopo.

Os 8 PDFs de protocolos enviados são as fontes para **identificar** os itens.
A citação de uma medição ou teste no protocolo não o torna automaticamente uma
faixa universal de normalidade, uma indicação de solicitação, ou um achado anormal.

## Resultados já confirmados no Firestore — 12/10/2026

- 19 documentos de sinais vitais, 41 de exames laboratoriais/imagem, 23 de
  revisão de sistemas.
- Lote clínico inicial de 15 documentos: nenhum faltante, nenhum conflito;
  comparação interna com o manifesto \`catalogo-protocolos-csae-v1.json\`
  considerada compatível. **Isto não valida a atualidade científica do lote.**
- Índice exploratório: 80 conceitos; 51 correspondências nominais e 29 sem
  correspondência nominal. Zero alertas nas regras estreitas da auditoria.
- Frequência Cardíaca (FC): documento \`frequencia-cardiaca-fc-09c0fe7869\`,
  2 regras, **nenhuma faixa pediátrica reconhecida** no inventário exploratório.
- Frequência Respiratória (FR): documento com cinco faixas pediátricas
  reconhecidas; **não comprova cobertura clínica completa**.

## Falhas conhecidas da busca exploratória

- \`Hemoglobina\` também encontra hemoglobina glicada ou eletroforese:
  a correspondência textual **não comprova equivalência de componente**.
- \`TFGe\` foi relacionada ao clearance de Cockcroft–Gault por sinônimo
  expansivo. **Não são a mesma medição**; requer conferência específica.
- \`Teste para sífilis\` pode parecer ausente apesar de existir
  \`Sorologia para Sífilis — Teste Treponêmico (TR) + VDRL\`:
  nomes de testes e componentes exigem conciliação semântica.
- \`Exsudato\` pode ser ferida ou orofaringe: distinguir por sistema,
  exame físico pai e achado; não consolidar apenas pela palavra.
- Parte dos 29 itens sem match pode ser um achado ou componente aninhado,
  não um documento ausente.

**Não usar os números 51/29 para cadastrar ou excluir itens automaticamente.**

## Evidências de referência para revisão prioritária

### Volume 5, p. 11 do PDF (Quadros 2.2 e 2.3)

Quadro 2.2: limiares superiores de FR por idade (menores de 2 meses até 60;
2–11 meses até 50; 12 meses a 5 anos até 40; 6–8 anos até 30;
acima de 8 anos até 20 movimentos/min). Trata-se de limite superior;
não define limite inferior.

Quadro 2.3: FC apresentada por idades **pontuais**, não intervalos contínuos:

| Idade descrita | Variação registrada (bpm) |
|---|---:|
| Recém-nato | 70–170 |
| 11 meses | 80–160 |
| 2 anos | 80–130 |
| 4 anos | 80–120 |
| 6 anos | 75–115 |
| 8 anos | 70–110 |
| 10 anos | 70–110 |

**NÃO converter automaticamente esses pontos em intervalos etários**:
o motor \`idadeCompativel\` usa \`differenceInYears\` para faixas em anos.
\`idadeMinima=0, idadeMaxima=0, idadeUnidade=anos\` abrange todo o primeiro ano
de vida; **não corresponde especificamente ao recém-nascido**. Definir faixas
contínuas exige fonte adicional e validação clínica. Preservar o documento FC.

### Volume 7, p. 22 do PDF (Quadros 8.1 e 8.2)

Contém critérios de alteração para **acolhimento e classificação de risco**:
FC, FR, temperatura, oximetria, PA e glicemia, inclusive pediátricos.
Esses limiares podem diferir das faixas usuais; devem levar contexto
\`classificacao_risco\` ou mecanismo equivalente aprovado, nunca simplesmente
sobrescrever regra geral de normalidade.

**Atenção para possível inconsistência no texto do Quadro 8.1**:
a temperatura adulta aparece como "≥ 35,9 ºC" na categoria de valores
alterados. Não importar esse critério sem esclarecimento institucional da
fonte (pode ser erro tipográfico). Não transformar em corte automático.

## Etapa operacional segura

No Cloud Shell autenticado, a partir da main atualizada:

\`\`\`bash
git pull --ff-only origin main
.venv-csae-release/bin/python -m unittest discover -s scripts/tests -p 'test_exportar_inventario_clinico_8v.py'
.venv-csae-release/bin/python scripts/exportar-inventario-clinico-8v.py
\`\`\`

Exportação permitida **somente** para documentos clínicos e NHBs; campos são
restritos a listas autorizadas. O relatório privado em
\`~/csae-auditoria-clinica/inventario_clinico_completo_8v_*.json\` fornece
dados internos de faixas, unidades, contextos, resultados, propedêutica, achados,
opções e NHBs. **Nenhuma escrita Firestore**.

A partir dele, classificar cada candidato e os demais dados dos PDFs como:
\`PRESERVAR\`, \`COMPLEMENTAR_DOCUMENTO\`, \`COMPLEMENTAR_COMPONENTE\`,
\`NOVO_DOCUMENTO\`, \`AMBIGUO\`, \`CRITERIO_DE_TRIAGEM\`,
\`PENDENTE_FONTE\` ou \`PENDENTE_NHB\`.
Exigir sempre origem (volume/página ou referência externa), interpretação,
idade/sexo, unidade, contexto e NHB proposta para alterações.

## Critérios antes de qualquer migração

1. Corresponder **semântica e unidade**, não só nomes.
2. Distinguir limites de triagem, limiares de encaminhamento, referências de
   laboratório, metas terapêuticas e normalidade.
3. Manter nomes/IDs de documentos, componentes, exames físicos, achados e
   opções que já aparecem em registros históricos.
4. Atualizar listas aninhadas sem apagar nenhum elemento legado; comparar
   estado remoto dentro de transação, com relatório e reversibilidade planejada.
5. Nenhuma faixa alterada \`interpretacaoClinica=alterado\` e nenhum achado
   \`ehAlteracao=true\` pode iniciar uso clínico sem NHB válida ou decisão de
   interpretação indeterminada fundamentada. Vínculo NHB não define diagnóstico.
6. Exigir revisão institucional dos critérios clínicos e teste com pacientes
   **fictícios**, inclusive recém-nascido, lactente e gestante.
7. Não executar \`--apply\` em scripts antigos como substituto da reconciliação.

## Estado

**Inventário remoto de valores completos pendente de recebimento.**
A lista de 80 conceitos é exploratória, não exaustiva; a varredura crítica
volume a volume e a revisão clínica ainda não terminaram.
