export interface DestinoIntervencao {
  diagnosticoId: string;
  tituloDiagnostico: string;
  tituloResultado: string;
  resultadoIndice?: number;
}

export type ModoDisponibilidadeIntervencao = 'resultados_especificos' | 'transversal';

export interface PreparacaoAprovacao {
  acaoPrescrita: string;
  acaoEnfermeiro: string;
  destinos: DestinoIntervencao[];
  modoDisponibilidade?: ModoDisponibilidadeIntervencao;
  materiaisDeApoio?: Array<{ tituloMaterialApoio: string; urlMaterialApoio: string }>;
  referenciaDeliberacao?: string;
  dataDeliberacao?: string;
  documentoHomologacao?: string;
  responsavelValidacao?: string;
}

const MAX_DESTINOS = 1000;
const MAX_BYTES_DOCUMENTO = 850_000;
const modo = (preparacao: PreparacaoAprovacao): ModoDisponibilidadeIntervencao => preparacao.modoDisponibilidade || 'resultados_especificos';
const chaveDestino = (destino: DestinoIntervencao) => `${destino.diagnosticoId}|${destino.resultadoIndice ?? destino.tituloResultado}`;

export function validarPreparacao(preparacao: PreparacaoAprovacao | undefined): asserts preparacao is PreparacaoAprovacao {
  if (!preparacao?.acaoPrescrita.trim() || !preparacao.acaoEnfermeiro.trim()) throw new Error('Informe a Ação Prescrita e a Ação do Enfermeiro aprovadas.');
  const disponibilidade = modo(preparacao);
  if (disponibilidade !== 'transversal' && disponibilidade !== 'resultados_especificos') throw new Error('Selecione um modo de disponibilidade válido.');
  if (disponibilidade === 'resultados_especificos' && !preparacao.destinos.length) throw new Error('Selecione pelo menos um resultado esperado.');
  if (disponibilidade === 'transversal' && preparacao.destinos.length) throw new Error('Intervenção transversal não pode conter destinos específicos.');
  if (preparacao.destinos.length > MAX_DESTINOS || new Set(preparacao.destinos.map(chaveDestino)).size !== preparacao.destinos.length) {
    throw new Error(`Destinos repetidos ou acima do limite técnico de ${MAX_DESTINOS}.`);
  }
  if ((preparacao.materiaisDeApoio || []).length > 20) throw new Error('Adicione no máximo 20 materiais de apoio por intervenção.');
  const bytes = new TextEncoder().encode(JSON.stringify({ ...preparacao, status: 'disponivel', versao: 1 })).length;
  if (bytes > MAX_BYTES_DOCUMENTO) throw new Error('A seleção ultrapassa o limite seguro de tamanho de documento do Firestore. Reduza a quantidade de destinos.');
}

export function filtrarDestinosDiagnosticos<T extends { id: string; tituloDiagnostico: string; resultadosEsperados: Array<{ tituloResultado: string }> }>(
  diagnosticos: T[], busca: string,
) {
  const termo = busca.trim().toLocaleLowerCase('pt-BR');
  return diagnosticos.flatMap(diagnostico => {
    const resultados = diagnostico.resultadosEsperados
      .map((resultado, resultadoIndice) => ({ ...resultado, resultadoIndice }))
      .filter(resultado => !termo || `${diagnostico.tituloDiagnostico} ${resultado.tituloResultado}`.toLocaleLowerCase('pt-BR').includes(termo));
    return resultados.map(resultado => ({ diagnostico, resultado }));
  });
}

export function obterDisponibilidadePorResultado<T extends { modoDisponibilidade: ModoDisponibilidadeIntervencao; destinos: DestinoIntervencao[] }>(
  intervencoes: T[], diagnosticoId: string, resultadoIndice: number, tituloResultado: string,
) {
  return intervencoes.filter(intervencao => intervencao.modoDisponibilidade === 'transversal'
    || intervencao.destinos.some(destino => destino.diagnosticoId === diagnosticoId
      && (destino.resultadoIndice === undefined ? destino.tituloResultado === tituloResultado : destino.resultadoIndice === resultadoIndice)));
}
