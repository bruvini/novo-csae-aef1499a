
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen } from 'lucide-react';
import { ProcessoEnfermagem, AvaliacaoEnfermagem } from '@/types/processoEnfermagem';

interface EtapaAvaliacaoProps {
  processo: ProcessoEnfermagem;
  onUpdateAvaliacao: (avaliacao: AvaliacaoEnfermagem) => void;
}

const EtapaAvaliacao: React.FC<EtapaAvaliacaoProps> = ({
  processo,
  onUpdateAvaliacao
}) => {
  const [guiaOpen, setGuiaOpen] = useState(false);

  const handleColetaDadosChange = (value: string) => {
    const novaAvaliacao: AvaliacaoEnfermagem = {
      ...processo.avaliacao,
      coletaDeDadosSubjetivos: value
    };
    onUpdateAvaliacao(novaAvaliacao);
  };

  return (
    <div className="h-full">
      <Tabs defaultValue="coleta-dados" className="w-full h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-2 shrink-0">
          <TabsTrigger value="coleta-dados">Coleta de Dados</TabsTrigger>
          <TabsTrigger value="exame-fisico">Exame Físico</TabsTrigger>
        </TabsList>

        <TabsContent value="coleta-dados" className="flex-1 mt-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="shrink-0">
              <div className="flex justify-between items-center">
                <CardTitle>Coleta de Dados Subjetivos</CardTitle>
                <Dialog open={guiaOpen} onOpenChange={setGuiaOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Guia de Comunicação
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl h-[80vh]">
                    <DialogHeader>
                      <DialogTitle>Guia de Habilidades de Comunicação para a Coleta de Dados</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-full pr-4">
                      <div className="space-y-6 text-sm">
                        <section>
                          <h3 className="text-lg font-semibold text-csae-green-800 mb-3">O Contato Inicial</h3>
                          <p className="mb-4">
                            O contato inicial com o usuário pode determinar como a relação será estabelecida. 
                            A demonstração de respeito, cordialidade, empatia e assertividade devem fazer parte 
                            da apresentação inicial. Tente causar uma primeira impressão positiva (LEIN; WILLS, 2007; CARRIO, 2012).
                          </p>
                          <ul className="space-y-2 list-disc pl-6">
                            <li><strong>Seja cordial:</strong> Chame a pessoa pelo nome, se apresente, mantenha contato visual, sorria e indique onde ela deve se sentar.</li>
                            <li><strong>Lei do eco emocional:</strong> O profissional recebe do usuário conforme o que oferece a ele.</li>
                            <li><strong>Atenção à linguagem corporal:</strong> Evite demonstrar pressa, desinteresse ou desconforto.</li>
                          </ul>
                        </section>

                        <section>
                          <h3 className="text-lg font-semibold text-csae-green-800 mb-3">Encorajando a Narrativa do Paciente</h3>
                          
                          <div className="mb-4">
                            <h4 className="font-semibold mb-2">1. Pergunta aberta:</h4>
                            <p className="mb-2">Utilize frases e perguntas abertas para incentivar a pessoa a falar.</p>
                            <div className="bg-gray-50 p-3 rounded-md">
                              <p className="font-medium mb-1">Exemplos:</p>
                              <ul className="list-disc pl-4 space-y-1">
                                <li>"Como posso te ajudar hoje?"</li>
                                <li>"Certo, conte-me mais..."</li>
                                <li>"Então, me conte..."</li>
                              </ul>
                            </div>
                          </div>

                          <div className="mb-4">
                            <h4 className="font-semibold mb-2">2. Não interromper (O Primeiro Minuto):</h4>
                            <p>
                              Dê ao usuário a oportunidade de expor os pontos que ele considera importantes sem interrupções. 
                              Se precisar usar o computador, avise que continua prestando atenção (EPSTEIN et al, 2008; CARRIO, 2012).
                            </p>
                          </div>

                          <div className="mb-4">
                            <h4 className="font-semibold mb-2">3. Ecoar:</h4>
                            <p className="mb-2">Repita as últimas palavras ditas pela pessoa para reforçar que você está ouvindo e incentivá-la a continuar.</p>
                            <div className="bg-gray-50 p-3 rounded-md">
                              <p className="font-medium mb-1">Exemplo:</p>
                              <p><strong>Usuário:</strong> "Enfermeira, minha dor nas costas iniciou quando eu caí da escada.."</p>
                              <p><strong>Enfermeiro(a):</strong> "Humm.. caiu da escada?"</p>
                            </div>
                          </div>

                          <div className="mb-4">
                            <h4 className="font-semibold mb-2">4. Parafrasear:</h4>
                            <p className="mb-2">Reproduza a mensagem com suas próprias palavras para verificar o entendimento e dar a chance de correção.</p>
                            <div className="bg-gray-50 p-3 rounded-md">
                              <p className="font-medium mb-1">Exemplo:</p>
                              <p>"Deixa eu ver se entendi... você está sentindo X por causa de Y. Isso está correto?" (MCCABE; TIMMINS, 2013; SIBIYA, 2018).</p>
                            </div>
                          </div>

                          <div className="mb-4">
                            <h4 className="font-semibold mb-2">5. Silêncio:</h4>
                            <p>
                              Ofereça pausas para que o usuário organize os pensamentos. O silêncio permite observar 
                              e responder de forma mais apropriada (SILVA, 2015; SIBIYA, 2018).
                            </p>
                          </div>

                          <div className="mb-4">
                            <h4 className="font-semibold mb-2">6. Clarificar:</h4>
                            <p className="mb-2">Peça esclarecimentos sobre termos ou eventos para entender o real significado do que foi dito.</p>
                            <div className="bg-gray-50 p-3 rounded-md">
                              <p className="font-medium mb-1">Exemplos:</p>
                              <ul className="list-disc pl-4 space-y-1">
                                <li>"O que a senhora quer dizer com..."</li>
                                <li>"O senhor quer dizer que é como se fosse..."</li>
                              </ul>
                            </div>
                          </div>

                          <div className="mb-4">
                            <h4 className="font-semibold mb-2">7. Resumir:</h4>
                            <p className="mb-2">Ao final de um tópico, organize e confirme o que foi dito para estruturar a consulta e evitar mal-entendidos.</p>
                            <div className="bg-gray-50 p-3 rounded-md">
                              <p className="font-medium mb-1">Exemplo:</p>
                              <p>"Então, posso confirmar se entendi corretamente? Você disse que..."</p>
                            </div>
                          </div>
                        </section>

                        <section>
                          <h3 className="text-lg font-semibold text-csae-green-800 mb-3">Explorando os Problemas com Detalhes</h3>
                          
                          <div className="mb-4">
                            <h4 className="font-semibold mb-2">1. Atenção à Linguagem Não Verbal:</h4>
                            <p>
                              Preste atenção ao tom de voz, gestos e postura. Verifique disparidades entre o que é dito 
                              e o que você observa (SILVERMAN; KURTZ; DRAPER, 2013).
                            </p>
                          </div>

                          <div className="mb-4">
                            <h4 className="font-semibold mb-2">2. Perguntas Abertas (Aprofundamento):</h4>
                            <p className="mb-2">Use-as para investigar as implicações do problema na vida da pessoa.</p>
                            <div className="bg-gray-50 p-3 rounded-md">
                              <p className="font-medium mb-1">Exemplos:</p>
                              <ul className="list-disc pl-4 space-y-1">
                                <li>"O que mais o preocupa nas dores de cabeça?"</li>
                                <li>"Como isso tem afetado o seu dia a dia?"</li>
                              </ul>
                            </div>
                          </div>

                          <div className="mb-4">
                            <h4 className="font-semibold mb-2">3. "Conte-me mais":</h4>
                            <p className="mb-2">Um convite direto para que o usuário aprofunde um tópico importante (GUSTIN; STOWERS; VON GUNTEN, 2015).</p>
                            <div className="bg-gray-50 p-3 rounded-md">
                              <p className="font-medium mb-1">Exemplo:</p>
                              <p>"Conte-me mais sobre como você está se sentindo em relação à diabetes."</p>
                            </div>
                          </div>

                          <div className="mb-4">
                            <h4 className="font-semibold mb-2">4. Reforço Positivo:</h4>
                            <p className="mb-2">Elogie comportamentos saudáveis para incentivar sua manutenção (SILVA, 2015).</p>
                            <div className="bg-gray-50 p-3 rounded-md">
                              <p className="font-medium mb-1">Exemplo:</p>
                              <p>"Parabéns! Que bom que está conseguindo fazer as caminhadas diárias!"</p>
                            </div>
                          </div>

                          <div className="mb-4">
                            <h4 className="font-semibold mb-2">5. Evite Falsas Garantias:</h4>
                            <p>
                              Não use expressões como "Isso passa" ou "Logo melhora", pois podem minimizar 
                              o sentimento do usuário (RAPHAEL-GRIMM, 2015).
                            </p>
                          </div>

                          <div className="mb-4">
                            <h4 className="font-semibold mb-2">6. Administre o Constrangimento:</h4>
                            <p className="mb-2">Formule perguntas de forma neutra.</p>
                            <div className="bg-gray-50 p-3 rounded-md">
                              <p className="font-medium mb-1">Exemplo:</p>
                              <p>Em vez de "Você não fuma mais de 20 cigarros, não é?", pergunte "Quantos cigarros você costuma fumar por dia?" (ALI, 2017).</p>
                            </div>
                          </div>
                        </section>
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>
              <p className="text-sm text-gray-600">
                Registre aqui as informações coletadas através da entrevista com o paciente (dados subjetivos).
              </p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <Textarea
                value={processo.avaliacao?.coletaDeDadosSubjetivos || ''}
                onChange={(e) => handleColetaDadosChange(e.target.value)}
                placeholder="Descreva aqui os dados subjetivos coletados durante a entrevista com o paciente..."
                className="flex-1 resize-none min-h-[300px]"
              />
              <p className="text-xs text-gray-500 mt-2">
                Dica: Use o "Guia de Comunicação" para aplicar técnicas eficazes de entrevista clínica.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exame-fisico" className="flex-1 mt-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Exame Físico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <p className="text-gray-600">
                  A interface para registro dos dados objetivos (Sinais Vitais, Revisão de Sistemas, etc.) será implementada aqui.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EtapaAvaliacao;
