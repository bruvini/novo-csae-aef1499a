# Conciliação preliminar real — rol de diagnósticos CSAE, 11/10/2026

**Fonte de comparação autorizada:** Google Sheets "Diagnósticos de Enfermagem e Resultados Esperados" (https://docs.google.com/spreadsheets/d/1A-whzkJuGXIlsiMZ6_yKJayyJF6oXAiH9c0kbHNd2Jg/edit), especificamente as abas "ListaDiagnosticos", "DE-RE" e "ListaResultadosEsperados".

**Origem de produção:** inventário JSON de leitura do projeto \`csaefloripa\` gerado em 11/10/2026, contendo os nomes, IDs e vínculos de \`rolEnfermagem\` e \`subconjuntosEnfermagem\`, **não** resultados/intervenções aninhados.

## Resultado da comparação por nome normalizado

| Indicador | Apurado |
| --- | ---: |
| Documentos de diagnóstico no Firestore | 635 |
| Títulos distintos no Firestore | 634 |
| Títulos distintos na aba ListaDiagnosticos | 629 |
| Títulos da planilha localizados no Firestore | **629** |
| Títulos da planilha sem registro no Firestore | **0** |
| Títulos extras no Firestore, ausentes da planilha | 5 |
| Nomes duplicados em IDs distintos | 1 grupo |
| Divergências de vínculos NHB/protocolo entre os 629 títulos comuns | **0** |

**Interpretação:** a aba oficial não justifica o cadastro de novos diagnósticos pelo título nem a reconstrução dos vínculos NHB/protocolo. Comparação de texto normalizado não confirma equivalência clínica de todos os resultados, intervenções e materiais de apoio.

### Documentos existentes apenas no Firestore — PRESERVAR

| Título | Firestore ID |
| --- | --- |
| cefaleia/dor de cabeça | \`Uq17s94HUnaUHv66DwI7\` |
| diarreia | \`h7HfFb6SMgH7BCevhmcY\` |
| dor de garganta | \`QwypmmTj16aQt4L2inVg\` |
| dor de ouvido e/ou cerumen | \`pvUA0RgWcplhqBepCjFV\` |
| náuseas e/ou vômitos | \`oTs9Sak3gJ9M37JpxtbG\` |

### Título duplicado por equivalência nominal — NÃO UNIFICAR SEM MIGRAÇÃO

- \`Azia (Pirose)\`: \`K2eqR5ZlMYFnWXuUHrMa\`
- \`Azia/Pirose\`: \`wQWnb7O5WS5ANHHeRBgm\`

Ambos os documentos devem permanecer até avaliar processos históricos e aprovar a estratégia de referência única.

## Relações que ainda faltam conferir com dados completos

A fonte Drive apresenta **2.104 linhas**, **571** combinações distintas de diagnóstico e resultado esperado e **1.808** combinações distintas de diagnóstico, resultado e ação prescrita. Parte das linhas não inclui todos esses campos. São relações, não novas entidades a cadastrar.

O JSON anterior exportava somente \`nome\` e \`subconjuntos\`; portanto, **a equivalência dos resultados e das intervenções atuais no Firestore permanece desconhecida**. O script \`scripts/auditar-rol-diagnosticos.py\` (somente leitura) foi criado para exportar \`resultadosEsperados[]\` e \`intervencoes[]\`. O relatório offline \`npm run conciliar:rol\` fará a comparação após obter essa nova fotografia.

**Nada neste documento autoriza alterações clínicas.** A pasta Drive não é fonte para exame físico, sinal vital ou exame laboratorial. Esses temas seguem exclusivamente protocolos de enfermagem e validação institucional pela CSAE.
