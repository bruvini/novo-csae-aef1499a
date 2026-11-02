import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calcularIndicadoresTickets,
  calcularIndicadoresSugestoes,
  calcularIndicadoresUsuarios,
  formatarDuracaoHoras,
} from './indicadoresAdministrativos';
import type { TicketProblema, SugestaoMelhoria } from '@/services/bancodados/suporteDB';
import type { Usuario } from '@/types/usuario';

const dia = (valor: string) => ({ toDate: () => new Date(valor) });
const ticket = (dados: Partial<TicketProblema>): TicketProblema => ({
  usuarioId: 'u', nomeUsuario: 'Profissional', moduloAferido: 'Processo de Enfermagem',
  descricao: 'Teste', status: 'Aberto', dataCriacao: dia('2026-10-13T12:00:00Z') as TicketProblema['dataCriacao'],
  ...dados,
});
const sugestao = (dados: Partial<SugestaoMelhoria>): SugestaoMelhoria => ({
  usuarioId: 'u', nomeUsuario: 'Profissional', categoria: 'Outro',
  descricao: 'Teste', dataCriacao: dia('2026-10-13T12:00:00Z') as SugestaoMelhoria['dataCriacao'],
  ...dados,
});

test('tickets contabilizam pendências e tempo de resolução apenas com datas válidas', () => {
  const itens = [
    ticket({ status: 'Aberto', visualizadoPeloSuporte: false }),
    ticket({ status: 'Resolvido', dataResolucao: dia('2026-10-13T18:00:00Z') as TicketProblema['dataResolucao'] }),
    ticket({ status: 'Resolvido' }),
  ];
  const valor = calcularIndicadoresTickets(itens);
  assert.equal(valor.total, 3);
  assert.equal(valor.abertos, 1);
  assert.equal(valor.resolvidos, 2);
  assert.equal(valor.semLeitura, 1);
  assert.equal(valor.tempoResolucao, 6);
});

test('sugestões com resposta sem data mantêm contagem, mas não inventam lead time', () => {
  const itens = [
    sugestao({ respostaAdmin: 'Avaliamos.', visualizadoPeloSuporte: true }),
    sugestao({ visualizadoPeloSuporte: false }),
  ];
  const v = calcularIndicadoresSugestoes(itens);
  assert.equal(v.respondidas, 1);
  assert.equal(v.pendentes, 1);
  assert.equal(v.semLeitura, 1);
  assert.equal(v.tempoResposta, null);
  assert.equal(formatarDuracaoHoras(v.tempoResposta), '—');
});

test('usuários aprovados calculam prazo e acessos sem considerar perfis não aprovados', () => {
  const grupo = {
    aguardando: [{ totalAcessos: 88 } as Usuario],
    aprovados: [
      { totalAcessos: 4, dataCadastro: dia('2026-10-10T12:00:00Z'),
        dataAprovacao: dia('2026-10-11T12:00:00Z') } as Usuario,
      { totalAcessos: 6 } as Usuario,
    ],
    recusados: [] as Usuario[],
    revogados: [] as Usuario[],
  };
  const v = calcularIndicadoresUsuarios(grupo);
  assert.equal(v.total, 3);
  assert.equal(v.tempoAprovacao, 24);
  assert.equal(v.totalAcessos, 10);
});

test('tempo negativo ou ausente nunca vira média', () => {
  const v = calcularIndicadoresTickets([ticket({
    status: 'Resolvido', dataResolucao: dia('2026-10-12T12:00:00Z') as TicketProblema['dataResolucao'],
  })]);
  assert.equal(v.tempoResolucao, null);
  assert.equal(formatarDuracaoHoras(null), '—');
});
