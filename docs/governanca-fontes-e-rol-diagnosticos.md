# Fontes clínicas: correção de escopo e governança do rol (11/10/2026)

## Escopo autorizado

**A pasta do Drive fornecida pelo responsável do CSAE destina-se SOMENTE à análise de diagnósticos de enfermagem, resultados esperados e intervenções.** Não utilizar os arquivos dessa pasta como fontes para valores de sinais vitais, faixas laboratoriais, exame físico ou revisão de sistemas. A ferramenta errônea de conciliação de exames físicos do PR #34 foi retirada com os comandos e testes associados. A planilha de 24 células formatadas como data pode ser um achado de qualidade do arquivo, mas **não integra o plano de atualização de exames ou sinais vitais**.

Para parâmetros e exames físicos, a fonte de trabalho são os oito Protocolos de Enfermagem institucionais fornecidos à conversa, a parametrização atual do Firestore e a aprovação clínica pela CSAE. Não inventar valores nem importar referências de outras planilhas.

## Diagnósticos e suas relações

O Firestore mantém **635 documentos de diagnóstico** (último inventário disponível) na coleção \`rolEnfermagem\`. Cada documento possui \`tituloDiagnostico\`, \`descricaoDiagnostico\`, \`subconjuntos[]\`, \`resultadosEsperados[]\`, e cada resultado contém \`intervencoes[]\` com ação do enfermeiro, ação prescrita e materiais de apoio. O Processo de Enfermagem referencia diagnósticos por seu **ID Firestore**; não remover/renomear documentos históricos sem migração aprovada.

O arquivo nativo de referência **"Diagnósticos de Enfermagem e Resultados Esperados"** contém:
- \`ListaDiagnosticos\`: **2.104 linhas** representando **629 títulos distintos**; repetição pode expressar múltiplos resultados e intervenções.
- \`DE-RE\`: **571 linhas** de relações diagnóstico–resultado;
- \`ListaResultadosEsperados\`: **950 linhas** de resultados–intervenções prescritas.

Esses totais descrevem a leitura do Drive na auditoria; não representam novas entidades para cadastrar. Diferentes versões, sinônimos e relacionamentos devem ser avaliados pela comissão.

## Ferramentas seguras (nenhuma gravação no Firestore)

1. **Inventário detalhado** — no Cloud Shell autenticado, com ADC e repositório atualizado:

       .venv-csae-release/bin/python scripts/auditar-rol-diagnosticos.py

   Lê apenas \`rolEnfermagem\` e \`subconjuntosEnfermagem\`. Produz JSON privado (0600) em \`~/csae-auditoria-clinica/rol_diagnosticos_*.json\` com diagnósticos, resultados esperados, intervenções, subconjuntos e alertas agregados. Nunca lê dados de usuários ou pacientes.

2. **Fonte do Drive** — no arquivo "Diagnósticos de Enfermagem e Resultados Esperados", selecionar **Arquivo → Fazer download → Microsoft Excel (.xlsx)**. Não alterar o original nem compartilhar no GitHub um XLSX institucional.

3. **Conciliação offline** — usa o JSON do passo 1 e XLSX do passo 2, sem credenciais ou rede:

       npm run conciliar:rol -- /caminho/rol_diagnosticos_20261011.json "/caminho/Diagnósticos de Enfermagem e Resultados Esperados.xlsx" /caminho/relatorio_rol.json

   A ferramenta exige as três abas e seus cabeçalhos, diferencia resultados e intervenções por associação, detecta inconsistências de vínculos e preserva todos os IDs. O caminho de saída deve ser novo; gera arquivo privado sem sobrescrever.

**A saída não é um script de importação.** Antes de qualquer edição em \`rolEnfermagem\`, revisar manualmente os itens com \`revisao-csae\` e obter aprovação clínica expressa para cada ajuste. Não excluir diagnósticos apenas porque estão ausentes na planilha.
