import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  limit,
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

// ─── Seed inicial (executado uma vez se a coleção estiver vazia)
export async function seedChangelogInicial(): Promise<void> {
  const ref = collection(db, 'changelogs');
  const snapshot = await getDocs(query(ref, limit(1)));

  if (snapshot.empty) {
    await addDoc(ref, {
      titulo: 'Nova Interface do Dashboard',
      descricao:
        'Otimizamos a área inicial e adicionamos o mural de atualizações para manter você informado.',
      dataHora: Timestamp.now(),
    });
    await addDoc(ref, {
      titulo: "Novo Design do Exame Físico",
      descricao: "A aba de Exame Físico foi completamente redesenhada. Agora os sinais vitais, exames e revisão de sistemas estão organizados em painéis interativos mais claros, com feedback inteligente de cores para alterações clínicas.",
      dataHora: Timestamp.now(),
    });
    await addDoc(ref, {
      titulo: "Mais Controle no Planejamento: Exclusão de Intervenções Autorais",
      descricao: "Agora, ao escrever uma intervenção autoral na etapa de Planejamento de Enfermagem, é possível excluí-la facilmente clicando no ícone de lixeira caso mude de ideia ou note algum erro de digitação. Mais liberdade e precisão para o seu raciocínio clínico.",
      dataHora: Timestamp.now(),
    });
    await addDoc(ref, {
      titulo: "Salvamento Automático Inteligente",
      descricao: "Simplificamos o Processo de Enfermagem! O botão 'Salvar Progresso' foi removido para evitar confusões. Agora, basta clicar em 'Avançar' e o sistema salvará automaticamente todas as suas alterações de forma segura.",
      dataHora: Timestamp.now(),
    });
    await addDoc(ref, {
      titulo: "Executores em Intervenções Autorais",
      descricao: "Corrigimos um bloqueio na Etapa de Implementação. Agora, quando você criar uma Intervenção Autoral, o campo obrigatório de 'Quem Executa' aparecerá normalmente, permitindo que você avance de etapa sem problemas.",
      dataHora: Timestamp.now(),
    });
    await addDoc(ref, {
      titulo: "Adequação à Resolução COFEN Nº 736/2024",
      descricao: "Atualizamos os responsáveis pela execução das intervenções. Agora você pode delegar o cuidado de forma mais precisa, escolhendo entre: Técnico/Auxiliar de Enfermagem, Equipe Multiprofissional, Cuidador/Familiar ou o próprio Paciente (Autocuidado).",
      dataHora: Timestamp.now(),
    });
    console.log('[Changelog] Seed inicial inserido com sucesso.');
  }
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

// ─── Inserir Changelog específico do Redesign ──────────────
export async function inserirChangelogRedesignAvaliacao(): Promise<void> {
  const ref = collection(db, 'changelogs');
  const q = query(ref, limit(100)); // Busca para verificar duplicidade manual simples
  const snapshot = await getDocs(q);
  const jaExiste = snapshot.docs.some(doc => doc.data().titulo === "Novo Design do Exame Físico");

  if (!jaExiste) {
    await salvarChangelog(
      "Novo Design do Exame Físico",
      "A aba de Exame Físico foi completamente redesenhada. Agora os sinais vitais, exames e revisão de sistemas estão organizados em painéis interativos mais claros, com feedback inteligente de cores para alterações clínicas."
    );
    console.log("[Changelog] Registro de redesign inserido com sucesso.");
  }
}
