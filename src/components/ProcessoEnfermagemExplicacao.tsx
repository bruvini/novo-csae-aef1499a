
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
    <section className="bg-white py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <Card className="shadow-lg border-csae-green-200">
          <CardHeader className="text-center pb-6">
            <CardTitle className="flex items-center justify-center space-x-2 text-2xl text-csae-green-800 mb-2">
              <FileText className="w-6 h-6" />
              <span>O que é o Processo de Enfermagem?</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Painel Esquerdo - Explicação */}
              <div className="space-y-4">
                <div className="prose prose-lg text-gray-700 leading-relaxed">
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
              <div className="bg-gradient-to-br from-csae-green-50 to-csae-green-100 rounded-lg p-6">
                <h3 className="font-bold text-csae-green-800 mb-4 text-lg">
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
            <div className="flex items-center justify-center pt-6 mt-6 border-t border-csae-green-200">
              <a
                href="https://www.cofen.gov.br/resolucao-cofen-no-736-de-17-de-janeiro-de-2024"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-csae-green-700 hover:text-csae-green-800 transition-colors group"
              >
                <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">Consultar Resolução COFEN nº 736/2024</span>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default ProcessoEnfermagemExplicacao;
