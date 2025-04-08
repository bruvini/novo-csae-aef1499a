import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X, AlertCircle } from 'lucide-react';
import { CasoClinico } from '@/types/cipe';
import { useToast } from '@/hooks/use-toast';

const registrarVencedor = async (casoId: string, userId: string, variant = "success") => {
  try {
    console.log(`Registered winner ${userId} for case ${casoId}`);
    return true;
  } catch (error) {
    console.error("Error registering winner:", error);
    return false;
  }
};

interface ExercicioCasoClinicoProps {
  caso: CasoClinico;
  termosFoco: string[];
  termosJulgamento: string[];
  termosMeios: string[];
  termosAcao: string[];
  termosLocalizacao: string[];
  termosCliente: string[];
  termosTempo: string[];
  nomeUsuario: string;
  onCasoCompleto: () => void;
}

const ExercicioCasoClinico: React.FC<ExercicioCasoClinicoProps> = ({
  caso,
  termosFoco,
  termosJulgamento,
  termosMeios,
  termosAcao,
  termosLocalizacao,
  termosCliente,
  termosTempo,
  nomeUsuario,
  onCasoCompleto
}) => {
  const { toast } = useToast();
  const [respostas, setRespostas] = useState({
    foco: '',
    julgamento: '',
    meios: '',
    acao: '',
    localizacao: '',
    cliente: '',
    tempo: ''
  });
  
  const [resultados, setResultados] = useState<Record<string, boolean | null>>({
    foco: null,
    julgamento: null,
    meios: null,
    acao: null,
    localizacao: null,
    cliente: null,
    tempo: null
  });
  
  const [verificado, setVerificado] = useState(false);
  const [completo, setCompleto] = useState(false);
  const [jaVencedor, setJaVencedor] = useState(false);
  
  useEffect(() => {
    if (caso.arrayVencedor && caso.arrayVencedor.includes(nomeUsuario)) {
      setJaVencedor(true);
    }
  }, [caso, nomeUsuario]);

  const handleInputChange = (eixo: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setRespostas(prev => ({
      ...prev,
      [eixo]: e.target.value
    }));
    
    if (verificado) {
      setResultados(prev => ({
        ...prev,
        [eixo]: null
      }));
      setVerificado(false);
      setCompleto(false);
    }
  };

  const verificarRespostas = () => {
    const novosResultados: Record<string, boolean> = {
      foco: caso.focoEsperado === null || respostas.foco.toLowerCase() === caso.focoEsperado?.toLowerCase(),
      julgamento: caso.julgamentoEsperado === null || respostas.julgamento.toLowerCase() === caso.julgamentoEsperado?.toLowerCase(),
      meios: caso.meioEsperado === null || respostas.meios.toLowerCase() === caso.meioEsperado?.toLowerCase(),
      acao: caso.acaoEsperado === null || respostas.acao.toLowerCase() === caso.acaoEsperado?.toLowerCase(),
      localizacao: caso.localizacaoEsperado === null || respostas.localizacao.toLowerCase() === caso.localizacaoEsperado?.toLowerCase(),
      cliente: caso.clienteEsperado === null || respostas.cliente.toLowerCase() === caso.clienteEsperado?.toLowerCase(),
      tempo: caso.tempoEsperado === null || respostas.tempo.toLowerCase() === caso.tempoEsperado?.toLowerCase()
    };
    
    setResultados(novosResultados);
    setVerificado(true);
    
    const todasCorretas = Object.values(novosResultados).every(Boolean);
    setCompleto(todasCorretas);
    
    if (todasCorretas) {
      toast({
        title: "Parabéns!",
        description: "Você acertou todas as respostas!",
        variant: "success"
      });
      
      if (caso.id && !jaVencedor) {
        registrarVencedor(caso.id, nomeUsuario)
          .then(() => {
            setJaVencedor(true);
            onCasoCompleto();
          })
          .catch(error => {
            console.error("Erro ao registrar vencedor:", error);
            toast({
              title: "Erro",
              description: "Não foi possível registrar sua conclusão.",
              variant: "destructive"
            });
          });
      }
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Caso Clínico ({caso.tipoCaso})
          {jaVencedor && (
            <span className="text-sm bg-csae-green-100 text-csae-green-700 py-1 px-2 rounded-md">
              ✓ Concluído
            </span>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="bg-csae-green-50 p-4 rounded-md">
          <p className="text-gray-800">{caso.casoClinico}</p>
        </div>
        
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-csae-green-700">Preencha os eixos com os termos corretos:</h4>
          
          {caso.focoEsperado !== null && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Eixo Foco:</label>
              <div className="flex items-center gap-2">
                <Input 
                  value={respostas.foco}
                  onChange={handleInputChange('foco')}
                  placeholder="Digite o termo do eixo Foco"
                  className={verificado ? (resultados.foco ? "border-green-500" : "border-red-500") : ""}
                  list="termosFoco"
                />
                {verificado && (
                  resultados.foco ? 
                  <Check className="h-5 w-5 text-green-500" /> : 
                  <X className="h-5 w-5 text-red-500" />
                )}
              </div>
              <datalist id="termosFoco">
                {termosFoco.map((termo, index) => (
                  <option key={index} value={termo} />
                ))}
              </datalist>
            </div>
          )}
          
          {caso.julgamentoEsperado !== null && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Eixo Julgamento:</label>
              <div className="flex items-center gap-2">
                <Input 
                  value={respostas.julgamento}
                  onChange={handleInputChange('julgamento')}
                  placeholder="Digite o termo do eixo Julgamento"
                  className={verificado ? (resultados.julgamento ? "border-green-500" : "border-red-500") : ""}
                  list="termosJulgamento"
                />
                {verificado && (
                  resultados.julgamento ? 
                  <Check className="h-5 w-5 text-green-500" /> : 
                  <X className="h-5 w-5 text-red-500" />
                )}
              </div>
              <datalist id="termosJulgamento">
                {termosJulgamento.map((termo, index) => (
                  <option key={index} value={termo} />
                ))}
              </datalist>
            </div>
          )}
          
          {caso.meioEsperado !== null && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Eixo Meios:</label>
              <div className="flex items-center gap-2">
                <Input 
                  value={respostas.meios}
                  onChange={handleInputChange('meios')}
                  placeholder="Digite o termo do eixo Meios"
                  className={verificado ? (resultados.meios ? "border-green-500" : "border-red-500") : ""}
                  list="termosMeios"
                />
                {verificado && (
                  resultados.meios ? 
                  <Check className="h-5 w-5 text-green-500" /> : 
                  <X className="h-5 w-5 text-red-500" />
                )}
              </div>
              <datalist id="termosMeios">
                {termosMeios.map((termo, index) => (
                  <option key={index} value={termo} />
                ))}
              </datalist>
            </div>
          )}
          
          {caso.acaoEsperado !== null && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Eixo Ação:</label>
              <div className="flex items-center gap-2">
                <Input 
                  value={respostas.acao}
                  onChange={handleInputChange('acao')}
                  placeholder="Digite o termo do eixo Ação"
                  className={verificado ? (resultados.acao ? "border-green-500" : "border-red-500") : ""}
                  list="termosAcao"
                />
                {verificado && (
                  resultados.acao ? 
                  <Check className="h-5 w-5 text-green-500" /> : 
                  <X className="h-5 w-5 text-red-500" />
                )}
              </div>
              <datalist id="termosAcao">
                {termosAcao.map((termo, index) => (
                  <option key={index} value={termo} />
                ))}
              </datalist>
            </div>
          )}
          
          {caso.localizacaoEsperado !== null && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Eixo Localização:</label>
              <div className="flex items-center gap-2">
                <Input 
                  value={respostas.localizacao}
                  onChange={handleInputChange('localizacao')}
                  placeholder="Digite o termo do eixo Localização"
                  className={verificado ? (resultados.localizacao ? "border-green-500" : "border-red-500") : ""}
                  list="termosLocalizacao"
                />
                {verificado && (
                  resultados.localizacao ? 
                  <Check className="h-5 w-5 text-green-500" /> : 
                  <X className="h-5 w-5 text-red-500" />
                )}
              </div>
              <datalist id="termosLocalizacao">
                {termosLocalizacao.map((termo, index) => (
                  <option key={index} value={termo} />
                ))}
              </datalist>
            </div>
          )}
          
          {caso.clienteEsperado !== null && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Eixo Cliente:</label>
              <div className="flex items-center gap-2">
                <Input 
                  value={respostas.cliente}
                  onChange={handleInputChange('cliente')}
                  placeholder="Digite o termo do eixo Cliente"
                  className={verificado ? (resultados.cliente ? "border-green-500" : "border-red-500") : ""}
                  list="termosCliente"
                />
                {verificado && (
                  resultados.cliente ? 
                  <Check className="h-5 w-5 text-green-500" /> : 
                  <X className="h-5 w-5 text-red-500" />
                )}
              </div>
              <datalist id="termosCliente">
                {termosCliente.map((termo, index) => (
                  <option key={index} value={termo} />
                ))}
              </datalist>
            </div>
          )}
          
          {caso.tempoEsperado !== null && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Eixo Tempo:</label>
              <div className="flex items-center gap-2">
                <Input 
                  value={respostas.tempo}
                  onChange={handleInputChange('tempo')}
                  placeholder="Digite o termo do eixo Tempo"
                  className={verificado ? (resultados.tempo ? "border-green-500" : "border-red-500") : ""}
                  list="termosTempo"
                />
                {verificado && (
                  resultados.tempo ? 
                  <Check className="h-5 w-5 text-green-500" /> : 
                  <X className="h-5 w-5 text-red-500" />
                )}
              </div>
              <datalist id="termosTempo">
                {termosTempo.map((termo, index) => (
                  <option key={index} value={termo} />
                ))}
              </datalist>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm mt-4">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span className="text-gray-600">Dica: Digite exatamente como consta na lista de termos. Você pode clicar nas caixas e selecionar das listas disponíveis.</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div>
          {verificado && !completo && (
            <span className="text-red-600 text-sm">
              Algumas respostas estão incorretas. Tente novamente!
            </span>
          )}
          {completo && (
            <span className="text-csae-green-700 text-sm font-medium flex items-center gap-1">
              <Check className="h-4 w-4" /> Correto! Parabéns!
            </span>
          )}
        </div>
        <Button 
          onClick={verificarRespostas} 
          className={completo ? "bg-csae-green-700" : "bg-csae-green-600 hover:bg-csae-green-700"}
          disabled={completo}
        >
          Verificar Respostas
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ExercicioCasoClinico;
