
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ExternalLink, CheckCircle } from 'lucide-react';

const ProcessoEnfermagemExplicacao = () => {
  const etapas = [
    {
      numero: '1',
      titulo: 'Avaliação',
      descricao: 'Coleta de dados subjetivos e objetivos'
    },
    {
      numero: '2',
      titulo: 'Diagnóstico de Enfermagem',
      descricao: 'Identificação de problemas e vulnerabilidades'
    },
    {
      numero: '3',
      titulo: 'Planejamento',
      descricao: 'Elaboração do plano assistencial com priorização'
    },
    {
      numero: '4',
      titulo: 'Implementação',
      descricao: 'Execução das intervenções e atividades'
    },
    {
      numero: '5',
      titulo: 'Evolução',
      descricao: 'Avaliação dos resultados e revisão de todo o processo'
    }
  ];

  return (
    <section className="min-w-0">
      <Card className="h-full min-w-0 border-csae-green-200 shadow-sm">
          <CardHeader className="px-4 pb-4 text-center sm:px-6">
            <CardTitle className="flex items-center justify-center gap-2 text-lg font-bold leading-snug text-csae-green-800 sm:text-xl 2xl:text-2xl">
              <FileText className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" />
              <span>O que é o Processo de Enfermagem?</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="min-w-0 px-4 pb-5 sm:px-6">
            <div className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-1 2xl:gap-6">
              {/* Painel Esquerdo - Explicação */}
              <div className="space-y-4">
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed sm:prose-base">
                  <p>
                    Conforme a <strong>Resolução COFEN nº 736/2024</strong>, o Processo de Enfermagem (PE) 
                    deve ser realizado de forma <em>deliberada e sistemática</em> em todo contexto onde ocorre o cuidado.
                  </p>
                  
                  <p>
                    Ele precisa estar fundamentado em <strong>suporte teórico</strong>, como:
                  </p>
                  
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-5 h-5 text-csae-green-600 mt-0.5 flex-shrink-0" />
                      <span>Teorias e modelos de cuidado</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-5 h-5 text-csae-green-600 mt-0.5 flex-shrink-0" />
                      <span>Linguagens padronizadas</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-5 h-5 text-csae-green-600 mt-0.5 flex-shrink-0" />
                      <span>Instrumentos de predição de risco</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-5 h-5 text-csae-green-600 mt-0.5 flex-shrink-0" />
                      <span>Protocolos baseados em evidências</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Painel Direito - Etapas */}
              <div className="min-w-0 rounded-lg bg-gradient-to-br from-csae-green-50 to-csae-green-100 p-4 sm:p-5">
                <h3 className="mb-4 text-base font-bold text-csae-green-800 sm:text-lg">
                  As cinco etapas inter-relacionadas e cíclicas:
                </h3>
                
                <div className="space-y-3">
                  {etapas.map((etapa) => (
                    <div key={etapa.numero} className="flex items-start space-x-3">
                      <span className="bg-csae-green-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                        {etapa.numero}
                      </span>
                      <div>
                        <h4 className="font-semibold text-csae-green-800 text-sm">
                          {etapa.titulo}
                        </h4>
                        <p className="text-xs text-gray-700 leading-relaxed">
                          {etapa.descricao}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Link para resolução */}
            <div className="mt-5 flex items-center justify-center border-t border-csae-green-200 pt-5 text-center">
              <a
                href="https://www.cofen.gov.br/resolucao-cofen-no-736-de-17-de-janeiro-de-2024"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-csae-green-700 hover:text-csae-green-800 transition-colors group"
              >
                <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium sm:text-sm">Consultar Resolução COFEN nº 736/2024</span>
              </a>
            </div>
          </CardContent>
      </Card>
    </section>
  );
};

export default ProcessoEnfermagemExplicacao;
