# CSAE Floripa — conciliação do inventário clínico real dos oito protocolos (12/10/2026)

## Inventário confirmado no projeto `csaefloripa`

Leitura somente de catálogos em produção (arquivo privado exportado em 2026-10-12T03:26:26Z):
19 documentos de `SinaisVitais`, 41 de `ExamesLabImagem`, 23 de `RevisaoSistemas`;
53 componentes laboratoriais/de imagem; 213 regras de resultado ou referência;
59 exames físicos, 159 achados e 367 opções aninhadas; 28 NHBs cadastradas.

A matriz exploratória dos oito PDFs identificou 80 conceitos: 51 correspondências
por nome e 29 sem correspondência nominal. A última categoria **não** significa
ausência clínica. Conciliados os 29 com o conteúdo aninhado:
- **14** presentes como achados aninhados (tiragem respiratória, batimento de
  asas nasais, sibilos/crepitações, tonsilas, mucosas, estado mental,
  vários componentes de avaliação de feridas e hidratação).
- **3** presentes sob outra denominação (Sorologia para Sífilis — TR + VDRL,
  Coombs Indireto, Raio-X de Tórax).
- **2** presentes em outra coleção (Tempo de Enchimento Capilar e BCF,
  ambos em `SinaisVitais`; BCF também em obstetrícia).
- **6** candidatos a novos cadastros, sujeitos à leitura da indicação clínica e
  definição de referência: Ureia, Urocultura, Beta-hCG, Teste de HPV,
  Ultrassonografia de Mama e Fundoscopia.
- **3** candidatos a complementar registros: leucócitos no hemograma;
  mensuração estruturada das dimensões da ferida; peso/estatura geral
  (verificar módulo antropométrico do Processo de Enfermagem antes).
- **1** pendente de verificar indicação no PDF: Radiografia de Abdome.

Não cadastrar um novo exame chamado "Teste para Sífilis" ou "Radiografia de Tórax"
sem revisar os equivalentes atuais. Um item sem correspondência por nome pode
ser achado, opção, componente ou parâmetro existente.

## Risco confirmado: frequência cardíaca pediátrica

`SinaisVitais/frequencia-cardiaca-fc-09c0fe7869` possui apenas
2 faixas globais: 60–100 bpm como normal, ≥101 bpm como taquicardia.
Não há delimitação etária, então regras adultas podem ser consideradas
para crianças. Quadro 2.3 do **Volume 5, p. 11 do PDF**:

| Idade pontual | FC indicada no quadro |
|---|---:|
| Recém-nato | 70–170 |
| 11 meses | 80–160 |
| 2 anos | 80–130 |
| 4 anos | 80–120 |
| 6 anos | 75–115 |
| 8 anos | 70–110 |
| 10 anos | 70–110 |

O script `scripts/complementar-fc-pediatrica.py` delimita as duas regras
legadas a **adultos ≥18 anos**, preservando seus valores e NHBs, e propõe
21 novas regras (inferior, normal, superior) para as sete idades do quadro.
Recém-nato = 0–27 dias segundo definição internacional de período neonatal
(OMS); as outras idades permanecem **pontuais**, não interpoladas.
As idades não documentadas são deixadas neutras, sem inferir normalidade.
NHB proposta para alterações: **Regulação vascular** (catalogada), sujeita
a **homologação clínica** — trata-se de associação inferida e não explicitada
no quadro. Não alterar automaticamente critérios do Volume 7: estes são
limiares de classificação de risco, não limites gerais de normalidade.

O script é dry-run por padrão, cria backup privado, testa estado esperado do
documento, exige confirmação interativa e revalida dentro da transação.
Não há escrita em produção até execução deliberada de `--apply`.

## Risco confirmado: contextos misturados no hemograma

`ExamesLabImagem/hemograma-completo-81dd0b7182` possui:
- Hb: três regras para gestantes (Volume 3, PDF p. 115), sem contexto explícito;
- Hematócrito: seis critérios de dengue (Volume 2, PDF p. 99), sem contexto;
- Plaquetas: dois critérios de dengue (Volume 2, PDF p. 99), sem contexto.

`scripts/contextualizar-hemograma.py` propõe acrescentar
`contextoClinico=gestante` à Hb (3 registros) e
`contextoClinico=dengue` a Ht (6) e Plaquetas (2), mantendo limites,
identificadores, NHBs e resultados originais intactos. A interpretação de
"normal" nos resultados de dengue corresponde a limiar de encaminhamento,
não normalidade laboratorial geral; revisar nomenclaturas em etapa clínica
posterior. Dry-run e confirmação transacional obrigatórios.

## Outros itens que exigem revisão, sem escrita aprovada

- TSH do catálogo está localizado no exame `TSH — Gestante (valores por
  trimestre)`; isso **não comprova** cobertura de TSH para adulto não gestante.
- Glicemia capilar tem 13 referências (DM, gestante, jejum, horários,
  hipoglicemia, triagem) com possíveis sobreposições por contexto.
- Saturação SpO2 inclui 95–100% como normal e ≤93% na gestante asmática;
  é necessário avaliar pacientes com 93–94% em outros contextos sem inventar
  enquadramento automático.
- Temperatura corporal não tem referência explícita de hipotermia; Volume 7
  possui limiares distintos para classificação de risco.
- A altura uterina está representada por três regras textuais (P10/P90)
  sem limiares numéricos; exige idade gestacional e curva.
- Albumina, B12, vitamina D e zinco do primeiro lote possuem resultados
  descritivos sem faixa numérica classificatória. A compatibilidade com o
  primeiro manifesto não demonstra completude ou atualidade científica.
- IMC adulto contempla ≥20 anos. O uso pediátrico requer curvas/z-scores
  por sexo e idade, não aplicação direta dos cortes de adulto.

## Execução para conferência e homologação (Cloud Shell)

```bash
git pull --ff-only origin main
.venv-csae-release/bin/python -m unittest discover -s scripts/tests -p 'test_complementar_fc_pediatrica.py'
.venv-csae-release/bin/python -m unittest discover -s scripts/tests -p 'test_contextualizar_hemograma.py'
.venv-csae-release/bin/python scripts/complementar-fc-pediatrica.py
.venv-csae-release/bin/python scripts/contextualizar-hemograma.py
```

As simulações apenas leem `SinaisVitais`, `ExamesLabImagem` e
`subconjuntosEnfermagem`, e emitem relatórios privados. Após validação
institucional de idade, NHB e contexto, os responsáveis podem executar
`--apply --confirm-project csaefloripa` em cada script e confirmar a frase
específica. **Ainda não executado nesta conversa.**

## Limites

A revisão da matriz exploratória não substitui varredura exaustiva página a
página dos oito protocolos e atualização com referências externas atualizadas.
Nenhuma mudança em diagnósticos, resultados esperados, intervenções, pacientes
ou prontuários. Preservar IDs e chaves históricas. Qualquer nova faixa/alteração
requer vínculo a NHB adequada e validação clínica antes da produção.
