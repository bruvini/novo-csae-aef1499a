import { normalizarNomeClinico } from './referenciasClinicas';

interface ExameComponente {
  componenteAnalisado: string;
  resultados?: Array<{ resultadoClassificatorio?: string }>;
}
interface ExameFisico {
  nomeExame: string;
  achados?: Array<{
    descricaoAchado: string;
    opcoes?: Array<{ textoOpcao: string }>;
  }>;
}

function nomesMantidos(antigos: string[], novos: string[], tipo: string): void {
  const novaLista = new Set(novos.map(normalizarNomeClinico));
  const ausentes = antigos.filter(nome => !novaLista.has(normalizarNomeClinico(nome)));
  if (ausentes.length) {
    throw new Error('Não é permitido excluir ou renomear ' + tipo +
      ' já existente: ' + ausentes.join(', ') +
      '. Preserve a chave dos registros clínicos antigos; utilize uma migração versionada para substituí-la.');
  }
}

/** Campos escritos como nome nos processos de enfermagem são imutáveis até haver uma migração versionada. */
export function validarAtualizacaoVital(
  anterior: { sinalVitalNome: string },
  proximo: { sinalVitalNome: string },
): void {
  if (anterior.sinalVitalNome !== proximo.sinalVitalNome) {
    throw new Error('Não é permitido renomear um sinal vital existente. O nome é uma chave usada nos processos antigos.');
  }
}

/** Preserva tanto chaves dos componentes quanto opções textuais de exames. */
export function validarAtualizacaoExame(
  anterior: { nomeExame: string; componentes: ExameComponente[] },
  proximo: { nomeExame: string; componentes: ExameComponente[] },
): void {
  if (anterior.nomeExame !== proximo.nomeExame) {
    throw new Error('Não renomeie um exame já cadastrado; a identificação consta em resultados e históricos.');
  }
  nomesMantidos(anterior.componentes.map(c => c.componenteAnalisado),
    proximo.componentes.map(c => c.componenteAnalisado), 'componentes de exames');
  for (const componente of anterior.componentes) {
    const novo = proximo.componentes.find(c =>
      normalizarNomeClinico(c.componenteAnalisado) === normalizarNomeClinico(componente.componenteAnalisado));
    if (!novo) continue;
    const originais = (componente.resultados || []).map(r => r.resultadoClassificatorio || '').filter(Boolean);
    nomesMantidos(originais, (novo.resultados || []).map(r => r.resultadoClassificatorio || '').filter(Boolean),
      'resultados classificatórios de ' + componente.componenteAnalisado);
  }
}

/** A revisão de sistemas grava o nome do exame e a descrição do achado nos prontuários. */
export function validarAtualizacaoSistema(
  anterior: { nomeSistema: string; exames: ExameFisico[] },
  proximo: { nomeSistema: string; exames: ExameFisico[] },
): void {
  if (anterior.nomeSistema !== proximo.nomeSistema) {
    throw new Error('Não é permitido renomear um sistema corporal existente sem migração versionada.');
  }
  nomesMantidos(anterior.exames.map(e => e.nomeExame), proximo.exames.map(e => e.nomeExame),
    'exames físicos');
  for (const exame of anterior.exames) {
    const novo = proximo.exames.find(e =>
      normalizarNomeClinico(e.nomeExame) === normalizarNomeClinico(exame.nomeExame));
    if (!novo) continue;
    nomesMantidos((exame.achados || []).map(a => a.descricaoAchado),
      (novo.achados || []).map(a => a.descricaoAchado), 'achados de ' + exame.nomeExame);
    for (const achado of exame.achados || []) {
      const atualizado = (novo.achados || []).find(a =>
        normalizarNomeClinico(a.descricaoAchado) === normalizarNomeClinico(achado.descricaoAchado));
      if (atualizado) nomesMantidos((achado.opcoes || []).map(o => o.textoOpcao),
        (atualizado.opcoes || []).map(o => o.textoOpcao), 'opções de ' + achado.descricaoAchado);
    }
  }
}
