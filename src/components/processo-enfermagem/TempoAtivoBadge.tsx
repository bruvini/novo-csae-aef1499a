import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { calcularTempoAtivo } from '@/utils/timeUtils';
import { SessaoDeTrabalho } from '@/types/processoEnfermagem';

interface TempoAtivoBadgeProps {
  sessoes: SessaoDeTrabalho[];
}

/**
 * Componente isolado que atualiza o contador de tempo a cada segundo.
 * Mantido separado do modal para evitar re-renders desnecessários do componente pai.
 */
const TempoAtivoBadge: React.FC<TempoAtivoBadgeProps> = ({ sessoes }) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const tempoAtivo =
    sessoes?.length > 0 ? calcularTempoAtivo(sessoes) : '00 dias, 00:00:00';

  return (
    <Badge variant="outline" className="text-sm">
      Tempo Ativo: {tempoAtivo}
    </Badge>
  );
};

export default TempoAtivoBadge;
