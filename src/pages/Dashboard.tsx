
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bell, FileText, ClipboardCheck, Info } from 'lucide-react';
import { auth, db } from '@/services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import HeroBanner from '@/components/HeroBanner';
import NavigationCards from '@/components/NavigationCards';
import { buscarEstatisticasGlobais } from '@/services/bancodados';

const Dashboard = () => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

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
    };

    fetchDashboardData();
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

        {/* Atalhos Rápidos / Cards de Navegação */}
        <NavigationCards />
      </div>
    </AuthenticatedLayout>
  );
};

export default Dashboard;
