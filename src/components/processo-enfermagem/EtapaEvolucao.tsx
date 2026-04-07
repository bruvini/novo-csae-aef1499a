import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Info, CheckCircle } from 'lucide-react';
import { ProcessoEnfermagem, EvolucaoEnfermagem } from '@/types/processoEnfermagem';
import { Paciente } from '@/types/paciente';

interface EtapaEvolucaoProps {
  processo: ProcessoEnfermagem;
  paciente: Paciente;
  onUpdateEvolucao: (evolucao: EvolucaoEnfermagem) => void;
}

const EtapaEvolucao: React.FC<EtapaEvolucaoProps> = ({
  processo,
  paciente,
  onUpdateEvolucao
}) => {
  const [executadas, setExecutadas] = useState<{ [key: string]: string[] }>(
    processo.evolucao?.intervencoesExecutadas || {}
  );

  // Verificar se a implementação atende aos critérios
  const verificarCriteriosImplementacao = () => {
    const implementacao = processo.implementacao || {};
    let peloMenosUmaImplementada = false;

    Object.values(implementacao).forEach(diagnostico => {
      diagnostico.intervencoes.forEach(intervencao => {
        if (intervencao.implementadoNestaConsulta) {
          peloMenosUmaImplementada = true;
        }
      });
    });

    return peloMenosUmaImplementada;
  };

  const handleCheck = (tituloDiag: string, acaoPrescrita: string, checked: boolean) => {
    const list = executadas[tituloDiag] || [];
    let newList = [...list];
    if (checked && !newList.includes(acaoPrescrita)) {
      newList.push(acaoPrescrita);
    } else if (!checked) {
      newList = newList.filter((x) => x !== acaoPrescrita);
    }
    const novoEstado = { ...executadas, [tituloDiag]: newList };
    setExecutadas(novoEstado);
    
    // Atualiza o processo (mantém o resumo gerado se já existir)
    onUpdateEvolucao({
      ...(processo.evolucao || { resumoGerado: '' }),
      intervencoesExecutadas: novoEstado
    });
  };

  if (!verificarCriteriosImplementacao()) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-yellow-500" />
            Etapa 5: Evolução (Checklist)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Para acessar a etapa de Evolução, é necessário implementar pelo menos uma intervenção na etapa anterior. 
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Pegar diagnósticos que possuem ao menos uma intervenção a nível de implementação
  const implementacaoAtiva = Object.entries(processo.implementacao || {}).filter(
    ([_, dados]) => dados.intervencoes.filter(i => i.implementadoNestaConsulta).length > 0
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Etapa 5: Evolução de Enfermagem (Checklist de Execução)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground pb-4 border-b">
            Assinale as intervenções que foram <strong>efetivamente executadas</strong> no decorrer deste encontro.
            Estes registros ditarão o que fará parte do relato final da Evolução.
          </p>

          <Accordion type="multiple" className="w-full mt-4">
            {implementacaoAtiva.map(([tituloDiag, diagnostico], idx) => {
              const intervencoesImplementadas = diagnostico.intervencoes.filter(
                int => int.implementadoNestaConsulta
              );

              return (
                <AccordionItem key={tituloDiag} value={`diag-${idx}`}>
                  <AccordionTrigger className="font-semibold text-lg hover:no-underline">
                    {tituloDiag}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 mt-2">
                      {intervencoesImplementadas.map((int, i) => {
                        const isChecked = (executadas[tituloDiag] || []).includes(int.acaoPrescrita);
                        return (
                          <div key={i} className="flex flex-row items-start space-x-3 bg-muted/30 p-3 rounded-lg border">
                            <Checkbox
                              id={`check-${idx}-${i}`}
                              checked={isChecked}
                              onCheckedChange={(checked) => handleCheck(tituloDiag, int.acaoPrescrita, !!checked)}
                              className="mt-0.5"
                            />
                            <div className="space-y-1 leading-none">
                              <label
                                htmlFor={`check-${idx}-${i}`}
                                className="text-sm font-medium leading-none cursor-pointer flex-1"
                              >
                                {int.acaoPrescrita}
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default EtapaEvolucao;
