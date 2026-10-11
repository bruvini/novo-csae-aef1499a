import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, RotateCcw, UserMinus, UserCheck, UserX } from 'lucide-react';
import { Link } from 'react-router-dom';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import TabelaUsuarios from '@/components/gestao-usuarios/TabelaUsuarios';
import ModalDetalhesUsuario from '@/components/gestao-usuarios/ModalDetalhesUsuario';
import ModalConfirmacaoAprovacao from '@/components/gestao-usuarios/ModalConfirmacaoAprovacao';
import ModalEdicaoPrivilegios from '@/components/gestao-usuarios/ModalEdicaoPrivilegios';
import ModalConfirmacaoExclusao from '@/components/gestao-usuarios/ModalConfirmacaoExclusao';
import ModalMotivoRecusa from '@/components/gestao-usuarios/ModalMotivoRecusa';
import {
  buscarUsuariosGestao,
  aprovarUsuario,
  editarPrivilegiosUsuario,
  recusarUsuario,
  restaurarUsuarioParaAguardando,
  revogarAcessoUsuario
} from '@/services/bancodados';
import { Usuario } from '@/types/usuario';
import { useAuth } from '@/contexts/AuthContext';

const GestaoUsuarios = () => {
  const { toast } = useToast();
  const { sessionData } = useAuth();
  const isAdmin = sessionData?.ehAdmin === true;
  const [usuariosAguardando, setUsuariosAguardando] = useState<Usuario[]>([]);
  const [usuariosAprovados, setUsuariosAprovados] = useState<Usuario[]>([]);
  const [usuariosRecusados, setUsuariosRecusados] = useState<Usuario[]>([]);
  const [usuariosRevogados, setUsuariosRevogados] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState(false);
  
  const [textoBusca, setTextoBusca] = useState('');
  const [filtroFormacao, setFiltroFormacao] = useState('todos');
  
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);
  const [modalAprovacaoAberto, setModalAprovacaoAberto] = useState(false);
  const [modalEdicaoPrivilegiosAberto, setModalEdicaoPrivilegiosAberto] = useState(false);
  const [modalRecusaAberto, setModalRecusaAberto] = useState(false);
  const [modalExclusaoAberto, setModalExclusaoAberto] = useState(false);

  const carregarUsuarios = useCallback(async () => {
    setCarregando(true);
    setErroCarregamento(false);
    try {
      const usuarios = await buscarUsuariosGestao();
      setUsuariosAguardando(usuarios.aguardando);
      setUsuariosAprovados(usuarios.aprovados);
      setUsuariosRecusados(usuarios.recusados);
      setUsuariosRevogados(usuarios.revogados);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setErroCarregamento(true);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os usuários.',
        variant: 'destructive'
      });
    } finally {
      setCarregando(false);
    }
  }, [toast]);

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  const filtrarUsuarios = useCallback((usuarios: Usuario[]) => {
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
  }, [textoBusca, filtroFormacao]);

  const aguardandoFiltrados = useMemo(() => filtrarUsuarios(usuariosAguardando), [usuariosAguardando, filtrarUsuarios]);
  const aprovadosFiltrados = useMemo(() => filtrarUsuarios(usuariosAprovados), [usuariosAprovados, filtrarUsuarios]);
  const recusadosFiltrados = useMemo(() => filtrarUsuarios(usuariosRecusados), [usuariosRecusados, filtrarUsuarios]);
  const revogadosFiltrados = useMemo(() => filtrarUsuarios(usuariosRevogados), [usuariosRevogados, filtrarUsuarios]);

  const handleDetalhes = (usuario: Usuario) => { setUsuarioSelecionado(usuario); setModalDetalhesAberto(true); };
  const handleAprovar = (usuario: Usuario) => { setUsuarioSelecionado(usuario); setModalAprovacaoAberto(true); };
  const handleEditarPrivilegios = (usuario: Usuario) => { setUsuarioSelecionado(usuario); setModalEdicaoPrivilegiosAberto(true); };
  const handleRecusar = (usuario: Usuario) => { setUsuarioSelecionado(usuario); setModalRecusaAberto(true); };
  const handleRevogar = (usuario: Usuario) => { setUsuarioSelecionado(usuario); setModalExclusaoAberto(true); };
  
  const handleRestaurar = async (usuario: Usuario) => {
    if (!usuario.id) return;
    try {
      await restaurarUsuarioParaAguardando(usuario.id);
      toast({ 
        title: 'Usuário restaurado', 
        description: `${usuario.dadosPessoais?.nomeCompleto} voltou para análise.` 
      });
      carregarUsuarios();
    } catch (error) {
      console.error('Erro ao restaurar usuário:', error);
      toast({ title: 'Erro', description: 'Não foi possível restaurar o usuário.', variant: 'destructive' });
    }
  };

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

  const confirmarRecusa = async (motivo: string) => {
    if (!usuarioSelecionado?.id) return;
    try {
      await recusarUsuario(usuarioSelecionado.id, motivo);
      toast({ title: 'Usuário recusado', description: `${usuarioSelecionado.dadosPessoais?.nomeCompleto} foi recusado.` });
      setModalRecusaAberto(false);
      setUsuarioSelecionado(null);
      carregarUsuarios();
    } catch (error) {
      console.error('Erro ao recusar usuário:', error);
      toast({ title: 'Erro', description: 'Não foi possível recusar o usuário.', variant: 'destructive' });
    }
  };

  const confirmarRevogacao = async () => {
    if (!usuarioSelecionado?.id || !sessionData?.uid) return;
    try {
      await revogarAcessoUsuario(usuarioSelecionado.id, sessionData.uid);
      toast({ title: 'Acesso revogado', description: 'O cadastro e o histórico foram preservados.' });
      setModalExclusaoAberto(false);
      setUsuarioSelecionado(null);
      carregarUsuarios();
    } catch (error) {
      console.error('Falha ao revogar acesso do usuário.');
      toast({ title: 'Erro', description: 'Não foi possível revogar o acesso. O cadastro foi preservado.', variant: 'destructive' });
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-1 mb-6">
          <h1 className="text-3xl font-bold text-csae-green-800">Gestão de Usuários</h1>
          <p className="text-gray-600 font-medium">Controle de acessos e permissões administrativas.</p>
        </div>

        {carregando ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-csae-green-600 mx-auto mb-4"></div>
              <p className="text-gray-500 font-medium anim-pulse">Buscando dados no servidor...</p>
            </div>
          </div>
        ) : erroCarregamento ? (
          <Card className="border border-red-200 bg-red-50">
            <CardContent className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-red-900">Não foi possível carregar os perfis.</p>
                <p className="text-sm text-red-800">A lista não está vazia: houve uma falha na consulta. Tente novamente.</p>
              </div>
              <Button type="button" variant="outline" onClick={carregarUsuarios}>
                <RotateCcw className="mr-2 h-4 w-4" /> Tentar novamente
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="border-none shadow-sm h-fit">
              <CardHeader className="bg-slate-50/50 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-700">
                  <Search className="h-5 w-5 text-csae-green-600" />
                  Localizar Usuário
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6">
                <div className="md:col-span-3">
                  <Input
                    placeholder="Nome, matrícula ou COREN..."
                    value={textoBusca}
                    onChange={(e) => setTextoBusca(e.target.value)}
                    className="focus-visible:ring-csae-green-600"
                  />
                </div>
                <Select value={filtroFormacao} onValueChange={setFiltroFormacao}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Formação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas Formações</SelectItem>
                    <SelectItem value="Enfermeiro">Enfermeiro</SelectItem>
                    <SelectItem value="Técnico de Enfermagem">Técnico</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Tabs defaultValue="aguardando" className="space-y-6">
              <TabsList className="bg-slate-100 p-1 rounded-lg w-full max-w-4xl grid grid-cols-4 h-12">
                <TabsTrigger value="aguardando" className="rounded-md flex items-center gap-2 font-semibold">
                  <UserMinus className="w-4 h-4" />
                  Aguardando
                  <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full border border-amber-200">
                    {usuariosAguardando.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="aprovados" className="rounded-md flex items-center gap-2 font-semibold">
                  <UserCheck className="w-4 h-4" />
                  Aprovados
                  <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full border border-green-200">
                    {usuariosAprovados.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="recusados" className="rounded-md flex items-center gap-2 font-semibold">
                  <UserX className="w-4 h-4" />
                  Recusados
                  <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full border border-red-200">
                    {usuariosRecusados.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="revogados" className="rounded-md flex items-center gap-2 font-semibold">
                  <UserX className="w-4 h-4" />
                  Revogados
                  <span className="bg-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded-full border border-slate-300">
                    {usuariosRevogados.length}
                  </span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="aguardando" className="anim-fade-in">
                <TabelaUsuarios 
                  usuarios={aguardandoFiltrados} 
                  tipo="aguardando" 
                  onDetalhes={handleDetalhes} 
                  onAprovar={handleAprovar} 
                  onRecusar={handleRecusar} 
                />
              </TabsContent>
              <TabsContent value="aprovados" className="anim-fade-in">
                <TabelaUsuarios 
                  usuarios={aprovadosFiltrados} 
                  tipo="aprovados" 
                  onDetalhes={handleDetalhes} 
                  onRevogar={isAdmin ? handleRevogar : undefined}
                  onEditarPrivilegios={isAdmin ? handleEditarPrivilegios : undefined} 
                />
              </TabsContent>
              <TabsContent value="recusados" className="anim-fade-in">
                <TabelaUsuarios 
                  usuarios={recusadosFiltrados} 
                  tipo="recusados" 
                  onDetalhes={handleDetalhes} 
                  onRestaurar={handleRestaurar}
                />
              </TabsContent>
              <TabsContent value="revogados" className="anim-fade-in">
                <TabelaUsuarios
                  usuarios={revogadosFiltrados}
                  tipo="revogados"
                  onDetalhes={handleDetalhes}
                  onRestaurar={handleRestaurar}
                />
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* Modais */}
        <ModalDetalhesUsuario 
          isOpen={modalDetalhesAberto} 
          onClose={() => { setModalDetalhesAberto(false); setUsuarioSelecionado(null); }} 
          usuario={usuarioSelecionado} 
        />
        <ModalConfirmacaoAprovacao 
          isOpen={modalAprovacaoAberto} 
          onClose={() => { setModalAprovacaoAberto(false); setUsuarioSelecionado(null); }} 
          onConfirm={confirmarAprovacao} 
          usuario={usuarioSelecionado} 
          nomeUsuario={usuarioSelecionado?.dadosPessoais?.nomeCompleto || ''} 
        />
        <ModalEdicaoPrivilegios 
          isOpen={modalEdicaoPrivilegiosAberto} 
          onClose={() => { setModalEdicaoPrivilegiosAberto(false); setUsuarioSelecionado(null); }} 
          onConfirm={confirmarEdicaoPrivilegios} 
          usuario={usuarioSelecionado} 
          isNewApproval={false} 
        />
        <ModalConfirmacaoExclusao 
          isOpen={modalExclusaoAberto} 
          onClose={() => { setModalExclusaoAberto(false); setUsuarioSelecionado(null); }} 
          onConfirm={confirmarRevogacao}
          nomeUsuario={usuarioSelecionado?.dadosPessoais?.nomeCompleto || ''} 
        />
        
        <ModalMotivoRecusa 
          isOpen={modalRecusaAberto}
          onClose={() => { setModalRecusaAberto(false); setUsuarioSelecionado(null); }}
          onConfirm={confirmarRecusa}
          usuario={usuarioSelecionado}
        />
      </div>
    </AuthenticatedLayout>
  );
};

export default GestaoUsuarios;
