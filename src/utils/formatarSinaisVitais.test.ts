import assert from 'node:assert/strict';
import test from 'node:test';
import { formatarSinaisVitais } from './formatarSinaisVitais';

const sinaisDoTicket = [
  { sinalVitalNome: 'Frequência Cardíaca (FC)', unidadeMedida: 'bpm' },
  { sinalVitalNome: 'Glicemia Capilar', unidadeMedida: 'mg/dL' },
  { sinalVitalNome: 'Pressão Arterial Diastólica (PAD)', unidadeMedida: 'mmHg' },
  { sinalVitalNome: 'Pressão Arterial Sistólica (PAS)', unidadeMedida: 'mmHg' },
  { sinalVitalNome: 'Saturação de Oxigênio (SpO2)', unidadeMedida: '%' },
  { sinalVitalNome: 'Temperatura Corporal', unidadeMedida: 'ºC' },
  { sinalVitalNome: 'Tempo de Enchimento Capilar', unidadeMedida: 'segundos' },
];

test('formata os parâmetros e unidades do exemplo sem duplicar a PA', () => {
  const result = formatarSinaisVitais({
    'Frequência Cardíaca (FC)': 87,
    'Glicemia Capilar': 106,
    'Pressão Arterial Diastólica (PAD)': 70,
    'Pressão Arterial Sistólica (PAS)': 90,
    'Saturação de Oxigênio (SpO2)': 96,
    'Temperatura Corporal': '36.1',
    'Tempo de Enchimento Capilar': 1,
  }, sinaisDoTicket);

  assert.deepEqual(result, [
    { nome: 'Frequência Cardíaca (FC)', valor: '87 bpm' },
    { nome: 'Glicemia Capilar', valor: '106 mg/dL' },
    { nome: 'Pressão Arterial (PA)', valor: '90/70 mmHg' },
    { nome: 'Saturação de Oxigênio (SpO2)', valor: '96%' },
    { nome: 'Temperatura Corporal', valor: '36,1 °C' },
    { nome: 'Tempo de Enchimento Capilar', valor: '1 s' },
  ]);
  assert.equal(result.filter(({ nome }) => nome.includes('(PA)')).length, 1);
});

test('mantém PAS e PAD identificadas individualmente quando só uma está preenchida', () => {
  const catalogo = sinaisDoTicket.slice(2, 4);
  assert.deepEqual(
    formatarSinaisVitais({ 'Pressão Arterial Diastólica (PAD)': '', 'Pressão Arterial Sistólica (PAS)': 0 }, catalogo),
    [{ nome: 'Pressão Arterial Sistólica (PAS)', valor: '0 mmHg' }],
  );
  assert.deepEqual(
    formatarSinaisVitais({ 'Pressão Arterial Diastólica (PAD)': 70 }, catalogo),
    [{ nome: 'Pressão Arterial Diastólica (PAD)', valor: '70 mmHg' }],
  );
});

test('combina PA em ordem sistólica/diastólica mesmo se o catálogo vier invertido', () => {
  const result = formatarSinaisVitais({
    'Pressão Arterial Diastólica (PAD)': '70',
    'Pressão Arterial Sistólica (PAS)': '90',
  }, sinaisDoTicket.slice(2, 4));

  assert.deepEqual(result, [{ nome: 'Pressão Arterial (PA)', valor: '90/70 mmHg' }]);
});

test('não confunde PAM, pressão diferencial ou medidas posturais com PAS/PAD', () => {
  const catalogo = [
    { sinalVitalNome: 'Pressão Arterial Média (PAM)', unidadeMedida: 'mmHg' },
    { sinalVitalNome: 'Pressão Diferencial (Convergência)', unidadeMedida: 'mmHg' },
    { sinalVitalNome: 'Pressão Arterial Sistólica Postural (PAS)', unidadeMedida: 'mmHg' },
    { sinalVitalNome: 'Pressão Arterial Diastólica Postural (PAD)', unidadeMedida: 'mmHg' },
  ];
  const result = formatarSinaisVitais({
    'Pressão Arterial Média (PAM)': 80,
    'Pressão Diferencial (Convergência)': 20,
    'Pressão Arterial Sistólica Postural (PAS)': 90,
    'Pressão Arterial Diastólica Postural (PAD)': 70,
  }, catalogo);

  assert.deepEqual(result, [
    { nome: 'Pressão Arterial Média (PAM)', valor: '80 mmHg' },
    { nome: 'Pressão Diferencial (Convergência)', valor: '20 mmHg' },
    { nome: 'Pressão Arterial Sistólica Postural (PAS)', valor: '90 mmHg' },
    { nome: 'Pressão Arterial Diastólica Postural (PAD)', valor: '70 mmHg' },
  ]);
});

test('combina apenas pressões com o mesmo contexto e preserva a indicação no rótulo', () => {
  const catalogo = [
    { sinalVitalNome: 'Pressão Arterial Sistólica (PAS) — Investigação de Dengue', unidadeMedida: 'mmHg' },
    { sinalVitalNome: 'Pressão Arterial Diastólica (PAD) — Investigação de Dengue', unidadeMedida: 'mmHg' },
  ];
  assert.deepEqual(
    formatarSinaisVitais({
      'Pressão Arterial Sistólica (PAS) — Investigação de Dengue': 90,
      'Pressão Arterial Diastólica (PAD) — Investigação de Dengue': 60,
    }, catalogo),
    [{ nome: 'Pressão Arterial (PA) — Investigação de Dengue', valor: '90/60 mmHg' }],
  );

  const contextosDiferentes = [
    catalogo[0],
    { sinalVitalNome: 'Pressão Arterial Diastólica (PAD)', unidadeMedida: 'mmHg' },
  ];
  assert.equal(formatarSinaisVitais({
    [contextosDiferentes[0].sinalVitalNome]: 90,
    [contextosDiferentes[1].sinalVitalNome]: 60,
  }, contextosDiferentes).length, 2);
});

test('normaliza decimais inequívocos e preserva strings de formato ambíguo', () => {
  const catalogo = [
    { sinalVitalNome: 'Temperatura Corporal', unidadeMedida: '°C' },
    { sinalVitalNome: 'Medida legada', unidadeMedida: '' },
  ];
  assert.deepEqual(formatarSinaisVitais({
    'Temperatura Corporal': '36.25',
    'Medida legada': '1.234',
  }, catalogo), [
    { nome: 'Temperatura Corporal', valor: '36,25 °C' },
    { nome: 'Medida legada', valor: '1.234' },
  ]);
});

test('não repete unidade incorporada no nome ou no valor e converte aliases conhecidos', () => {
  const catalogo = [
    { sinalVitalNome: 'Frequência Cardíaca (bpm)', unidadeMedida: 'bpm' },
    { sinalVitalNome: 'Glicemia Capilar', unidadeMedida: 'mg/dl' },
    { sinalVitalNome: 'Temperatura Corporal', unidadeMedida: 'ºC' },
    { sinalVitalNome: 'Tempo de Enchimento Capilar', unidadeMedida: 'segundos' },
  ];
  assert.deepEqual(formatarSinaisVitais({
    'Frequência Cardíaca (bpm)': '87 bpm',
    'Glicemia Capilar': '106mg/dl',
    'Temperatura Corporal': '36,1 ºC',
    'Tempo de Enchimento Capilar': '1 segundo',
  }, catalogo), [
    { nome: 'Frequência Cardíaca (bpm)', valor: '87 bpm' },
    { nome: 'Glicemia Capilar', valor: '106 mg/dL' },
    { nome: 'Temperatura Corporal', valor: '36,1 °C' },
    { nome: 'Tempo de Enchimento Capilar', valor: '1 s' },
  ]);
});

test('não inventa unidade para parâmetros sem unidade confiável e não altera dados antigos', () => {
  const processoAntigo = {
    'Sinal sem unidade': '0',
    'Sinal sem valor': '',
  };
  const original = structuredClone(processoAntigo);

  assert.deepEqual(formatarSinaisVitais(processoAntigo, [
    { sinalVitalNome: 'Sinal sem unidade' },
    { sinalVitalNome: 'Sinal sem valor', unidadeMedida: 'bpm' },
  ]), [{ nome: 'Sinal sem unidade', valor: '0' }]);
  assert.deepEqual(processoAntigo, original);
});

test('não combina leituras PA com sufixos não numéricos ou unidades conflitantes', () => {
  const catalogo = sinaisDoTicket.slice(2, 4);
  const result = formatarSinaisVitais({
    'Pressão Arterial Diastólica (PAD)': '70%',
    'Pressão Arterial Sistólica (PAS)': '90 mmHg',
  }, catalogo);

  assert.deepEqual(result, [
    { nome: 'Pressão Arterial Diastólica (PAD)', valor: '70% mmHg' },
    { nome: 'Pressão Arterial Sistólica (PAS)', valor: '90 mmHg' },
  ]);
});
