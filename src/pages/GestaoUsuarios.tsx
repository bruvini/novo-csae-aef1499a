
import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import TabelaUsuarios from '@/components/gestao-usuarios/TabelaUsuarios';
import ModalDetalhesUsuario from '@/components/gestao-usuarios/ModalDetalhesUsuario';
import ModalConfirmacaoAprovacao from '@/components/gestao-usuarios/ModalConfirmacaoAprovacao';
import {
  buscarUsuariosAguardando,
  buscarUsuariosAprovados,
  aprovarUsuario,
  recusarUsuario
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
  
  // Estados dos modais
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);
  const [modalAprovacaoAberto, setModalAprovacaoAberto] = useState(false);
  const [modalRecusaAberto, setModalRecusaAberto] = useState(false);

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

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-csae-green-600 mx-auto mb-4"></div>
          <p>Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="outline" asChild className="mb-4">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Início
            </Link>
          </Button>
          
          <h1 className="text-3xl font-bold text-csae-green-800 mb-2">
            Gestão de Usuários
          </h1>
          <p className="text-gray-600">
            Gerencie as solicitações de acesso e usuários aprovados do sistema.
          </p>
        </div>

        <Tabs defaultValue="aguardando" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="aguardando" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Aguardando ({usuariosAguardando.length})
            </TabsTrigger>
            <TabsTrigger value="aprovados" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Aprovados ({usuariosAprovados.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="aguardando">
            <Card>
              <CardHeader>
                <CardTitle>Usuários Aguardando Aprovação</CardTitle>
              </CardHeader>
              <CardContent>
                <TabelaUsuarios
                  usuarios={usuariosAguardando}
                  tipo="aguardando"
                  onDetalhes={handleDetalhes}
                  onAprovar={handleAprovar}
                  onRecusar={handleRecusar}
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
                  usuarios={usuariosAprovados}
                  tipo="aprovados"
                  onDetalhes={handleDetalhes}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

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
    </div>
  );
};

export default GestaoUsuarios;
