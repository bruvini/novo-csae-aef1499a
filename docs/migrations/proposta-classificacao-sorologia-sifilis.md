# Proposta revisável — classificação da sorologia para sífilis

Status: **proposta não executada; requer autorização explícita antes de qualquer escrita no Firestore**.

## Documento verificado

- Coleção: `ExamesLabImagem`
- ID: `ygN3AA8HKdHAz89F1Fdn`
- Nome: `Sorologia para Sífilis — Teste Treponêmico (TR) + VDRL`
- Valor lido: `tipoExame: "Imagem"`
- Componentes: `Teste Treponêmico (TR)` e `VDRL (Teste Não Treponêmico / Titulação)`; ambos qualitativos. O VDRL permite texto complementar e mantém as opções de titulação já registradas.

## Alteração proposta

```json
{
  "tipoExame": "Laboratorial"
}
```

Somente o campo `tipoExame` deve mudar. Preservar integralmente IDs, resultados classificatórios, orientações clínicas, NHBs, opções e demais campos do documento.

## Condições de execução idempotente

1. Ler novamente o documento pelo ID imediatamente antes da alteração.
2. Se estiver ausente, abortar sem gravar.
3. Se `tipoExame` for `Imagem`, atualizar somente `tipoExame` para `Laboratorial`.
4. Se já for `Laboratorial`, tratar como concluído e não gravar novamente.
5. Se tiver qualquer outro valor, abortar e solicitar revisão humana.
6. Registrar no log da operação o ID, valor anterior e novo valor; nunca registrar dados de pacientes.

Esta proposta não é um script de execução e não foi aplicada ao banco. A validação clínica/institucional e a autorização operacional permanecem pendentes.
