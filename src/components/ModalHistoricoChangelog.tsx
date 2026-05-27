import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Activity, History } from 'lucide-react';
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
    if (!isOpen) return;

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
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-csae-green-900 to-csae-green-700 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <History className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-white">
                Histórico de Atualizações
              </DialogTitle>
              <p className="text-csae-green-200 text-xs font-medium mt-0.5">
                Todas as melhorias e correções do Portal CSAE Floripa
              </p>
            </div>
            {!loading && changelogs.length > 0 && (
              <Badge
                variant="outline"
                className="ml-auto border-white/30 text-white text-[10px] font-black px-2.5"
              >
                {changelogs.length} registros
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Body */}
        <ScrollArea className="flex-1 bg-gray-50/50" id="changelog-history-scroll">
          <div className="px-6 py-5 space-y-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <Activity className="w-8 h-8 text-csae-green-500 animate-spin" />
                <p className="text-gray-400 text-sm font-medium animate-pulse">
                  Carregando histórico...
                </p>
              </div>
            ) : changelogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <History className="w-10 h-10 text-gray-300" />
                <p className="text-gray-400 text-sm font-medium">
                  Nenhuma atualização encontrada.
                </p>
              </div>
            ) : (
              changelogs.map((log, idx) => (
                <div key={log.id || idx} className="flex gap-4 group">
                  {/* Linha do tempo */}
                  <div className="flex flex-col items-center shrink-0 pt-1">
                    <div className="w-3 h-3 rounded-full bg-csae-green-500 border-2 border-white shadow-sm ring-2 ring-csae-green-200 group-hover:ring-csae-green-400 transition-all" />
                    {idx < changelogs.length - 1 && (
                      <div className="w-px flex-1 bg-gradient-to-b from-csae-green-200 to-transparent mt-1 min-h-[2rem]" />
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div className="pb-6 flex-1 min-w-0">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 group-hover:border-csae-green-200 group-hover:shadow-md transition-all">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-black text-gray-900 text-sm leading-tight">
                          {log.titulo}
                        </h3>
                        <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap shrink-0 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
                          {formatarData(log.dataHora)}
                        </span>
                      </div>
                      <p className="text-gray-600 text-xs leading-relaxed">
                        {log.descricao}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ModalHistoricoChangelog;
