import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ExternalLink, CheckCircle } from 'lucide-react';

const etapas = [
  { numero: '1', titulo: 'Avaliação', descricao: 'Coleta de dados subjetivos e objetivos' },
  { numero: '2', titulo: 'Diagnóstico de Enfermagem', descricao: 'Identificação de problemas e vulnerabilidades' },
  { numero: '3', titulo: 'Planejamento', descricao: 'Elaboração do plano assistencial com priorização' },
  { numero: '4', titulo: 'Implementação', descricao: 'Execução das intervenções e atividades' },
  { numero: '5', titulo: 'Evolução', descricao: 'Avaliação dos resultados e revisão de todo o processo' },
];

const fundamentos = [
  'Teorias e modelos de cuidado',
  'Linguagens padronizadas',
  'Instrumentos de predição de risco',
  'Protocolos baseados em evidências',
];

const ProcessoEnfermagemExplicacao: React.FC = () => {
  return (
    <section className="w-full min-w-0" aria-labelledby="pe-explicacao-titulo">
      <Card className="min-w-0 border-csae-green-200 shadow-sm">
        <CardHeader className="gap-3 px-4 pb-3 pt-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <CardTitle id="pe-explicacao-titulo" className="flex min-w-0 items-center gap-2 text-lg font-bold text-csae-green-800 sm:text-xl">
            <FileText className="h-5 w-5 shrink-0" aria-hidden="true" />
            O que é o Processo de Enfermagem?
          </CardTitle>
          <a
            href="https://www.cofen.gov.br/resolucao-cofen-no-736-de-17-de-janeiro-de-2024"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-csae-green-700 hover:text-csae-green-800 hover:underline focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-csae-green-600 sm:text-sm"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Resolução COFEN nº 736/2024
          </a>
        </CardHeader>
        <CardContent className="grid min-w-0 grid-cols-1 gap-4 px-4 pb-4 sm:px-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] xl:items-start xl:gap-6">
          <div className="min-w-0 space-y-3">
            <p className="text-sm leading-relaxed text-gray-700">
              Conforme a <strong>Resolução COFEN nº 736/2024</strong>, o Processo de Enfermagem (PE)
              deve ocorrer de forma <em>deliberada e sistemática</em> em todo contexto onde ocorre o cuidado.
              Sua realização precisa estar fundamentada em <strong>suporte teórico</strong>:
            </p>
            <ul className="grid grid-cols-1 gap-x-3 gap-y-1.5 text-sm text-gray-600 sm:grid-cols-2" aria-label="Fundamentos do Processo de Enfermagem">
              {fundamentos.map((fundamento) => (
                <li key={fundamento} className="flex min-w-0 items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-csae-green-600" aria-hidden="true" />
                  <span>{fundamento}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="min-w-0 rounded-lg bg-gradient-to-br from-csae-green-50 to-csae-green-100 p-3 sm:p-4">
            <h3 className="mb-2 text-sm font-bold text-csae-green-800">
              As cinco etapas inter-relacionadas e cíclicas:
            </h3>
            <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {etapas.map((etapa) => (
                <li key={etapa.numero} className="flex min-w-0 items-start gap-2 xl:flex-col xl:gap-1.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-csae-green-600 text-xs font-bold text-white">
                    {etapa.numero}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold leading-snug text-csae-green-800 sm:text-sm">
                      {etapa.titulo}
                    </h4>
                    <p className="mt-0.5 text-xs leading-snug text-gray-700">
                      {etapa.descricao}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default ProcessoEnfermagemExplicacao;
