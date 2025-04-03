
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle } from 'lucide-react';

interface DiagnosticoEnfermagem {
  id: string;
  descricao: string;
  selecionado: boolean;
  subconjunto?: string;
}

interface Planejamento {
  diagnosticoId: string;
  resultadoEsperado: string;
  intervencoes: string[];
}

interface Implementacao {
  intervencaoId: string;
  responsavel: string;
  status: 'Pendente' | 'Em andamento' | 'Concluído';
  observacoes?: string;
  selecionada?: boolean;
  tempoReavaliacao?: string;
  unidadeTempo?: string;
}

interface EvolucaoEnfermagemProps {
  valor: string;
  onChange: (valor: string) => void;
  diagnosticos: DiagnosticoEnfermagem[];
  planejamento: Planejamento[];
  implementacao: Implementacao[];
}

export function EvolucaoEnfermagem({ 
  valor, 
  onChange, 
  diagnosticos, 
  planejamento, 
  implementacao 
}: EvolucaoEnfermagemProps) {
  // Calcular estatísticas para o resumo
  const estatisticas = {
    diagnosticos: diagnosticos.length,
    intervencoes: planejamento.reduce((acc, p) => acc + p.intervencoes.length, 0),
    implementacoesCompletas: implementacao.filter(i => i.selecionada && i.responsavel).length,
    implementacoesEmAndamento: implementacao.filter(i => i.status === 'Em andamento').length,
    implementacoesPendentes: implementacao.filter(i => i.status === 'Pendente').length,
  };

  // Encontrar implementações para cada intervenção
  const encontrarImplementacao = (diagnosticoId: string, indiceIntervencao: number) => {
    const intervencaoId = `${diagnosticoId}-${indiceIntervencao}`;
    return implementacao.find(i => i.intervencaoId === intervencaoId);
  };

  // Agrupar intervenções por subconjunto (Protocolos/NHBs)
  const diagnosticosPorSubconjunto = diagnosticos.reduce<Record<string, DiagnosticoEnfermagem[]>>((acc, d) => {
    const subconjunto = d.subconjunto || 'Outros';
    if (!acc[subconjunto]) {
      acc[subconjunto] = [];
    }
    acc[subconjunto].push(d);
    return acc;
  }, {});

  // Gerar texto de evolução com base nas informações anteriores
  const gerarEvolucaoTexto = () => {
    let texto = `# Evolução de Enfermagem:\n\n`;
    
    // Seção de Avaliação
    texto += `# Avaliação de enfermagem:\n`;
    
    // Parte da Entrevista - Assumindo que o valor é o texto de entrevista
    texto += `- Entrevista: ${valor || "[Não preenchido]"}\n\n`;
    
    // Exame Físico - Simulação para esta versão
    texto += `- Exame Físico:\n\n`;
    
    // Simulação de Sinais Vitais para esta versão
    const sinaisVitais = [
      { nome: "Temperatura", valor: "36.5°C" },
      { nome: "Frequência Cardíaca", valor: "78 bpm" },
      { nome: "Pressão Arterial", valor: "120/80 mmHg" }
    ];
    
    if (sinaisVitais.length > 0) {
      texto += `Sinais Vitais:\n`;
      texto += sinaisVitais.map(sv => `${sv.nome}: ${sv.valor}`).join(' / ') + '\n\n';
    }
    
    // Diagnósticos de Enfermagem
    texto += `# Diagnósticos de Enfermagem:\n`;
    
    Object.entries(diagnosticosPorSubconjunto).forEach(([subconjunto, diagsNoSubconjunto]) => {
      texto += `${subconjunto}:\n`;
      diagsNoSubconjunto.forEach(d => {
        texto += `- ${d.descricao}\n`;
      });
      texto += '\n';
    });
    
    // Planejamento de Enfermagem
    texto += `# Planejamento de Enfermagem:\n`;
    
    diagnosticos.forEach(d => {
      const plano = planejamento.find(p => p.diagnosticoId === d.id);
      
      if (plano && plano.resultadoEsperado) {
        texto += `${plano.resultadoEsperado}:\n`;
        
        plano.intervencoes.forEach(intervencao => {
          texto += `- ${intervencao}\n`;
        });
        
        texto += '\n';
      }
    });
    
    // Implementação de Enfermagem
    texto += `# Implementação de Enfermagem:\n`;
    
    diagnosticos.forEach(d => {
      const plano = planejamento.find(p => p.diagnosticoId === d.id);
      
      if (plano && plano.resultadoEsperado) {
        texto += `${plano.resultadoEsperado}:\n`;
        
        plano.intervencoes.forEach((intervencao, idx) => {
          const impl = encontrarImplementacao(d.id, idx);
          
          if (impl && impl.selecionada) {
            let textoIntervencao = `- ${intervencao}`;
            
            if (impl.responsavel) {
              if (impl.responsavel === 'Enfermeiro') {
                // Verbo no infinitivo para o enfermeiro
                textoIntervencao = `- ${intervencao}`;
              } else {
                // Ajuste verbal para outros responsáveis
                textoIntervencao = `- Orientar ${impl.responsavel.toLowerCase()} a ${intervencao.toLowerCase()}`;
              }
            }
            
            if (impl.tempoReavaliacao && impl.unidadeTempo) {
              textoIntervencao += ` em ${impl.tempoReavaliacao} ${impl.unidadeTempo}`;
            }
            
            if (impl.observacoes) {
              textoIntervencao += ` (Obs: ${impl.observacoes})`;
            }
            
            texto += `${textoIntervencao}\n`;
          }
        });
        
        texto += '\n';
      }
    });
    
    texto += `# Portal CSAE Floripa`;
    
    return texto;
  };

  const usarSugestao = () => {
    onChange(gerarEvolucaoTexto());
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Evolução de Enfermagem</CardTitle>
          <CardDescription>
            Registre a avaliação dos resultados alcançados e as observações finais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Registre aqui sua evolução final..."
            className="min-h-[300px] font-mono"
            value={valor}
            onChange={(e) => onChange(e.target.value)}
          />
          
          <div className="flex justify-end">
            <button
              onClick={usarSugestao}
              className="text-csae-green-600 hover:text-csae-green-700 text-sm font-medium"
            >
              Usar sugestão de texto
            </button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo do Processo de Enfermagem</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-csae-green-50 p-4 rounded-md">
              <h3 className="font-medium text-csae-green-700">Diagnósticos</h3>
              <p className="text-2xl font-semibold text-csae-green-800 mt-1">{estatisticas.diagnosticos}</p>
            </div>
            
            <div className="bg-csae-green-50 p-4 rounded-md">
              <h3 className="font-medium text-csae-green-700">Intervenções</h3>
              <p className="text-2xl font-semibold text-csae-green-800 mt-1">{estatisticas.intervencoes}</p>
            </div>
            
            <div className="bg-csae-green-50 p-4 rounded-md">
              <h3 className="font-medium text-csae-green-700">Implementadas</h3>
              <p className="text-2xl font-semibold text-csae-green-800 mt-1">
                {estatisticas.implementacoesCompletas}/{estatisticas.intervencoes}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="p-4 bg-blue-50 rounded-md border border-blue-100 flex items-start">
        <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
        <div>
          <h4 className="font-medium text-blue-700">Finalizando o processo de enfermagem</h4>
          <p className="mt-1 text-sm text-blue-700">
            Ao clicar em "Finalizar", todos os dados serão salvos e esta evolução será marcada como concluída.
            Você poderá visualizá-la posteriormente no histórico do paciente.
          </p>
          <p className="mt-2 text-sm text-blue-700 font-medium">
            Dica: Utilize o botão "Usar sugestão de texto" para gerar um texto base que você pode editar.
          </p>
        </div>
      </div>
    </div>
  );
}
