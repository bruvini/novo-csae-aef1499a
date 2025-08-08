
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Usuario } from '@/types/usuario';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, Check, X, Trash2, Settings } from 'lucide-react';

interface TabelaUsuariosProps {
  usuarios: Usuario[];
  tipo: 'aguardando' | 'aprovados';
  onDetalhes: (usuario: Usuario) => void;
  onAprovar?: (usuario: Usuario) => void;
  onRecusar?: (usuario: Usuario) => void;
  onExcluir: (usuario: Usuario) => void;
  onEditarPrivilegios?: (usuario: Usuario) => void;
}

const TabelaUsuarios: React.FC<TabelaUsuariosProps> = ({
  usuarios,
  tipo,
  onDetalhes,
  onAprovar,
  onRecusar,
  onExcluir,
  onEditarPrivilegios
}) => {
  const formatarData = (timestamp: any) => {
    if (!timestamp) return 'Não informado';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const getTipoUsuarioBadge = (usuario: Usuario) => {
    if (usuario.ehAdmin) {
      return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Administrador</Badge>;
    }
    return <Badge variant="outline">Usuário Comum</Badge>;
  };

  if (usuarios.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {tipo === 'aguardando' 
          ? 'Nenhum usuário aguardando aprovação' 
          : 'Nenhum usuário aprovado encontrado'}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome Completo</TableHead>
            {tipo === 'aprovados' && <TableHead>Tipo de Usuário</TableHead>}
            <TableHead>Data de Cadastro</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {usuarios.map((usuario) => (
            <TableRow key={usuario.id}>
              <TableCell className="font-medium">
                {usuario.dadosPessoais?.nomeCompleto || 'Nome não informado'}
              </TableCell>
              {tipo === 'aprovados' && (
                <TableCell>
                  {getTipoUsuarioBadge(usuario)}
                </TableCell>
              )}
              <TableCell>
                {formatarData(usuario.dataCadastro)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDetalhes(usuario)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Detalhes
                  </Button>
                  
                  {tipo === 'aguardando' && onAprovar && onRecusar && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onAprovar(usuario)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Aceitar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onRecusar(usuario)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Recusar
                      </Button>
                    </>
                  )}

                  {tipo === 'aprovados' && onEditarPrivilegios && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditarPrivilegios(usuario)}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Alterar Privilégios
                    </Button>
                  )}
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onExcluir(usuario)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TabelaUsuarios;
