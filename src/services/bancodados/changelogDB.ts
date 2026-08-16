import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  limit,
  where,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/services/firebase';

// ─── Interface ───────────────────────────────────────────────
export interface Changelog {
  id?: string;
  titulo: string;
  descricao: string;
  dataHora: Timestamp;
}

// ─── Buscar changelogs recentes (últimos 10) ─────────────────
export async function buscarChangelogsRecentes(): Promise<Changelog[]> {
  const ref = collection(db, 'changelogs');
  const q = query(ref, orderBy('dataHora', 'desc'), limit(10));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Changelog[];
}

// ─── Buscar TODOS os changelogs (para modal de histórico) ──────────────────
export async function buscarTodosChangelogs(): Promise<Changelog[]> {
  const ref = collection(db, 'changelogs');
  const q = query(ref, orderBy('dataHora', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Changelog[];
}

// ─── Salvar novo changelog ───────────────────────────────────
export async function salvarChangelog(titulo: string, descricao: string): Promise<void> {
  const ref = collection(db, 'changelogs');
  await addDoc(ref, {
    titulo,
    descricao,
    dataHora: serverTimestamp(),
  });
}

// ─── Inserção idempotente por título ────────────────────────
// Só insere se ainda não existir um documento com esse título.
export async function inserirChangelogIdempotente(
  titulo: string,
  descricao: string,
  dataHora?: Timestamp
): Promise<boolean> {
  const ref = collection(db, 'changelogs');
  const q = query(ref, where('titulo', '==', titulo), limit(1));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    await addDoc(ref, {
      titulo,
      descricao,
      dataHora: dataHora ?? Timestamp.now(),
    });
    return true; // inserido
  }
  return false; // já existia
}

// ─── Lista completa de changelogs do sistema ────────────────
// Entradas com dataHora fixa mantêm ordem cronológica estável.
// Entradas sem dataHora usam Timestamp.now() na primeira inserção (aparecem no topo).
const CHANGELOGS_SISTEMA: { titulo: string; descricao: string; dataHora?: Timestamp }[] = [
  {
    titulo: 'Nova Interface do Dashboard',
    descricao:
      'Otimizamos a área inicial e adicionamos o mural de atualizações para manter você informado.',
    dataHora: Timestamp.fromDate(new Date('2025-01-01T08:00:00')),
  },
  {
    titulo: 'Novo Design do Exame Físico',
    descricao:
      'A aba de Exame Físico foi completamente redesenhada. Agora os sinais vitais, exames e revisão de sistemas estão organizados em painéis interativos mais claros, com feedback inteligente de cores para alterações clínicas.',
    dataHora: Timestamp.fromDate(new Date('2025-02-01T08:00:00')),
  },
  {
    titulo: 'Salvamento Automático Inteligente',
    descricao:
      "Simplificamos o Processo de Enfermagem! O botão 'Salvar Progresso' foi removido para evitar confusões. Agora, basta clicar em 'Avançar' e o sistema salvará automaticamente todas as suas alterações de forma segura.",
    dataHora: Timestamp.fromDate(new Date('2025-03-01T08:00:00')),
  },
  {
    titulo: 'Adequação à Resolução COFEN Nº 736/2024',
    descricao:
      'Atualizamos os responsáveis pela execução das intervenções. Agora você pode delegar o cuidado de forma mais precisa, escolhendo entre: Técnico/Auxiliar de Enfermagem, Equipe Multiprofissional, Cuidador/Familiar ou o próprio Paciente (Autocuidado).',
    dataHora: Timestamp.fromDate(new Date('2025-04-01T08:00:00')),
  },
  {
    titulo: 'Executores em Intervenções Autorais',
    descricao:
      "Corrigimos um bloqueio na Etapa de Implementação. Agora, quando você criar uma Intervenção Autoral, o campo obrigatório de 'Quem Executa' aparecerá normalmente, permitindo que você avance de etapa sem problemas.",
    dataHora: Timestamp.fromDate(new Date('2025-05-01T08:00:00')),
  },
  {
    titulo: 'Mais Controle no Planejamento: Exclusão de Intervenções Autorais',
    descricao:
      'Agora, ao escrever uma intervenção autoral na etapa de Planejamento de Enfermagem, é possível excluí-la facilmente clicando no ícone de lixeira caso mude de ideia ou note algum erro de digitação. Mais liberdade e precisão para o seu raciocínio clínico.',
    dataHora: Timestamp.fromDate(new Date('2025-06-01T08:00:00')),
  },
  {
    titulo: 'Mais Segurança na Gestão de Usuários',
    descricao:
      'Ajustamos os níveis de acesso para garantir mais segurança na plataforma. Agora, membros da equipe que ajudam na triagem podem aprovar novos cadastros, mas apenas Administradores possuem a permissão de alterar privilégios avançados ou excluir contas que já estão ativas no sistema.',
    dataHora: Timestamp.fromDate(new Date('2025-07-01T08:00:00')),
  },
  {
    titulo: 'Ouvindo Nossos Usuários: Central de Ajuda e Avaliações',
    descricao:
      'Lançamos a nova Central de Ajuda! Agora você pode relatar problemas técnicos para nossa equipe, sugerir melhorias brilhantes e avaliar o Portal CSAE de forma estruturada. Nossa equipe terá um painel exclusivo para responder e resolver suas solicitações rapidamente.',
    dataHora: Timestamp.fromDate(new Date('2025-08-01T08:00:00')),
  },
  {
    titulo: 'Correções Finais de UX e Semântica Clínica',
    descricao:
      'Corrigimos a exibição do mural de atualizações, bloqueamos o seletor de executor para intervenções não selecionadas e refatoramos completamente o texto gerado da Evolução de Enfermagem — agora com Planejamento, Implementação e Evolução separados em estrutura clínica correta.',
    dataHora: Timestamp.fromDate(new Date('2025-09-01T08:00:00')),
  },
  {
    titulo: 'Filtros Inteligentes de Produção e Histórico Completo',
    descricao:
      'O Painel Estatístico agora permite filtrar toda a produção de enfermagem por unidade/lotação, trazendo uma visão estratégica individualizada da rede assistencial. Também adicionamos o histórico completo de atualizações do sistema e melhorias de estabilidade no Processo de Enfermagem para garantir reinicialização correta das etapas após exclusões.',
    dataHora: Timestamp.fromDate(new Date('2025-10-01T08:00:00')),
  },
  // ── Entradas sem dataHora explícita: inseridas com Timestamp.now() na primeira execução,
  // garantindo que apareçam no topo do painel (data real de deploy).
  // Os títulos são propositalmente distintos dos anteriores para forçar nova inserção.
  {
    titulo: 'Exame Físico: Busca, IMC, PA Agrupada e NHBs na Sidebar',
    descricao:
      'A aba de Exame Físico ganhou melhorias significativas: barra de pesquisa para localizar rapidamente qualquer sinal vital, exame ou sistema; bloco especial de PA com Sistólica e Diastólica sempre juntas; calculadora de IMC integrada que computa o índice automaticamente a partir do Peso e Altura; cada sistema da Revisão de Sistemas agora tem seu próprio acordeão; as NHBs afetadas ficam numa coluna lateral fixa visível enquanto o exame é preenchido; sinais vitais agora exibem apenas os critérios compatíveis com idade e sexo do paciente; e o campo "Condição" foi removido do cadastro de sinais vitais.',
  },
  {
    titulo: 'Achados Reformulados: Edição Inline e Classificação Clínica',
    descricao:
      'Reformulamos completamente o cadastro de achados na Revisão de Sistemas. Agora você edita os achados diretamente dentro do card do exame, sem precisar abrir janelas adicionais. Um novo campo permite informar se o achado é uma alteração clínica ou não — quando sim, basta nomear a alteração e vincular a NHB afetada; quando não, é só classificar (Normal, Padrão Normal, etc.). Os achados normais aparecem sempre primeiro, garantindo clareza no Processo de Enfermagem.',
  },
  {
    titulo: 'Revisão de Sistemas: Opções, Dicas Clínicas e Campo Descritivo',
    descricao:
      'O cadastro de sistemas ganhou três novos recursos: (1) Achados com Opções — agrupe variantes de um mesmo exame e o enfermeiro escolhe uma ou mais na avaliação; (2) Dica para o Enfermeiro — orientações clínicas visíveis na avaliação, sem poluir o resumo final; (3) Exige Descrição — achados como temperatura ou nódulos exibem campo de texto obrigatório no processo. Também adicionamos textos de ajuda em todos os campos de cadastro.',
  },
  {
    titulo: 'Correção de Estabilidade: Processo de Enfermagem',
    descricao:
      'Corrigimos uma falha que impedia alguns enfermeiros de concluir ou salvar o processo de enfermagem. O problema ocorria quando uma intervenção era desmarcada na etapa de Implementação, deixando um dado inválido que o banco de dados rejeitava silenciosamente. Agora os dados são validados antes de qualquer gravação, e as mensagens de erro estão mais claras — indicando exatamente o que precisa ser revisado.',
  },
  {
    titulo: 'Avaliação Automática do Portal a Cada 10 Acessos',
    descricao:
      'Para melhorarmos continuamente o portal, a cada 10 acessos o sistema exibirá automaticamente um breve formulário de avaliação (as mesmas 3 perguntas da Central de Ajuda). O formulário só aparecerá se você ainda não avaliou nas últimas 48 horas, e leva menos de 1 minuto. Sua opinião é fundamental!',
  },
  {
    titulo: 'Notificações de Novidades na Central de Ajuda',
    descricao:
      'Agora você verá um aviso vermelho no menu sempre que receber uma nova resposta para um chamado ou sugestão. A equipe de suporte também passa a visualizar quantos novos pedidos ainda precisam ser consultados, deixando o acompanhamento mais rápido e transparente.',
  },
];

// ─── Seed completo e idempotente ─────────────────────────────
// Insere cada changelog apenas se ainda não existir no Firestore.
// Não depende de localStorage nem de coleção vazia.
export async function seedChangelogCompleto(): Promise<void> {
  const inseridos: string[] = [];

  for (const entry of CHANGELOGS_SISTEMA) {
    const foi = await inserirChangelogIdempotente(entry.titulo, entry.descricao, entry.dataHora);
    if (foi) inseridos.push(entry.titulo);
  }

  if (inseridos.length > 0) {
    console.log(`[Changelog] ${inseridos.length} registro(s) inserido(s):`, inseridos);
  } else {
    console.log('[Changelog] Todos os registros já existem no Firestore.');
  }
}

// ─── Compatibilidade retroativa ──────────────────────────────
// Mantida para não quebrar imports existentes que ainda usem seedChangelogInicial.
export async function seedChangelogInicial(): Promise<void> {
  return seedChangelogCompleto();
}

// ─── Inserir Changelog específico do Redesign ──────────────
// Mantida para compatibilidade retroativa.
export async function inserirChangelogRedesignAvaliacao(): Promise<void> {
  await inserirChangelogIdempotente(
    'Novo Design do Exame Físico',
    'A aba de Exame Físico foi completamente redesenhada. Agora os sinais vitais, exames e revisão de sistemas estão organizados em painéis interativos mais claros, com feedback inteligente de cores para alterações clínicas.'
  );
}
