
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface IndicadoresTempoReal {
  totalPacientes: number;
  processosAtivos: number;
  processosConcluidos: number;
  mediaProcessosPorPaciente: number;
}

export const useIndicadoresTempoReal = () => {
  const [indicadores, setIndicadores] = useState<IndicadoresTempoReal>({
    totalPacientes: 0,
    processosAtivos: 0,
    processosConcluidos: 0,
    mediaProcessosPorPaciente: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const unsubscribers: (() => void)[] = [];

    // Listener para pacientes
    const pacientesQuery = query(
      collection(db, 'pacientesProcessoEnfermagem'),
      where('uidUsuario', '==', user.uid)
    );

    const unsubscribePacientes = onSnapshot(pacientesQuery, (snapshot) => {
      setIndicadores(prev => ({
        ...prev,
        totalPacientes: snapshot.size
      }));
    });
    unsubscribers.push(unsubscribePacientes);

    // Listener para processos ativos
    const processosAtivosQuery = query(
      collection(db, 'processosEnfermagem'),
      where('enfermeiroId', '==', user.uid),
      where('status', '==', 'em_andamento')
    );

    const unsubscribeAtivos = onSnapshot(processosAtivosQuery, (snapshot) => {
      setIndicadores(prev => ({
        ...prev,
        processosAtivos: snapshot.size
      }));
    });
    unsubscribers.push(unsubscribeAtivos);

    // Listener para processos concluídos
    const processosConcluidos = query(
      collection(db, 'processosEnfermagem'),
      where('enfermeiroId', '==', user.uid),
      where('status', '==', 'concluido')
    );

    const unsubscribeConcluidos = onSnapshot(processosConcluidos, (snapshot) => {
      setIndicadores(prev => ({
        ...prev,
        processosConcluidos: snapshot.size
      }));
    });
    unsubscribers.push(unsubscribeConcluidos);

    // Listener para todos os processos (para calcular média)
    const todosProcessosQuery = query(
      collection(db, 'processosEnfermagem'),
      where('enfermeiroId', '==', user.uid)
    );

    const unsubscribeTodos = onSnapshot(todosProcessosQuery, (snapshot) => {
      const totalProcessos = snapshot.size;
      setIndicadores(prev => ({
        ...prev,
        mediaProcessosPorPaciente: prev.totalPacientes > 0 ? 
          Math.round((totalProcessos / prev.totalPacientes) * 10) / 10 : 0
      }));
      setLoading(false);
    });
    unsubscribers.push(unsubscribeTodos);

    // Cleanup function
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [user]);

  return { indicadores, loading };
};
