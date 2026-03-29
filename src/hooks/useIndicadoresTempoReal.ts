
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface IndicadoresTempoReal {
  totalPacientes: number;
  processosAtivos: number;
  processosConcluidos: number;
  mediaProcessosPorPaciente: number;
  tempoMedioEvolucao: number; // em minutos
}

export const useIndicadoresTempoReal = () => {
  const [indicadores, setIndicadores] = useState<IndicadoresTempoReal>({
    totalPacientes: 0,
    processosAtivos: 0,
    processosConcluidos: 0,
    mediaProcessosPorPaciente: 0,
    tempoMedioEvolucao: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Listener para a coleção de pacientes do usuário
    const q = query(
      collection(db, 'pacientesProcessoEnfermagem'),
      where('uidUsuario', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let totalProcessos = 0;
      let ativos = 0;
      let concluidos = 0;
      let tempoTotalMinutos = 0;
      let countComTempo = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const processos = data.processosEnfermagem || [];
        
        totalProcessos += processos.length;
        
        processos.forEach((p: any) => {
          if (p.status === 'concluido') {
            concluidos++;
            
            // Calcular tempo ativo deste processo
            if (p.sessoesDeTrabalho && Array.isArray(p.sessoesDeTrabalho)) {
              let tempoProcessoSegundos = 0;
              p.sessoesDeTrabalho.forEach((s: any) => {
                if (s.inicioSessao && s.fimSessao) {
                  const inicio = s.inicioSessao.toDate().getTime();
                  const fim = s.fimSessao.toDate().getTime();
                  tempoProcessoSegundos += (fim - inicio) / 1000;
                }
              });
              
              if (tempoProcessoSegundos > 0) {
                tempoTotalMinutos += tempoProcessoSegundos / 60;
                countComTempo++;
              }
            }
          } else if (p.status === 'em_andamento') {
            ativos++;
          }
        });
      });

      setIndicadores({
        totalPacientes: snapshot.size,
        processosAtivos: ativos,
        processosConcluidos: concluidos,
        mediaProcessosPorPaciente: snapshot.size > 0 ? 
          Math.round((totalProcessos / snapshot.size) * 10) / 10 : 0,
        tempoMedioEvolucao: countComTempo > 0 ? 
          Math.round(tempoTotalMinutos / countComTempo) : 0
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { indicadores, loading };
};
