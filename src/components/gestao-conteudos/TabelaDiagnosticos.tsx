
import React, { useState, useEffect } from 'react';
import { 
  getDiagnosticos, 
  addDiagnostico, 
  updateDiagnostico, 
  deleteDiagnostico,
  type Diagnostico,
  type Subconjunto,
  type ResultadoEsperado,
  type Intervencao,
  type MaterialApoio
} from '@/services/bancodados/rolEnfermagemDB';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  X, 
  PlusCircle,
  Search 
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const TabelaDiagnosticos = () => {
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editandoDiagnostico, setEditandoDiagnostico] = useState<Diagnostico | null>(null);
  const [salvandoDiagnostico, setSalvandoDiagnostico] = useState(false);
  
  // Estados do formulário
  const [tituloDiagnostico, setTituloDiagnostico] = useState('');
  const [descricaoDiagnostico, setDescricaoDiagnostico] = useState('');
  const [subconjuntos, setSubconjuntos] = useState<Subconjunto[]>([]);
  const [resultadosEsperados, setResultadosEsperados] = useState<ResultadoEsperado[]>([]);
  
  // Estados para adicionar novos subconjuntos
  const [novoSubconjuntoTipo, setNovoSubconjuntoTipo] = useState('');
  const [novoSubconjuntoTitulo, setNovoSubconjuntoTitulo] = useState('');

  useEffect(() => {
    const unsubscribe = getDiagnosticos((data) => {
      setDiagnosticos(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const diagnosticosFiltrados = diagnosticos.filter(diagnostico =>
    diagnostico.tituloDiagnostico.toLowerCase().includes(filtro.toLowerCase())
  );

  const limparFormulario = () => {
    setTituloDiagnostico('');
    setDescricaoDiagnostico('');
    setSubconjuntos([]);
    setResultadosEsperados([]);
    setNovoSubconjuntoTipo('');
    setNovoSubconjuntoTitulo('');
    setEditandoDiagnostico(null);
  };

  const abrirModalCriacao = () => {
    limparFormulario();
    setSheetOpen(true);
  };

  const abrirModalEdicao = (diagnostico: Diagnostico) => {
    setTituloDiagnostico(diagnostico.tituloDiagnostico);
    setDescricaoDiagnostico(diagnostico.descricaoDiagnostico);
    setSubconjuntos([...diagnostico.subconjuntos]);
    setResultadosEsperados([...diagnostico.resultadosEsperados]);
    setEditandoDiagnostico(diagnostico);
    setSheetOpen(true);
  };

  const adicionarSubconjunto = () => {
    if (novoSubconjuntoTipo.trim() && novoSubconjuntoTitulo.trim()) {
      setSubconjuntos([...subconjuntos, {
        tipoSubconjunto: novoSubconjuntoTipo.trim(),
        tituloSubconjunto: novoSubconjuntoTitulo.trim()
      }]);
      setNovoSubconjuntoTipo('');
      setNovoSubconjuntoTitulo('');
    }
  };

  const removerSubconjunto = (index: number) => {
    setSubconjuntos(subconjuntos.filter((_, i) => i !== index));
  };

  const adicionarResultado = () => {
    setResultadosEsperados([...resultadosEsperados, {
      tituloResultado: '',
      descricaoResultado: '',
      intervencoes: []
    }]);
  };

  const removerResultado = (index: number) => {
    setResultadosEsperados(resultadosEsperados.filter((_, i) => i !== index));
  };

  const atualizarResultado = (index: number, campo: keyof ResultadoEsperado, valor: any) => {
    const novosResultados = [...resultadosEsperados];
    novosResultados[index] = { ...novosResultados[index], [campo]: valor };
    setResultadosEsperados(novosResultados);
  };

  const adicionarIntervencao = (resultadoIndex: number) => {
    const novosResultados = [...resultadosEsperados];
    novosResultados[resultadoIndex].intervencoes.push({
      acaoEnfermeiro: '',
      acaoPrescrita: '',
      materiaisDeApoio: []
    });
    setResultadosEsperados(novosResultados);
  };

  const removerIntervencao = (resultadoIndex: number, intervencaoIndex: number) => {
    const novosResultados = [...resultadosEsperados];
    novosResultados[resultadoIndex].intervencoes = 
      novosResultados[resultadoIndex].intervencoes.filter((_, i) => i !== intervencaoIndex);
    setResultadosEsperados(novosResultados);
  };

  const atualizarIntervencao = (resultadoIndex: number, intervencaoIndex: number, campo: keyof Intervencao, valor: any) => {
    const novosResultados = [...resultadosEsperados];
    novosResultados[resultadoIndex].intervencoes[intervencaoIndex] = {
      ...novosResultados[resultadoIndex].intervencoes[intervencaoIndex],
      [campo]: valor
    };
    setResultadosEsperados(novosResultados);
  };

  const adicionarMaterial = (resultadoIndex: number, intervencaoIndex: number) => {
    const novosResultados = [...resultadosEsperados];
    novosResultados[resultadoIndex].intervencoes[intervencaoIndex].materiaisDeApoio.push({
      tituloMaterialApoio: '',
      urlMaterialApoio: ''
    });
    setResultadosEsperados(novosResultados);
  };

  const removerMaterial = (resultadoIndex: number, intervencaoIndex: number, materialIndex: number) => {
    const novosResultados = [...resultadosEsperados];
    novosResultados[resultadoIndex].intervencoes[intervencaoIndex].materiaisDeApoio = 
      novosResultados[resultadoIndex].intervencoes[intervencaoIndex].materiaisDeApoio.filter((_, i) => i !== materialIndex);
    setResultadosEsperados(novosResultados);
  };

  const atualizarMaterial = (resultadoIndex: number, intervencaoIndex: number, materialIndex: number, campo: keyof MaterialApoio, valor: string) => {
    const novosResultados = [...resultadosEsperados];
    novosResultados[resultadoIndex].intervencoes[intervencaoIndex].materiaisDeApoio[materialIndex] = {
      ...novosResultados[resultadoIndex].intervencoes[intervencaoIndex].materiaisDeApoio[materialIndex],
      [campo]: valor
    };
    setResultadosEsperados(novosResultados);
  };

  const salvarDiagnostico = async () => {
    if (!tituloDiagnostico.trim()) {
      toast.error('O título do diagnóstico é obrigatório');
      return;
    }

    setSalvandoDiagnostico(true);
    try {
      const dados = {
        tituloDiagnostico: tituloDiagnostico.trim(),
        descricaoDiagnostico: descricaoDiagnostico.trim(),
        subconjuntos,
        resultadosEsperados
      };

      if (editandoDiagnostico) {
        await updateDiagnostico(editandoDiagnostico.id, dados);
        toast.success('Diagnóstico atualizado com sucesso!');
      } else {
        await addDiagnostico(dados);
        toast.success('Diagnóstico criado com sucesso!');
      }

      setSheetOpen(false);
      limparFormulario();
    } catch (error) {
      toast.error('Erro ao salvar diagnóstico');
      console.error(error);
    } finally {
      setSalvandoDiagnostico(false);
    }
  };

  const excluirDiagnostico = async (diagnostico: Diagnostico) => {
    try {
      await deleteDiagnostico(diagnostico.id);
      toast.success('Diagnóstico excluído com sucesso!');
    } catch (error) {
      toast.error('Erro ao excluir diagnóstico');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com busca e botão de adicionar */}
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar diagnósticos..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button onClick={abrirModalCriacao}>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Novo Diagnóstico
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-4xl max-h-screen overflow-y-auto">
            <SheetHeader>
              <SheetTitle>
                {editandoDiagnostico ? 'Editar Diagnóstico' : 'Novo Diagnóstico'}
              </SheetTitle>
            </SheetHeader>

            <div className="space-y-6 mt-6">
              {/* Dados básicos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Dados do Diagnóstico</h3>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Título do Diagnóstico *
                  </label>
                  <Input
                    value={tituloDiagnostico}
                    onChange={(e) => setTituloDiagnostico(e.target.value)}
                    placeholder="Ex: Risco de Infecção"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Descrição do Diagnóstico
                  </label>
                  <Textarea
                    value={descricaoDiagnostico}
                    onChange={(e) => setDescricaoDiagnostico(e.target.value)}
                    placeholder="Descrição detalhada do diagnóstico..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Subconjuntos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Subconjuntos Vinculados</h3>
                
                {/* Lista de subconjuntos */}
                <div className="flex flex-wrap gap-2">
                  {subconjuntos.map((subconjunto, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-2">
                      {subconjunto.tituloSubconjunto}
                      <span className="text-xs">({subconjunto.tipoSubconjunto})</span>
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

                {/* Adicionar novo subconjunto */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Tipo do subconjunto"
                    value={novoSubconjuntoTipo}
                    onChange={(e) => setNovoSubconjuntoTipo(e.target.value)}
                  />
                  <Input
                    placeholder="Título do subconjunto"
                    value={novoSubconjuntoTitulo}
                    onChange={(e) => setNovoSubconjuntoTitulo(e.target.value)}
                  />
                  <Button onClick={adicionarSubconjunto} variant="outline">
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Resultados Esperados */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Resultados Esperados</h3>
                  <Button onClick={adicionarResultado} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Resultado
                  </Button>
                </div>

                <Accordion type="multiple" className="w-full">
                  {resultadosEsperados.map((resultado, resultadoIndex) => (
                    <AccordionItem key={resultadoIndex} value={`resultado-${resultadoIndex}`}>
                      <AccordionTrigger>
                        {resultado.tituloResultado || `Resultado ${resultadoIndex + 1}`}
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div className="flex justify-end">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removerResultado(resultadoIndex)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir Resultado
                          </Button>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Título do Resultado</label>
                          <Input
                            value={resultado.tituloResultado}
                            onChange={(e) => atualizarResultado(resultadoIndex, 'tituloResultado', e.target.value)}
                            placeholder="Ex: Ausência de sinais de infecção"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Descrição do Resultado</label>
                          <Textarea
                            value={resultado.descricaoResultado}
                            onChange={(e) => atualizarResultado(resultadoIndex, 'descricaoResultado', e.target.value)}
                            placeholder="Descrição detalhada..."
                            rows={2}
                          />
                        </div>

                        {/* Intervenções */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">Intervenções de Enfermagem</h4>
                            <Button
                              onClick={() => adicionarIntervencao(resultadoIndex)}
                              variant="outline"
                              size="sm"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Adicionar Intervenção
                            </Button>
                          </div>

                          {resultado.intervencoes.map((intervencao, intervencaoIndex) => (
                            <div key={intervencaoIndex} className="border rounded-lg p-4 space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Intervenção {intervencaoIndex + 1}</span>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => removerIntervencao(resultadoIndex, intervencaoIndex)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              <div>
                                <label className="block text-sm font-medium mb-1">Ação do Enfermeiro</label>
                                <Textarea
                                  value={intervencao.acaoEnfermeiro}
                                  onChange={(e) => atualizarIntervencao(resultadoIndex, intervencaoIndex, 'acaoEnfermeiro', e.target.value)}
                                  placeholder="Ex: Avalio sinais inflamatórios diariamente"
                                  rows={2}
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium mb-1">Ação Prescrita</label>
                                <Textarea
                                  value={intervencao.acaoPrescrita}
                                  onChange={(e) => atualizarIntervencao(resultadoIndex, intervencaoIndex, 'acaoPrescrita', e.target.value)}
                                  placeholder="Ex: Avaliar sinais inflamatórios diariamente"
                                  rows={2}
                                />
                              </div>

                              {/* Materiais de Apoio */}
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium">Materiais de Apoio</span>
                                  <Button
                                    onClick={() => adicionarMaterial(resultadoIndex, intervencaoIndex)}
                                    variant="outline"
                                    size="sm"
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Adicionar Material
                                  </Button>
                                </div>

                                {intervencao.materiaisDeApoio.map((material, materialIndex) => (
                                  <div key={materialIndex} className="flex gap-2 items-center">
                                    <Input
                                      placeholder="Título do material"
                                      value={material.tituloMaterialApoio}
                                      onChange={(e) => atualizarMaterial(resultadoIndex, intervencaoIndex, materialIndex, 'tituloMaterialApoio', e.target.value)}
                                    />
                                    <Input
                                      placeholder="URL do material"
                                      value={material.urlMaterialApoio}
                                      onChange={(e) => atualizarMaterial(resultadoIndex, intervencaoIndex, materialIndex, 'urlMaterialApoio', e.target.value)}
                                    />
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => removerMaterial(resultadoIndex, intervencaoIndex, materialIndex)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              {/* Botões de ação */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setSheetOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={salvarDiagnostico} disabled={salvandoDiagnostico}>
                  {salvandoDiagnostico ? 'Salvando...' : 'Salvar Diagnóstico'}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título do Diagnóstico</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Subconjuntos</TableHead>
              <TableHead className="w-32">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {diagnosticosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  {filtro ? 'Nenhum diagnóstico encontrado' : 'Nenhum diagnóstico cadastrado'}
                </TableCell>
              </TableRow>
            ) : (
              diagnosticosFiltrados.map((diagnostico) => (
                <TableRow key={diagnostico.id}>
                  <TableCell className="font-medium">
                    {diagnostico.tituloDiagnostico}
                  </TableCell>
                  <TableCell>
                    <span className="line-clamp-2">
                      {diagnostico.descricaoDiagnostico || 'Sem descrição'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {diagnostico.subconjuntos.map((sub, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {sub.tituloSubconjunto}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => abrirModalEdicao(diagnostico)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o diagnóstico "{diagnostico.tituloDiagnostico}"? 
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => excluirDiagnostico(diagnostico)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TabelaDiagnosticos;
