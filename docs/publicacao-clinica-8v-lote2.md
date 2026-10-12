# Publicação clínica CSAE — lote incremental 2 (12/10/2026)

## Resultado esperado no Firestore

A carga `scripts/aplicar-catalogo-clinico-8v-lote2.py` lê os registros atuais,
verifica identidade/NHB, faz backup privado e publica **em transação única**:

- 18 exames novos em `ExamesLabImagem` (ureia, TSH geral, TGO, TGP, FA,
  GGT, bilirrubinas, urocultura + antibiograma, beta-hCG, DNA-HPV, CD4,
  carga viral HIV, anti-HBs, anti-HBc, anti-HAV, HBV-DNA, TAP/INR e
  ultrassonografia das mamas).
- 1 sistema de revisão ocular com fundoscopia e achados vinculados a NHBs.
- 1 novo componente de leucócitos no **Hemograma Completo existente**.
- 1 novo exame propedêutico de **mensuração de feridas** no sistema já existente.

**Não** escreve diagnósticos/intervenções, pacientes, prontuários ou contas.
**Não** modifica a FC pediátrica nem executa scripts anteriores.
Mantém todos os IDs históricos. Não elimina os parâmetros atuais.

## Executar após revisar o manifesto

No Cloud Shell do projeto `csaefloripa`:

```bash
cd ~/novo-csae-aef1499a &&
git pull --ff-only origin main &&
.venv-csae-release/bin/python -m unittest discover -s scripts/tests -p 'test_aplicar_catalogo_clinico_8v_lote2.py' &&
.venv-csae-release/bin/python scripts/aplicar-catalogo-clinico-8v-lote2.py --apply --confirm-project csaefloripa
```

A execução é **de fato gravação**, não apenas dry-run. Primeiro grava o
arquivo `~/csae-auditoria-clinica/plano_e_backup_lote2_csae_*.json`, com os
campos anteriores que seriam complementados. Então grava todos os itens numa
única transação — se ocorrer um conflito de identidade ou alteração concorrente,
a transação não faz nenhuma mudança. Ao final grava
`resultado_lote2_csae_*.json` com as operações confirmadas. Reexecutar a
mesma carga deve resultar em zero gravações (idempotência).

## Critérios clínicos e suas limitações

- Os protocolos 1–8 identificam **quais exames coletar/avaliar**. Não é
  correto converter critérios de triagem em faixas gerais nem converter
  testes positivos (p. ex. gravidez) em doença.
- Quando a fonte não fornece faixa de referência segura, o exame entra como
  **resultado descritivo, interpretação indeterminada** e sem NHB automática;
  a equipe poderá completar manualmente após homologação.
- Para alterações explicitamente classificadas no manifesto, há NHB válida.
  Essas correspondências entre alteração e NHB são propostas técnico-clínicas,
  não diagnósticos inferidos do protocolo. Validar institucionalmente.
- **Ureia:** referência adulta 10–50 mg/dL (ureia, NÃO nitrogênio ureico/BUN).
  Fonte adicional: https://www.fleury.com.br/noticias/ureia
- **Leucócitos:** referência adulta 4.500–11.000 células/µL.
  Fonte adicional: https://medlineplus.gov/ency/article/003643.htm
- **TSH:** 0,3–5,0 mU/L no Volume 8, p.20 do PDF; não usar a faixa geral
  para gestante. O exame existente TSH por trimestre continua separado.
- **Urocultura:** Volume 3, pp.33–34 do PDF, antibiótico depende de contexto
  e antibiograma; o sistema não prescreve automaticamente.
- **DNA-HPV:** Volume 3, pp.73–74 e diretrizes brasileiras atualizadas pelo
  INCA; DNA positivo é achado de rastreio, não câncer.
  https://www.gov.br/inca/pt-br/assuntos/gestor-e-profissional-de-saude/controle-do-cancer-do-colo-do-utero/acoes/deteccao-precoce
- **Mensuração de ferida:** Volume 6, pp.19–20 do PDF, inclui comprimento,
  largura, profundidade e túneis/solapamento; registra dados observados,
  sem inferir patologia apenas pelo tamanho.
- **Perfil HIV/hepatites:** Volume 2, pp.50,81 do PDF; exames dependentes
  da modalidade/metodologia são descritivos até confirmação local.
- **Função renal/hepática e álcool:** Volume 8, pp.53–54.

Este é um lote **executável e incremental** (não uma declaração de que todas
as possibilidades dos oito volumes foram exauridas). Revisão clínica de demais
componentes e fontes externas seguirá em lotes posteriores sem repetir dados.
