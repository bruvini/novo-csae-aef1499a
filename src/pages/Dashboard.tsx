
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Plus } from 'lucide-react';
import { auth, db } from '@/services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { useAuth } from '@/contexts/AuthContext';
import HeroBanner from '@/components/HeroBanner';
import NavigationCards from '@/components/NavigationCards';
import ModalHistoricoChangelog from '@/components/ModalHistoricoChangelog';
import { assinarChangelogsRecentes } from '@/services/bancodados/changelogDB';
import {
  buscarEstatisticasGlobais,
  type Changelog,
} from '@/services/bancodados';

// ── Helpers ──────────────────────────────────────────────────
function formatarDataHora(ts: Timestamp | undefined): string {
  if (!ts) return '';
  const d = ts.toDate();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── Dashboard ────────────────────────────────────────────────
const Dashboard = () => {
  const { sessionData } = useAuth();
  const [userData, setUserData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ profissionaisAprovados: number; processosAndamento: number; processosConcluidos: number; totalAcessosPlataforma: number; totalTempoProcessosMinutos: number } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [changelogs, setChangelogs] = useState<Changelog[]>([]);
  const [changelogLoading, setChangelogLoading] = useState(true);
  const [changelogErro, setChangelogErro] = useState(false);
  const [changelogModalOpen, setChangelogModalOpen] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // ── Dados do usuário ────────────────────────────────────
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      }
      setLoading(false);

      // ── Estatísticas ────────────────────────────────────────
      try {
        if (sessionData?.ehAdmin === true) {
          const globalStats = await buscarEstatisticasGlobais();
          setStats(globalStats);
        }
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
      } finally {
        setStatsLoading(false);
      }

    };

    fetchDashboardData();
  }, [sessionData?.ehAdmin]);

  useEffect(() => {
    const unsubscribe = assinarChangelogsRecentes(
      (novos) => {
        setChangelogs(novos);
        setChangelogErro(false);
        setChangelogLoading(false);
      },
      (error) => {
        console.error('Erro ao acompanhar changelogs:', error);
        setChangelogErro(true);
        setChangelogLoading(false);
      },
    );
    return () => unsubscribe();
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
          <div className="lg:col-span-2 self-start">
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-csae-green-900">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  Atualizações Recentes
                  <button
                    id="btn-historico-changelog"
                    aria-label="Ver histórico completo de atualizações"
                    onClick={() => setChangelogModalOpen(true)}
                    className="ml-auto w-7 h-7 rounded-full bg-gray-100 hover:bg-csae-green-100 text-gray-400 hover:text-csae-green-700 flex items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-csae-green-400"
                    title="Ver histórico completo"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </CardTitle>
              </CardHeader>

              <CardContent>
                {changelogLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-csae-green-600"></div>
                  </div>
                ) : changelogErro ? (
                  <p role="alert" className="text-sm text-rose-600 text-center py-8">
                    Não foi possível atualizar o mural. Verifique sua conexão ou permissão de acesso e recarregue a página.
                  </p>
                ) : changelogs.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-12">
                    Nenhuma atualização registrada.
                  </p>
                ) : (
                  <div className="max-h-[420px] overflow-y-auto pr-4">
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
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <ModalHistoricoChangelog
        isOpen={changelogModalOpen}
        onClose={() => setChangelogModalOpen(false)}
      />
    </AuthenticatedLayout>
  );
};

export default Dashboard;
