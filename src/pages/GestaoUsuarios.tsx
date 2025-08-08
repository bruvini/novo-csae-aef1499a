import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserCheck, Search } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import TabelaUsuarios from '@/components/gestao-usuarios/TabelaUsuarios';
import ModalDetalhesUsuario from '@/components/gestao-usuarios/ModalDetalhesUsuario';
import ModalConfirmacaoAprovacao from '@/components/gestao-usuarios/ModalConfirmacaoAprovacao';
import ModalConfirmacaoExclusao from '@/components/gestao-usuarios/ModalConfirmacaoExclusao';
import {
  buscarUsuariosAguardando,
  buscarUsuariosAprovados,
  aprovarUsuario,
  recusarUsuario,
  excluirUsuario
} from '@/services/bancodados';
import { Usuario } from '@/types/usuario';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const GestaoUsuarios = () => {
  const { toast } = useToast();
  const [usuariosAguardando, setUsuariosAguardando] = useState<Usuario[]>([]);
  const [usuariosAprovados, setUsuariosAprovados] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  
  // Estados dos filtros
  const [textoBusca, setTextoBusca] = useState('');
  const [filtroFormacao, setFiltroFormacao] = useState('todos');
  
  // Estados dos modais
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);
  const [modalAprovacaoAberto, setModalAprovacaoAberto] = useState(false);
  const [modalRecusaAberto, setModalRecusaAberto] = useState(false);
  const [modalExclusaoAberto, setModalExclusaoAberto] = useState(false);

  const handleLogout = () => {
    console.log('Logout functionality to be implemented');
  };

  const carregarUsuarios = async () => {
    setCarregando(true);
    try {
      const [aguardando, aprovados] = await Promise.all([
        buscarUsuariosAguardando(),
        buscarUsuariosAprovados()
      ]);
      
      setUsuariosAguardando(aguardando);
      setUsuariosAprovados(aprovados);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os usuários.',
        variant: 'destructive'
      });
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const filtrarUsuarios = (usuarios: Usuario[]) => {
    return usuarios.filter(usuario => {
      const nomeCompleto = usuario.dadosPessoais?.nomeCompleto?.toLowerCase() || '';
      const matricula = usuario.dadosProfissionais?.matricula?.toLowerCase() || '';
      const numeroCoren = usuario.dadosProfissionais?.numeroCoren?.toLowerCase() || '';
      const buscaLower = textoBusca.toLowerCase();
      
      const matchBusca = textoBusca === '' || 
        nomeCompleto.includes(buscaLower) || 
        matricula.includes(buscaLower) || 
        numeroCoren.includes(buscaLower);
      
      const matchFormacao = filtroFormacao === 'todos' || 
        usuario.dadosProfissionais?.formacao === filtroFormacao;
      
      return matchBusca && matchFormacao;
    });
  };

  const usuariosAguardandoFiltrados = useMemo(() => 
    filtrarUsuarios(usuariosAguardando), 
    [usuariosAguardando, textoBusca, filtroFormacao]
  );

  const usuariosAprovadosFiltrados = useMemo(() => 
    filtrarUsuarios(usuariosAprovados), 
    [usuariosAprovados, textoBusca, filtroFormacao]
  );

  const handleDetalhes = (usuario: Usuario) => {
    setUsuarioSelecionado(usuario);
    setModalDetalhesAberto(true);
  };

  const handleAprovar = (usuario: Usuario) => {
    setUsuarioSelecionado(usuario);
    setModalAprovacaoAberto(true);
  };

  const handleRecusar = (usuario: Usuario) => {
    setUsuarioSelecionado(usuario);
    setModalRecusaAberto(true);
  };

  const handleExcluir = (usuario: Usuario) => {
    setUsuarioSelecionado(usuario);
    setModalExclusaoAberto(true);
  };

  const confirmarAprovacao = async (isAdmin: boolean) => {
    if (!usuarioSelecionado?.id) return;
    
    try {
      await aprovarUsuario(usuarioSelecionado.id, isAdmin);
      toast({
        title: 'Usuário aprovado!',
        description: `${usuarioSelecionado.dadosPessoais?.nomeCompleto} foi aprovado com sucesso.`
      });
      setModalAprovacaoAberto(false);
      setUsuarioSelecionado(null);
      carregarUsuarios();
    } catch (error) {
      console.error('Erro ao aprovar usuário:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível aprovar o usuário.',
        variant: 'destructive'
      });
    }
  };

  const confirmarRecusa = async () => {
    if (!usuarioSelecionado?.id) return;
    
    try {
      await recusarUsuario(usuarioSelecionado.id);
      toast({
        title: 'Usuário recusado',
        description: `${usuarioSelecionado.dadosPessoais?.nomeCompleto} foi recusado.`
      });
      setModalRecusaAberto(false);
      setUsuarioSelecionado(null);
      carregarUsuarios();
    } catch (error) {
      console.error('Erro ao recusar usuário:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível recusar o usuário.',
        variant: 'destructive'
      });
    }
  };

  const confirmarExclusao = async () => {
    if (!usuarioSelecionado?.id || !usuarioSelecionado?.uid) return;
    
    try {
      await excluirUsuario(usuarioSelecionado.id, usuarioSelecionado.uid);
      toast({
        title: 'Usuário excluído',
        description: `${usuarioSelecionado.dadosPessoais?.nomeCompleto} foi excluído permanentemente.`
      });
      setModalExclusaoAberto(false);
      setUsuarioSelecionado(null);
      carregarUsuarios();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o usuário.',
        variant: 'destructive'
      });
    }
  };

  if (carregando) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <Header userName="Enf. Maria Silva" onLogout={handleLogout} />
            <main className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-csae-green-600 mx-auto mb-4"></div>
                <p>Carregando usuários...</p>
              </div>
            </main>
            <Footer />
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <Header 
            userName="Enf. Maria Silva"
            onLogout={handleLogout}
          />
          
          <main className="flex-1 bg-gray-50">
            <div className="container mx-auto px-4 py-8">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-csae-green-800 mb-2">
                  Gestão de Usuários
                </h1>
                <p className="text-gray-600">
                  Gerencie as solicitações de acesso e usuários aprovados do sistema.
                </p>
              </div>

              {/* Filtros */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Filtros
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="busca" className="block text-sm font-medium mb-2">
                        Buscar por nome, matrícula ou COREN
                      </label>
                      <Input
                        id="busca"
                        placeholder="Digite para buscar..."
                        value={textoBusca}
                        onChange={(e) => setTextoBusca(e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="formacao" className="block text-sm font-medium mb-2">
                        Filtrar por formação
                      </label>
                      <Select value={filtroFormacao} onValueChange={setFiltroFormacao}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma formação" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          <SelectItem value="Enfermeiro">Enfermeiro</SelectItem>
                          <SelectItem value="Residente de Enfermagem">Residente de Enfermagem</SelectItem>
                          <SelectItem value="Técnico de Enfermagem">Técnico de Enfermagem</SelectItem>
                          <SelectItem value="Acadêmico de Enfermagem">Acadêmico de Enfermagem</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="aguardando" className="space-y-6">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="aguardando" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Aguardando ({usuariosAguardandoFiltrados.length})
                  </TabsTrigger>
                  <TabsTrigger value="aprovados" className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Aprovados ({usuariosAprovadosFiltrados.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="aguardando">
                  <Card>
                    <CardHeader>
                      <CardTitle>Usuários Aguardando Aprovação</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TabelaUsuarios
                        usuarios={usuariosAguardandoFiltrados}
                        tipo="aguardando"
                        onDetalhes={handleDetalhes}
                        onAprovar={handleAprovar}
                        onRecusar={handleRecusar}
                        onExcluir={handleExcluir}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="aprovados">
                  <Card>
                    <CardHeader>
                      <CardTitle>Usuários Aprovados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TabelaUsuarios
                        usuarios={usuariosAprovadosFiltrados}
                        tipo="aprovados"
                        onDetalhes={handleDetalhes}
                        onExcluir={handleExcluir}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>

          <Footer />
        </div>
      </div>

      {/* Modais */}
      <ModalDetalhesUsuario
        isOpen={modalDetalhesAberto}
        onClose={() => {
          setModalDetalhesAberto(false);
          setUsuarioSelecionado(null);
        }}
        usuario={usuarioSelecionado}
      />

      <ModalConfirmacaoAprovacao
        isOpen={modalAprovacaoAberto}
        onClose={() => {
          setModalAprovacaoAberto(false);
          setUsuarioSelecionado(null);
        }}
        onConfirm={confirmarAprovacao}
        nomeUsuario={usuarioSelecionado?.dadosPessoais?.nomeCompleto || ''}
      />

      <ModalConfirmacaoExclusao
        isOpen={modalExclusaoAberto}
        onClose={() => {
          setModalExclusaoAberto(false);
          setUsuarioSelecionado(null);
        }}
        onConfirm={confirmarExclusao}
        nomeUsuario={usuarioSelecionado?.dadosPessoais?.nomeCompleto || ''}
      />

      <AlertDialog open={modalRecusaAberto} onOpenChange={setModalRecusaAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recusar Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja recusar o acesso do usuário{' '}
              <strong>{usuarioSelecionado?.dadosPessoais?.nomeCompleto}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarRecusa} className="bg-red-600 hover:bg-red-700">
              Recusar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
};

export default GestaoUsuarios;
