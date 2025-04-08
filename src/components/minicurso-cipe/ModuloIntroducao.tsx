import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

export interface ModuloIntroducaoProps {
  completado: boolean;
  onComplete: () => void;
}

const ModuloIntroducao: React.FC<ModuloIntroducaoProps> = ({ completado, onComplete }) => {
  return (
    <div id="introducao" className="space-y-6 pb-8">
      <h2 className="text-2xl font-bold text-csae-green-700">Introdução sobre a CIPE</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>O que é a CIPE?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            A Classificação Internacional para a Prática de Enfermagem (CIPE®) é uma terminologia padronizada, ampla e complexa, 
            que representa o domínio da prática de enfermagem a nível mundial.
          </p>
          
          <p>
            Desenvolvida pelo Conselho Internacional de Enfermeiros (CIE), a CIPE® fornece uma linguagem unificada 
            para documentação da prática clínica de enfermagem, permitindo:
          </p>
          
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Comunicação clara e eficaz entre profissionais de enfermagem</li>
            <li>Documentação padronizada dos cuidados</li>
            <li>Visibilidade das ações de enfermagem nos sistemas de informação em saúde</li>
            <li>Comparação de dados entre diferentes contextos clínicos, populações e regiões geográficas</li>
            <li>Projeção de tendências sobre necessidades dos pacientes</li>
            <li>Desenvolvimento de pesquisas</li>
          </ul>
          
          <p>
            A CIPE® é uma ferramenta que possibilita a descrição e comparação das práticas de enfermagem a nível local, 
            regional, nacional e internacional, proporcionando dados confiáveis e válidos para a tomada de decisão.
          </p>
          
          <p>
            Desde sua primeira versão em 1996, a CIPE® tem evoluído continuamente. Neste curso, utilizaremos 
            principalmente conceitos baseados na CIPE® versão 1.0, com um modelo de sete eixos.
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Importância da CIPE para o Processo de Enfermagem</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            O Processo de Enfermagem é um método sistemático e organizado para prestação de cuidados de enfermagem, 
            composto por cinco etapas interrelacionadas:
          </p>
          
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li><strong>Avaliação:</strong> coleta de dados do paciente</li>
            <li><strong>Diagnóstico de Enfermagem:</strong> análise dos dados e identificação de problemas</li>
            <li><strong>Planejamento:</strong> estabelecimento de resultados esperados e intervenções</li>
            <li><strong>Implementação:</strong> realização das intervenções planejadas</li>
            <li><strong>Avaliação:</strong> verificação dos resultados alcançados</li>
          </ol>
          
          <p>
            A CIPE® proporciona uma linguagem unificada para todas essas etapas, especialmente para a formulação de 
            diagnósticos, resultados e intervenções de enfermagem. Ao utilizar a CIPE®, os enfermeiros podem:
          </p>
          
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Padronizar a documentação clínica</li>
            <li>Melhorar a comunicação entre a equipe</li>
            <li>Permitir análise da prática clínica através dos dados registrados</li>
            <li>Vincular diagnósticos às intervenções e resultados de forma consistente</li>
            <li>Promover a prática baseada em evidências</li>
          </ul>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        {!completado ? (
          <Button onClick={onComplete} className="bg-csae-green-600 hover:bg-csae-green-700">
            Marcar como concluído
          </Button>
        ) : (
          <Button disabled className="bg-csae-green-700 flex items-center gap-2">
            <Check className="h-4 w-4" /> Módulo concluído
          </Button>
        )}
      </div>
    </div>
  );
};

export default ModuloIntroducao;
