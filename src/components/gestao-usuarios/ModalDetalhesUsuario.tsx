import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Usuario } from "@/types/usuario";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Clock3 } from "lucide-react";

interface ModalDetalhesUsuarioProps {
  isOpen: boolean;
  onClose: () => void;
  usuario: Usuario | null;
}

const ModalDetalhesUsuario: React.FC<ModalDetalhesUsuarioProps> = ({
  isOpen,
  onClose,
  usuario,
}) => {
  if (!usuario) return null;

  const formatarData = (timestamp?: Timestamp) => {
    if (!timestamp) return "Não informado";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch {
      return "Data inválida";
    }
  };

  const historico = [...(usuario.historicoRevisoes || [])];
  if (
    usuario.dataRecusa &&
    !historico.some((evento) => evento.tipo === "acesso_recusado")
  ) {
    historico.push({
      tipo: "acesso_recusado",
      dataHora: usuario.dataRecusa,
      responsavelNome: "Responsável não registrado",
      descricao: "Cadastro recusado na análise de acesso.",
      motivo: usuario.motivoRecusa,
    });
  }
  if (
    usuario.dataAprovacao &&
    !historico.some((evento) => evento.tipo === "acesso_aprovado")
  ) {
    historico.push({
      tipo: "acesso_aprovado",
      dataHora: usuario.dataAprovacao,
      responsavelNome: "Responsável não registrado",
      descricao: "Cadastro aprovado e acesso liberado.",
    });
  }
  if (
    usuario.dataCadastro &&
    !historico.some((evento) => evento.tipo === "cadastro_enviado")
  ) {
    historico.push({
      tipo: "cadastro_enviado",
      dataHora: usuario.dataCadastro,
      responsavelId: usuario.uid,
      responsavelNome: usuario.dadosPessoais?.nomeCompleto || "Usuário",
      descricao: "Cadastro enviado para análise.",
    });
  }
  historico.sort((a, b) => b.dataHora.toMillis() - a.dataHora.toMillis());

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Usuário</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dados Pessoais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-csae-green-700 border-b pb-2">
              Dados Pessoais
            </h3>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Nome Completo:</span>
                <p className="text-gray-700">
                  {usuario.dadosPessoais?.nomeCompleto || "Não informado"}
                </p>
              </div>
              <div>
                <span className="font-medium">CPF:</span>
                <p className="text-gray-700">
                  {usuario.dadosPessoais?.cpf || "Não informado"}
                </p>
              </div>
              <div>
                <span className="font-medium">RG:</span>
                <p className="text-gray-700">
                  {usuario.dadosPessoais?.rg || "Não informado"}
                </p>
              </div>
              <div>
                <span className="font-medium">Endereço:</span>
                <p className="text-gray-700">
                  {usuario.dadosPessoais?.rua && usuario.dadosPessoais?.numero
                    ? `${usuario.dadosPessoais.rua}, ${usuario.dadosPessoais.numero}`
                    : "Não informado"}
                </p>
              </div>
              <div>
                <span className="font-medium">Bairro:</span>
                <p className="text-gray-700">
                  {usuario.dadosPessoais?.bairro || "Não informado"}
                </p>
              </div>
              <div>
                <span className="font-medium">Cidade/UF:</span>
                <p className="text-gray-700">
                  {usuario.dadosPessoais?.cidade && usuario.dadosPessoais?.uf
                    ? `${usuario.dadosPessoais.cidade}/${usuario.dadosPessoais.uf}`
                    : "Não informado"}
                </p>
              </div>
              <div>
                <span className="font-medium">CEP:</span>
                <p className="text-gray-700">
                  {usuario.dadosPessoais?.cep || "Não informado"}
                </p>
              </div>
            </div>
          </div>

          {/* Dados Profissionais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-csae-green-700 border-b pb-2">
              Dados Profissionais
            </h3>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Formação:</span>
                <p className="text-gray-700">
                  {usuario.dadosProfissionais?.formacao || "Não informado"}
                </p>
              </div>
              {usuario.dadosProfissionais?.numeroCoren && (
                <div>
                  <span className="font-medium">COREN:</span>
                  <p className="text-gray-700">
                    {usuario.dadosProfissionais.numeroCoren}/
                    {usuario.dadosProfissionais.ufCoren}
                  </p>
                </div>
              )}
              <div>
                <span className="font-medium">Atua na SMS:</span>
                <p className="text-gray-700">
                  {usuario.dadosProfissionais?.atuaSMS ? "Sim" : "Não"}
                </p>
              </div>
              {usuario.dadosProfissionais?.lotacao && (
                <div>
                  <span className="font-medium">Lotação:</span>
                  <p className="text-gray-700">
                    {usuario.dadosProfissionais.lotacao}
                  </p>
                </div>
              )}
              {usuario.dadosProfissionais?.matricula && (
                <div>
                  <span className="font-medium">Matrícula:</span>
                  <p className="text-gray-700">
                    {usuario.dadosProfissionais.matricula}
                  </p>
                </div>
              )}
              {usuario.dadosProfissionais?.iesEnfermagem && (
                <div>
                  <span className="font-medium">IES Enfermagem:</span>
                  <p className="text-gray-700">
                    {usuario.dadosProfissionais.iesEnfermagem}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dados do Sistema */}
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold text-csae-green-700 border-b pb-2">
            Dados do Sistema
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Email:</span>
              <p className="text-gray-700">
                {usuario.email || "Não informado"}
              </p>
            </div>
            <div>
              <span className="font-medium">Status de Acesso:</span>
              <p className="text-gray-700">
                {usuario.statusAcesso || "Não informado"}
              </p>
            </div>
            <div>
              <span className="font-medium">Tipo de Usuário:</span>
              <p className="text-gray-700">
                {usuario.tipoUsuario || "Não definido"}
              </p>
            </div>
            <div>
              <span className="font-medium text-slate-600">
                Data de Cadastro:
              </span>
              <p className="text-gray-700 font-medium">
                {formatarData(usuario.dataCadastro)}
              </p>
            </div>
            <div>
              <span className="font-medium text-slate-600">
                Total de Acessos:
              </span>
              <p className="text-csae-green-700 font-bold text-lg">
                {usuario.totalAcessos || 0}
              </p>
            </div>
            <div>
              <span className="font-medium">Termo de Responsabilidade:</span>
              <p className="text-gray-700">
                {usuario.termoResponsabilidadeAceito ? "Aceito" : "Não aceito"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold text-csae-green-700 border-b pb-2 flex items-center gap-2">
            <Clock3 className="h-5 w-5" /> Linha do tempo de revisões
          </h3>
          {historico.length === 0 ? (
            <p className="text-sm text-gray-500">
              Nenhum evento de revisão registrado.
            </p>
          ) : (
            <div className="relative ml-3 border-l-2 border-slate-200 space-y-5 py-1">
              {historico.map((evento, index) => (
                <div
                  key={`${evento.tipo}-${evento.dataHora.toMillis()}-${index}`}
                  className="relative pl-6"
                >
                  <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-csae-green-600 ring-4 ring-white" />
                  <div className="rounded-lg border bg-slate-50 p-4 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge variant="outline">{evento.descricao}</Badge>
                      <span className="text-xs text-gray-500">
                        {formatarData(evento.dataHora)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      <strong>Responsável:</strong> {evento.responsavelNome}
                    </p>
                    {evento.motivo && (
                      <p className="text-sm">
                        <strong>Justificativa:</strong> {evento.motivo}
                      </p>
                    )}
                    {evento.alteracoes && evento.alteracoes.length > 0 && (
                      <div className="space-y-1 pt-1">
                        {evento.alteracoes.map((alteracao) => (
                          <p
                            key={`${evento.tipo}-${alteracao.campo}`}
                            className="text-xs text-gray-600"
                          >
                            <strong>{alteracao.campo}:</strong>{" "}
                            {alteracao.anterior} → {alteracao.novo}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModalDetalhesUsuario;
