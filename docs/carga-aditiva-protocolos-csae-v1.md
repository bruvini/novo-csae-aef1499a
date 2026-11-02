# CSAE — Carga clínica aditiva baseada nos Protocolos de Enfermagem

**Objetivo:** colocar conteúdo clínico real no Firestore, não somente melhorar a interface.
**Estado:** pacote versionado e rotina segura. Nenhum dado remoto será alterado por merge, teste ou deploy do frontend.

## Fontes

- **Volume 4 (pp. PDF 16–18 e 30–31):** inspeção auricular, otoscopia, trago, faringe, tonsilas, exame cervical.
- **Volume 5 (p. PDF 11 e 23–24):** limites superiores de frequência respiratória por idade e morfologia de lesões pediátricas.
- **Volume 6 (pp. PDF 19–24):** exame de feridas (leito, bordas, exsudato, odor, área perilesional), exames de albumina, vitaminas B12/D, zinco e cultura de swab.
- **Volume 7 (pp. PDF 24–25, 36–40):** sinais de desidratação pediátrica, desconforto respiratório e perfusão.
- **Volume 8 (pp. PDF 19–22):** exame do estado mental, consciência, orientação, psicomotricidade, afetividade, linguagem, memória e atenção.
- **Volume 3:** ultrassonografias citadas no cuidado da saúde da mulher.
- **Volumes 1 e 2:** o catálogo já contém sinais, exames, revisão hipertensão/diabetes, IST, tuberculose/dengue. **Não duplicá-los**: esse pacote cobre principalmente lacunas dos volumes posteriores.

O Google Drive fornecido NÃO foi usado para definir sinais vitais ou achados de exame físico; serve apenas para entender os nomes das 28 NHBs previamente registradas. Nenhum diagnóstico, resultado esperado ou intervenção foi alterado.

## Conteúdo preparado

O arquivo \`scripts/data/catalogo-protocolos-csae-v1.json\` contém **1 sinal vital FR, 7 exames laboratoriais/de imagem, 7 sistemas de revisão, 22 exames físicos, 70 achados clínicos e 192 opções de resposta**.

- **FR:** uma só chave "Frequência Respiratória (FR)", com 5 limiares superiores de taquipneia por idade (Volume 5). Não define limite inferior; qualquer valor fora dos limiares aprovados permanece **indeterminado**, não "normal".
- **Laboratoriais:** albumina sérica, vitamina B12, vitamina D, zinco e cultura de ferida. Permitem registro sem inferir diagnóstico; os exames numéricos recém-incluídos permanecem sem classificação automática até faixas por idade/sexo/contexto homologadas.
- **Imagem:** ultrassonografia obstétrica e transvaginal com laudo descritivo, sem diagnóstico automático.
- **Revisão de Sistemas:** ouvido/otoscopia, orofaringe, exame mental, desconforto respiratório pediátrico, hidratação, avaliação de feridas e morfologia de lesões pediátricas.
- **Achado → NHB:** opções com alteração objetiva vinculam a NHB existente; normal, não avaliado e sintomas inespecíficos não disparam inferência indevida. A NHB orienta o raciocínio do enfermeiro, **nunca gera diagnóstico ou prescrição**.

## Limites clínicos e qualidade

Este é um primeiro lote **aditivo**, não uma substituição do catálogo. A validação institucional continua necessária para critérios ambíguos. Metas de HbA1c por doença, curvas de crescimento/gestação e referências pediátricas de FC não foram sobrescritas. A fonte do protocolo pode estar defasada e a aplicação clínica das novas faixas requer revisão técnica.

O script recusa NHB inexistente, duplicidades por chaves, campos vazios, idade inválida e opções incompletas. Não cria novas coleções de diagnósticos, não altera referências nem substitui documentos antigos.

## Como executar com segurança — Cloud Shell

Após integrar o PR, **publique primeiro frontend e regras de segurança** pela nova rotina de publicação (ela não altera o catálogo):

```bash
git pull --ff-only origin main
bash scripts/publicar-atualizacao-clinica-cloudshell.sh
```

Depois de conferir a Gestão de Conteúdos em csae.com.br, execute o dry-run do catálogo:

\`\`\`bash
git pull --ff-only origin main
.venv-csae-release/bin/python scripts/popular-catalogo-protocolos.py
\`\`\`

A rotina faz **somente leitura**, consulta o estado atual e salva um plano privado \`~/csae-auditoria-clinica/plano_catalogo_csae_*.json\`. Confira nomes e quantidades: caso qualquer item já exista, ele será ignorado; colisões impedem toda a carga.

**Depois da homologação e da publicação coordenada do novo motor/Frontend e das regras Firestore**, para adicionar somente os itens que ainda faltam:

\`\`\`bash
.venv-csae-release/bin/python scripts/popular-catalogo-protocolos.py \
  --apply --confirm-project csaefloripa
\`\`\`

O shell solicitará a digitação de **INSERIR CATALOGO CSAE**. Cada item é criado em transação com reserva imutável de identidade; nenhum documento existente é alterado. Uma interrupção pode deixar inclusões já finalizadas (sem corrupção); reexecutar o dry-run mostrará quais ainda faltam. Uma cópia do plano é salva antes da escrita, e o resultado registra os IDs criados.

**IMPORTANTE:** a aplicação de uma carga clínica deve ser aprovada pela comissão responsável e testada com prontuário fictício: sistema mental, otoscopia, FR pediátrica, exame descritivo. A criação é permanente (não há exclusão física dos itens clínicos pelas regras do portal). Antes de aplicar, confirmar quem homologou e quando. Não usar script antigo \`import-clinical-parameters.ts --apply\` para coleções já povoadas.

## Verificações depois da carga

1. \`scripts/auditar-catalogo-clinico.py\` em modo somente leitura: comparar contagens e duplicidades.
2. Gestão de Conteúdos: KPI Revisão de Sistemas deve subir com 7 documentos e 22 exames físicos, além dos campos existentes (se nenhum item já tiver sido inserido).
3. Processo de Enfermagem com paciente **fictício**: sem duplicar PA, sem campos de diagnóstico automático, sem classificar um resultado sem faixa aprovada como normal.
4. Conferir se a NHB afetada aparece somente quando a opção correspondente foi marcada.
5. Validar versão nova no domínio oficial \`https://csae.com.br\`. Não presumir que alterações da branch atual estejam publicadas.
