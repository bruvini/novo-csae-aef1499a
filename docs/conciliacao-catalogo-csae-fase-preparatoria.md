# Conciliação clínica — planilha CSAE × inventário Firestore (somente leitura)

**Fase:** preparação de propostas para validação humana. **Não é cadastro nem migração.**

## Fontes e escopo verificados

A pasta do Drive \`1z_BIFM20QV-YmqzrXgcxWSak2z2KXfHp\` contém a planilha nativa "Exame físico" com três abas: \`SinaisVitais\`, \`RevisaoSistemas\` e \`ExamesLabImagem\`. Na consulta de 11/10/2026, o conteúdo não vazio observado nessas abas era, respectivamente, **66 linhas / 11 sinais distintos**, **50 linhas / 8 sistemas** e **67 linhas / 12 exames**. O inventário clínico disponível na mesma data informa um catálogo Firestore mais amplo (18 sinais, 16 sistemas, 34 exames). As origens podem ter vigências e nomenclaturas diferentes: **ausência na planilha não justifica apagar nenhum cadastro**.

Os arquivos "Diagnósticos de Enfermagem e Resultados Esperados", "Intervenções de Enfermagem" e os protocolos volumes 1 a 8 são referências para revisão semântica e dos vínculos CIPE/NHB; **não se misturam automaticamente com os parâmetros de exame físico**.

## Como gerar propostas sem tocar na produção

1. No ambiente autorizado (ex.: Cloud Shell com ADC), obter inventário do catálogo sem dados de pacientes/usuários:

       .venv-csae-release/bin/python scripts/auditar-catalogo-clinico.py

   O comando gera \`~/csae-auditoria-clinica/inventario_clinico_YYYYMMDD_HHMMSS.json\` (permissão 0600). Ele **lê** exclusivamente coleções de catálogo; não grava no Firestore.

2. Na planilha "Exame físico" do Drive, usar **Arquivo → Fazer download → Microsoft Excel (.xlsx)**. O original não deve ser editado para a conciliação.

3. Executar a comparação **localmente**, sem credenciais de Firebase:

       npm run conciliar:clinical -- /caminho/inventario_clinico_YYYYMMDD_HHMMSS.json "/caminho/Exame físico.xlsx" /caminho/relatorio-conciliacao.json

   O caminho de saída deve ser novo (o comando não sobrescreve relatórios existentes). O arquivo é gerado com permissão 0600. Evitar versionar o inventário de produção no GitHub; manter os dados no ambiente institucional autorizado.

## O que o relatório significa

Cada proposta registra a aba, nome do item, números das linhas na planilha e **IDs existentes** no Firestore, com uma ação preliminar:
- \`reutilizar\`: correspondência nominal e, quando aplicável, campos exportados equivalentes. Ainda requer validação de vigência.
- \`conferir-referencias\`: item encontrado; faixas/valores/condições divergem ou não foram comparados detalhadamente.
- \`complementar-candidato\`: partes da fonte podem estar ausentes em um item existente; **não adicioná-las diretamente**.
- \`novo-candidato\`: sem equivalência nominal; pesquisar sinônimos e vinculação a outros itens.
- \`revisao-obrigatoria\`: dados ambíguos, tipo Laboratorial/Imagem divergente, duplicidade ou NHB não conciliada.

A comparação de exames laboratoriais **não** declara correspondência perfeita de faixa apenas por encontrar o componente. Exames classificatórios e titulações requerem revisão de resultados e complementos. Nenhuma proposta autoriza renomeação de campo usado como chave de prontuário.

## Limites, integridade e aprovação

- Um inventário representa um **retrato temporal**, não uma transação ou leitura sempre atual. Gerar novo inventário antes de executar qualquer plano aprovado.
- Diferenças de unidades, idades, gestação, metas terapêuticas, contextos de risco, tipo de exame e nomenclatura CIPE devem ser reconciliadas com os protocolos vigentes pela Comissão CSAE.
- Alteração de valor clínico, exclusão/arquivamento, mapeamento NHB ou inferência diagnóstica **somente com aprovação técnica e trilha de auditoria**. Não alterar dados de pacientes.
- Este utilitário NÃO tem opções de \`--apply\` nem acessa a rede: **não existe caminho de importação ou escrita**.
- Os itens aprovados serão submetidos depois em um manifesto versionado de mudanças idempotentes, com conferência de ID, backup e rollback antes de qualquer publicação.
