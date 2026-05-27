
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';
import { auth, db } from '@/services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import HeroBanner from '@/components/HeroBanner';
import NavigationCards from '@/components/NavigationCards';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  buscarEstatisticasGlobais,
  buscarChangelogsRecentes,
  seedChangelogInicial,
  type Changelog,
} from '@/services/bancodados';
import { salvarChangelog } from '@/services/bancodados/changelogDB';

// ── Helpers ──────────────────────────────────────────────────
function formatarDataHora(ts: Timestamp | undefined): string {
  if (!ts) return '';
  const d = ts.toDate();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── Dashboard ────────────────────────────────────────────────
const Dashboard = () => {
  const [userData, setUserData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ profissionaisAprovados: number; processosAndamento: number; processosConcluidos: number; totalAcessosPlataforma: number } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [changelogs, setChangelogs] = useState<Changelog[]>([]);
  const [changelogLoading, setChangelogLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      }
      setLoading(false);

      try {
        const globalStats = await buscarEstatisticasGlobais();
        setStats(globalStats);
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
      } finally {
        setStatsLoading(false);
      }

      // Changelog: seed + fetch
      try {
        await seedChangelogInicial();
        const logs = await buscarChangelogsRecentes();
        setChangelogs(logs);
      } catch (error) {
        console.error("Erro ao buscar changelogs:", error);
      } finally {
        setChangelogLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('changelog_rbac_v2')) {
      salvarChangelog(
        "Mais Segurança na Gestão de Usuários",
        "Ajustamos os níveis de acesso para garantir mais segurança na plataforma. Agora, membros da equipe que ajudam na triagem podem aprovar novos cadastros, mas apenas Administradores possuem a permissão de alterar privilégios avançados ou excluir contas que já estão ativas no sistema."
      ).then(() => {
        localStorage.setItem('changelog_rbac_v2', 'true');
      }).catch(console.error);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('changelog_central_ajuda_v1')) {
      salvarChangelog(
        "Ouvindo Nossos Usuários: Central de Ajuda e Avaliações",
        "Lançamos a nova Central de Ajuda! Agora você pode relatar problemas técnicos para nossa equipe, sugerir melhorias brilhantes e avaliar o Portal CSAE de forma estruturada. Nossa equipe terá um painel exclusivo para responder e resolver suas solicitações rapidamente."
      ).then(() => {
        localStorage.setItem('changelog_central_ajuda_v1', 'true');
      }).catch(console.error);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('changelog_exclusao_autoral_v1')) {
      salvarChangelog(
        "Mais Controle no Planejamento: Exclusão de Intervenções Autorais",
        "Agora, ao escrever uma intervenção autoral na etapa de Planejamento de Enfermagem, é possível excluí-la facilmente clicando no ícone de lixeira caso mude de ideia ou note algum erro de digitação. Mais liberdade e precisão para o seu raciocínio clínico."
      ).then(() => {
        localStorage.setItem('changelog_exclusao_autoral_v1', 'true');
      }).catch(console.error);
    }
  }, []);

  useEffect(() => {
    const registrarChangelogsNovos = async () => {
      if (!localStorage.getItem('changelog_autosave_v1')) {
        await salvarChangelog(
          "Salvamento Automático Inteligente",
          "Simplificamos o Processo de Enfermagem! O botão 'Salvar Progresso' foi removido para evitar confusões. Agora, basta clicar em 'Avançar' e o sistema salvará automaticamente todas as suas alterações de forma segura."
        );
        localStorage.setItem('changelog_autosave_v1', 'true');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (!localStorage.getItem('changelog_executores_autorais_v1')) {
        await salvarChangelog(
          "Executores em Intervenções Autorais",
          "Corrigimos um bloqueio na Etapa de Implementação. Agora, quando você criar uma Intervenção Autoral, o campo obrigatório de 'Quem Executa' aparecerá normalmente, permitindo que você avance de etapa sem problemas."
        );
        localStorage.setItem('changelog_executores_autorais_v1', 'true');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (!localStorage.getItem('changelog_cofen_736_2024_v1')) {
        await salvarChangelog(
          "Adequação à Resolução COFEN Nº 736/2024",
          "Atualizamos os responsáveis pela execução das intervenções. Agora você pode delegar o cuidado de forma mais precisa, escolhendo entre: Técnico/Auxiliar de Enfermagem, Equipe Multiprofissional, Cuidador/Familiar ou o próprio Paciente (Autocuidado)."
        );
        localStorage.setItem('changelog_cofen_736_2024_v1', 'true');
      }
    };

    registrarChangelogsNovos().catch(console.error);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-csae-green-600"></div>
      </div>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-8 pb-12">
        {/* Banner de Boas-vindas Dinâmico */}
        <HeroBanner stats={stats} loading={statsLoading} />

        {/* ── Grid: Navigation (60%) + Changelog (40%) ── */}
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Coluna esquerda — Ferramentas */}
          <div className="lg:col-span-3">
            <NavigationCards />
          </div>

          {/* Coluna direita — Atualizações Recentes */}
          <div className="lg:col-span-2">
            <Card className="border-none shadow-sm bg-white h-full flex flex-col">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-csae-green-900">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  Atualizações Recentes
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 min-h-0">
                {changelogLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-csae-green-600"></div>
                  </div>
                ) : changelogs.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-12">
                    Nenhuma atualização registrada.
                  </p>
                ) : (
                  <ScrollArea className="h-[340px] pr-4">
                    <div className="relative pl-6">
                      {/* Timeline line */}
                      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200" />

                      <ul className="space-y-5">
                        {changelogs.map((log, idx) => (
                          <li key={log.id || idx} className="relative">
                            {/* Timeline dot */}
                            <span
                              className={`absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 ${
                                idx === 0
                                  ? 'bg-csae-green-500 border-csae-green-200 ring-4 ring-csae-green-50'
                                  : 'bg-white border-gray-300'
                              }`}
                            />

                            <time className="block text-[11px] font-semibold text-gray-400 mb-0.5 tracking-wide">
                              {formatarDataHora(log.dataHora)}
                            </time>
                            <p className="text-sm font-bold text-gray-800 leading-tight">
                              {log.titulo}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                              {log.descricao}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default Dashboard;
