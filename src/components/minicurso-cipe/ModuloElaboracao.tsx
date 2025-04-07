
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface ModuloElaboracaoProps {
  id: string;
  tipo: 'diagnosticos' | 'acoes' | 'resultados';
  completado: boolean;
  onComplete: () => void;
}

const ModuloElaboracao: React.FC<ModuloElaboracaoProps> = ({ 
  id, 
  tipo, 
  completado, 
  onComplete 
}) => {
  // Conteúdo específico para cada tipo de elaboração
  const conteudo = {
    diagnosticos: {
      titulo: 'Estrutura para representar Diagnósticos de Enfermagem',
      descricao: 'Os diagnósticos de enfermagem são compostos principalmente por termos dos eixos Foco e Julgamento.',
      estrutura: 'Termo do eixo Foco + Termo do eixo Julgamento + outros eixos quando necessário',
      regras: [
        'Obrigatório incluir um termo do eixo Foco',
        'Obrigatório incluir um termo do eixo Julgamento',
        'Os outros eixos são opcionais e usados conforme necessidade',
        'A afirmativa deve representar um estado, condição ou percepção avaliada pelo enfermeiro'
      ],
      exemplos: [
        'Dor (Foco) aguda (Julgamento)',
        'Integridade da pele (Foco) prejudicada (Julgamento)',
        'Ansiedade (Foco) moderada (Julgamento) relacionada à cirurgia (Meio)',
        'Amamentação (Foco) eficaz (Julgamento) em recém-nascido (Cliente)',
        'Mobilidade (Foco) reduzida (Julgamento) em extremidade direita (Localização)'
      ]
    },
    acoes: {
      titulo: 'Estrutura para representar Ações de Enfermagem',
      descricao: 'As ações de enfermagem são compostas principalmente por termos dos eixos Ação e Foco.',
      estrutura: 'Termo do eixo Ação + Termo do eixo Foco + outros eixos quando necessário',
      regras: [
        'Obrigatório incluir um termo do eixo Ação',
        'Obrigatório incluir um termo do eixo Foco',
        'Os outros eixos são opcionais e usados conforme necessidade',
        'A afirmativa deve representar uma atividade realizada pela enfermagem'
      ],
      exemplos: [
        'Monitorar (Ação) sinais vitais (Foco)',
        'Administrar (Ação) medicação (Foco) para dor (Foco)',
        'Implementar (Ação) medidas de segurança (Foco) durante o banho (Tempo)',
        'Facilitar (Ação) deambulação (Foco) com dispositivo de suporte (Meio)',
        'Ensinar (Ação) técnica de respiração (Foco) à família (Cliente)'
      ]
    },
    resultados: {
      titulo: 'Estrutura para representar Resultados de Enfermagem',
      descricao: 'Os resultados de enfermagem são compostos de maneira semelhante aos diagnósticos, mas representam um estado alcançado após as intervenções.',
      estrutura: 'Termo do eixo Foco + Termo do eixo Julgamento + outros eixos quando necessário',
      regras: [
        'Similar à estrutura dos diagnósticos',
        'Representam a resolução ou melhora de um problema identificado anteriormente',
        'Devem ser mensuráveis e observáveis',
        'Podem incluir escalas ou indicadores de melhoria'
      ],
      exemplos: [
        'Dor (Foco) ausente (Julgamento)',
        'Integridade da pele (Foco) melhorada (Julgamento)',
        'Ansiedade (Foco) diminuída (Julgamento) antes da cirurgia (Tempo)',
        'Amamentação (Foco) estabelecida (Julgamento) efetivamente (Meio)',
        'Mobilidade (Foco) restaurada (Julgamento) em extremidade direita (Localização)'
      ]
    }
  };

  const conteudoAtual = conteudo[tipo];

  return (
    <div id={id} className="space-y-6 pb-8">
      <h3 className="text-xl font-bold text-csae-green-700">{conteudoAtual.titulo}</h3>
      
      <Card>
        <CardHeader>
          <CardTitle>Definição</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">{conteudoAtual.descricao}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Estrutura Básica</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 font-medium">{conteudoAtual.estrutura}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Regras de Composição</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 ml-4">
            {conteudoAtual.regras.map((regra, index) => (
              <li key={index} className="text-gray-700">{regra}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Exemplos</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 ml-4">
            {conteudoAtual.exemplos.map((exemplo, index) => (
              <li key={index} className="text-gray-700">{exemplo}</li>
            ))}
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
            <Check className="h-4 w-4" /> Submódulo concluído
          </Button>
        )}
      </div>
    </div>
  );
};

export default ModuloElaboracao;
