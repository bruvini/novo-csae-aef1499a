
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Usuario } from '@/types/usuario';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ModalDetalhesUsuarioProps {
  isOpen: boolean;
  onClose: () => void;
  usuario: Usuario | null;
}

const ModalDetalhesUsuario: React.FC<ModalDetalhesUsuarioProps> = ({
  isOpen,
  onClose,
  usuario
}) => {
  if (!usuario) return null;

  const formatarData = (timestamp: any) => {
    if (!timestamp) return 'Não informado';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

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
                <p className="text-gray-700">{usuario.dadosPessoais?.nomeCompleto || 'Não informado'}</p>
              </div>
              <div>
                <span className="font-medium">CPF:</span>
                <p className="text-gray-700">{usuario.dadosPessoais?.cpf || 'Não informado'}</p>
              </div>
              <div>
                <span className="font-medium">RG:</span>
                <p className="text-gray-700">{usuario.dadosPessoais?.rg || 'Não informado'}</p>
              </div>
              <div>
                <span className="font-medium">Endereço:</span>
                <p className="text-gray-700">
                  {usuario.dadosPessoais?.rua && usuario.dadosPessoais?.numero 
                    ? `${usuario.dadosPessoais.rua}, ${usuario.dadosPessoais.numero}`
                    : 'Não informado'}
                </p>
              </div>
              <div>
                <span className="font-medium">Bairro:</span>
                <p className="text-gray-700">{usuario.dadosPessoais?.bairro || 'Não informado'}</p>
              </div>
              <div>
                <span className="font-medium">Cidade/UF:</span>
                <p className="text-gray-700">
                  {usuario.dadosPessoais?.cidade && usuario.dadosPessoais?.uf 
                    ? `${usuario.dadosPessoais.cidade}/${usuario.dadosPessoais.uf}`
                    : 'Não informado'}
                </p>
              </div>
              <div>
                <span className="font-medium">CEP:</span>
                <p className="text-gray-700">{usuario.dadosPessoais?.cep || 'Não informado'}</p>
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
                <p className="text-gray-700">{usuario.dadosProfissionais?.formacao || 'Não informado'}</p>
              </div>
              {usuario.dadosProfissionais?.numeroCoren && (
                <div>
                  <span className="font-medium">COREN:</span>
                  <p className="text-gray-700">
                    {usuario.dadosProfissionais.numeroCoren}/{usuario.dadosProfissionais.ufCoren}
                  </p>
                </div>
              )}
              <div>
                <span className="font-medium">Atua na SMS:</span>
                <p className="text-gray-700">{usuario.dadosProfissionais?.atuaSMS ? 'Sim' : 'Não'}</p>
              </div>
              {usuario.dadosProfissionais?.lotacao && (
                <div>
                  <span className="font-medium">Lotação:</span>
                  <p className="text-gray-700">{usuario.dadosProfissionais.lotacao}</p>
                </div>
              )}
              {usuario.dadosProfissionais?.matricula && (
                <div>
                  <span className="font-medium">Matrícula:</span>
                  <p className="text-gray-700">{usuario.dadosProfissionais.matricula}</p>
                </div>
              )}
              {usuario.dadosProfissionais?.iesEnfermagem && (
                <div>
                  <span className="font-medium">IES Enfermagem:</span>
                  <p className="text-gray-700">{usuario.dadosProfissionais.iesEnfermagem}</p>
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
              <p className="text-gray-700">{usuario.email || 'Não informado'}</p>
            </div>
            <div>
              <span className="font-medium">Status de Acesso:</span>
              <p className="text-gray-700">{usuario.statusAcesso || 'Não informado'}</p>
            </div>
            {usuario.motivoRecusa && (
              <div className="md:col-span-2 bg-red-50 p-3 rounded border border-red-100">
                <span className="font-medium text-red-700 flex items-center gap-1">Motivo da Recusa:</span>
                <p className="text-red-900 mt-1">{usuario.motivoRecusa}</p>
              </div>
            )}
            <div>
              <span className="font-medium">Tipo de Usuário:</span>
              <p className="text-gray-700">{usuario.tipoUsuario || 'Não definido'}</p>
            </div>
            <div>
              <span className="font-medium text-slate-600">Data de Cadastro:</span>
              <p className="text-gray-700 font-medium">{formatarData(usuario.dataCadastro)}</p>
            </div>
            <div>
              <span className="font-medium text-slate-600">Total de Acessos:</span>
              <p className="text-csae-green-700 font-bold text-lg">{usuario.totalAcessos || 0}</p>
            </div>
            {usuario.dataRecusa && (
              <div className="bg-red-50 p-2 rounded">
                <span className="font-medium text-red-700">Data da Recusa:</span>
                <p className="text-red-900">{formatarData(usuario.dataRecusa)}</p>
              </div>
            )}
            {usuario.dataAprovacao && (
              <div className="bg-green-50 p-2 rounded">
                <span className="font-medium text-green-700">Data de Aprovação:</span>
                <p className="text-green-900">{formatarData(usuario.dataAprovacao)}</p>
              </div>
            )}
            <div>
              <span className="font-medium">Termo de Responsabilidade:</span>
              <p className="text-gray-700">
                {usuario.termoResponsabilidadeAceito ? 'Aceito' : 'Não aceito'}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModalDetalhesUsuario;
