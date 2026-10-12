# CSAE Floripa — Correção integral dos resultados clínicos do lote 2 (V3)

## Objetivo e escopo

Corrigir **13 exames apontados como incompletos** no Firestore de produção
`csaefloripa`, substituindo os resultados únicos `Descritivo / Indeterminado`
por faixas numéricas ou classificações clínicas explícitas, com NHB para
resultados **alterados**. **Não** altera Ureia Sérica, TSH geral, sorologias
Anti-HBs/Anti-HBc/Anti-HAV, fundoscopia, leucócitos, mensuração de ferida,
diagnósticos de enfermagem, intervenções, resultados esperados ou prontuários.

`scripts/data/correcoes-parametros-exames-csae-8v-v3.json` contém 13
documentos de atualização e as referências individualizadas.
`scripts/corrigir-parametros-exames-csae-8v-v3.py` aplica essas alterações
idempotentemente, com backup privado e uma transação única.

## Resultados disponíveis

| Exame | Resultado/critério introduzido | Fonte |
|---|---|---|
| TGO/AST | Adultos: 8–33 U/L, abaixo/acima | [MedlinePlus](https://medlineplus.gov/ency/article/003472.htm) |
| TGP/ALT | Adultos: 4–36 U/L, abaixo/acima | [MedlinePlus](https://medlineplus.gov/ency/article/003473.htm) |
| Fosfatase alcalina | Adultos: 20–130 U/L, abaixo/acima; **não aplicar em crianças/gestantes** | [MedlinePlus](https://medlineplus.gov/ency/article/003468.htm) |
| GGT | Adultos: 5–40 U/L, abaixo/acima | [MedlinePlus](https://medlineplus.gov/ency/article/003458.htm) |
| Bilirrubinas total, direta e indireta | Total 0,1–1,2; direta <0,3; indireta 0,2–0,8 mg/dL, calculada por diferença | [MedlinePlus](https://medlineplus.gov/ency/article/003479.htm), [Cedars-Sinai](https://www.cedars-sinai.org/health-topics/indirect-bilirubin) |
| Urocultura + antibiograma | Crescimento, cultura mista, contagem UFC/mL (gestante), espécie, S/I/R e notas | [Ministério da Saúde](https://linhasdecuidado.saude.gov.br/portal/pre-natal-baixo-risco/unidade-de-atencao-primaria/planejamento-terapeutico/) |
| Beta-hCG quantitativo | <5 mUI/mL; 5–24,99 (retestar); ≥25 (gestação possível, **não doença**) | [MedlinePlus](https://medlineplus.gov/ency/article/003510.htm), [laboratório universitário](https://uvmlabs.testcatalog.org/show/LAB143-1) |
| DNA-HPV | Genótipos 16, 18, ambos, outros oncogênicos, negativo, amostra inválida. Positivo **não é diagnóstico de câncer** | [MS Portaria Conjunta 13/2025](https://www.gov.br/saude/pt-br/assuntos/pcdt/r/rastreamento-cancer-do-colo-do-utero/view) |
| Linfócitos T CD4+ | 0–199, 200–499, 500–1200, ≥1201 células/mm³; dependente de idade | [MedlinePlus](https://medlineplus.gov/lab-tests/cd4-lymphocyte-count/) |
| HIV-RNA | Quantitativo 0–19, 20–199, ≥200 cópias/mL e qualitativo: não detectado/detectado abaixo do limite/quantificável; não declarar falha sem confirmação | [NIH](https://clinicalinfo.hiv.gov/en/guidelines/hiv-clinical-guidelines-adult-and-adolescent-arv/plasma-hiv-1-rna-cd4-monitoring) |
| HBV-DNA | Quantitativo <2.000/≥2.000 UI/mL e qualitativo. **2.000 não é corte de normalidade nem indicação isolada de tratamento** | [OMS](https://www.ncbi.nlm.nih.gov/books/NBK442261/) |
| TAP/INR | TP 11–13,5 s e INR 0,8–1,1 **somente sem anticoagulantes** | [MedlinePlus](https://medlineplus.gov/ency/article/003652.htm) |
| Ultrassonografia das mamas | BI-RADS 0, 1, 2, 3, 4, 4A, 4B, 4C, 5, 6; opção para descrever laudo | [ACR BI-RADS 2025](https://www.acr.org/Clinical-Resources/Clinical-Tools-and-Reference/Reporting-and-Data-Systems/BI-RADS) |

**Os intervalos laboratoriais são exemplos documentados, não universais.**
Devem ser substituídos pelas faixas vigentes do laboratório executor
quando diferentes, inclusive por idade, gestação, sexo e método.

## Sem falso diagnóstico — `informativo`

A UI e o motor foram atualizados para reconhecer
`interpretacaoClinica = informativo`, exibido como
**Informativo — registro sem inferência de diagnóstico**.
Não é o genérico `indeterminado` de antes: acompanha um resultado concreto
(HPV amostra inválida, BI-RADS 3, HIV <200, hCG limítrofe etc.).
Nesse estado o motor retorna **neutro**, nunca gera NHB ou diagnóstico
automaticamente. Nos resultados `alterado` o manifesto exige NHB existente;
isso ainda não substitui homologação institucional de cada associação.

## Preservação e histórico

- Os 13 documentos mantêm **o mesmo ID e nome no Firestore**.
- Os componentes existentes mantêm **nome/id lógico**; alterações são nas
  regras internas. Quando necessário, 3 componentes novos são inseridos
  (contagem de colônias, HIV RNA qualitativo, HBV DNA qualitativo).
- As regras originais são arquivadas por componente na coleção privada
  `auditoriaCatalogoClinicoV3` (um documento por exame), além de backup JSON
  local `~/csae-auditoria-clinica/backup_correcao_clinica_v3_*.json`.
- Não reescreve processos de enfermagem antigos, laudos nem prontuários.
- O script exige que o estado anterior corresponda ao lote 2. Se houve
  edição concorrente, **aborta tudo** e exige reconciliação.
- A transação aplica os 13 documentos, as reservas de identidade e os 13
  registros de auditoria como uma única operação atômica.
- O documento clínico conserva somente os campos permitidos em
  `validCatalogDocument()` pelas regras Firebase publicadas, garantindo
  que a edição na Gestão de Conteúdos continue funcionando sem abrir
  permissões novas para campos administrativos.

## Comando ÚNICO de publicação (faz a gravação)

```bash
cd ~/novo-csae-aef1499a &&
git pull --ff-only origin main &&
.venv-csae-release/bin/python -m unittest discover -s scripts/tests -p 'test_corrigir_parametros_exames_csae_8v_v3.py' &&
.venv-csae-release/bin/python scripts/corrigir-parametros-exames-csae-8v-v3.py --apply --confirm-project csaefloripa
```

O terminal deve informar **13 exames corrigidos**, relatório de backup,
relatório final e pós-verificação. A atualização é idempotente: uma segunda
execução deve indicar 0 documentos a atualizar.

**Importante:** alterações de TypeScript/UI publicadas no GitHub
ainda exigem o pipeline de deploy habitual para o Hosting;
a transação Firestore não publica a interface. Enquanto o Hosting mantiver
o código anterior, a UI ainda pode exibir o rótulo antigo de status para
algumas regras, embora os novos valores quantitativos/classificatórios
já apareçam pela assinatura das coleções.

## Fora do escopo

Esta correção não aprova automaticamente referências laboratoriais para
todas as faixas pediátricas nem cobre todos os conceitos dos oito PDFs.
Não é uma homologação assistencial. A vinculação de uma NHB proposta
não equivale a diagnóstico de enfermagem automático.
