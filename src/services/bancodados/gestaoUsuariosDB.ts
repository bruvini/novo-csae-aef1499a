import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  getAggregateFromServer,
  sum,
  count,
  arrayUnion,
  Timestamp,
  getDoc,
  deleteField,
} from "firebase/firestore";
import { db } from "../firebase";
import { Usuario, EventoHistoricoUsuario } from "@/types/usuario";
import { listarAlteracoesProfissionais } from "@/utils/profileUtils";
import {
  normalizarSelecaoPaginas,
  PERMISSION_SCHEMA_VERSION,
} from "@/lib/pages";

export interface ResponsavelAnalise {
  uid: string;
  nome: string;
}

const responsavelSistema = { uid: "", nome: "Responsável não identificado" };

const criarEvento = (
  evento: Omit<EventoHistoricoUsuario, "dataHora">,
): EventoHistoricoUsuario => ({ ...evento, dataHora: Timestamp.now() });

export async function buscarUsuariosAguardando(): Promise<Usuario[]> {
  try {
    const q = query(
      collection(db, "usuarios"),
      orderBy("dataCadastro", "desc"),
    );
    const querySnapshot = await getDocs(q);

    const usuarios: Usuario[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Usuario;
      const status = (data.statusAcesso || "").toLowerCase();
      // Capturar variantes de 'Aguardando'
      if (status === "aguardando" || status === "pendente" || status === "") {
        usuarios.push({ ...data, id: doc.id });
      }
    });

    return usuarios;
  } catch (error) {
    console.error("Erro ao buscar usuários aguardando:", error);
    return [];
  }
}

export async function buscarUsuariosAprovados(): Promise<Usuario[]> {
  try {
    const q = query(
      collection(db, "usuarios"),
      orderBy("dataCadastro", "desc"),
    );
    const querySnapshot = await getDocs(q);

    const usuarios: Usuario[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Usuario;
      const status = (data.statusAcesso || "").toLowerCase();
      // Capturar variantes de 'Liberado' ou 'Aprovado'
      if (status === "liberado" || status === "aprovado") {
        usuarios.push({ ...data, id: doc.id });
      }
    });

    return usuarios;
  } catch (error) {
    console.error("Erro ao buscar usuários aprovados:", error);
    return [];
  }
}

export async function buscarUsuariosRecusados(): Promise<Usuario[]> {
  try {
    const q = query(
      collection(db, "usuarios"),
      orderBy("dataCadastro", "desc"),
    );
    const querySnapshot = await getDocs(q);

    const usuarios: Usuario[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Usuario;
      const status = (data.statusAcesso || "").toLowerCase();
      // Capturar variantes de 'Recusado' ou 'Rejeitado'
      if (
        status === "recusado" ||
        status === "rejeitado" ||
        status === "revogado"
      ) {
        usuarios.push({ ...data, id: doc.id });
      }
    });

    return usuarios;
  } catch (error) {
    console.error("Erro ao buscar usuários recusados:", error);
    return [];
  }
}

export async function buscarUsuariosRevisaoCadastral(): Promise<Usuario[]> {
  try {
    const q = query(
      collection(db, "usuarios"),
      orderBy("dataCadastro", "desc"),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .map((snapshot) => ({ ...snapshot.data(), id: snapshot.id }) as Usuario)
      .filter(
        (usuario) => usuario.statusAcesso?.toLowerCase() === "revisaocadastral",
      );
  } catch (error) {
    console.error("Erro ao buscar alterações cadastrais:", error);
    return [];
  }
}

export async function aprovarUsuario(
  userId: string,
  isAdmin: boolean,
  paginasPermitidas: string[] = [],
  analisador: ResponsavelAnalise = responsavelSistema,
): Promise<void> {
  try {
    const userRef = doc(db, "usuarios", userId);
    const paginasNormalizadas = normalizarSelecaoPaginas(
      isAdmin,
      paginasPermitidas,
    );
    const updateData: Record<string, unknown> = {
      statusAcesso: "Liberado",
      dataAprovacao: serverTimestamp(),
      ehAdmin: isAdmin,
      tipoUsuario: isAdmin ? "Administrador" : "Comum",
      paginasPermitidas: paginasNormalizadas,
      versaoPermissoes: PERMISSION_SCHEMA_VERSION,
      gestorConteudos: paginasNormalizadas.includes("GestaoConteudos"),
      analisadoPor: analisador.nome,
      analisadoPorUid: analisador.uid,
      historicoRevisoes: arrayUnion(
        criarEvento({
          tipo: "acesso_aprovado",
          responsavelId: analisador.uid,
          responsavelNome: analisador.nome,
          descricao: "Cadastro aprovado e acesso liberado.",
        }),
      ),
    };

    await updateDoc(userRef, updateData);
  } catch (error) {
    console.error("Erro ao aprovar usuário:", error);
    throw error;
  }
}

export async function editarPrivilegiosUsuario(
  userId: string,
  isAdmin: boolean,
  paginasPermitidas: string[] = [],
  analisador: ResponsavelAnalise = responsavelSistema,
): Promise<void> {
  try {
    const userRef = doc(db, "usuarios", userId);
    const paginasNormalizadas = normalizarSelecaoPaginas(
      isAdmin,
      paginasPermitidas,
    );
    const updateData: Record<string, unknown> = {
      ehAdmin: isAdmin,
      tipoUsuario: isAdmin ? "Administrador" : "Comum",
      paginasPermitidas: paginasNormalizadas,
      versaoPermissoes: PERMISSION_SCHEMA_VERSION,
      gestorConteudos: paginasNormalizadas.includes("GestaoConteudos"),
      dataAtualizacaoPrivilegios: serverTimestamp(),
      historicoRevisoes: arrayUnion(
        criarEvento({
          tipo: "privilegios_atualizados",
          responsavelId: analisador.uid,
          responsavelNome: analisador.nome,
          descricao: `Privilégios atualizados para ${isAdmin ? "Administrador" : "Usuário Comum"}.`,
        }),
      ),
    };

    await updateDoc(userRef, updateData);
  } catch (error) {
    console.error("Erro ao editar privilégios do usuário:", error);
    throw error;
  }
}

export async function recusarUsuario(
  userId: string,
  motivo: string,
  analisador: ResponsavelAnalise = responsavelSistema,
): Promise<void> {
  try {
    const userRef = doc(db, "usuarios", userId);
    await updateDoc(userRef, {
      statusAcesso: "Recusado",
      motivoRecusa: motivo,
      dataRecusa: serverTimestamp(),
      analisadoPor: analisador.nome,
      analisadoPorUid: analisador.uid,
      historicoRevisoes: arrayUnion(
        criarEvento({
          tipo: "acesso_recusado",
          responsavelId: analisador.uid,
          responsavelNome: analisador.nome,
          descricao: "Cadastro recusado na análise de acesso.",
          motivo,
        }),
      ),
    });
  } catch (error) {
    console.error("Erro ao recusar usuário:", error);
    throw error;
  }
}

export async function revogarAcessoUsuario(
  userId: string,
  motivo: string,
  analisador: ResponsavelAnalise = responsavelSistema,
): Promise<void> {
  const justificativa = motivo.trim();
  if (!justificativa) throw new Error("Informe o motivo da revogação.");

  try {
    const userRef = doc(db, "usuarios", userId);
    await updateDoc(userRef, {
      statusAcesso: "Revogado",
      motivoRevogacao: justificativa,
      dataRevogacao: serverTimestamp(),
      analisadoPor: analisador.nome,
      analisadoPorUid: analisador.uid,
      historicoRevisoes: arrayUnion(
        criarEvento({
          tipo: "acesso_revogado",
          responsavelId: analisador.uid,
          responsavelNome: analisador.nome,
          descricao: "Acesso ao portal revogado sem excluir o cadastro.",
          motivo: justificativa,
        }),
      ),
    });
  } catch (error) {
    console.error("Erro ao revogar acesso do usuário:", error);
    throw error;
  }
}

export async function restaurarUsuarioParaAguardando(
  userId: string,
  analisador: ResponsavelAnalise = responsavelSistema,
): Promise<void> {
  try {
    const userRef = doc(db, "usuarios", userId);
    await updateDoc(userRef, {
      statusAcesso: "Aguardando",
      dataRestauracao: serverTimestamp(),
      historicoRevisoes: arrayUnion(
        criarEvento({
          tipo: "acesso_restaurado",
          responsavelId: analisador.uid,
          responsavelNome: analisador.nome,
          descricao: "Cadastro devolvido para uma nova análise.",
        }),
      ),
    });
  } catch (error) {
    console.error("Erro ao restaurar usuário:", error);
    throw error;
  }
}

export async function aprovarAlteracaoCadastral(
  userId: string,
  analisador: ResponsavelAnalise,
): Promise<void> {
  const userRef = doc(db, "usuarios", userId);
  const snapshot = await getDoc(userRef);
  if (!snapshot.exists()) throw new Error("Usuário não encontrado.");
  const usuario = snapshot.data() as Usuario;
  const solicitacao = usuario.alteracaoProfissionalPendente;
  if (!solicitacao) throw new Error("Não há alteração cadastral pendente.");
  const alteracoes = listarAlteracoesProfissionais(
    solicitacao.dadosAnteriores,
    solicitacao.dadosNovos,
  );

  await updateDoc(userRef, {
    dadosProfissionais: solicitacao.dadosNovos,
    statusAcesso: "Liberado",
    alteracaoProfissionalPendente: deleteField(),
    dataAprovacaoAlteracaoCadastral: serverTimestamp(),
    ultimaRevisaoCadastral: {
      status: "Aprovada",
      dataRevisao: Timestamp.now(),
      responsavelId: analisador.uid,
      responsavelNome: analisador.nome,
      alteracoes,
    },
    historicoRevisoes: arrayUnion(
      criarEvento({
        tipo: "alteracao_profissional_aprovada",
        responsavelId: analisador.uid,
        responsavelNome: analisador.nome,
        descricao: "Alterações profissionais aprovadas.",
        alteracoes,
      }),
    ),
  });
}

export async function recusarAlteracaoCadastral(
  userId: string,
  motivo: string,
  analisador: ResponsavelAnalise,
): Promise<void> {
  const userRef = doc(db, "usuarios", userId);
  const snapshot = await getDoc(userRef);
  if (!snapshot.exists()) throw new Error("Usuário não encontrado.");
  const usuario = snapshot.data() as Usuario;
  const solicitacao = usuario.alteracaoProfissionalPendente;
  if (!solicitacao) throw new Error("Não há alteração cadastral pendente.");
  const alteracoes = listarAlteracoesProfissionais(
    solicitacao.dadosAnteriores,
    solicitacao.dadosNovos,
  );

  await updateDoc(userRef, {
    statusAcesso: "Liberado",
    alteracaoProfissionalPendente: deleteField(),
    dataRecusaAlteracaoCadastral: serverTimestamp(),
    ultimaRevisaoCadastral: {
      status: "Recusada",
      dataRevisao: Timestamp.now(),
      responsavelId: analisador.uid,
      responsavelNome: analisador.nome,
      motivo,
      alteracoes,
    },
    historicoRevisoes: arrayUnion(
      criarEvento({
        tipo: "alteracao_profissional_recusada",
        responsavelId: analisador.uid,
        responsavelNome: analisador.nome,
        descricao:
          "Alterações profissionais recusadas; dados anteriores mantidos.",
        motivo,
        alteracoes,
      }),
    ),
  });
}

export async function excluirUsuario(
  userId: string,
  uid: string,
): Promise<void> {
  try {
    const userRef = doc(db, "usuarios", userId);
    await deleteDoc(userRef);
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    throw error;
  }
}

export async function buscarEstatisticasGlobais(): Promise<{
  profissionaisAprovados: number;
  processosAndamento: number;
  processosConcluidos: number;
  totalAcessosPlataforma: number;
  totalHorasProcessos: number;
}> {
  try {
    let aprovados = 0;
    let totalAcessosPlataforma = 0;
    let andamento = 0;
    let concluidos = 0;
    let totalHorasProcessos = 0;

    // 1. Contar profissionais aprovados e somar acessos via Iteração Client-side (visto flutuação na base)
    try {
      const usuariosSnap = await getDocs(collection(db, "usuarios"));

      usuariosSnap.forEach((doc) => {
        const data = doc.data();
        const status = (data.statusAcesso || "").toLowerCase().trim();

        if (status === "aprovado" || status === "liberado") {
          aprovados++;
          totalAcessosPlataforma += data.totalAcessos || 0;
        }
      });
    } catch (userError) {
      console.error("Erro ao iterar usuários globais:", userError);
    }

    // 2. Contar processos globalmente e calcular tempo total investido
    try {
      const processosSnap = await getDocs(
        collection(db, "pacientesProcessoEnfermagem"),
      );

      processosSnap.forEach((doc) => {
        const data = doc.data();
        const processos = data.processosEnfermagem || [];
        processos.forEach(
          (p: {
            status?: string;
            dataInicio?: Timestamp;
            dataConclusao?: Timestamp;
            tempoAtividadeMinutos?: number;
            tempoAtivoSegundos?: number;
          }) => {
            if (p.status === "concluido") {
              concluidos++;
              const dtInicio = p.dataInicio?.toDate
                ? p.dataInicio.toDate()
                : p.dataInicio
                  ? new Date(p.dataInicio)
                  : null;
              const dtConclusao = p.dataConclusao?.toDate
                ? p.dataConclusao.toDate()
                : p.dataConclusao
                  ? new Date(p.dataConclusao)
                  : null;
              if (dtInicio && dtConclusao) {
                const diffHoras =
                  (dtConclusao.getTime() - dtInicio.getTime()) /
                  (1000 * 60 * 60);
                if (diffHoras > 0 && diffHoras < 720) {
                  totalHorasProcessos += diffHoras;
                }
              } else if (p.tempoAtividadeMinutos) {
                totalHorasProcessos += p.tempoAtividadeMinutos / 60;
              } else if (p.tempoAtivoSegundos) {
                totalHorasProcessos += p.tempoAtivoSegundos / 3600;
              }
            } else if (p.status === "em_andamento") {
              andamento++;
            }
          },
        );
      });
    } catch (procError) {
      console.error("Erro na busca global de processos:", procError);
    }

    return {
      profissionaisAprovados: aprovados,
      processosAndamento: andamento,
      processosConcluidos: concluidos,
      totalAcessosPlataforma,
      totalHorasProcessos: Math.round(totalHorasProcessos),
    };
  } catch (error) {
    console.error("Erro critico ao buscar estatísticas globais:", error);
    return {
      profissionaisAprovados: 0,
      processosAndamento: 0,
      processosConcluidos: 0,
      totalAcessosPlataforma: 0,
      totalHorasProcessos: 0,
    };
  }
}
