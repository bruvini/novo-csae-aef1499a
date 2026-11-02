import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { ProcessoEnfermagem, EvolucaoEnfermagem, IntervencaoImplementada } from '@/types/processoEnfermagem';
import { Paciente } from '@/types/paciente';
import { materiaisAgrupados } from '@/utils/materiaisApoioProcesso';
import MateriaisApoioLeitura from './MateriaisApoioLeitura';

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

  // Filtrar diagnósticos e intervenções onde quemExecuta é 'Enfermeiro'
  const implementacaoEnfermeiro = Object.entries(processo.implementacao || {}).reduce<Record<string, { intervencoes: IntervencaoImplementada[] }>>((acc, [tituloDiag, dados]) => {
    const intervencoesEnfermeiro = dados.intervencoes.filter(
      int => int.implementadoNestaConsulta && int.quemExecuta === 'Enfermeiro'
    );
    if (intervencoesEnfermeiro.length > 0) {
      acc[tituloDiag] = {
        ...dados,
        intervencoes: intervencoesEnfermeiro
      };
    }
    return acc;
    }, {});

  const implementacaoAtiva = Object.entries(implementacaoEnfermeiro) as Array<
    [string, { intervencoes: IntervencaoImplementada[] }]
  >;
  const gruposMateriais = materiaisAgrupados(processo);

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Etapa 5: Evolução de Enfermagem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground pb-4 border-b text-sm">
            Avalie os resultados alcançados e registre seu julgamento clínico. Assinale somente as intervenções que você <strong>efetivamente executou</strong>;
            apenas ações atribuídas ao enfermeiro aparecem para checagem.
          </p>

          <div className="space-y-3 py-4 border-b">
            <h4 className="font-semibold">Diagnósticos e resultados esperados desta consulta</h4>
            {(processo.planejamento?.diagnosticosPlanejados || []).map((plano) => (
              <div key={plano.diagnosticoId} className="rounded-md border bg-muted/20 p-3">
                <p className="font-medium">{plano.tituloDiagnostico}</p>
                {plano.resultadoEsperadoSelecionado ? (
                  <p className="mt-1 text-sm text-muted-foreground">Resultado esperado: {plano.resultadoEsperadoSelecionado}</p>
                ) : null}
              </div>
            ))}
          </div>

          {gruposMateriais.length > 0 && <div className="space-y-2 border-b py-4">
            <h4 className="font-semibold text-sm">Materiais de apoio vinculados às intervenções</h4>
            {gruposMateriais.map(grupo => <div key={grupo.chave} className="rounded-md border bg-muted/20 p-3">
              <p className="text-xs font-medium">{grupo.tituloDiagnostico} · {grupo.acaoPrescrita}</p>
              <MateriaisApoioLeitura materiais={grupo.materiais} />
            </div>)}
          </div>}

          {implementacaoAtiva.length === 0 && (
            <Alert className="my-4 border-blue-200 bg-blue-50">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                Nenhuma intervenção direta do enfermeiro foi registrada nesta consulta. Documente a avaliação dos resultados e o julgamento clínico; nenhuma ação será presumida como executada.
              </AlertDescription>
            </Alert>
          )}

          {implementacaoAtiva.length > 0 && <Accordion type="multiple" className="w-full mt-4">
            {implementacaoAtiva.map(([tituloDiag, diagnostico], idx) => {
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
                        {diagnostico.intervencoes.map((int, i) => {
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
          </Accordion>}

          <div className="space-y-2 border-t pt-4">
            <label htmlFor="julgamento-clinico" className="text-sm font-semibold">
              Julgamento clínico e avaliação dos resultados <span className="text-red-600">*</span>
            </label>
            <Textarea
              id="julgamento-clinico"
              value={processo.evolucao?.julgamentoClinico || ''}
              onChange={(event) => onUpdateEvolucao({
                ...(processo.evolucao || { resumoGerado: '' }),
                julgamentoClinico: event.target.value,
              })}
              placeholder="Registre os resultados observados, sua avaliação clínica e a decisão de manter, revisar ou encerrar o plano."
              rows={5}
            />
            <p className="text-xs text-muted-foreground">A evolução é obrigatória mesmo quando não há intervenção direta nesta consulta.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EtapaEvolucao;
