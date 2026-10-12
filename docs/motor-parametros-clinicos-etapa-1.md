# CSAE — Motor de parâmetros clínicos (etapa 1)
**Data:** 11/10/2026. **Escopo:** código, UI/UX, testes; sem alterar Firestore de produção.

## Fontes examinadas
- Inventário do Firebase de 11/10/2026: 18 sinais, 16 sistemas, 34 exames, 635 diagnósticos em rolEnfermagem, 36 subconjuntos; um diagnóstico nominal duplicado. O cadastro atual inclui PAS/PAD gerais e PAS/PAD para dengue e medidas derivadas.
- Drive da CSAE (pasta 1z_BIFM20QV-YmqzrXgcxWSak2z2KXfHp): **somente o rol de diagnósticos, seus resultados esperados, intervenções e materiais de apoio**. Outros arquivos do Drive, inclusive planilhas de exames físicos, NÃO são referências clínicas autorizadas para parametrização de sinais vitais ou exames. Ver `docs/governanca-fontes-e-rol-diagnosticos.md`.
- Protocolos de Enfermagem 1–8: valores por idade, cuidado pediátrico, diabetes, gestação, classificação de risco, feridas etc. Esses documentos não são importados automaticamente.

## Mudanças desta etapa
1. Motor puro centralizado: idade por dias/meses/anos, sexo, contexto clínico explicitamente escolhido pelo enfermeiro, faixa numérica, interpretação explícita normal/alterado/indeterminado e estado neutro para sobreposições incompatíveis.
2. Novo modelo de referência opcional: contextoClinico e interpretacaoClinica para SinaisVitais e ExamesLabImagem, preservando a leitura do legado sem migração destrutiva.
3. Gestão de Conteúdos: edição explícita de condição (texto orientativo), contexto estruturado e interpretação; exibição de zero em campos de mínimo/máximo; aviso legível para nomes duplicados.
4. Processo de Enfermagem: seleção de contexto por parâmetro quando necessário, persistência em avaliacao.contextosParametros, recálculo das NHBs e mensagens de ambiguidade; dados históricos preservados. Não atribui diagnósticos automaticamente.
5. Guardas de nomes duplicados em SinaisVitais, ExamesLabImagem e RevisaoSistemas (com preservação dos IDs legados). PAS/PAD, FC/FR e aliases não geram novos cadastros por protocolo, sexo ou idade.

## Limites conhecidos e próximos bloqueios
- As planilhas da CSAE têm sugestões de faixas que nem sempre coincidem com o Firestore. NÃO carregar essas faixas sem conciliação e aprovação institucional.
- O mecanismo de normalidade legado por nome é somente fallback; ideal: revisar todos os valores existentes e preencher interpretacaoClinica sob supervisão da CSAE.
- criterioCondicao histórico é TEXTO livre: o motor só reconhece alguns contextos inequivocamente identificáveis; rótulos ambíguos ficam sem classificação automática. Uma seleção de contexto não substitui a avaliação clínica.
- Sobreposição entre contexto geral e faixa de alerta pode produzir 'neutro' mesmo com contexto escolhido: esse é o comportamento seguro até saneamento do catálogo; os resultados de hipoglicemia e gestação são particularmente sensíveis.
- Regras pediátricas por percentis, curvas de crescimento gestacional, alvos de tratamento e condições clínicas múltiplas precisam de estrutura própria (não apenas faixa numérica e sexo).
- As verificações de nome duplicado no frontend/serviços são preventivas, mas não transacionais. Concorrência de gestores ou importações externas exigem um registro de identidade atômico controlado.
- No modelo atual, chaves de exames e de achados ainda são NOMES. Esta etapa evita novos homônimos; a futura substituição por IDs estáveis exigirá versão de schema e leitura retrocompatível dos processos históricos.
- A aprovação clínica e o changelog devem ocorrer apenas depois dos testes de UI (inclusive cadastro/edição como gestor e aplicação em processo de enfermagem), revisão da CSAE e implantação autorizada.

## Conduta antes de produção
1. Conferir GitHub Actions (testes clínicos + testes Firebase no Emulator + TS + build).
2. Inspecionar os dados de referência críticos do inventário real (PA gestante/geral, glicemia jejum/pós/gestação, FC pediátrica, VDRL).
3. Testar com dados fictícios uma criança, adulto, gestante e uma pessoa com resultados de exame classificatório.
4. Confirmar que os históricos existentes não foram alterados.
5. NÃO executar script de importação nem cadastrar conteúdos de protocolos até aprovar mapa item a item.
