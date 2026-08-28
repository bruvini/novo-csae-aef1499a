import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Usuario } from "@/types/usuario";
import { normalizarNomeCompleto } from "@/utils/userNormalization";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Eye, Check, X, Trash2, Settings, Undo } from "lucide-react";
import { Timestamp } from "firebase/firestore";

interface TabelaUsuariosProps {
  usuarios: Usuario[];
  tipo: "aguardando" | "aprovados" | "recusados" | "alteracoes";
  onDetalhes: (usuario: Usuario) => void;
  onAprovar?: (usuario: Usuario) => void;
  onRecusar?: (usuario: Usuario) => void;
  onExcluir?: (usuario: Usuario) => void;
  onEditarPrivilegios?: (usuario: Usuario) => void;
  onRestaurar?: (usuario: Usuario) => void;
}

const TabelaUsuarios: React.FC<TabelaUsuariosProps> = ({
  usuarios,
  tipo,
  onDetalhes,
  onAprovar,
  onRecusar,
  onExcluir,
  onEditarPrivilegios,
  onRestaurar,
}) => {
  const formatarData = (timestamp?: Timestamp) => {
    if (!timestamp) return "Não informado";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch {
      return "Data inválida";
    }
  };

  const getTipoUsuarioBadge = (usuario: Usuario) => {
    if (usuario.ehAdmin) {
      return (
        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
          Administrador
        </Badge>
      );
    }
    return <Badge variant="outline">Usuário Comum</Badge>;
  };

  if (usuarios.length === 0) {
    const mensagens = {
      aguardando: "Nenhum usuário aguardando aprovação",
      aprovados: "Nenhum usuário aprovado encontrado",
      recusados: "Nenhum usuário recusado encontrado",
      alteracoes: "Nenhuma alteração cadastral aguardando revisão",
    };
    return (
      <div className="text-center py-8 text-gray-500">{mensagens[tipo]}</div>
    );
  }

  return (
    <div className="rounded-md border bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="font-bold">Nome Completo</TableHead>
            {tipo === "aprovados" && (
              <TableHead className="font-bold">Tipo de Usuário</TableHead>
            )}
            {tipo === "aguardando" && (
              <TableHead className="font-bold">Data de Cadastro</TableHead>
            )}
            {tipo === "aprovados" && (
              <TableHead className="font-bold">Qtd. Acessos</TableHead>
            )}
            {tipo === "aprovados" && (
              <TableHead className="font-bold">Último Acesso</TableHead>
            )}
            {tipo === "aprovados" && (
              <TableHead className="font-bold">Data de Aprovação</TableHead>
            )}
            {tipo === "recusados" && (
              <TableHead className="font-bold">Data de Recusa</TableHead>
            )}
            {tipo === "recusados" && (
              <TableHead className="font-bold">Motivo da Recusa</TableHead>
            )}
            {(tipo === "aprovados" || tipo === "recusados") && (
              <TableHead className="font-bold">Analisado por</TableHead>
            )}
            {tipo === "alteracoes" && (
              <TableHead className="font-bold">Data da Solicitação</TableHead>
            )}
            <TableHead className="text-right font-bold w-[250px]">
              Ações
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {usuarios.map((usuario) => (
            <TableRow key={usuario.id} className="hover:bg-slate-50/50">
              <TableCell className="font-medium">
                {normalizarNomeCompleto(usuario.dadosPessoais?.nomeCompleto) ||
                  "NOME NÃO INFORMADO"}
              </TableCell>
              {tipo === "aprovados" && (
                <>
                  <TableCell>{getTipoUsuarioBadge(usuario)}</TableCell>
                  <TableCell>{usuario.totalAcessos || 0}</TableCell>
                  <TableCell>{formatarData(usuario.ultimoAcesso)}</TableCell>
                </>
              )}
              <TableCell>
                {tipo === "aprovados"
                  ? formatarData(usuario.dataAprovacao || usuario.dataCadastro)
                  : tipo === "recusados"
                    ? formatarData(usuario.dataRecusa || usuario.dataCadastro)
                    : formatarData(usuario.dataCadastro)}
              </TableCell>
              {tipo === "recusados" && (
                <TableCell className="max-w-[300px]">
                  <p
                    className="text-sm text-gray-600 italic line-clamp-2"
                    title={usuario.motivoRecusa}
                  >
                    {usuario.motivoRecusa || "Sem motivo registrado"}
                  </p>
                </TableCell>
              )}
              {(tipo === "aprovados" || tipo === "recusados") && (
                <TableCell className="text-sm text-gray-600">
                  {usuario.analisadoPor || "Não registrado"}
                </TableCell>
              )}
              {tipo === "alteracoes" && (
                <TableCell>
                  {formatarData(
                    usuario.alteracaoProfissionalPendente?.dataSolicitacao,
                  )}
                </TableCell>
              )}
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => onDetalhes(usuario)}
                    title="Ver detalhes"
                  >
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">Detalhes</span>
                  </Button>

                  {tipo === "aguardando" && onAprovar && onRecusar && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        className="h-8 bg-green-600 hover:bg-green-700 text-xs gap-1"
                        onClick={() => onAprovar(usuario)}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Aceitar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 text-xs gap-1"
                        onClick={() => onRecusar(usuario)}
                      >
                        <X className="h-3.5 w-3.5" />
                        Recusar
                      </Button>
                    </>
                  )}

                  {tipo === "aprovados" && onEditarPrivilegios && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1"
                      onClick={() => onEditarPrivilegios(usuario)}
                    >
                      <Settings className="h-3.5 w-3.5" />
                      Privilégios
                    </Button>
                  )}

                  {tipo === "recusados" && onRestaurar && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 border-amber-600 text-amber-700 hover:bg-amber-50 text-xs gap-1"
                      onClick={() => onRestaurar(usuario)}
                    >
                      <Undo className="h-3.5 w-3.5" />
                      Restaurar
                    </Button>
                  )}

                  {onExcluir && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => onExcluir(usuario)}
                      title="Excluir permanentemente"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Excluir</span>
                    </Button>
                  )}
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
