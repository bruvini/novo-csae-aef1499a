# Auditoria clínica dos Protocolos de Enfermagem — volumes 1 a 8

**Estado:** etapa documental preliminar, ainda não aprovada para cadastro ou migração.

Os oito PDFs foram fornecidos em 11/10/2026 para comparação com os conteúdos da Comissão de Sistematização da Assistência de Enfermagem (CSAE) de Florianópolis. Antes de qualquer cadastro, verificar a existência e os vínculos dos parâmetros no Firestore.

## Escopo por volume

| Volume | Tema | Evidências a reconciliar |
| --- | --- | --- |
| 1 | Hipertensão, diabetes e fatores cardiovasculares | PA sistólica/diastólica, glicemia, HbA1c, perfil lipídico (PDF pp. 14, 22, 28) |
| 2 | IST, dengue e tuberculose | Testes rápidos, sorologias e titulação VDRL (p. 32) |
| 3 | Saúde da mulher, atualização de 2025 | Exame obstétrico, ausculta fetal, mamografia, ultrassonografia (pp. 85, 100, 105, 109, 122) |
| 4 | Demanda espontânea no adulto | Otoscopia, palpação do tragus, orofaringe (pp. 16, 17, 30) |
| 5 | Criança | FC/FR pediátricas, sinais de desconforto e hidratação (pp. 10, 11, 17) |
| 6 | Feridas | Local, C×L×P, túneis/solapamento, exsudato, perilesão e exames (pp. 19–21, 24) |
| 7 | Classificação de risco | Sinais vitais e discriminadores de gravidade, adultos e crianças (pp. 22, 36) |
| 8 | Saúde mental | Exame do estado mental, segurança e escalas específicas (pp. 17–20, 53) |

As páginas acima são índices do PDF, não necessariamente a numeração impressa.

## Modelo do portal investigado no GitHub

- SinaisVitais: sinal e faixas em valoresDeReferencia (idade, unidade, sexo, classificação, NHB).
- ExamesLabImagem: exame, componentes e resultados quantitativos/classificatórios.
- RevisaoSistemas: sistema, exames propedêuticos, achados e opções.
- subconjuntosEnfermagem: NHBs e subconjuntos por protocolo.
- rolEnfermagem: diagnósticos consumidos por EtapaDiagnostico.
- diagnosticosEnfermagem: modelo separado; não presumir que esteja integrado ao fluxo clínico.

**Cadeia atual:** achado/resultado alterado → NHB → apresentação dos diagnósticos associados à NHB → escolha clínica do enfermeiro. Nunca transformar medida isolada em diagnóstico automático.

## Riscos impeditivos

1. A UI orienta criar PAS e PAD em registros separados; o requisito de um só bloco visual Pressão arterial (com PAS/PAD) exige desenho retrocompatível, não exclusão das chaves históricas.
2. Em EtapaAvaliacao.tsx, a idade calculada em anos é comparada com limites cujas unidades podem ser dias ou meses. Corrigir antes de importar faixas pediátricas.
3. A primeira faixa de resultado compatível é utilizada. Sobreposições, gestação, contextos de risco e percentis exigem validação clínica explícita. O campo criterioCondicao não é considerado pelo motor atual.
4. O nome do sinal ou componente é usado como chave do valor de exame físico. Homônimos podem causar perda de distinção; o mesmo vale para nomes de exames na seleção da revisão de sistemas.
5. A gravação de SinaisVitais e ExamesLabImagem não possui bloqueio inequívoco de nomes duplicados no serviço.
6. Uma regra de triagem/encaminhamento não corresponde necessariamente a faixa universal de normalidade.
7. O script de importação existente scripts/import-clinical-parameters.ts é para **carga inicial** e bloqueia importação quando coleções não estão vazias. NÃO executá-lo com --apply em produção.
8. Todo novo conteúdo, alteração de referência ou vínculo NHB depende de revisão e validação da CSAE.

## Inventário remoto — somente leitura

Após integrar a ferramenta da branch audit/catalogo-clinico-protocolos-v1-v8, executar no Cloud Shell autenticado:

    git pull --ff-only origin main
    .venv-csae-release/bin/python scripts/auditar-catalogo-clinico.py

O script lê exclusivamente seis coleções de conteúdo clínico e gera um JSON privado em ~/csae-auditoria-clinica/. Não lê usuários, pacientes, prontuários ou processos, nem escreve no Firebase.

## Próximas etapas

Inventário → conciliação detalhada por documento/ID/achado/componente → lista de ações (reutilizar, complementar, novo, não cadastrar, pendente de aprovação) → validação pela CSAE → correções estruturais e testes → migração idempotente não destrutiva → publicação revisada.

**Nesta fase, nenhuma alteração é autorizada nos dados clínicos de produção.**
