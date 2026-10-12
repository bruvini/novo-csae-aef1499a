# Proteção dos identificadores e vínculos do rol de enfermagem

**Estado:** alterações de código e regras aguardam homologação e publicação coordenada.

## Dependências reais dos processos clínicos

O banco mantém diagnósticos em \`rolEnfermagem\`. \`EtapaDiagnostico\` salva o \`id\` e \`tituloDiagnostico\` selecionado; \`EtapaPlanejamento\` usa \`diagnosticoId\`, \`resultadoEsperadoSelecionado\` (título textual) e \`intervencoesSelecionadas[].acaoPrescrita\` (texto da intervenção). Remover ou renomear um desses elementos pode impedir a reprodução fiel da assistência histórica.

## Mudanças propostas

- Criação de novos diagnósticos: preflight compara o título normalizado contra os existentes (635 documentos no último inventário), evitando novos homônimos. Reserva imutável \`diagnostico--<titulo-normalizado>\` em \`identidadesCatalogoClinico\` pela mesma transação que grava o diagnóstico. Não migra, combina, exclui nem reserva retroativamente títulos históricos.
- Edição do rol: transação lê o documento mais recente e permite acrescentar resultados, intervenções, vínculos e ajustar descrições. Proíbe renomear título, remover vinculação original, remover/renomear resultado esperado e remover/renomear ação prescrita ou do enfermeiro associada.
- UI de Gestão de Conteúdos: nomes e ações antigas ficam somente leitura, exclusão permanente de diagnóstico/NHB fica desabilitada, com mensagens claras. Novas inclusões continuam possíveis.
- Regras \`firestore.rules\`: proíbem exclusão direta de qualquer coleção de conteúdo clínico, inclusive \`rolEnfermagem\` e \`subconjuntosEnfermagem\`; bloqueiam renomeação direta do título do diagnóstico e do título/tipo do subconjunto. Reserva de diagnóstico recebe permissão de criação exclusiva aos gestores autorizados.

## Limitações e validação

- As regras protegem **títulos e exclusão**, mas não garantem a preservação de todos os elementos aninhados em escritas diretas de terceiros: regras genéricas ainda permitem atualização de arrays. Os serviços oficiais usam \`protegerVinculosDoRol\`; para impor esta política a scripts externos será necessário um esquema versionado/servidor mediador e regras mais fortes, após avaliar todas as rotas de escrita.
- Relacionamentos antigos com duplicatas ou sem resultados são preservados. Não consolidar sinônimos sem conhecer a utilização histórica dos IDs.
- A exclusão administrativa precisa de arquivamento **lógico** e versão, preservando a recuperação de planos existentes. Excluir definitivamente está indisponível até desenvolver essa transição.
- Executar testes do Firestore Emulator, testes unitários de imutabilidade, TypeScript e build; realizar cenários com processos **fictícios** (diagnóstico antigo, resultado antigo, nova intervenção e NHB).
- **Nenhum dado clínico foi alterado nesta implementação.** Publicar somente após homologação e atualização coordenada do frontend e regras.
