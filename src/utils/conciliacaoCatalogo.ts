import { identidadeParametroVital, normalizarNomeClinico } from './referenciasClinicas';

export type AbaOrigem = 'SinaisVitais' | 'RevisaoSistemas' | 'ExamesLabImagem';
export interface LinhaFonte { linha: number; celulas: string[]; }
export type FontesPlanilha = Record<AbaOrigem, LinhaFonte[]>;

export interface InventarioClinico {
  projeto: string;
  modo: string;
  geradoEmUTC?: string;
  colecoes: {
    SinaisVitais: Array<{ id: string; nome: string; referencias: Array<Record<string, unknown>> }>;
    RevisaoSistemas: Array<{ id: string; nome: string; exames: Array<{
      nome: string; achados: Array<{ nome: string }>;
    }> }>;
    ExamesLabImagem: Array<{ id: string; nome: string; tipo: string; componentes: Array<{
      nome: string; resultados: Array<Record<string, unknown>>;
    }> }>;
    subconjuntosEnfermagem: Array<{ nome: string; tipo: string }>;
  };
}
export type AcaoConciliacao = 'reutilizar' | 'conferir-referencias' | 'complementar-candidato'
  | 'novo-candidato' | 'revisao-obrigatoria';
export interface PropostaConciliacao {
  aba: AbaOrigem;
  item: string;
  acao: AcaoConciliacao;
  linhasOrigem: number[];
  documentosFirestore: string[];
  justificativa: string;
  /** Ação administrativa somente após avaliação e aprovação institucional. */
  exigeAprovacaoCSAE: true;
}
export interface ResultadoConciliacao {
  projeto: string;
  versaoFonte: string;
  modo: 'somente_leitura';
  contagensOrigem: Record<AbaOrigem, number>;
  totaisPorAcao: Record<AcaoConciliacao, number>;
  propostas: PropostaConciliacao[];
  observacoes: string[];
}
const norm = (v: unknown): string => normalizarNomeClinico(typeof v === 'string' ? v : String(v ?? ''));
const texto = (row: LinhaFonte, col: number): string => (row.celulas[col] || '').trim();
const mapaLinhas = (linhas: LinhaFonte[], coluna: number) => {
  const grupos = new Map<string, LinhaFonte[]>();
  for (const linha of linhas) {
    const key = norm(texto(linha, coluna));
    if (!key) continue;
    const array = grupos.get(key) || [];
    array.push(linha);
    grupos.set(key, array);
  }
  return grupos;
};
const ids = (arr: Array<{ id: string }>): string[] => arr.map(v => v.id);
const proposta = (
  aba: AbaOrigem, item: string, acao: AcaoConciliacao, linhas: LinhaFonte[],
  documentos: string[], justificativa: string,
): PropostaConciliacao => ({
  aba, item, acao, linhasOrigem: linhas.map(r => r.linha),
  documentosFirestore: documentos, justificativa, exigeAprovacaoCSAE: true,
});
const numeric = (v: unknown): number | null => {
  if (v === null || v === undefined || String(v).trim() === '') return null;
  const number = Number(String(v).replace(',', '.'));
  return Number.isFinite(number) ? number : null;
};
function assinaturaVitalFonte(l: LinhaFonte) {
  return [
    numeric(texto(l, 3)), numeric(texto(l, 4)),
    norm(texto(l, 5)), norm(texto(l, 6)), norm(texto(l, 7)),
    numeric(texto(l, 8)), numeric(texto(l, 9)),
    norm(texto(l, 10)), norm(texto(l, 11)),
  ].join('|');
}
function assinaturaVitalInventario(r: Record<string, unknown>) {
  return [
    numeric(r.idadeMinima), numeric(r.idadeMaxima),
    norm(r.idadeUnidade), norm(r.sexo), norm(r.condicao),
    numeric(r.valorMinimo), numeric(r.valorMaximo),
    norm(r.alteracao), norm(r.nhb),
  ].join('|');
}
function conferirNHB(
  aba: AbaOrigem, rows: LinhaFonte[], indice: number, nhbs: Set<string>,
): string[] {
  const faltantes = [...new Set(rows.map(l => texto(l, indice))
    .filter(v => v && !nhbs.has(norm(v))))];
  return faltantes.map(nhb => 'NHB não identificada no inventário: ' + nhb);
}
export function conciliarCatalogoClinico(
  inventario: InventarioClinico, fontes: FontesPlanilha,
): ResultadoConciliacao {
  if (inventario.projeto !== 'csaefloripa' || inventario.modo !== 'somente_leitura') {
    throw new Error('Inventário recusado: exige projeto csaefloripa e relatório somente_leitura.');
  }
  if (!inventario.colecoes || !Array.isArray(inventario.colecoes.SinaisVitais)
    || !Array.isArray(inventario.colecoes.RevisaoSistemas)
    || !Array.isArray(inventario.colecoes.ExamesLabImagem)
    || !Array.isArray(inventario.colecoes.subconjuntosEnfermagem)) {
    throw new Error('Inventário incompleto: faltam as coleções clínicas e os subconjuntos NHB.');
  }
  const nhbs = new Set(inventario.colecoes.subconjuntosEnfermagem
    .filter(s => norm(s.tipo) === 'nhb').map(s => norm(s.nome)));
  const propostas: PropostaConciliacao[] = [];
  const sources = {
    SinaisVitais: fontes.SinaisVitais || [],
    RevisaoSistemas: fontes.RevisaoSistemas || [],
    ExamesLabImagem: fontes.ExamesLabImagem || [],
  };
  for (const [key, entries] of mapaLinhas(sources.SinaisVitais, 0)) {
    const candidatos = inventario.colecoes.SinaisVitais.filter(s =>
      identidadeParametroVital(s.nome) === identidadeParametroVital(texto(entries[0], 0)));
    const nhbErrors = conferirNHB('SinaisVitais', entries, 11, nhbs);
    if (candidatos.length > 1 || nhbErrors.length) {
      propostas.push(proposta('SinaisVitais', texto(entries[0], 0),
        'revisao-obrigatoria', entries, ids(candidatos),
        ['Identidade ambígua ou vínculo NHB incompatível.', ...nhbErrors].join(' ')));
      continue;
    }
    if (!candidatos.length) {
      propostas.push(proposta('SinaisVitais', texto(entries[0], 0),
        'novo-candidato', entries, [], 'Não localizado por identidade nominal; pesquisar sinônimos e protocolos antes de criar.'));
      continue;
    }
    const cadastradas = new Set((candidatos[0].referencias || []).map(assinaturaVitalInventario));
    const ausentes = entries.filter(l => !cadastradas.has(assinaturaVitalFonte(l)));
    propostas.push(proposta('SinaisVitais', texto(entries[0], 0),
      ausentes.length ? 'conferir-referencias' : 'reutilizar', entries,
      ids(candidatos),
      ausentes.length ? String(ausentes.length) +
        ' linha(s) de faixa não coincidem integralmente; NÃO anexar automaticamente.' :
        'As referências da planilha coincidem nos campos exportados; confirmar vigência e fonte.'));
  }
  for (const [key, entries] of mapaLinhas(sources.ExamesLabImagem, 0)) {
    const candidatos = inventario.colecoes.ExamesLabImagem.filter(e => norm(e.nome) === key);
    const nhbErrors = conferirNHB('ExamesLabImagem', entries, 13, nhbs);
    if (candidatos.length > 1 || nhbErrors.length) {
      propostas.push(proposta('ExamesLabImagem', texto(entries[0], 0),
        'revisao-obrigatoria', entries, ids(candidatos),
        ['Exames homônimos ou vínculos NHB não conciliados.', ...nhbErrors].join(' ')));
      continue;
    }
    if (!candidatos.length) {
      propostas.push(proposta('ExamesLabImagem', texto(entries[0], 0),
        'novo-candidato', entries, [], 'Exame não encontrado pelo nome; conferir sinônimos e componentes já existentes.'));
      continue;
    }
    const existente = candidatos[0];
    const tiposPlanilha = [...new Set(entries.map(r => texto(r, 2)))].filter(Boolean);
    if (tiposPlanilha.length !== 1 || tiposPlanilha[0] !== existente.tipo) {
      propostas.push(proposta('ExamesLabImagem', texto(entries[0], 0),
        'revisao-obrigatoria', entries, [existente.id],
        'Divergência ou mistura de tipo Laboratorial/Imagem. Não converter resultados de forma automática.'));
      continue;
    }
    const itens = new Set((existente.componentes || []).map(c => norm(c.nome)));
    const nomesNovos = [...new Set(entries.map(l => texto(l, 3)).filter(n => n && !itens.has(norm(n))))];
    propostas.push(proposta('ExamesLabImagem', texto(entries[0], 0),
      nomesNovos.length ? 'complementar-candidato' : 'conferir-referencias', entries,
      [existente.id],
      nomesNovos.length ?
        'Componentes candidatos ausentes: ' + nomesNovos.join('; ') + '. Conferir possíveis equivalências.' :
        'Componentes encontrados; confrontar faixas, resultados qualitativos, unidades e NHBs manualmente.'));
  }
  for (const [key, entries] of mapaLinhas(sources.RevisaoSistemas, 0)) {
    const candidatos = inventario.colecoes.RevisaoSistemas.filter(s => norm(s.nome) === key);
    const nhbErrors = conferirNHB('RevisaoSistemas', entries, 10, nhbs);
    if (candidatos.length > 1 || nhbErrors.length) {
      propostas.push(proposta('RevisaoSistemas', texto(entries[0], 0),
        'revisao-obrigatoria', entries, ids(candidatos),
        ['Sistema duplicado ou vínculos NHB não conciliados.', ...nhbErrors].join(' ')));
      continue;
    }
    if (!candidatos.length) {
      propostas.push(proposta('RevisaoSistemas', texto(entries[0], 0),
        'novo-candidato', entries, [], 'Sistema não localizado pelo nome; verificar denominação atual e exame em outros sistemas.'));
      continue;
    }
    const registrados = (candidatos[0].exames || []);
    const faltantes = entries.filter(r => !registrados.some(ex =>
      norm(ex.nome) === norm(texto(r, 3))
      && (ex.achados || []).some(a => norm(a.nome) === norm(texto(r, 8)))));
    propostas.push(proposta('RevisaoSistemas', texto(entries[0], 0),
      faltantes.length ? 'complementar-candidato' : 'reutilizar', entries,
      ids(candidatos),
      faltantes.length ?
        String(faltantes.length) + ' linha(s) de exame/achado ausente(s) ou renomeada(s); verificar chaves legadas.' :
        'Exames e achados nominativos correspondem; ainda é necessária avaliação clínica das descrições.'));
  }
  const acoes: AcaoConciliacao[] = [
    'reutilizar', 'conferir-referencias', 'complementar-candidato',
    'novo-candidato', 'revisao-obrigatoria',
  ];
  const totais = Object.fromEntries(acoes.map(a => [a, propostas.filter(p => p.acao === a).length]))
    as Record<AcaoConciliacao, number>;
  return {
    projeto: inventario.projeto,
    versaoFonte: inventario.geradoEmUTC || 'inventario-sem-data',
    modo: 'somente_leitura',
    contagensOrigem: {
      SinaisVitais: sources.SinaisVitais.length,
      RevisaoSistemas: sources.RevisaoSistemas.length,
      ExamesLabImagem: sources.ExamesLabImagem.length,
    },
    totaisPorAcao: totais,
    propostas: propostas.sort((a,b) => a.aba.localeCompare(b.aba) || a.item.localeCompare(b.item, 'pt-BR')),
    observacoes: [
      'Este documento é somente uma comparação técnica. Não é autorização para alterações no Firestore.',
      'Os achados representam a data do inventário; obter um inventário novo antes de qualquer proposta de migração.',
      'Não deduzir normalidade, gestação, risco ou vínculo diagnóstico com base apenas no nome de uma referência.',
      'As planilhas são fontes auxiliares: diferenças de nomenclatura, mudanças de protocolo e recortes não equivalem a conteúdo novo.',
      'Resultados classificatórios, limites clínicos e NHBs dependem de aprovação da Comissão CSAE.',
    ],
  };
}
