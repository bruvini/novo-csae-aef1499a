import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAutenticacao } from '@/services/autenticacao';
import { buscarTermosCipe } from '@/services/bancodados/cipeDB';
import { CasoClinico } from '@/services/bancodados/tipos';
import CursoSidebar, { CursoSidebarProps } from '@/components/minicurso-cipe/CursoSidebar';
import ModuloIntroducao from '@/components/minicurso-cipe/ModuloIntroducao';
import ModuloEixo from '@/components/minicurso-cipe/ModuloEixo';
import ModuloElaboracao from '@/components/minicurso-cipe/ModuloElaboracao';
import ModuloExercicios from '@/components/minicurso-cipe/ModuloExercicios';
// Importe adequadamente o componente Header
import Header from '@/components/Header';

const MinicursoCipe: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { obterSessao } = useAutenticacao();
  const [modulosCompletados, setModulosCompletados] = useState<string[]>([]);
  const [moduloAtivo, setModuloAtivo] = useState('introducao');
  const [termosCipe, setTermosCipe] = useState<{ [key: string]: any[] }>({});
  const [casosClinicos, setCasosClinicos] = useState<CasoClinico[]>([]);

  useEffect(() => {
    const sessao = obterSessao();
    if (!sessao || sessao.statusAcesso !== "Aprovado") {
      toast({
        title: "Acesso restrito",
        description: "É necessário fazer login para acessar esta página.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [obterSessao, navigate, toast]);

  useEffect(() => {
    const carregarTermosCipe = async () => {
      const termos = await buscarTermosCipe();
      setTermosCipe(termos);
    };

    carregarTermosCipe();
  }, []);

  const marcarModuloComoCompletado = (moduloId: string) => {
    setModulosCompletados(prev => {
      if (prev.includes(moduloId)) {
        return prev;
      }
      return [...prev, moduloId];
    });
  };

  const sessao = obterSessao();

  return (
    <div className="flex flex-col min-h-screen bg-csae-light">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8 flex">
        <CursoSidebar
          modulos={[
            { id: 'introducao', nome: 'Introdução' },
            { id: 'foco', nome: 'Eixo Foco' },
            { id: 'julgamento', nome: 'Eixo Julgamento' },
            { id: 'meios', nome: 'Eixo Meios' },
            { id: 'acao', nome: 'Eixo Ação' },
            { id: 'tempo', nome: 'Eixo Tempo' },
            { id: 'localizacao', nome: 'Eixo Localização' },
            { id: 'cliente', nome: 'Eixo Cliente' },
            { id: 'elaboracao', nome: 'Elaboração do Diagnóstico' },
            { id: 'exercicios', nome: 'Exercícios' },
          ]}
          moduloAtivo={moduloAtivo}
          setModuloAtivo={setModuloAtivo}
        />

        <div className="w-3/4 pl-8">
          {moduloAtivo === 'introducao' && (
            <ModuloIntroducao 
              completado={modulosCompletados.includes('introducao')}
              onComplete={() => marcarModuloComoCompletado('introducao')}
            />
          )}

          {moduloAtivo === 'foco' && (
            <ModuloEixo
              tipo="Foco"
              termos={termosCipe.eixoFoco || []}
            />
          )}

          {moduloAtivo === 'julgamento' && (
            <ModuloEixo
              tipo="Julgamento"
              termos={termosCipe.eixoJulgamento || []}
            />
          )}

          {moduloAtivo === 'meios' && (
            <ModuloEixo
              tipo="Meios"
              termos={termosCipe.eixoMeios || []}
            />
          )}

          {moduloAtivo === 'acao' && (
            <ModuloEixo
              tipo="Ação"
              termos={termosCipe.eixoAcao || []}
            />
          )}

          {moduloAtivo === 'tempo' && (
            <ModuloEixo
              tipo="Tempo"
              termos={termosCipe.eixoTempo || []}
            />
          )}

          {moduloAtivo === 'localizacao' && (
            <ModuloEixo
              tipo="Localização"
              termos={termosCipe.eixoLocalizacao || []}
            />
          )}

          {moduloAtivo === 'cliente' && (
            <ModuloEixo
              tipo="Cliente"
              termos={termosCipe.eixoCliente || []}
            />
          )}

          {moduloAtivo === 'elaboracao' && (
            <ModuloElaboracao
              id="elaboracao"
              tipo="diagnostico"
              completado={modulosCompletados.includes('elaboracao')}
              onComplete={() => marcarModuloComoCompletado('elaboracao')}
            />
          )}

          {moduloAtivo === 'exercicios' && (
            <ModuloExercicios
              casos={casosClinicos}
              termosFoco={termosCipe.eixoFoco || []}
              termosJulgamento={termosCipe.eixoJulgamento || []}
              termosMeios={termosCipe.eixoMeios || []}
              termosAcao={termosCipe.eixoAcao || []}
              termosTempo={termosCipe.eixoTempo || []}
              termosLocalizacao={termosCipe.eixoLocalizacao || []}
              termosCliente={termosCipe.eixoCliente || []}
              completado={modulosCompletados.includes('exercicios')}
              onComplete={() => marcarModuloComoCompletado('exercicios')}
              userId={sessao ? sessao.uid : ''}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default MinicursoCipe;
