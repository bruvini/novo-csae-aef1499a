import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Info, CheckCircle, AlertTriangle } from 'lucide-react';
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

  // Filtrar intervenções onde Enfermeiro é um dos executores
  const implementacaoEnfermeiro = Object.entries(processo.implementacao || {}).reduce((acc, [tituloDiag, dados]) => {
    const intervencoesEnfermeiro = dados.intervencoes.filter(int => {
      if (!int.implementadoNestaConsulta) return false;
      const executores = Array.isArray(int.quemExecuta) ? int.quemExecuta : (int.quemExecuta ? [int.quemExecuta] : []);
      return executores.includes('Enfermeiro');
    });
    if (intervencoesEnfermeiro.length > 0) {
      acc[tituloDiag] = {
        ...dados,
        intervencoes: intervencoesEnfermeiro
      };
    }
    return acc;
  }, {} as any);

  const implementacaoAtiva = Object.entries(implementacaoEnfermeiro);

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
    
    onUpdateEvolucao({
      ...(processo.evolucao || { resumoGerado: '' }),
      intervencoesExecutadas: novoEstado
    });
  };

  if (implementacaoAtiva.length === 0) {
    return (
      <Card className="h-full border-dashed border-2">
        <CardContent className="pt-10 flex flex-col items-center text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-blue-500 animate-pulse" />
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-blue-900">Nenhuma ação direta do Enfermeiro</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Todas as intervenções implementadas nesta consulta foram delegadas à Equipe ou Outros profissionais. 
              Revise a Etapa de Implementação se desejar executar alguma ação técnica diretamente agora.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Etapa 5: Evolução (Ações Diretas do Enfermeiro)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground pb-4 border-b text-sm">
            Assinale as intervenções que você <strong>efetivamente executou</strong>. 
            Apenas intervenções marcadas para o executor "Enfermeiro" na etapa anterior aparecem aqui.
          </p>

          <Accordion type="multiple" className="w-full mt-4">
            {implementacaoAtiva.map(([tituloDiag, diagnostico]: any, idx) => {
              // Pegar o resultado esperado planejado para este diagnóstico
              const planejamentoDiag = processo.planejamento?.diagnosticosPlanejados?.find(
                p => p.tituloDiagnostico === tituloDiag
              );

              return (
                <AccordionItem key={tituloDiag} value={`diag-${idx}`} className="border rounded-lg px-4 mb-3 shadow-sm">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="text-left space-y-1">
                      <span className="text-xs uppercase font-black text-csae-green-600 tracking-widest">Diagnóstico</span>
                      <h4 className="font-bold text-gray-900 leading-tight">{tituloDiag}</h4>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      {planejamentoDiag?.resultadoEsperadoSelecionado && (
                        <div className="bg-muted/50 p-2 rounded text-xs border-l-4 border-csae-green-500">
                          <span className="font-black uppercase text-[10px] text-muted-foreground block mb-1">Resultado Esperado</span>
                          <p className="font-semibold text-gray-700">{planejamentoDiag.resultadoEsperadoSelecionado}</p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">Intervenções Planejadas</span>
                        {diagnostico.intervencoes.map((int: any, i: number) => {
                          const isChecked = (executadas[tituloDiag] || []).includes(int.acaoPrescrita);
                          return (
                            <div key={i} className="flex flex-row items-center space-x-3 bg-muted/20 p-3 rounded-md border hover:bg-muted/40 transition-colors">
                              <Checkbox
                                id={`check-${idx}-${i}`}
                                checked={isChecked}
                                onCheckedChange={(checked) => handleCheck(tituloDiag, int.acaoPrescrita, !!checked)}
                              />
                              <label
                                htmlFor={`check-${idx}-${i}`}
                                className="text-sm font-medium leading-tight cursor-pointer flex-1"
                              >
                                {int.acaoEnfermeiro || int.acaoPrescrita}
                              </label>
                            </div>
                          );
                        })}
                      </div>
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
