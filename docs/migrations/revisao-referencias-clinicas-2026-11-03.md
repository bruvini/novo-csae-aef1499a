# Revisão clínica CSAE — lote proposto de 03/11/2026

**Estado: AGUARDANDO HOMOLOGAÇÃO CLÍNICA.** Não é publicação de produção.

## Escopo e integridade

Esta proposta parte do export do Firestore de 03/11/2026 (projeto `csaefloripa`) e respeita:
1. Os Protocolos de Enfermagem de Florianópolis prevalecem sobre fontes externas em divergências.
2. O motor classifica alterações e pode associar NHBs, mas não diagnostica nem prescreve condutas.
3. Apenas 12 documentos pré-existentes: 3 em `SinaisVitais`, 9 em `ExamesLabImagem`.
4. Nenhum `set` de coleções inteiras, nenhuma criação de exames/sinais, nenhuma alteração em `rolEnfermagem`, `RevisaoSistemas`, `subconjuntosEnfermagem`, pacientes ou históricos.
5. Cada documento tem `sha256Anterior` e `sha256Proposto` do campo clínico a substituir. Se o Firestore divergiu da exportação, **abortar**, sem reconciliar às cegas.

Manifesto: `scripts/data/revisao-referencias-2026-11-03.json`. Matriz de inventário e pendências: `docs/migrations/matriz-revisao-referencias-2026-11-03.csv`.

## Revisões contidas no manifesto

| Item | Alteração proposta | Fundamento |
|---|---|---|
| FC | Restringe 60–100 bpm a adultos; inclui bradicardia adulta e faixas pediátricas **pontuais** (RN 0–27 dias; 11 meses; 2, 4, 6, 8 e 10 anos). **Não interpolar** idades faltantes. | Protocolo 5, quadro 2.3 |
| Temperatura | Identifica valores abaixo de 35,5°C sem afirmar etiologia | Limite de normalidade preexistente; pendente de homologação |
| SpO₂ | Complementa a referência geral inferior a 95%, preservando separadamente a regra para gestante asmática | Catálogo atual e Protocolo 3 |
| Albumina | 3,5–5,2 g/dL | Protocolo 6, quadro de exames laboratoriais |
| B12 | 300–900 pg/mL | Protocolo 6 e Protocolo 8 |
| Zinco | 70–120 µg/dL | Protocolo 6 |
| Vitamina D | Deficiência <20; insuficiência 21–29; suficiência 30–100 ng/mL. Região 20 a 20,99 fica *informativa*, porque o texto municipal não a classifica explicitamente. >100 não equivale automaticamente a intoxicação. | Protocolo 6 |
| Hemograma | Hb apenas no contexto gestacional; hematócrito/plaquetas como limiares de **dengue**, sem chamar de normal o que está abaixo do corte de alerta | Protocolos 2 e 3 |
| TSH gestacional | Preserva as faixas dos três trimestres; inclui valores abaixo dos mínimos como alteração | Protocolo 3 |
| Glicose laboratorial em jejum | Contextos `jejum` e `gestante_jejum` explícitos, preservando limiares do protocolo | Protocolos 1 e 3 |
| Rh | Ambos os sexos; fator negativo é característica imuno-hematológica, não NHB alterada isoladamente; interpretação informativa | Validação clínica necessária |
| Clearance | A faixa 60–89 mL/min é **informativa**, distinta de <60 e ≥90; creatinina sérica segue sem intervalo isolado artificial | Protocolo 1 |

**Cuidado com a NHB:** propostas de `Nutrição` para albumina, B12, vitamina D, zinco e `Regulação vascular` para frequência cardíaca precisam de revisão clínica individual. Uma alteração bioquímica não demonstra automaticamente uma necessidade de enfermagem afetada. Rejeite/altere o vínculo na proposta se não houver justificativa.

**Cuidado com a pressão arterial, glicemia capilar e contextos mistos:** não foram executadas alterações extensivas nesses grupos porque o motor pode devolver resultado neutro diante de faixas de alertas/normalidade em contextos diferentes. Resolver ou validar o cenário antes de expandir regras; não converter `criterioCondicao` (texto orientativo) em contexto automático sem conferir `contextoClinico`.

**Cuidado com idade:** idades intermediárias não documentadas pelo quadro de FC pediátrica devem ficar **sem classificação automática**, não receber faixas inventadas. A faixa adulta somente se aplica a ≥18 anos. A frequência respiratória do Volume 5 traz apenas limites superiores de taquipneia; não se cadastrou normalidade artificial.

**Cuidado com números 88:** `88` é valor clínico legítimo em alguns campos (ex.: circunferência abdominal feminina), **não é marcador global de nulo**. Campos vazios na exportação JSON estão como `null`. Não usar substituições globais.

## Testes e homologação

```bash
python3 -m unittest discover -s scripts/tests -p 'test_revisao_referencias_20261103.py'
python3 scripts/aplicar-revisao-referencias-20261103.py \
  --manifest scripts/data/revisao-referencias-2026-11-03.json
```

A primeira linha testa integridade em ambiente local; a segunda faz simulação totalmente offline, **sem acesso ao Firestore**.

Para conferir contra o banco atual (somente leitura), use:
```bash
python3 -m pip install google-cloud-firestore
python3 scripts/aplicar-revisao-referencias-20261103.py \
  --manifest scripts/data/revisao-referencias-2026-11-03.json --remote
```

As credenciais podem vir da variável `FIREBASE_SERVICE_ACCOUNT_CSAE` (JSON ou base64 de JSON) ou do Google Application Default Credentials. A conta precisa de permissão de leitura/escrita de dados no Firestore; **Firebase Hosting Admin e Firebase Rules Admin não concedem, isoladamente, essa permissão**.

A publicação, somente após homologação, é disparada **manualmente** pelo fluxo `Revisão clínica CSAE — lote 2026-11-03`, com SHA do manifesto, confirmação literal e ambiente `csae-clinico-producao`. **Configure revisores obrigatórios para esse environment no GitHub antes de habilitar a aplicação.** O script cria backup local privado (modo `0600`) antes de escrever, atualiza os campos em uma única transação, verifica versões concorrentes e lê o resultado novamente.

A importação não deve ocorrer em `push` ou `pull_request`. Ela não deve rodar automaticamente apenas porque a PR foi mesclada.

## Pendências clínicas que impedem homologação integral

- Validar item a item as 12 propostas e, sobretudo, as NHBs sugeridas, a temperatura e a SpO₂ geral.
- Executar os testes existentes do motor: `src/utils/referenciasClinicas.test.ts`; simular pacientes fictícios com contextos `geral`, `gestante`, `gestante_jejum`, `dengue` e `sem_anticoagulante`.
- Conferir que o campo `contextoClinico` é selecionado explicitamente na avaliação e não deduzido apenas do sexo.
- Validar a apresentação de exames quantitativos em precisão decimal e documentar lacunas de borda; p.ex., 20 ng/mL em vitamina D.
- Obter intervalos laboratoriais vigentes e por método do Santa Luzia antes de ampliar creatinina, enzimas ou faixas gerais sem parâmetro municipal.
- Validar separadamente os demais resultados qualitativos, vínculos NHB e parâmetros não alterados. O CSV é inventário de cobertura, **não declaração de que os demais estejam clinicamente homologados**.
- Conferir o estado real do Firestore após eventuais edições posteriores a 03/11/2026; SHA divergente significa bloqueio.
- Confirmar o papel IAM apropriado da conta de serviço e aprovar a janela de publicação.

## Fontes primárias

- [Protocolo 1 — Hipertensão/Diabetes](https://drive.google.com/file/d/14vvThRfQ-Q93kxzxMMeUoLw_p_nAfJhM/view)
- [Protocolo 2 — IST, dengue e tuberculose](https://drive.google.com/file/d/17ZrwFljC4dZq6oo08rumgiD7FIBH42wy/view)
- [Protocolo 3 — Saúde da Mulher (2025)](https://drive.google.com/file/d/1txLibJuV1V7UJG4pDpXlu0Lg84r5iOa-/view)
- [Protocolo 5 — Saúde da Criança](https://drive.google.com/file/d/17PMgqAQXnrZd6Z072InlLA3-VPMUtv3_/view)
- [Protocolo 6 — Cuidado à Pessoa com Ferida](https://drive.google.com/file/d/18WCwsgImek4TMXgzNOeyVO9ENFqQHNT9/view)
- [Protocolo 8 — Saúde Mental](https://drive.google.com/file/d/1xEjmxMioEY7dSmMT4r9u1DON64F8mXPd/view)

Fonte laboratorial complementar consultada: [Santa Luzia, catálogo de exames](https://sluzia.com.br/exames/); não foi encontrada tabela pública completa por método de ensaio para confirmar todos os intervalos.
