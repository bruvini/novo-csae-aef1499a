import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Activity, History, Sparkles } from 'lucide-react';
import { buscarTodosChangelogs, Changelog } from '@/services/bancodados/changelogDB';

interface ModalHistoricoChangelogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModalHistoricoChangelog: React.FC<ModalHistoricoChangelogProps> = ({
  isOpen,
  onClose,
}) => {
  const [changelogs, setChangelogs] = useState<Changelog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Limpa ao fechar para evitar badge com contagem desatualizada na próxima abertura
      setChangelogs([]);
      return;
    }

    const fetch = async () => {
      setLoading(true);
      try {
        const todos = await buscarTodosChangelogs();
        setChangelogs(todos);
      } catch (err) {
        console.error('Erro ao buscar histórico de changelogs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [isOpen]);

  const formatarData = (dataHora: Changelog['dataHora']) => {
    try {
      const date = dataHora?.toDate ? dataHora.toDate() : new Date(dataHora as unknown as string);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return 'Data indisponível';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-5 bg-gradient-to-br from-csae-green-900 via-csae-green-800 to-csae-green-700 text-white shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="bg-white/15 backdrop-blur-sm p-2.5 rounded-xl border border-white/10">
              <History className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base font-black text-white leading-tight">
                Histórico de Atualizações
              </DialogTitle>
              <p className="text-csae-green-200 text-[11px] font-medium mt-0.5">
                Portal CSAE Floripa — todas as melhorias e correções
              </p>
            </div>
            {loading ? (
              <div className="bg-white/10 border border-white/20 rounded-full px-3 py-1">
                <Activity className="w-3.5 h-3.5 text-white/60 animate-spin" />
              </div>
            ) : changelogs.length > 0 ? (
              <Badge className="bg-white/15 hover:bg-white/20 border border-white/25 text-white text-[10px] font-black px-2.5 py-1">
                <Sparkles className="w-3 h-3 mr-1 opacity-80" />
                {changelogs.length} {changelogs.length === 1 ? 'registro' : 'registros'}
              </Badge>
            ) : null}
          </div>
        </DialogHeader>

        {/* Body — overflow-y-auto nativo garante scroll independente de altura flex */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50/60">
          <div className="px-6 py-5">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-10 h-10 rounded-full bg-csae-green-100 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-csae-green-500 animate-spin" />
                </div>
                <p className="text-gray-400 text-sm font-medium animate-pulse">
                  Carregando histórico...
                </p>
              </div>
            ) : changelogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <History className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-gray-400 text-sm font-medium">
                  Nenhuma atualização encontrada.
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {changelogs.map((log, idx) => (
                  <div key={log.id || idx} className="flex gap-4 group">
                    {/* Linha do tempo */}
                    <div className="flex flex-col items-center shrink-0 pt-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm transition-all group-hover:scale-110 ${
                        idx === 0
                          ? 'bg-csae-green-500 ring-2 ring-csae-green-200 group-hover:ring-csae-green-300'
                          : 'bg-csae-green-300 ring-1 ring-csae-green-100'
                      }`} />
                      {idx < changelogs.length - 1 && (
                        <div className="w-px flex-1 bg-gradient-to-b from-csae-green-200 via-csae-green-100 to-transparent mt-1.5 min-h-[1.5rem]" />
                      )}
                    </div>

                    {/* Conteúdo */}
                    <div className="pb-5 flex-1 min-w-0">
                      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 group-hover:border-csae-green-200 group-hover:shadow-md transition-all duration-200">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="font-bold text-gray-900 text-sm leading-snug">
                            {log.titulo}
                          </h3>
                          <span className="text-[10px] font-semibold text-gray-400 whitespace-nowrap shrink-0 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full leading-5">
                            {formatarData(log.dataHora)}
                          </span>
                        </div>
                        <p className="text-gray-500 text-xs leading-relaxed">
                          {log.descricao}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModalHistoricoChangelog;
