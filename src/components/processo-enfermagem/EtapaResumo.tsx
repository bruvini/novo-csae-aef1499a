import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, CheckCircle } from 'lucide-react';
import { ProcessoEnfermagem, EvolucaoEnfermagem } from '@/types/processoEnfermagem';
import { Paciente } from '@/types/paciente';
import { useToast } from '@/hooks/use-toast';
import { getSinaisVitais } from '@/services/bancodados/sinaisVitaisDB';
import { getExames } from '@/services/bancodados/examesDB';
import { getSistemas } from '@/services/bancodados/revisaoSistemasDB';

interface EtapaResumoProps {
  processo: ProcessoEnfermagem;
  paciente: Paciente;
  onUpdateEvolucao: (evolucao: EvolucaoEnfermagem) => void;
}

const EtapaResumo: React.FC<EtapaResumoProps> = ({
  processo,
  paciente,
  onUpdateEvolucao
}) => {
  const [textoEvolucao, setTextoEvolucao] = useState(processo.evolucao?.resumoGerado || '');
  const { toast } = useToast();
  const [sinaisVitais, setSinaisVitais] = useState<any[]>([]);
  const [exames, setExames] = useState<any[]>([]);
  const [sistemas, setSistemas] = useState<any[]>([]);

  useEffect(() => {
    // Carregar catálogos para o texto do exame físico
    const loadCatalogs = async () => {
      try {
        const [sv, ex, sist] = await Promise.all([
          new Promise<any[]>((resolve) => {
             const unsubscribe = getSinaisVitais((data) => {
               resolve(data);
               unsubscribe();
             });
          }),
          new Promise<any[]>((resolve) => {
            const unsubscribe = getExames((data) => {
              resolve(data);
              unsubscribe();
            });
          }),
          getSistemas()
        ]);
        setSinaisVitais(sv);
        setExames(ex);
        setSistemas(sist);
      } catch (err) {
        console.error('Erro ao carregar catálogos:', err);
      }
    };
    loadCatalogs();
  }, []);

  const gerarTextoEvolucao = () => {
    const linhas: string[] = [];
    
    linhas.push(`EVOLUÇÃO DE ENFERMAGEM`);
    linhas.push(`Paciente: ${paciente.nomeCompleto}`);
    linhas.push(`Unidade: Unidade de Saúde Floripa`);
    linhas.push(`Data: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
    linhas.push(`-`.repeat(50));
    linhas.push('');

    // Avaliação Subjetiva
    if (processo.avaliacao.coletaDeDadosSubjetivos) {
      linhas.push('AVALIAÇÃO / COLETA DE DADOS:');
      linhas.push(processo.avaliacao.coletaDeDadosSubjetivos);
      linhas.push('');
    }

    // Exame Físico
    const exameFisico = processo.avaliacao.exameFisico || {};
    if (Object.keys(exameFisico).length > 0) {
      linhas.push('EXAME FÍSICO:');
      
      const svAtivos = sinaisVitais.filter(s => exameFisico[s.sinalVitalNome]);
      if (svAtivos.length > 0) {
        linhas.push('  [SINAIS VITAIS]');
        svAtivos.forEach(s => {
          linhas.push(`  • ${s.sinalVitalNome}: ${exameFisico[s.sinalVitalNome]}`);
        });
      }

      const exMap = new Map();
      exames.forEach(ex => {
        ex.componentes.forEach((c: any) => {
          if (exameFisico[c.componenteAnalisado]) {
            const grp = `${ex.tipoExame} - ${ex.tituloExame}`;
            if (!exMap.has(grp)) exMap.set(grp, []);
            exMap.get(grp).push(`${c.componenteAnalisado}: ${exameFisico[c.componenteAnalisado]}`);
          }
        });
      });
      if (exMap.size > 0) {
        linhas.push('  [EXAMES DIAGNÓSTICOS]');
        exMap.forEach((vals, titulo) => {
          linhas.push(`  • ${titulo}: ${vals.join(', ')}`);
        });
      }

      const rsEncontrados: string[] = [];
      sistemas.forEach(s => {
        s.exames.forEach((e: any) => {
          if (exameFisico[e.nomeExame]) {
            rsEncontrados.push(`${e.nomeExame}: ${exameFisico[e.nomeExame]}`);
          }
        });
      });
      if (rsEncontrados.length > 0) {
        linhas.push('  [REVISÃO DE SISTEMAS]');
        rsEncontrados.forEach(item => {
          linhas.push(`  • ${item}`);
        });
      }
      linhas.push('');
    }

    // NHBs
    if (processo.avaliacao.nhbsAfetadas?.length > 0) {
      linhas.push('NECESSIDADES HUMANAS BÁSICAS AFETADAS:');
      processo.avaliacao.nhbsAfetadas.forEach(n => {
        linhas.push(`• ${n.parametro}: ${n.nhb}`);
      });
      linhas.push('');
    }

    // Diagnósticos
    if (processo.diagnostico.diagnosticosSelecionados.length > 0) {
      linhas.push('DIAGNÓSTICOS DE ENFERMAGEM:');
      processo.diagnostico.diagnosticosSelecionados.forEach(diag => {
        linhas.push(`• ${diag.tituloDiagnostico}`);
      });
      linhas.push('');
    }

    // Planejamento
    if (processo.planejamento?.diagnosticosPlanejados?.length > 0) {
      linhas.push('PLANEJAMENTO DE ENFERMAGEM:');
      const diagnosticosOrdenados = [...processo.planejamento.diagnosticosPlanejados]
        .sort((a, b) => a.ordemPrioridade - b.ordemPrioridade);

      diagnosticosOrdenados.forEach((diag, index) => {
        linhas.push(`${index + 1}º) ${diag.tituloDiagnostico}`);
        
        if (diag.resultadoEsperadoSelecionado) {
          linhas.push(`   Resultado Esperado: ${diag.resultadoEsperadoSelecionado}`);
        }
        
        if (diag.intervencoesSelecionadas?.length > 0) {
          linhas.push('   Intervenções Planejadas:');
          diag.intervencoesSelecionadas.forEach(int => {
            linhas.push(`   - ${int.acaoPrescrita}`);
          });
        }
      });
      linhas.push('');
    }

    // Implementação
    const implementacao = processo.implementacao || {};
    const possuiImplementacao = Object.values(implementacao).some(d => d.intervencoes?.some(i => i.implementadoNestaConsulta));

    if (possuiImplementacao) {
      linhas.push('IMPLEMENTAÇÃO DE ENFERMAGEM:');
      Object.entries(implementacao).forEach(([tituloDiag, dados]) => {
        const implementadas = dados.intervencoes.filter(i => i.implementadoNestaConsulta);
        if (implementadas.length > 0) {
          linhas.push(`  [${tituloDiag}]`);
          implementadas.forEach(int => {
            let itemStr = `  • ${int.acaoPrescrita}.`;
            if (int.quemExecuta) {
               itemStr += ` (Executor: ${int.quemExecuta})`;
            }
            linhas.push(itemStr);
          });
        }
      });
      linhas.push('');
    }

    // Evolução de Enfermagem (Checklist executado)
    const intervencoesExecutadas = processo.evolucao?.intervencoesExecutadas || {};
    const temExecutada = Object.values(intervencoesExecutadas).some(lista => lista.length > 0);
    
    if (temExecutada) {
      linhas.push('EVOLUÇÃO DE ENFERMAGEM:');
      Object.entries(intervencoesExecutadas).forEach(([tituloDiag, acoesMarcadas]) => {
        if (acoesMarcadas.length === 0) return;
        linhas.push(`  [${tituloDiag}]`);
        
        acoesMarcadas.forEach(acaoPresc => {
          // Achar a acaoEnfermeiro mapeada no planejamento
          let verboMapeado: string | undefined = undefined;
          
          if (processo.planejamento?.diagnosticosPlanejados) {
            const d = processo.planejamento.diagnosticosPlanejados.find(dx => dx.tituloDiagnostico === tituloDiag);
            if (d && d.intervencoesSelecionadas) {
              const inv = d.intervencoesSelecionadas.find(i => i.acaoPrescrita === acaoPresc);
              if (inv && inv.acaoEnfermeiro) {
                verboMapeado = inv.acaoEnfermeiro;
              }
            }
          }

          // Fallback para acaoPrescrita
          linhas.push(`  • ${verboMapeado || acaoPresc}`);
        });
      });
      linhas.push('');
    }

    linhas.push('-'.repeat(50));
    linhas.push('Enfermeiro Responsável: [Nome do Enfermeiro]');
    linhas.push('COREN: [Número / UF]');

    return linhas.join('\n');
  };

  const handleCopiarTexto = async () => {
    const texto = gerarTextoEvolucao();
    setTextoEvolucao(texto);
    
    try {
      await navigator.clipboard.writeText(texto);
      
      onUpdateEvolucao({
        ...processo.evolucao,
        resumoGerado: texto
      });
      
      toast({
        title: "Sucesso",
        description: "Evolução de enfermagem copiada para a área de transferência!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o texto.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Etapa 6: Resumo Final do Prontuário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground pb-2 border-b">
            Revise todo o processo e gere o resumo formatado para cópia do prontuário eletrônico.
          </p>

          <Button onClick={handleCopiarTexto} className="flex items-center gap-2 w-full md:w-auto">
            <Copy className="w-4 h-4" />
            Gerar e Copiar Prontuário
          </Button>
          
          {(textoEvolucao || processo.evolucao?.resumoGerado) && (
            <Textarea
              value={textoEvolucao || processo.evolucao?.resumoGerado}
              readOnly
              className="min-h-[500px] font-mono text-sm leading-relaxed"
              placeholder="O prontuário final aparecerá aqui após clicar em 'Gerar e Copiar Prontuário'"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EtapaResumo;
