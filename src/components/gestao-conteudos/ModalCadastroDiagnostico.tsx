
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Upload, X } from 'lucide-react';
import { buscarSubconjuntos } from '@/services/bancodados/subconjuntosDB';
import { salvarDiagnostico, uploadMaterialApoio, SubconjuntoVinculado, ResultadoEsperado, IntervencaoEnfermagem } from '@/services/bancodados/diagnosticosDB';
import { toast } from '@/hooks/use-toast';

interface Subconjunto {
  id: string;
  tipoSubconjunto: string;
  tituloSubconjunto: string;
}

const ModalCadastroDiagnostico = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subconjuntos, setSubconjuntos] = useState<Subconjunto[]>([]);
  
  // Estados do formulário
  const [tituloDiagnostico, setTituloDiagnostico] = useState('');
  const [descricaoDiagnostico, setDescricaoDiagnostico] = useState('');
  const [subconjuntosVinculados, setSubconjuntosVinculados] = useState<SubconjuntoVinculado[]>([]);
  const [resultadosEsperados, setResultadosEsperados] = useState<ResultadoEsperado[]>([
    { tituloResultado: '', descricaoResultado: '', intervencoesEnfermagem: [] }
  ]);

  useEffect(() => {
    if (open) {
      carregarSubconjuntos();
    }
  }, [open]);

  const carregarSubconjuntos = async () => {
    try {
      const dados = await buscarSubconjuntos();
      setSubconjuntos(dados);
    } catch (error) {
      console.error('Erro ao carregar subconjuntos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar subconjuntos",
        variant: "destructive",
      });
    }
  };

  const adicionarSubconjunto = (subconjuntoId: string) => {
    const subconjunto = subconjuntos.find(s => s.id === subconjuntoId);
    if (!subconjunto) return;

    const jaVinculado = subconjuntosVinculados.some(sv => 
      sv.tipoSubconjunto === subconjunto.tipoSubconjunto && 
      sv.tituloSubconjunto === subconjunto.tituloSubconjunto
    );

    if (!jaVinculado) {
      setSubconjuntosVinculados([...subconjuntosVinculados, {
        tipoSubconjunto: subconjunto.tipoSubconjunto,
        tituloSubconjunto: subconjunto.tituloSubconjunto
      }]);
    }
  };

  const removerSubconjunto = (index: number) => {
    setSubconjuntosVinculados(subconjuntosVinculados.filter((_, i) => i !== index));
  };

  const adicionarResultado = () => {
    setResultadosEsperados([...resultadosEsperados, {
      tituloResultado: '',
      descricaoResultado: '',
      intervencoesEnfermagem: []
    }]);
  };

  const removerResultado = (index: number) => {
    setResultadosEsperados(resultadosEsperados.filter((_, i) => i !== index));
  };

  const atualizarResultado = (index: number, campo: string, valor: string) => {
    const novosResultados = [...resultadosEsperados];
    novosResultados[index] = { ...novosResultados[index], [campo]: valor };
    setResultadosEsperados(novosResultados);
  };

  const adicionarIntervencao = (resultadoIndex: number) => {
    const novosResultados = [...resultadosEsperados];
    novosResultados[resultadoIndex].intervencoesEnfermagem.push({
      acaoEnfermeiro: '',
      acaoPrescrita: ''
    });
    setResultadosEsperados(novosResultados);
  };

  const removerIntervencao = (resultadoIndex: number, intervencaoIndex: number) => {
    const novosResultados = [...resultadosEsperados];
    novosResultados[resultadoIndex].intervencoesEnfermagem = 
      novosResultados[resultadoIndex].intervencoesEnfermagem.filter((_, i) => i !== intervencaoIndex);
    setResultadosEsperados(novosResultados);
  };

  const atualizarIntervencao = (resultadoIndex: number, intervencaoIndex: number, campo: string, valor: string) => {
    const novosResultados = [...resultadosEsperados];
    novosResultados[resultadoIndex].intervencoesEnfermagem[intervencaoIndex] = {
      ...novosResultados[resultadoIndex].intervencoesEnfermagem[intervencaoIndex],
      [campo]: valor
    };
    setResultadosEsperados(novosResultados);
  };

  const handleUploadMaterial = async (
    file: File, 
    titulo: string, 
    resultadoIndex: number, 
    intervencaoIndex: number
  ) => {
    try {
      const tempId = `temp_${Date.now()}`;
      const url = await uploadMaterialApoio(file, tempId, intervencaoIndex);
      
      const novosResultados = [...resultadosEsperados];
      novosResultados[resultadoIndex].intervencoesEnfermagem[intervencaoIndex].materialApoio = {
        tituloMaterialApoio: titulo,
        urlMaterialApoio: url
      };
      setResultadosEsperados(novosResultados);

      toast({
        title: "Sucesso",
        description: "Material de apoio carregado com sucesso",
      });
    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro",
        description: "Erro ao fazer upload do material",
        variant: "destructive",
      });
    }
  };

  const validarFormulario = () => {
    if (!tituloDiagnostico.trim()) {
      toast({
        title: "Erro de validação",
        description: "Título do diagnóstico é obrigatório",
        variant: "destructive",
      });
      return false;
    }

    for (let i = 0; i < resultadosEsperados.length; i++) {
      const resultado = resultadosEsperados[i];
      if (!resultado.tituloResultado.trim()) {
        toast({
          title: "Erro de validação",
          description: `Título do resultado esperado ${i + 1} é obrigatório`,
          variant: "destructive",
        });
        return false;
      }

      for (let j = 0; j < resultado.intervencoesEnfermagem.length; j++) {
        const intervencao = resultado.intervencoesEnfermagem[j];
        if (!intervencao.acaoEnfermeiro.trim() || !intervencao.acaoPrescrita.trim()) {
          toast({
            title: "Erro de validação",
            description: `Campos obrigatórios da intervenção ${j + 1} do resultado ${i + 1} não preenchidos`,
            variant: "destructive",
          });
          return false;
        }
      }
    }

    return true;
  };

  const handleSalvar = async () => {
    if (!validarFormulario()) return;

    setLoading(true);
    try {
      await salvarDiagnostico({
        tituloDiagnostico,
        descricaoDiagnostico: descricaoDiagnostico || undefined,
        subconjuntosVinculados,
        resultadosEsperados
      });

      toast({
        title: "Sucesso",
        description: "Diagnóstico de enfermagem cadastrado com sucesso",
      });

      // Limpar formulário
      setTituloDiagnostico('');
      setDescricaoDiagnostico('');
      setSubconjuntosVinculados([]);
      setResultadosEsperados([{ tituloResultado: '', descricaoResultado: '', intervencoesEnfermagem: [] }]);
      setOpen(false);

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar diagnóstico",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="outline" className="h-8 w-8">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Diagnóstico de Enfermagem</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seção 1: Dados do Diagnóstico */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-csae-green-700">1. Dados do Diagnóstico</h3>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Título do Diagnóstico <span className="text-red-500">*</span>
              </label>
              <Input
                value={tituloDiagnostico}
                onChange={(e) => setTituloDiagnostico(e.target.value)}
                placeholder="Ex: Risco de Infecção"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Descrição do Diagnóstico</label>
              <Textarea
                value={descricaoDiagnostico}
                onChange={(e) => setDescricaoDiagnostico(e.target.value)}
                placeholder="Descrição detalhada do diagnóstico..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Subconjuntos Vinculados</label>
              <Select onValueChange={adicionarSubconjunto}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar subconjunto" />
                </SelectTrigger>
                <SelectContent>
                  {subconjuntos.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.tituloSubconjunto} ({sub.tipoSubconjunto})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {subconjuntosVinculados.map((sub, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-2">
                    {sub.tituloSubconjunto}
                    <span className="text-xs">({sub.tipoSubconjunto})</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-4 w-4 p-0"
                      onClick={() => removerSubconjunto(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Seção 2: Resultados Esperados */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-csae-green-700">2. Resultados Esperados</h3>
              <Button onClick={adicionarResultado} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Resultado
              </Button>
            </div>

            {resultadosEsperados.map((resultado, resultadoIndex) => (
              <div key={resultadoIndex} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Resultado Esperado {resultadoIndex + 1}</h4>
                  {resultadosEsperados.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removerResultado(resultadoIndex)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Título do Resultado <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={resultado.tituloResultado}
                    onChange={(e) => atualizarResultado(resultadoIndex, 'tituloResultado', e.target.value)}
                    placeholder="Ex: Ausência de sinais de infecção"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Descrição do Resultado</label>
                  <Textarea
                    value={resultado.descricaoResultado || ''}
                    onChange={(e) => atualizarResultado(resultadoIndex, 'descricaoResultado', e.target.value)}
                    placeholder="Descrição detalhada do resultado esperado..."
                    rows={2}
                  />
                </div>

                {/* Seção 3: Intervenções */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-sm">Intervenções de Enfermagem</h5>
                    <Button
                      onClick={() => adicionarIntervencao(resultadoIndex)}
                      size="sm"
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Intervenção
                    </Button>
                  </div>

                  {resultado.intervencoesEnfermagem.map((intervencao, intervencaoIndex) => (
                    <div key={intervencaoIndex} className="border-l-2 border-gray-200 pl-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Intervenção {intervencaoIndex + 1}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removerIntervencao(resultadoIndex, intervencaoIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Ação do Enfermeiro <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={intervencao.acaoEnfermeiro}
                          onChange={(e) => atualizarIntervencao(resultadoIndex, intervencaoIndex, 'acaoEnfermeiro', e.target.value)}
                          placeholder="Ex: Avalio sinais inflamatórios diariamente."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Ação Prescrita <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={intervencao.acaoPrescrita}
                          onChange={(e) => atualizarIntervencao(resultadoIndex, intervencaoIndex, 'acaoPrescrita', e.target.value)}
                          placeholder="Ex: Avaliar sinais inflamatórios diariamente."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Material de Apoio (PDF)</label>
                        {!intervencao.materialApoio ? (
                          <MaterialUpload 
                            onUpload={(file, titulo) => handleUploadMaterial(file, titulo, resultadoIndex, intervencaoIndex)}
                          />
                        ) : (
                          <div className="flex items-center gap-2 p-2 bg-green-50 rounded border">
                            <span className="text-sm text-green-700">
                              📄 {intervencao.materialApoio.tituloMaterialApoio}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const novosResultados = [...resultadosEsperados];
                                delete novosResultados[resultadoIndex].intervencoesEnfermagem[intervencaoIndex].materialApoio;
                                setResultadosEsperados(novosResultados);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Diagnóstico'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Componente para upload de material
const MaterialUpload = ({ onUpload }: { onUpload: (file: File, titulo: string) => void }) => {
  const [titulo, setTitulo] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      toast({
        title: "Erro",
        description: "Apenas arquivos PDF são permitidos",
        variant: "destructive",
      });
    }
  };

  const handleUpload = () => {
    if (file && titulo.trim()) {
      onUpload(file, titulo);
      setFile(null);
      setTitulo('');
    }
  };

  return (
    <div className="space-y-2">
      <Input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Título do material de apoio"
      />
      <div className="flex gap-2">
        <Input
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="flex-1"
        />
        <Button
          size="sm"
          onClick={handleUpload}
          disabled={!file || !titulo.trim()}
        >
          <Upload className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ModalCadastroDiagnostico;
