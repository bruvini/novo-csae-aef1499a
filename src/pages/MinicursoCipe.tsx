import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import { ChevronRight, Lightbulb } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardFooter,
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import SimpleFooter from '@/components/SimpleFooter';
import CursoSidebar from '@/components/minicurso-cipe/CursoSidebar';
import ModuloIntroducao from '@/components/minicurso-cipe/ModuloIntroducao';
import ModuloEixo from '@/components/minicurso-cipe/ModuloEixo';
import ModuloElaboracao from '@/components/minicurso-cipe/ModuloElaboracao';
import ModuloExercicios from '@/components/minicurso-cipe/ModuloExercicios';
import { buscarTermosCipe } from '@/services/bancodados/cipeDB';
import { useAutenticacao } from '@/services/autenticacao';
import { useToast } from '@/hooks/use-toast';

const MinicursoCipe = () => {
  const { usuario, verificarAutenticacao, obterSessao } = useAutenticacao();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [moduloAtivo, setModuloAtivo] = useState('introducao');
  const [progresso, setProgresso] = useState(0);
  const [dataUltimoAcesso, setDataUltimoAcesso] = useState<Date | null>(null);
  const [termosCipe, setTermosCipe] = useState({
    arrayFoco: [],
    arrayJulgamento: [],
    arrayMeios: [],
    arrayAcao: [],
    arrayTempo: [],
    arrayLocalizacao: [],
    arrayCliente: []
  });

  useEffect(() => {
    const verificarLogado = async () => {
      const autenticado = await verificarAutenticacao();
      if (!autenticado) {
        toast({
          title: "Acesso restrito",
          description: "Faça login para acessar o minicurso completo.",
          variant: "default"
        });
      }
      
      // Se vier de redirecionamento do dashboard, abrir módulo específico
      const params = new URLSearchParams(location.search);
      const modulo = params.get('modulo');
      if (modulo) {
        setModuloAtivo(modulo);
      }
    };
    
    verificarLogado();
  }, []);

  useEffect(() => {
    const carregarTermosCipe = async () => {
      try {
        const termos = await buscarTermosCipe();
        setTermosCipe(termos);
      } catch (error) {
        console.error("Erro ao carregar termos CIPE:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Ocorreu um erro ao carregar os termos CIPE. Tente novamente mais tarde.",
          variant: "destructive"
        });
      }
    };

    carregarTermosCipe();
  }, []);

  useEffect(() => {
    // Simulação de progresso (a ser substituído pela lógica real)
    switch (moduloAtivo) {
      case 'introducao':
        setProgresso(10);
        break;
      case 'eixo-foco':
        setProgresso(30);
        break;
      case 'eixo-julgamento':
        setProgresso(45);
        break;
      case 'eixo-meios':
        setProgresso(60);
        break;
        case 'eixo-acao':
          setProgresso(70);
          break;
        case 'eixo-tempo':
          setProgresso(80);
          break;
        case 'eixo-localizacao':
          setProgresso(90);
          break;
      case 'elaboracao':
        setProgresso(95);
        break;
      case 'exercicios':
        setProgresso(100);
        break;
      default:
        setProgresso(0);
    }
  }, [moduloAtivo]);

  const modulos = [
    { id: 'introducao', nome: 'Introdução' },
    { id: 'eixo-foco', nome: 'Eixo Foco' },
    { id: 'eixo-julgamento', nome: 'Eixo Julgamento' },
    { id: 'eixo-meios', nome: 'Eixo Meios' },
    { id: 'eixo-acao', nome: 'Eixo Ação' },
    { id: 'eixo-tempo', nome: 'Eixo Tempo' },
    { id: 'eixo-localizacao', nome: 'Eixo Localização' },
    { id: 'elaboracao', nome: 'Elaboração do Diagnóstico' },
    { id: 'exercicios', nome: 'Exercícios' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <main className="container mx-auto px-4 py-8 flex-grow">
        <Header />
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold tracking-tight text-csae-green-800">
              Minicurso CIPE
            </h1>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Voltar ao Dashboard
            </Button>
          </div>
          <p className="text-sm text-gray-500">
            Aprenda os fundamentos da Classificação Internacional para a Prática de Enfermagem.
          </p>
          <Progress value={progresso} className="mt-4" />
        </section>

        <div className="grid grid-cols-12 gap-4">
          <aside className="col-span-12 lg:col-span-3">
            <CursoSidebar
              modulos={modulos}
              moduloAtivo={moduloAtivo}
              setModuloAtivo={setModuloAtivo}
            />
          </aside>

          <div className="col-span-12 lg:col-span-9">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">
                  {modulos.find(m => m.id === moduloAtivo)?.nome}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {moduloAtivo === 'introducao' && <ModuloIntroducao />}
                {moduloAtivo === 'eixo-foco' && <ModuloEixo tipo="Foco" termos={termosCipe.arrayFoco} />}
                {moduloAtivo === 'eixo-julgamento' && <ModuloEixo tipo="Julgamento" termos={termosCipe.arrayJulgamento} />}
                {moduloAtivo === 'eixo-meios' && <ModuloEixo tipo="Meios" termos={termosCipe.arrayMeios} />}
                {moduloAtivo === 'eixo-acao' && <ModuloEixo tipo="Ação" termos={termosCipe.arrayAcao} />}
                {moduloAtivo === 'eixo-tempo' && <ModuloEixo tipo="Tempo" termos={termosCipe.arrayTempo} />}
                {moduloAtivo === 'eixo-localizacao' && <ModuloEixo tipo="Localização" termos={termosCipe.arrayLocalizacao} />}
                {moduloAtivo === 'elaboracao' && <ModuloElaboracao />}
                {moduloAtivo === 'exercicios' && <ModuloExercicios />}
              </CardContent>
              <CardFooter className="flex justify-end">
                {moduloAtivo !== 'exercicios' && (
                  <Button
                    onClick={() => {
                      const currentIndex = modulos.findIndex(m => m.id === moduloAtivo);
                      if (currentIndex < modulos.length - 1) {
                        setModuloAtivo(modulos[currentIndex + 1].id);
                      }
                    }}
                  >
                    Próximo <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
      <SimpleFooter />
    </div>
  );
};

export default MinicursoCipe;
