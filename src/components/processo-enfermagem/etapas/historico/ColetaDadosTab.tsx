
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Info } from 'lucide-react';
import { Evolucao } from '@/types';

interface ColetaDadosTabProps {
  dadosEvolucao: Partial<Evolucao>;
  onDadosChange: (novosDados: Partial<Evolucao>) => void;
}

const ColetaDadosTab: React.FC<ColetaDadosTabProps> = ({ dadosEvolucao, onDadosChange }) => {
  const handleQueixaPrincipalChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onDadosChange({
      dadosAvaliacao: {
        ...dadosEvolucao.dadosAvaliacao,
        etapaHistorico: {
          ...(dadosEvolucao.dadosAvaliacao?.etapaHistorico || {}),
          coletaDados: event.target.value,
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="queixa-principal" className="text-base font-semibold">
          Queixa Principal / História da Doença Atual
        </Label>
        <Textarea
          id="queixa-principal"
          placeholder="Descreva aqui a queixa principal do paciente, suas palavras, história da doença, etc."
          className="min-h-[150px]"
          value={dadosEvolucao.dadosAvaliacao?.etapaHistorico?.coletaDados || ''}
          onChange={handleQueixaPrincipalChange}
        />
      </div>
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-blue-800 flex items-center gap-2">
            <Info className="h-5 w-5" />
            Dicas para uma Coleta de Dados eficaz
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2 text-sm text-blue-700">
            <li><strong>Escuta Ativa:</strong> Demonstre interesse genuíno, mantenha contato visual e evite interrupções.</li>
            <li><strong>Perguntas Abertas:</strong> Use perguntas que incentivem o paciente a contar sua história, como "Fale-me mais sobre isso...".</li>
            <li><strong>Empatia:</strong> Valide os sentimentos do paciente. Frases como "Imagino que isso seja difícil" podem ajudar.</li>
            <li><strong>Ambiente Confortável:</strong> Garanta privacidade e um ambiente tranquilo para que o paciente se sinta à vontade para se expressar.</li>
            <li><strong>Linguagem Clara:</strong> Evite jargões técnicos. Use uma linguagem que o paciente possa entender facilmente.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default ColetaDadosTab;
