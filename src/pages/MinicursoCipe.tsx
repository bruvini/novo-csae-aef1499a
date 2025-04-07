
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import NavigationMenu from '@/components/NavigationMenu';
import SimpleFooter from '@/components/SimpleFooter';
import CursoSidebar from '@/components/minicurso-cipe/CursoSidebar';
import ModuloIntroducao from '@/components/minicurso-cipe/ModuloIntroducao';
import ModuloEixo from '@/components/minicurso-cipe/ModuloEixo';
import ModuloElaboracao from '@/components/minicurso-cipe/ModuloElaboracao';
import ModuloExercicios from '@/components/minicurso-cipe/ModuloExercicios';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CircleCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAutenticacao } from '@/services/autenticacao';
import { 
  buscarTermosCipe, 
  buscarCasosClinicos, 
  buscarProgressoCursoCipe, 
  atualizarProgressoCursoCipe 
} from '@/services/bancodados/cipeDB';
import { ProgressoCursoCipe, CasoClinico } from '@/types/cipe';

const MinicursoCipe: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { verificarLogado, obterSessao } = useAutenticacao();
  const [activeTab, setActiveTab] = useState("introducao");
  const [progresso, setProgresso] = useState<ProgressoCursoCipe | null>(null);
  const [termosCipe, setTermosCipe] = useState<any>(null);
  const [casos, setCasos] = useState<CasoClinico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [nomeUsuario, setNomeUsuario] = useState<string>("");
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    const sessao = obterSessao();
    if (sessao) {
      setNomeUsuario(sessao.nomeUsuario);
      setUserId(sessao.id);
    }
  }, [obterSessao]);

  // Carregar dados
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setCarregando(true);
        
        // Buscar termos CIPE
        const termos = await buscarTermosCipe();
        setTermosCipe(termos);
        
        // Buscar casos clínicos
        const casosClinicos = await buscarCasosClinicos();
        setCasos(casosClinicos);
        
        // Buscar progresso do usuário se estiver logado
        if (verificarLogado()) {
          const sessao = obterSessao();
          if (sessao && sessao.id) {
            const progressoUsuario = await buscarProgressoCursoCipe(sessao.id);
            setProgresso(progressoUsuario);
          }
        } else {
          // Definir progresso inicial para usuários não logados
          setProgresso({
            moduloIntroducao: false,
            moduloEixos: {
              foco: false,
              julgamento: false,
              meios: false,
              acao: false,
              tempo: false,
              localizacao: false,
              cliente: false,
              concluido: false
            },
            moduloElaboracao: {
              diagnosticos: false,
              acoes: false,
              resultados: false,
              concluido: false
            },
            moduloExercicios: false,
            statusCurso: false
          });
        }
      } catch (erro) {
        console.error("Erro ao carregar dados:", erro);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar o conteúdo do minicurso.",
          variant: "destructive"
        });
      } finally {
        setCarregando(false);
      }
    };
    
    carregarDados();
  }, [verificarLogado, obterSessao, toast]);

  // Manipuladores de progresso
  const atualizarProgresso = async (atualizacao: Partial<ProgressoCursoCipe>) => {
    // Atualizar localmente primeiro
    setProgresso(prev => {
      if (!prev) return null;
      return {
        ...prev,
        ...atualizacao
      };
    });
    
    // Se o usuário estiver logado, atualizar no Firestore
    if (verificarLogado() && userId) {
      try {
        const progressoAtualizado = await atualizarProgressoCursoCipe(userId, atualizacao);
        setProgresso(progressoAtualizado);
        
        // Verificar se o curso foi concluído
        if (progressoAtualizado.statusCurso && !progresso?.statusCurso) {
          toast({
            title: "Parabéns!",
            description: "Você concluiu o Minicurso CIPE com sucesso!",
            variant: "success"
          });
        }
      } catch (erro) {
        console.error("Erro ao salvar progresso:", erro);
        toast({
          title: "Erro ao salvar progresso",
          description: "Não foi possível salvar seu progresso.",
          variant: "destructive"
        });
      }
    }
  };

  // Manipuladores de conclusão para cada módulo
  const concluirIntroducao = () => {
    atualizarProgresso({ moduloIntroducao: true });
  };
  
  const concluirEixoFoco = () => {
    atualizarProgresso({ 
      moduloEixos: { 
        ...progresso?.moduloEixos, 
        foco: true 
      }
    });
  };
  
  const concluirEixoJulgamento = () => {
    atualizarProgresso({ 
      moduloEixos: { 
        ...progresso?.moduloEixos, 
        julgamento: true 
      }
    });
  };
  
  const concluirEixoMeios = () => {
    atualizarProgresso({ 
      moduloEixos: { 
        ...progresso?.moduloEixos, 
        meios: true 
      }
    });
  };
  
  const concluirEixoAcao = () => {
    atualizarProgresso({ 
      moduloEixos: { 
        ...progresso?.moduloEixos, 
        acao: true 
      }
    });
  };
  
  const concluirEixoTempo = () => {
    atualizarProgresso({ 
      moduloEixos: { 
        ...progresso?.moduloEixos, 
        tempo: true 
      }
    });
  };
  
  const concluirEixoLocalizacao = () => {
    atualizarProgresso({ 
      moduloEixos: { 
        ...progresso?.moduloEixos, 
        localizacao: true 
      }
    });
  };
  
  const concluirEixoCliente = () => {
    atualizarProgresso({ 
      moduloEixos: { 
        ...progresso?.moduloEixos, 
        cliente: true 
      }
    });
  };
  
  const concluirDiagnosticos = () => {
    atualizarProgresso({ 
      moduloElaboracao: { 
        ...progresso?.moduloElaboracao, 
        diagnosticos: true 
      }
    });
  };
  
  const concluirAcoes = () => {
    atualizarProgresso({ 
      moduloElaboracao: { 
        ...progresso?.moduloElaboracao, 
        acoes: true 
      }
    });
  };
  
  const concluirResultados = () => {
    atualizarProgresso({ 
      moduloElaboracao: { 
        ...progresso?.moduloElaboracao, 
        resultados: true 
      }
    });
  };
  
  const concluirExercicios = () => {
    atualizarProgresso({ moduloExercicios: true });
  };

  // Extrair termos para os datalists do exercício
  const extrairTermos = (arrayNome: string): string[] => {
    if (!termosCipe || !termosCipe[arrayNome]) return [];
    return termosCipe[arrayNome].map((item: any) => item.termo);
  };

  // Dados de exemplo para os eixos
  const dadosEixos = [
    {
      id: "eixos-foco",
      titulo: "Eixo Foco",
      descricao: "O eixo Foco contém termos que representam a área de atenção relevante para a enfermagem (um sintoma, um estado, um processo, uma entidade). É o principal elemento das afirmativas diagnósticas, intervencionistas e de resultados.",
      exemplos: ["Dor", "Febre", "Ansiedade", "Integridade da pele", "Amamentação", "Higiene", "Eliminação urinária"]
    },
    {
      id: "eixos-julgamento",
      titulo: "Eixo Julgamento",
      descricao: "O eixo Julgamento contém termos que representam a opinião clínica, determinação ou estimativa relacionada ao foco da prática de enfermagem. Qualifica ou modifica o foco.",
      exemplos: ["Diminuído", "Aumentado", "Comprometido", "Eficaz", "Ineficaz", "Melhorado", "Prejudicado"]
    },
    {
      id: "eixos-meios",
      titulo: "Eixo Meios",
      descricao: "O eixo Meios contém termos que representam um método, processo, técnica ou procedimento utilizado para executar uma intervenção.",
      exemplos: ["Bandagem", "Técnica de respiração", "Terapia", "Medicação", "Monitoramento", "Cateter"]
    },
    {
      id: "eixos-acao",
      titulo: "Eixo Ação",
      descricao: "O eixo Ação contém termos que representam um processo intencional aplicado, utilizado com um cliente. É o principal elemento para as afirmativas intervencionistas.",
      exemplos: ["Administrar", "Avaliar", "Monitorar", "Assistir", "Ensinar", "Prevenir", "Estimular"]
    },
    {
      id: "eixos-tempo",
      titulo: "Eixo Tempo",
      descricao: "O eixo Tempo contém termos que representam a duração, instante, intervalo ou momento em que ocorre um evento.",
      exemplos: ["Durante", "Agudo", "Crônico", "Contínuo", "Intermitente", "Noite", "Pré-operatório"]
    },
    {
      id: "eixos-localizacao",
      titulo: "Eixo Localização",
      descricao: "O eixo Localização contém termos que representam a orientação anatômica ou espacial de um diagnóstico ou intervenção.",
      exemplos: ["Abdômen", "Braço", "Costas", "Tórax", "Orelha", "Superior", "Posterior"]
    },
    {
      id: "eixos-cliente",
      titulo: "Eixo Cliente",
      descricao: "O eixo Cliente contém termos que representam o sujeito que recebe a intervenção de enfermagem ou a quem o diagnóstico se refere.",
      exemplos: ["Indivíduo", "Família", "Comunidade", "Recém-nascido", "Idoso", "Gestante", "Cuidador"]
    }
  ];

  if (carregando) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <NavigationMenu activeItem="minicurso-cipe" />
        <main className="flex-grow p-6">
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600">Carregando conteúdo do minicurso...</p>
          </div>
        </main>
        <SimpleFooter />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <NavigationMenu activeItem="minicurso-cipe" />
      
      <main className="flex-grow flex flex-col md:flex-row">
        {/* Sidebar */}
        <CursoSidebar ativo={activeTab} progresso={progresso} />
        
        {/* Conteúdo Principal */}
        <div className="flex-grow p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold text-csae-green-700 mb-2">Minicurso CIPE</h1>
            <p className="text-gray-600 mb-6">
              Este minicurso é essencial para compreender os fundamentos da CIPE e do Processo de Enfermagem. 
              Após a conclusão, você estará apto para utilizar os recursos da plataforma. 
              Você poderá revisar o conteúdo sempre que desejar.
            </p>
            
            {/* Visão geral do progresso */}
            {progresso && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Seu progresso</CardTitle>
                  <CardDescription>
                    Acompanhe seu avanço no minicurso.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="flex items-center gap-2">
                        {progresso.moduloIntroducao ? 
                          <CircleCheck className="h-5 w-5 text-csae-green-600" /> : 
                          <span className="h-5 w-5 rounded-full border border-gray-300" />
                        }
                        <span className={progresso.moduloIntroducao ? "text-csae-green-700 font-medium" : ""}>
                          Introdução
                        </span>
                      </p>
                      <p className="flex items-center gap-2">
                        {progresso.moduloEixos.concluido ? 
                          <CircleCheck className="h-5 w-5 text-csae-green-600" /> : 
                          <span className="h-5 w-5 rounded-full border border-gray-300" />
                        }
                        <span className={progresso.moduloEixos.concluido ? "text-csae-green-700 font-medium" : ""}>
                          Eixos de Classificação
                        </span>
                      </p>
                      <p className="flex items-center gap-2">
                        {progresso.moduloElaboracao.concluido ? 
                          <CircleCheck className="h-5 w-5 text-csae-green-600" /> : 
                          <span className="h-5 w-5 rounded-full border border-gray-300" />
                        }
                        <span className={progresso.moduloElaboracao.concluido ? "text-csae-green-700 font-medium" : ""}>
                          Elaboração de Afirmativas
                        </span>
                      </p>
                      <p className="flex items-center gap-2">
                        {progresso.moduloExercicios ? 
                          <CircleCheck className="h-5 w-5 text-csae-green-600" /> : 
                          <span className="h-5 w-5 rounded-full border border-gray-300" />
                        }
                        <span className={progresso.moduloExercicios ? "text-csae-green-700 font-medium" : ""}>
                          Exercícios de Fixação
                        </span>
                      </p>
                    </div>
                    
                    <div className="bg-csae-green-50 p-4 rounded-md flex flex-col justify-between">
                      <div>
                        <h4 className="font-medium mb-2">Status do curso:</h4>
                        <p className={progresso.statusCurso ? "text-csae-green-700 font-medium" : "text-amber-600"}>
                          {progresso.statusCurso ? "Curso concluído" : "Em andamento"}
                        </p>
                      </div>
                      
                      {progresso.statusCurso && (
                        <Button 
                          className="mt-3 bg-csae-green-600 hover:bg-csae-green-700"
                          onClick={() => navigate("/processo-enfermagem")}
                        >
                          Ir para Processo de Enfermagem
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Conteúdo do curso */}
            <ScrollArea className="h-full">
              {/* Módulo de Introdução */}
              <ModuloIntroducao 
                completado={progresso?.moduloIntroducao || false} 
                onComplete={concluirIntroducao} 
              />
              
              {/* Módulo de Eixos */}
              <div id="eixos" className="space-y-6 pb-8 mt-12 pt-4">
                <h2 className="text-2xl font-bold text-csae-green-700">Eixos de Classificação (CIPE 1.0)</h2>
                <p className="text-gray-700">
                  A CIPE 1.0 é estruturada em sete eixos que permitem a composição de diagnósticos, intervenções e 
                  resultados de enfermagem. Cada eixo representa uma perspectiva específica do cuidado.
                </p>
                
                {dadosEixos.map((eixo, index) => (
                  <div key={index}>
                    <ModuloEixo 
                      id={eixo.id} 
                      titulo={eixo.titulo}
                      descricao={eixo.descricao}
                      exemplos={eixo.exemplos}
                      completado={
                        eixo.id === "eixos-foco" ? (progresso?.moduloEixos.foco || false) :
                        eixo.id === "eixos-julgamento" ? (progresso?.moduloEixos.julgamento || false) :
                        eixo.id === "eixos-meios" ? (progresso?.moduloEixos.meios || false) :
                        eixo.id === "eixos-acao" ? (progresso?.moduloEixos.acao || false) :
                        eixo.id === "eixos-tempo" ? (progresso?.moduloEixos.tempo || false) :
                        eixo.id === "eixos-localizacao" ? (progresso?.moduloEixos.localizacao || false) :
                        (progresso?.moduloEixos.cliente || false)
                      }
                      onComplete={
                        eixo.id === "eixos-foco" ? concluirEixoFoco :
                        eixo.id === "eixos-julgamento" ? concluirEixoJulgamento :
                        eixo.id === "eixos-meios" ? concluirEixoMeios :
                        eixo.id === "eixos-acao" ? concluirEixoAcao :
                        eixo.id === "eixos-tempo" ? concluirEixoTempo :
                        eixo.id === "eixos-localizacao" ? concluirEixoLocalizacao :
                        concluirEixoCliente
                      }
                    />
                  </div>
                ))}
              </div>
              
              {/* Módulo de Elaboração de Afirmativas */}
              <div id="elaboracao" className="space-y-6 pb-8 mt-12 pt-4">
                <h2 className="text-2xl font-bold text-csae-green-700">Elaboração de Afirmativas</h2>
                <p className="text-gray-700">
                  A CIPE permite a elaboração de três tipos principais de afirmativas: diagnósticos, ações e resultados.
                  Cada tipo segue uma estrutura específica utilizando os eixos.
                </p>
                
                <ModuloElaboracao 
                  id="elaboracao-diagnosticos" 
                  tipo="diagnosticos"
                  completado={progresso?.moduloElaboracao.diagnosticos || false}
                  onComplete={concluirDiagnosticos}
                />
                
                <ModuloElaboracao 
                  id="elaboracao-acoes" 
                  tipo="acoes"
                  completado={progresso?.moduloElaboracao.acoes || false}
                  onComplete={concluirAcoes}
                />
                
                <ModuloElaboracao 
                  id="elaboracao-resultados" 
                  tipo="resultados"
                  completado={progresso?.moduloElaboracao.resultados || false}
                  onComplete={concluirResultados}
                />
              </div>
              
              {/* Módulo de Exercícios */}
              <ModuloExercicios 
                casos={casos}
                termosFoco={extrairTermos('arrayFoco')}
                termosJulgamento={extrairTermos('arrayJulgamento')}
                termosMeios={extrairTermos('arrayMeios')}
                termosAcao={extrairTermos('arrayAcao')}
                termosLocalizacao={extrairTermos('arrayLocalizacao')}
                termosCliente={extrairTermos('arrayCliente')}
                termosTempo={extrairTermos('arrayTempo')}
                nomeUsuario={nomeUsuario}
                completado={progresso?.moduloExercicios || false}
                onComplete={concluirExercicios}
              />
            </ScrollArea>
          </div>
        </div>
      </main>
      
      <SimpleFooter />
    </div>
  );
};

export default MinicursoCipe;
