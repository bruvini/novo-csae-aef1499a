import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserCheck, Search, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import TabelaUsuarios from '@/components/gestao-usuarios/TabelaUsuarios';
import ModalDetalhesUsuario from '@/components/gestao-usuarios/ModalDetalhesUsuario';
import ModalConfirmacaoAprovacao from '@/components/gestao-usuarios/ModalConfirmacaoAprovacao';
import ModalEdicaoPrivilegios from '@/components/gestao-usuarios/ModalEdicaoPrivilegios';
import ModalConfirmacaoExclusao from '@/components/gestao-usuarios/ModalConfirmacaoExclusao';
import {
  buscarUsuariosAguardando,
  buscarUsuariosAprovados,
  aprovarUsuario,
  editarPrivilegiosUsuario,
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
  
  const [textoBusca, setTextoBusca] = useState('');
  const [filtroFormacao, setFiltroFormacao] = useState('todos');
  
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);
  const [modalAprovacaoAberto, setModalAprovacaoAberto] = useState(false);
  const [modalEdicaoPrivilegiosAberto, setModalEdicaoPrivilegiosAberto] = useState(false);
  const [modalRecusaAberto, setModalRecusaAberto] = useState(false);
  const [modalExclusaoAberto, setModalExclusaoAberto] = useState(false);

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

  const usuariosAguardandoFiltrados = useMemo(() => filtrarUsuarios(usuariosAguardando), [usuariosAguardando, textoBusca, filtroFormacao]);
  const usuariosAprovadosFiltrados = useMemo(() => filtrarUsuarios(usuariosAprovados), [usuariosAprovados, textoBusca, filtroFormacao]);

  const handleDetalhes = (usuario: Usuario) => { setUsuarioSelecionado(usuario); setModalDetalhesAberto(true); };
  const handleAprovar = (usuario: Usuario) => { setUsuarioSelecionado(usuario); setModalAprovacaoAberto(true); };
  const handleEditarPrivilegios = (usuario: Usuario) => { setUsuarioSelecionado(usuario); setModalEdicaoPrivilegiosAberto(true); };
  const handleRecusar = (usuario: Usuario) => { setUsuarioSelecionado(usuario); setModalRecusaAberto(true); };
  const handleExcluir = (usuario: Usuario) => { setUsuarioSelecionado(usuario); setModalExclusaoAberto(true); };

  const confirmarAprovacao = async (isAdmin: boolean, paginasPermitidas: string[]) => {
    if (!usuarioSelecionado?.id) return;
    try {
      await aprovarUsuario(usuarioSelecionado.id, isAdmin, paginasPermitidas);
      toast({ title: 'Usuário aprovado!', description: `${usuarioSelecionado.dadosPessoais?.nomeCompleto} foi aprovado.` });
      setModalAprovacaoAberto(false);
      setUsuarioSelecionado(null);
      carregarUsuarios();
    } catch (error) {
      console.error('Erro ao aprovar usuário:', error);
      toast({ title: 'Erro', description: 'Não foi possível aprovar o usuário.', variant: 'destructive' });
    }
  };

  const confirmarEdicaoPrivilegios = async (isAdmin: boolean, paginasPermitidas: string[]) => {
    if (!usuarioSelecionado?.id) return;
    try {
      await editarPrivilegiosUsuario(usuarioSelecionado.id, isAdmin, paginasPermitidas);
      toast({ title: 'Privilégios atualizados!', description: `Os privilégios de ${usuarioSelecionado.dadosPessoais?.nomeCompleto} foram atualizados.` });
      setModalEdicaoPrivilegiosAberto(false);
      setUsuarioSelecionado(null);
      carregarUsuarios();
    } catch (error) {
      console.error('Erro ao editar privilégios:', error);
      toast({ title: 'Erro', description: 'Não foi possível editar os privilégios.', variant: 'destructive' });
    }
  };

  const confirmarRecusa = async () => {
    if (!usuarioSelecionado?.id) return;
    try {
      await recusarUsuario(usuarioSelecionado.id);
      toast({ title: 'Usuário recusado', description: `${usuarioSelecionado.dadosPessoais?.nomeCompleto} foi recusado.` });
      setModalRecusaAberto(false);
      setUsuarioSelecionado(null);
      carregarUsuarios();
    } catch (error) {
      console.error('Erro ao recusar usuário:', error);
      toast({ title: 'Erro', description: 'Não foi possível recusar o usuário.', variant: 'destructive' });
    }
  };

  const confirmarExclusao = async () => {
    if (!usuarioSelecionado?.id || !usuarioSelecionado?.uid) return;
    try {
      await excluirUsuario(usuarioSelecionado.id, usuarioSelecionado.uid);
      toast({ title: 'Usuário excluído', description: `${usuarioSelecionado.dadosPessoais?.nomeCompleto} foi excluído.` });
      setModalExclusaoAberto(false);
      setUsuarioSelecionado(null);
      carregarUsuarios();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast({ title: 'Erro', description: 'Não foi possível excluir o usuário.', variant: 'destructive' });
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex items-center gap-4 mb-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar ao Dashboard
                  </Link>
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-csae-green-800">Gestão de Usuários</h1>
                  <p className="text-gray-600 font-medium">Controle de acessos e permissões.</p>
                </div>
              </div>

              {carregando ? (
                <div className="flex-1 flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-csae-green-600 mx-auto mb-4"></div>
                    <p>Carregando usuários...</p>
                  </div>
                </div>
              ) : (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Filtros
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        placeholder="Buscar por nome, matrícula ou COREN..."
                        value={textoBusca}
                        onChange={(e) => setTextoBusca(e.target.value)}
                      />
                      <Select value={filtroFormacao} onValueChange={setFiltroFormacao}>
                        <SelectTrigger><SelectValue placeholder="Formação" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          <SelectItem value="Enfermeiro">Enfermeiro</SelectItem>
                          <SelectItem value="Técnico de Enfermagem">Técnico</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>

                  <Tabs defaultValue="aguardando" className="space-y-6">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                      <TabsTrigger value="aguardando">Aguardando ({usuariosAguardandoFiltrados.length})</TabsTrigger>
                      <TabsTrigger value="aprovados">Aprovados ({usuariosAprovadosFiltrados.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="aguardando">
                      <TabelaUsuarios usuarios={usuariosAguardandoFiltrados} tipo="aguardando" onDetalhes={handleDetalhes} onAprovar={handleAprovar} onRecusar={handleRecusar} onExcluir={handleExcluir} />
                    </TabsContent>
                    <TabsContent value="aprovados">
                      <TabelaUsuarios usuarios={usuariosAprovadosFiltrados} tipo="aprovados" onDetalhes={handleDetalhes} onExcluir={handleExcluir} onEditarPrivilegios={handleEditarPrivilegios} />
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </div>
          </main>
          <Footer />
        </div>
      </div>

      {/* Modais */}
      <ModalDetalhesUsuario isOpen={modalDetalhesAberto} onClose={() => { setModalDetalhesAberto(false); setUsuarioSelecionado(null); }} usuario={usuarioSelecionado} />
      <ModalConfirmacaoAprovacao isOpen={modalAprovacaoAberto} onClose={() => { setModalAprovacaoAberto(false); setUsuarioSelecionado(null); }} onConfirm={confirmarAprovacao} usuario={usuarioSelecionado} nomeUsuario={usuarioSelecionado?.dadosPessoais?.nomeCompleto || ''} />
      <ModalEdicaoPrivilegios isOpen={modalEdicaoPrivilegiosAberto} onClose={() => { setModalEdicaoPrivilegiosAberto(false); setUsuarioSelecionado(null); }} onConfirm={confirmarEdicaoPrivilegios} usuario={usuarioSelecionado} isNewApproval={false} />
      <ModalConfirmacaoExclusao isOpen={modalExclusaoAberto} onClose={() => { setModalExclusaoAberto(false); setUsuarioSelecionado(null); }} onConfirm={confirmarExclusao} nomeUsuario={usuarioSelecionado?.dadosPessoais?.nomeCompleto || ''} />
      
      <AlertDialog open={modalRecusaAberto} onOpenChange={setModalRecusaAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recusar Usuário</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja recusar o acesso de <strong>{usuarioSelecionado?.dadosPessoais?.nomeCompleto}</strong>?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarRecusa} className="bg-red-600 hover:bg-red-700">Recusar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
};

export default GestaoUsuarios;
