import { normalizarNomeClinico } from './referenciasClinicas';
import type { SistemaCorporal, ExamePropedeutico, Achado, OpcaoAchado } from '@/services/bancodados/revisaoSistemasDB';

type Sistema = Pick<SistemaCorporal, 'nomeSistema' | 'exames'>;
const norm = normalizarNomeClinico;
const erro = (msg: string): never => { throw new Error(msg); };

function verificarIdade(achado: Achado, descricao: string): void {
  const { idadeMinima: min, idadeMaxima: max, idadeUnidade: unidade } = achado;
  if ([min, max].some(x => x != null && (!Number.isFinite(x) || x < 0))) {
    erro('Idade inválida no achado "' + descricao + '". Use número não negativo.');
  }
  if ((min != null || max != null) && !['dias', 'meses', 'anos'].includes(unidade)) {
    erro('Selecione a unidade etária (dias, meses ou anos) para "' + descricao + '".');
  }
  if (min != null && max != null && min > max) {
    erro('Faixa etária invertida no achado "' + descricao + '".');
  }
}
function conferirAlteracao(
  nome: string, ehAlteracao: boolean, titulo: string | undefined,
  nhb: string | undefined, validos?: ReadonlySet<string>,
): void {
  if (!ehAlteracao) return;
  if (!titulo?.trim()) erro('Informe a classificação do achado alterado "' + nome + '".');
  if (!nhb?.trim()) erro('Selecione a NHB afetada no achado alterado "' + nome + '".');
  if (validos && !validos.has(norm(nhb))) {
    erro('A NHB "' + nhb + '" não existe no catálogo institucional. Revise o vínculo de "' + nome + '".');
  }
}
function validarOpcoes(achado: Achado, validos?: ReadonlySet<string>): void {
  const opcoes = achado.opcoes || [];
  if (!opcoes.length) erro('Inclua ao menos uma opção em "' + achado.descricaoAchado + '".');
  const nomes = opcoes.map(o => norm(o.textoOpcao));
  if (nomes.some(n => !n) || nomes.length !== new Set(nomes).size) {
    erro('Há opções vazias ou duplicadas em "' + achado.descricaoAchado + '".');
  }
  opcoes.forEach((opcao: OpcaoAchado) => conferirAlteracao(
    opcao.textoOpcao, opcao.ehAlteracao === true, opcao.nomeAlteracao,
    opcao.subconjuntoNHBVinculado, validos,
  ));
}
export function validarAchadoNovo(achado: Achado, nhbsDisponiveis?: readonly string[]): void {
  validarAchado(achado, nhbsDisponiveis ? new Set(nhbsDisponiveis.map(norm)) : undefined);
}

function validarAchado(achado: Achado, validos?: ReadonlySet<string>): void {
  const nome = achado.descricaoAchado?.trim();
  if (!nome) erro('Exame físico possui achado sem descrição.');
  verificarIdade(achado, nome);
  if ((achado.tipoAchado || 'simples') === 'opcoes') {
    validarOpcoes(achado, validos);
  } else {
    conferirAlteracao(nome, achado.ehAlteracao === true,
      achado.nomeAlteracao, achado.subconjuntoNHBVinculado, validos);
  }
}
function validarExame(exame: ExamePropedeutico, validos?: ReadonlySet<string>): void {
  if (!exame.nomeExame?.trim()) erro('Nome do exame físico é obrigatório.');
  if (!exame.propedeutica?.trim()) erro('Selecione a propedêutica do exame "' + exame.nomeExame + '".');
  if (!exame.achados?.length) erro('O exame "' + exame.nomeExame + '" não possui achados. Cadastre ao menos um.');
  const achados = exame.achados.map(a => norm(a.descricaoAchado));
  if (achados.some(n => !n) || achados.length !== new Set(achados).size) {
    erro('O exame "' + exame.nomeExame + '" contém achados vazios ou duplicados.');
  }
  exame.achados.forEach(a => validarAchado(a, validos));
}
/**
 * Exige estrutura clínica completa no cadastro e nos componentes que estão
 * sendo alterados. Itens legados inalterados nunca são reinterpretados.
 */
export function validarConteudoExameFisico(
  candidato: Sistema, anterior?: Sistema,
  nhbsDisponiveis?: readonly string[],
): void {
  if (!candidato.nomeSistema?.trim()) erro('Nome do sistema corporal é obrigatório.');
  if (!candidato.exames?.length) erro('Adicione ao menos um exame físico ao sistema corporal.');
  const nomes = candidato.exames.map(e => norm(e.nomeExame));
  if (nomes.some(n => !n) || nomes.length !== new Set(nomes).size) {
    erro('Há exames físicos sem nome ou duplicados no sistema "' + candidato.nomeSistema + '".');
  }
  const validos = nhbsDisponiveis ? new Set(nhbsDisponiveis.map(norm)) : undefined;
  for (const exame of candidato.exames) {
    const antesExame = anterior?.exames?.find(e => norm(e.nomeExame) === norm(exame.nomeExame));
    if (!antesExame) {
      validarExame(exame, validos);
      continue;
    }
    for (const achado of exame.achados || []) {
      const anteriorAchado = antesExame.achados?.find(a => norm(a.descricaoAchado) === norm(achado.descricaoAchado));
      if (!anteriorAchado || JSON.stringify(anteriorAchado) !== JSON.stringify(achado)) {
        validarAchado(achado, validos);
      }
    }
  }
}
