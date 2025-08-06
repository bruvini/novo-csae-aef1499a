import React, { useState, useEffect } from 'react';
import { 
  getExames, 
  addExame, 
  updateExame, 
  deleteExame,
  buscarNomesExamesUnicos,
  buscarExamePorNome,
  type Exame,
  type ComponenteExame,
  type ResultadoExame
} from '@/services/bancodados/examesDB';
import { buscarNHBs } from '@/services/bancodados/subconjuntosDB';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  Search,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Combobox } from '@/components/ui/combobox';

const TabelaExames = () => {
  const [exames, setExames] = useState<Exame[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editandoExame, setEditandoExame] = useState<Exame | null>(null);
  const [salvandoExame, setSalvandoExame] = useState(false);
  
  // Estados do formulário
  const [nomeExame, setNomeExame] = useState('');
  const [descricaoExame, setDescricaoExame] = useState('');
  const [tipoExame, setTipoExame] = useState<'Laboratorial' | 'Imagem'>('Laboratorial');
  const [componentes, setComponentes] = useState<ComponenteExame[]>([]);
  const [nomesExamesUnicos, setNomesExamesUnicos] = useState<string[]>([]);
  const [nhbOptions, setNhbOptions] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = getExames((data) => {
      setExames(data);
      setLoading(false);
    });

    // Carregar nomes únicos de exames e NHBs
    const carregarDados = async () => {
      try {
        const [nomesUnicos, nhbs] = await Promise.all([
          buscarNomesExamesUnicos(),
          buscarNHBs()
        ]);
        
        setNomesExamesUnicos(nomesUnicos);
        setNhbOptions(nhbs);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };

    carregarDados();

    return () => unsubscribe();
  }, []);

  const examesFiltrados = exames.filter(exame =>
    exame.nomeExame.toLowerCase().includes(filtro.toLowerCase())
  );

  const limparFormulario = () => {
    setNomeExame('');
    setDescricaoExame('');
    setTipoExame('Laboratorial');
    setComponentes([]);
    setEditandoExame(null);
  };

  const abrirModalCriacao = () => {
    limparFormulario();
    setSheetOpen(true);
  };

  const abrirModalEdicao = (exame: Exame) => {
    setNomeExame(exame.nomeExame);
    setDescricaoExame(exame.descricaoExame);
    setTipoExame(exame.tipoExame);
    setComponentes([...exame.componentes]);
    setEditandoExame(exame);
    setSheetOpen(true);
  };

  const handleNomeExameChange = async (novoNome: string) => {
    setNomeExame(novoNome);
    
    // Se o nome corresponde a um exame existente, carregar seus dados
    if (nomesExamesUnicos.includes(novoNome)) {
      try {
        const exameExistente = await buscarExamePorNome(novoNome);
        if (exameExistente) {
          setDescricaoExame(exameExistente.descricaoExame);
          setTipoExame(exameExistente.tipoExame);
          setComponentes([...exameExistente.componentes]);
          toast.info('Dados do exame existente carregados. Você pode adicionar novos componentes.');
        }
      } catch (error) {
        console.error('Erro ao carregar dados do exame:', error);
      }
    }
  };

  const adicionarComponente = () => {
    setComponentes([...componentes, {
      componenteAnalisado: '',
      unidadeMedida: '',
      resultados: []
    }]);
  };

  const removerComponente = (index: number) => {
    setComponentes(componentes.filter((_, i) => i !== index));
  };

  const atualizarComponente = (index: number, campo: keyof ComponenteExame, valor: any) => {
    const novosComponentes = [...componentes];
    novosComponentes[index] = { ...novosComponentes[index], [campo]: valor };
    setComponentes(novosComponentes);
  };

  const adicionarResultado = (componenteIndex: number) => {
    const novosComponentes = [...componentes];
    const novoResultado: ResultadoExame = {
      nomeAlteracao: '',
      subconjuntoNHBVinculado: ''
    };
    
    if (tipoExame === 'Laboratorial') {
      novoResultado.idadeMinima = null;
      novoResultado.idadeMaxima = null;
      novoResultado.idadeUnidade = '';
      novoResultado.criterioSexo = 'Ambos';
      novoResultado.valorMinimo = null;
      novoResultado.valorMaximo = null;
    } else {
      novoResultado.resultadoClassificatorio = '';
    }
    
    novosComponentes[componenteIndex].resultados.push(novoResultado);
    setComponentes(novosComponentes);
  };

  const removerResultado = (componenteIndex: number, resultadoIndex: number) => {
    const novosComponentes = [...componentes];
    novosComponentes[componenteIndex].resultados = 
      novosComponentes[componenteIndex].resultados.filter((_, i) => i !== resultadoIndex);
    setComponentes(novosComponentes);
  };

  const atualizarResultado = (componenteIndex: number, resultadoIndex: number, campo: keyof ResultadoExame, valor: any) => {
    const novosComponentes = [...componentes];
    novosComponentes[componenteIndex].resultados[resultadoIndex] = {
      ...novosComponentes[componenteIndex].resultados[resultadoIndex],
      [campo]: valor
    };
    setComponentes(novosComponentes);
  };

  const salvarExame = async () => {
    if (!nomeExame.trim()) {
      toast.error('Nome do exame é obrigatório');
      return;
    }

    setSalvandoExame(true);
    try {
      const dados = {
        nomeExame: nomeExame.trim(),
        descricaoExame: descricaoExame.trim(),
        tipoExame,
        componentes
      };

      if (editandoExame) {
        await updateExame(editandoExame.id, dados);
        toast.success('Exame atualizado com sucesso!');
      } else {
        await addExame(dados);
        toast.success('Exame criado com sucesso!');
      }

      setSheetOpen(false);
      limparFormulario();
    } catch (error) {
      toast.error('Erro ao salvar exame');
      console.error(error);
    } finally {
      setSalvandoExame(false);
    }
  };

  const excluirExame = async (exame: Exame) => {
    try {
      await deleteExame(exame.id);
      toast.success('Exame excluído com sucesso!');
    } catch (error) {
      toast.error('Erro ao excluir exame');
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

  const nomeExameOptions = nomesExamesUnicos.map(nome => ({
    value: nome,
    label: nome
  }));

  return (
    <div className="space-y-4">
      {/* Header com busca e botão de adicionar */}
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar exames..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button onClick={abrirModalCriacao}>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Exame
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-4xl max-h-screen overflow-y-auto">
            <SheetHeader>
              <SheetTitle>
                {editandoExame ? 'Editar Exame' : 'Novo Exame'}
              </SheetTitle>
            </SheetHeader>

            <div className="space-y-6 mt-6">
              {/* Dados básicos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Dados do Exame</h3>
                <div>
                  <label className="block text-sm font-medium mb-2">Nome *</label>
                  <Combobox
                    options={nomeExameOptions}
                    value={nomeExame}
                    onValueChange={handleNomeExameChange}
                    placeholder="Digite ou selecione um exame..."
                    searchPlaceholder="Buscar exames..."
                    emptyText="Nenhum exame encontrado."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Digite um novo nome ou selecione um exame existente para adicionar componentes
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Descrição</label>
                  <Textarea
                    value={descricaoExame}
                    onChange={(e) => setDescricaoExame(e.target.value)}
                    placeholder="Descrição do exame..."
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tipo de Exame</label>
                  <Select
                    value={tipoExame}
                    onValueChange={(value: 'Laboratorial' | 'Imagem') => setTipoExame(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Laboratorial">Laboratorial</SelectItem>
                      <SelectItem value="Imagem">Imagem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Componentes */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Componentes do Exame</h3>
                  <Button onClick={adicionarComponente} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Componente
                  </Button>
                </div>

                <Accordion type="multiple" className="w-full">
                  {componentes.map((componente, componenteIndex) => (
                    <AccordionItem key={componenteIndex} value={`componente-${componenteIndex}`}>
                      <AccordionTrigger>
                        {componente.componenteAnalisado || `Componente ${componenteIndex + 1}`}
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div className="flex justify-end">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removerComponente(componenteIndex)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remover Componente
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Componente Analisado</label>
                            <Input
                              value={componente.componenteAnalisado}
                              onChange={(e) => atualizarComponente(componenteIndex, 'componenteAnalisado', e.target.value)}
                              placeholder="Ex: Hemoglobina"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Unidade de Medida</label>
                            <Input
                              value={componente.unidadeMedida}
                              onChange={(e) => atualizarComponente(componenteIndex, 'unidadeMedida', e.target.value)}
                              placeholder="Ex: g/dL"
                            />
                          </div>
                        </div>

                        {/* Resultados do Componente */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">Resultados</h4>
                            <Button
                              onClick={() => adicionarResultado(componenteIndex)}
                              variant="outline"
                              size="sm"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Adicionar Resultado
                            </Button>
                          </div>

                          {componente.resultados.map((resultado, resultadoIndex) => (
                            <div key={resultadoIndex} className="border rounded-lg p-4 space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Resultado {resultadoIndex + 1}</span>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => removerResultado(componenteIndex, resultadoIndex)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              <div>
                                <label className="block text-sm font-medium mb-1">Nome da Alteração</label>
                                <Input
                                  value={resultado.nomeAlteracao}
                                  onChange={(e) => atualizarResultado(componenteIndex, resultadoIndex, 'nomeAlteracao', e.target.value)}
                                  placeholder="Ex: Normal"
                                />
                              </div>

                              {tipoExame === 'Laboratorial' ? (
                                <>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium mb-1">Idade Mínima</label>
                                      <Input
                                        type="number"
                                        value={resultado.idadeMinima || ''}
                                        onChange={(e) => atualizarResultado(componenteIndex, resultadoIndex, 'idadeMinima', e.target.value ? Number(e.target.value) : null)}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium mb-1">Idade Máxima</label>
                                      <Input
                                        type="number"
                                        value={resultado.idadeMaxima || ''}
                                        onChange={(e) => atualizarResultado(componenteIndex, resultadoIndex, 'idadeMaxima', e.target.value ? Number(e.target.value) : null)}
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium mb-1">Unidade de Idade</label>
                                      <Select
                                        value={resultado.idadeUnidade || ''}
                                        onValueChange={(value) => atualizarResultado(componenteIndex, resultadoIndex, 'idadeUnidade', value)}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Selecionar" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="">Não especificado</SelectItem>
                                          <SelectItem value="dias">Dias</SelectItem>
                                          <SelectItem value="meses">Meses</SelectItem>
                                          <SelectItem value="anos">Anos</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium mb-1">Critério Sexo</label>
                                      <Select
                                        value={resultado.criterioSexo || 'Ambos'}
                                        onValueChange={(value) => atualizarResultado(componenteIndex, resultadoIndex, 'criterioSexo', value)}
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Ambos">Ambos</SelectItem>
                                          <SelectItem value="Masculino">Masculino</SelectItem>
                                          <SelectItem value="Feminino">Feminino</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium mb-1">Valor Mínimo</label>
                                      <Input
                                        type="number"
                                        value={resultado.valorMinimo || ''}
                                        onChange={(e) => atualizarResultado(componenteIndex, resultadoIndex, 'valorMinimo', e.target.value ? Number(e.target.value) : null)}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium mb-1">Valor Máximo</label>
                                      <Input
                                        type="number"
                                        value={resultado.valorMaximo || ''}
                                        onChange={(e) => atualizarResultado(componenteIndex, resultadoIndex, 'valorMaximo', e.target.value ? Number(e.target.value) : null)}
                                      />
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <div>
                                  <label className="block text-sm font-medium mb-1">Resultado Classificatório</label>
                                  <Input
                                    value={resultado.resultadoClassificatorio || ''}
                                    onChange={(e) => atualizarResultado(componenteIndex, resultadoIndex, 'resultadoClassificatorio', e.target.value)}
                                    placeholder="Ex: Normal"
                                  />
                                </div>
                              )}

                              <div>
                                <label className="block text-sm font-medium mb-1">Subconjunto NHB Vinculado</label>
                                <Select
                                  value={resultado.subconjuntoNHBVinculado}
                                  onValueChange={(value) => atualizarResultado(componenteIndex, resultadoIndex, 'subconjuntoNHBVinculado', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione um NHB..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="">Nenhum</SelectItem>
                                    {nhbOptions.map((nhb) => (
                                      <SelectItem key={nhb} value={nhb}>
                                        {nhb}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
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
                <Button onClick={salvarExame} disabled={salvandoExame}>
                  {salvandoExame ? 'Salvando...' : 'Salvar Exame'}
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
              <TableHead>Nome do Exame</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="w-40">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {examesFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  {filtro ? 'Nenhum exame encontrado' : 'Nenhum exame cadastrado'}
                </TableCell>
              </TableRow>
            ) : (
              examesFiltrados.map((exame) => (
                <TableRow key={exame.id}>
                  <TableCell className="font-medium">
                    {exame.nomeExame}
                  </TableCell>
                  <TableCell>
                    <Badge variant={exame.tipoExame === 'Laboratorial' ? 'default' : 'secondary'}>
                      {exame.tipoExame}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{exame.nomeExame}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2">Tipo:</h4>
                              <Badge variant={exame.tipoExame === 'Laboratorial' ? 'default' : 'secondary'}>
                                {exame.tipoExame}
                              </Badge>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Descrição:</h4>
                              <p className="text-muted-foreground">{exame.descricaoExame || 'Sem descrição'}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Componentes:</h4>
                              {exame.componentes.length === 0 ? (
                                <p className="text-muted-foreground">Nenhum componente cadastrado</p>
                              ) : (
                                <Accordion type="multiple" className="w-full">
                                  {exame.componentes.map((componente, index) => (
                                    <AccordionItem key={index} value={`comp-${index}`}>
                                      <AccordionTrigger>
                                        {componente.componenteAnalisado} ({componente.unidadeMedida})
                                      </AccordionTrigger>
                                      <AccordionContent>
                                        <div className="space-y-2">
                                          {componente.resultados.map((resultado, rIndex) => (
                                            <div key={rIndex} className="border rounded-lg p-3">
                                              <h5 className="font-medium mb-2">{resultado.nomeAlteracao}</h5>
                                              <div className="text-sm space-y-1">
                                                {exame.tipoExame === 'Laboratorial' ? (
                                                  <>
                                                    <div>
                                                      <span className="font-medium">Faixa etária:</span>{' '}
                                                      {resultado.idadeMinima || resultado.idadeMaxima
                                                        ? `${resultado.idadeMinima || 0} - ${resultado.idadeMaxima || '∞'} ${resultado.idadeUnidade}`
                                                        : 'Não especificada'}
                                                    </div>
                                                    <div>
                                                      <span className="font-medium">Sexo:</span> {resultado.criterioSexo}
                                                    </div>
                                                    <div>
                                                      <span className="font-medium">Valores:</span>{' '}
                                                      {resultado.valorMinimo || resultado.valorMaximo
                                                        ? `${resultado.valorMinimo || 0} - ${resultado.valorMaximo || '∞'}`
                                                        : 'Não especificados'}
                                                    </div>
                                                  </>
                                                ) : (
                                                  <div>
                                                    <span className="font-medium">Resultado:</span> {resultado.resultadoClassificatorio}
                                                  </div>
                                                )}
                                                {resultado.subconjuntoNHBVinculado && (
                                                  <div>
                                                    <span className="font-medium">Subconjunto:</span> {resultado.subconjuntoNHBVinculado}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </AccordionContent>
                                    </AccordionItem>
                                  ))}
                                </Accordion>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => abrirModalEdicao(exame)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="h-8 w-8 p-0">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o exame "{exame.nomeExame}"? 
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => excluirExame(exame)}
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

export default TabelaExames;
