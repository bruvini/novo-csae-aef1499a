import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  observarItensNovosSuporte,
  observarRespostasNaoVisualizadas,
  type ContagemNotificacoesSuporte,
} from '@/services/bancodados/suporteDB';

interface SupportNotificationsContextType {
  respostasTicketsNaoVisualizadas: number;
  respostasSugestoesNaoVisualizadas: number;
  respostasNaoVisualizadas: number;
  ticketsNovosSuporte: number;
  sugestoesNovasSuporte: number;
  itensNovosSuporte: number;
}

const contagemInicial: ContagemNotificacoesSuporte = {
  tickets: 0,
  sugestoes: 0,
  total: 0,
};

const SupportNotificationsContext = createContext<SupportNotificationsContextType | undefined>(undefined);

export function SupportNotificationsProvider({ children }: { children: ReactNode }) {
  const { sessionData } = useAuth();
  const [respostas, setRespostas] = useState(contagemInicial);
  const [itensNovos, setItensNovos] = useState(contagemInicial);

  useEffect(() => {
    if (!sessionData?.uid) {
      setRespostas(contagemInicial);
      return;
    }

    return observarRespostasNaoVisualizadas(
      sessionData.uid,
      setRespostas,
      (error) => console.error('[Suporte] Falha ao acompanhar respostas não visualizadas:', error)
    );
  }, [sessionData?.uid]);

  useEffect(() => {
    const podeGerenciarSuporte = Boolean(
      sessionData?.ehAdmin || sessionData?.paginasPermitidas?.includes('GestaoSuporte')
    );

    if (!podeGerenciarSuporte) {
      setItensNovos(contagemInicial);
      return;
    }

    return observarItensNovosSuporte(
      setItensNovos,
      (error) => console.error('[Suporte] Falha ao acompanhar novos atendimentos:', error)
    );
  }, [sessionData?.ehAdmin, sessionData?.paginasPermitidas]);

  const value = useMemo<SupportNotificationsContextType>(() => ({
    respostasTicketsNaoVisualizadas: respostas.tickets,
    respostasSugestoesNaoVisualizadas: respostas.sugestoes,
    respostasNaoVisualizadas: respostas.total,
    ticketsNovosSuporte: itensNovos.tickets,
    sugestoesNovasSuporte: itensNovos.sugestoes,
    itensNovosSuporte: itensNovos.total,
  }), [itensNovos, respostas]);

  return (
    <SupportNotificationsContext.Provider value={value}>
      {children}
    </SupportNotificationsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSupportNotifications() {
  const context = useContext(SupportNotificationsContext);

  if (!context) {
    throw new Error('useSupportNotifications deve ser usado dentro de SupportNotificationsProvider');
  }

  return context;
}
