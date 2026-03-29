
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Settings, 
  FileText, 
  ClipboardCheck, 
  Bell, 
  LayoutDashboard,
  LogOut,
  User,
  HeartPulse
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '@/services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useToast } from '@/components/ui/use-toast';

const Dashboard = () => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      }
      setLoading(false);
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
      navigate("/");
    } catch (error) {
      console.error("Erro no logout:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-csae-green-600"></div>
      </div>
    );
  }

  const isAdmin = userData?.ehAdmin === true;
  const isGestor = userData?.gestorConteudos === true || isAdmin;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r hidden md:flex flex-col">
        <div className="p-6 border-b flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6 text-csae-green-600" />
          <span className="font-bold text-xl text-gray-800">CSAE Portal</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/dashboard" className="flex items-center gap-3 p-3 bg-csae-green-50 text-csae-green-700 rounded-lg font-medium">
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          {isGestor && (
            <Link to="/gestao-conteudos" className="flex items-center gap-3 p-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <FileText className="w-5 h-5" />
              Gestão de Conteúdos
            </Link>
          )}
          {isAdmin && (
            <Link to="/gestao-usuarios" className="flex items-center gap-3 p-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Users className="w-5 h-5" />
              Gestão de Usuários
            </Link>
          )}
        </nav>
        <div className="p-4 border-t">
          <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
            <LogOut className="w-5 h-5 mr-3" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b px-8 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-700">Dashboard Inicial</h2>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5 text-gray-500" />
            </Button>
            <div className="flex items-center gap-3 pl-4 border-l">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{userData?.dadosPessoais?.nomeCompleto || 'Usuário'}</p>
                <p className="text-xs text-gray-500">{isAdmin ? 'Administrador' : 'Enfermeiro(a)'}</p>
              </div>
              <div className="w-10 h-10 bg-csae-green-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-csae-green-600" />
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8">
          {/* Welcome Banner */}
          <section className="bg-csae-green-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10 w-full md:w-2/3">
              <h1 className="text-3xl font-bold mb-4">Bem-vindo(a) ao Portal CSAE Floripa 2.0</h1>
              <p className="text-csae-green-50 text-lg mb-6">
                Ponto de partida central para todas as ferramentas do Processo de Enfermagem. 
                Aqui você encontra atualizações, indicadores e acessos rápidos para o seu trabalho diário.
              </p>
              <div className="flex gap-4">
                <Button className="bg-white text-csae-green-700 hover:bg-csae-green-50" asChild>
                  <Link to="/gestao-conteudos">Acessar Conteúdos</Link>
                </Button>
                {isAdmin && (
                  <Button variant="outline" className="border-white text-white hover:bg-white/10" asChild>
                    <Link to="/gestao-usuarios">Gerenciar Acessos</Link>
                  </Button>
                )}
              </div>
            </div>
            <div className="absolute right-0 bottom-0 opacity-10 hidden lg:block">
              <ClipboardCheck size={240} />
            </div>
          </section>

          {/* Quick Stats/Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-md transition-shadow cursor-default border-t-4 border-t-blue-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pacientes Ativos</CardTitle>
                <Users className="w-4 h-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
                <p className="text-xs text-gray-500">Módulo em desenvolvimento</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow cursor-default border-t-4 border-t-green-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Diagnósticos Cadastrados</CardTitle>
                <FileText className="w-4 h-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Consultando...</div>
                <p className="text-xs text-gray-500">Atualizado agora</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow cursor-default border-t-4 border-t-orange-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pendências de Acesso</CardTitle>
                <Settings className="w-4 h-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isAdmin ? 'Ver Painel' : '--'}</div>
                <p className="text-xs text-gray-500">Solicitações de novos usuários</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity / Updates */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Novidades do Portal</CardTitle>
                <CardDescription>Acompanhe as últimas mudanças na plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4 p-4 border rounded-lg bg-gray-50/50">
                      <div className="bg-csae-green-100 p-2 rounded-full h-fit">
                        <Bell className="w-4 h-4 text-csae-green-600" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Nova funcionalidade de backup</p>
                        <p className="text-xs text-gray-500">Implementamos a sincronização em tempo real com o Firebase Firestore.</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Atalhos Rápidos</CardTitle>
                <CardDescription>Acesse as ferramentas mais utilizadas</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                {isGestor && (
                  <>
                    <Button variant="outline" className="h-24 flex flex-col gap-2" asChild>
                      <Link to="/gestao-conteudos?tab=diagnosticos">
                        <FileText className="w-6 h-6" />
                        Diagnósticos
                      </Link>
                    </Button>
                    <Button variant="outline" className="h-24 flex flex-col gap-2" asChild>
                      <Link to="/gestao-conteudos?tab=subconjuntos">
                        <LayoutDashboard className="w-6 h-6" />
                        Subconjuntos
                      </Link>
                    </Button>
                  </>
                )}
                <Button variant="outline" className="h-24 flex flex-col gap-2">
                  <ClipboardCheck className="w-6 h-6" />
                  Triagem
                </Button>
                <Button variant="outline" className="h-24 flex flex-col gap-2" asChild>
                  <Link to="/gestao-conteudos?tab=sinais-vitais">
                    <HeartPulse className="w-6 h-6" />
                    Sinais Vitais
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
