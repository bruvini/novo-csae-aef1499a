
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle } from 'lucide-react';

interface DiagnosticoEnfermagem {
  id: string;
  descricao: string;
  selecionado: boolean;
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
    implementacoesCompletas: implementacao.filter(i => i.status === 'Concluído').length,
    implementacoesEmAndamento: implementacao.filter(i => i.status === 'Em andamento').length,
    implementacoesPendentes: implementacao.filter(i => i.status === 'Pendente').length,
  };

  // Gerar texto de sugestão com base nas informações anteriores
  const gerarSugestaoTexto = () => {
    let texto = `EVOLUÇÃO DE ENFERMAGEM\n\n`;
    texto += `Paciente com ${estatisticas.diagnosticos} diagnósticos de enfermagem identificados, `;
    texto += `para os quais foram planejadas ${estatisticas.intervencoes} intervenções. `;
    
    texto += `Das intervenções implementadas, ${estatisticas.implementacoesCompletas} foram concluídas, `;
    texto += `${estatisticas.implementacoesEmAndamento} estão em andamento e `;
    texto += `${estatisticas.implementacoesPendentes} estão pendentes.\n\n`;
    
    texto += `DIAGNÓSTICOS DE ENFERMAGEM:\n`;
    diagnosticos.forEach((d, idx) => {
      texto += `${idx + 1}) ${d.descricao}\n`;
      
      // Adicionar resultado esperado se existir
      const plano = planejamento.find(p => p.diagnosticoId === d.id);
      if (plano && plano.resultadoEsperado) {
        texto += `   Resultado esperado: ${plano.resultadoEsperado}\n`;
      }
      
      // Calcular status das intervenções para este diagnóstico
      if (plano) {
        const idIntervencoes = plano.intervencoes.map((_, index) => `${d.id}-${index}`);
        const implsRelacionadas = implementacao.filter(i => idIntervencoes.includes(i.intervencaoId));
        
        const concluidas = implsRelacionadas.filter(i => i.status === 'Concluído').length;
        const total = implsRelacionadas.length;
        
        if (total > 0) {
          texto += `   Status: ${concluidas} de ${total} intervenções concluídas\n`;
        }
      }
      
      texto += `\n`;
    });
    
    texto += `OBSERVAÇÕES ADICIONAIS:\n`;
    texto += `[Adicione aqui suas observações finais sobre a evolução do paciente, incluindo orientações fornecidas, resposta do paciente ao tratamento, e próximos passos.]\n`;
    
    return texto;
  };

  const usarSugestao = () => {
    onChange(gerarSugestaoTexto());
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
            className="min-h-[300px]"
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
              <h3 className="font-medium text-csae-green-700">Concluídas</h3>
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
