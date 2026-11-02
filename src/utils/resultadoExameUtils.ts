export interface RegistroAvaliacaoClinica {
  exame: string;
  valor: string | number;
  tipo: 'parametro' | 'achado';
  descricao?: string;
}

export function obterRegistrosAvaliacaoClinica(avaliacao?: {
  exameFisico?: Record<string, string | number>;
  exameFisicoMulti?: Record<string, string[]>;
  exameFisicoDescricoes?: Record<string, string>;
}): RegistroAvaliacaoClinica[] {
  if (!avaliacao) return [];

  const parametros = avaliacao.exameFisico || {};
  const selecoes = avaliacao.exameFisicoMulti || {};
  const descricoes = avaliacao.exameFisicoDescricoes || {};
  const registros: RegistroAvaliacaoClinica[] = [];

  Object.entries(parametros).forEach(([exame, valor]) => {
    if (valor === null || valor === undefined || (typeof valor === 'string' && !valor.trim())) return;
    if (typeof valor === 'string' && selecoes[exame]?.includes(valor)) return;
    registros.push({ exame, valor, tipo: 'parametro' });
  });

  Object.entries(selecoes).forEach(([exame, valores]) => {
    valores.forEach((valor) => {
      if (!valor.trim()) return;
      const descricao = descricoes[`${exame}|||${valor}`];
      registros.push({
        exame,
        valor,
        tipo: 'achado',
        ...(descricao?.trim() ? { descricao } : {}),
      });
    });
  });

  return registros;
}

export interface ResultadoClassificatorioConfigurado {
  resultadoClassificatorio?: string;
  rotuloValorTexto?: string;
  tipoValorTexto?: 'lista' | 'livre';
  opcoesValorTexto?: string[];
}

export function obterOpcoesValorComplementar(resultado: ResultadoClassificatorioConfigurado): string[] {
  return resultado.tipoValorTexto === 'lista' && Array.isArray(resultado.opcoesValorTexto)
    ? resultado.opcoesValorTexto.filter((opcao) => typeof opcao === 'string' && opcao.trim().length > 0)
    : [];
}

export interface LinhaResultadoExame {
  tipoExame?: 'Laboratorial' | 'Imagem';
  nomeExame?: string;
  componente: string;
  valor: string | number;
  unidadeMedida?: string | null;
  resultadosConfigurados?: ResultadoClassificatorioConfigurado[];
  valorTexto?: {
    resultadoClassificatorio: string;
    valorTexto: string;
  };
}

/** Gera uma linha de resumo fiel ao resultado salvo e evita nomes indefinidos. */
export function formatarLinhaResultadoExame({
  tipoExame,
  nomeExame,
  componente,
  valor,
  unidadeMedida,
  resultadosConfigurados = [],
  valorTexto,
}: LinhaResultadoExame): string {
  const valorResultado = String(valor);
  const natureza = tipoExame === 'Imagem'
    ? 'Exame de imagem'
    : tipoExame === 'Laboratorial' ? 'Exame laboratorial' : 'Resultado de exame';
  const nomeVisivel = nomeExame?.trim() || componente;
  const resultadoConfigurado = resultadosConfigurados.find(
    (resultado) => resultado.resultadoClassificatorio === valorResultado
  );
  const complementoValido = valorTexto
    && valorTexto.resultadoClassificatorio === valorResultado
    && valorTexto.valorTexto.trim().length > 0;
  const complemento = complementoValido
    ? ` — ${resultadoConfigurado?.rotuloValorTexto || 'Informação complementar'}: ${valorTexto.valorTexto}`
    : '';

  const unidade = unidadeMedida?.trim();
  const valorNumerico = typeof valor === 'number' || /^[-+]?\d+(?:[.,]\d+)?$/.test(valorResultado.trim());
  const contemUnidade = unidade
    ? valorResultado.toLocaleLowerCase('pt-BR').includes(unidade.toLocaleLowerCase('pt-BR'))
    : false;
  const valorComUnidade = unidade
    && valorNumerico
    && !contemUnidade
    ? `${valorResultado} ${unidade}`
    : valorResultado;
  return `${natureza} — ${nomeVisivel} — ${componente}: ${valorComUnidade}${complemento}`;
}
