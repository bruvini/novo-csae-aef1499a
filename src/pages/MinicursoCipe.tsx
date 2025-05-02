import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAutenticacao } from '@/services/autenticacao';
import { buscarCasosClinicos, buscarTermosCipe } from '@/services/bancodados/cipeDB';
import { CasoClinico } from '@/types/cipe';
import PageHeader from '@/components/PageHeader';
import ModuloExercicios from '@/components/minicurso-cipe/ModuloExercicios';
import { UserRound } from 'lucide-react';

const MinicursoCipe = () => {
  const { usuario } = useAutenticacao();
  const [casos, setCasos] = useState<CasoClinico[]>([]);
  const [termosFoco, setTermosFoco] = useState<any[]>([]);
  const [termosJulgamento, setTermosJulgamento] = useState<any[]>([]);
  const [termosMeios, setTermosMeios] = useState<any[]>([]);
  const [termosAcao, setTermosAcao] = useState<any[]>([]);
  const [termosTempo, setTermosTempo] = useState<any[]>([]);
  const [termosLocalizacao, setTermosLocalizacao] = useState<any[]>([]);
  const [termosCliente, setTermosCliente] = useState<any[]>([]);
  const [moduloCompletado, setModuloCompletado] = useState<boolean>(false);

  useEffect(() => {
    const carregarDados = async () => {
      if (!usuario) return;

      try {
        const casosData = await buscarCasosClinicos();
        const termosFocoData = await buscarTermosCipe('Foco');
        const termosJulgamentoData = await buscarTermosCipe('Julgamento');
        const termosMeiosData = await buscarTermosCipe('Meio');
        const termosAcaoData = await buscarTermosCipe('Acao');
        const termosTempoData = await buscarTermosCipe('Tempo');
        const termosLocalizacaoData = await buscarTermosCipe('Localizacao');
        const termosClienteData = await buscarTermosCipe('Cliente');

        setCasos(casosData);
        setTermosFoco(termosFocoData);
        setTermosJulgamento(termosJulgamentoData);
        setTermosMeios(termosMeiosData);
        setTermosAcao(termosAcaoData);
        setTermosTempo(termosTempoData);
        setTermosLocalizacao(termosLocalizacaoData);
        setTermosCliente(termosClienteData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };

    carregarDados();
  }, [usuario]);

  const marcarModuloCompleto = () => {
    setModuloCompletado(true);
  };

  return (
    <>
      <Helmet>
        <title>Minicurso CIPE® | CSAE</title>
      </Helmet>

      <div className="container mx-auto my-6 space-y-6">
        <PageHeader
          title="Minicurso CIPE®"
          description="Treine seus conhecimentos sobre a CIPE® com casos clínicos"
          icon={<UserRound className="h-8 w-8 text-csae-green-600" />}
        />

        <ModuloExercicios
          casos={casos}
          termosFoco={termosFoco}
          termosJulgamento={termosJulgamento}
          termosMeios={termosMeios}
          termosAcao={termosAcao}
          termosTempo={termosTempo}
          termosLocalizacao={termosLocalizacao}
          termosCliente={termosCliente}
          completado={moduloCompletado}
          onComplete={marcarModuloCompleto}
          userId={usuario?.uid || ''}
        />
      </div>
    </>
  );
};

export default MinicursoCipe;
