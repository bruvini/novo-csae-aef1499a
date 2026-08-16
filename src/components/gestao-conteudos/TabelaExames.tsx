
import React, { useState, useEffect } from 'react';
import { 
  getExames, 
  addExame, 
  updateExame, 
  deleteExame,
  getNomesDeExamesUnicos,
  componenteEhClassificatorio,
  type Exame,
  type ComponenteExame,
  type ResultadoExame
} from '@/services/bancodados/examesDB';
import { getSubconjuntosNhb } from '@/services/bancodados/subconjuntosDB';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const TabelaExames = () => {
  const [exames, setExames] = useState<Exame[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editandoExame, setEditandoExame] = useState<Exame | null>(null);
  const [salvandoExame, setSalvandoExame] = useState(false);
  const [nomesExamesExistentes, setNomesExamesExistentes] = useState<string[]>([]);
  const [loadingExames, setLoadingExames] = useState(true);
  const [listaNhb, setListaNhb] = useState<{ id: string; tituloSubconjunto: string }[]>([]);
  const [loadingNhb, setLoadingNhb] = useState(true);

  // Estados do formulário
  const [nomeExame, setNomeExame] = useState('');
  const [descricaoExame, setDescricaoExame] = useState('');
  const [tipoExame, setTipoExame] = useState<'Laboratorial' | 'Imagem'>('Laboratorial');
  const [componentes, setComponentes] = useState<ComponenteExame[]>([]);

  useEffect(() => {
    const unsubscribe = getExames((data) => {
      setExames(data);
      setLoading(false);
    });

    // Buscar nomes de exames existentes
    const fetchNomes = async () => {
      try {
        setLoadingExames(true);
        const nomes = await getNomesDeExamesUnicos();
        setNomesExamesExistentes(nomes);
      } catch (error) {
        console.error('Erro ao carregar nomes de exames:', error);
        toast.error('Erro ao carregar lista de exames');
      } finally {
        setLoadingExames(false);
      }
    };

    // Buscar subconjuntos NHB
    const fetchNhb = async () => {
      try {
        setLoadingNhb(true);
        const nhbs = await getSubconjuntosNhb();
        setListaNhb(nhbs);
      } catch (error) {
        console.error('Erro ao carregar NHBs:', error);
        toast.error('Erro ao carregar lista de NHBs');
      } finally {
        setLoadingNhb(false);
      }
    };

    fetchNomes();
    fetchNhb();

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
    setComponentes(exame.componentes || []);
    setEditandoExame(exame);
    setSheetOpen(true);
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

  const atualizarComponente = <K extends keyof ComponenteExame,>(
    index: number,
    campo: K,
    valor: ComponenteExame[K]
  ) => {
    const novosComponentes = [...componentes];
    novosComponentes[index] = { ...novosComponentes[index], [campo]: valor };
    setComponentes(novosComponentes);
  };

  const adicionarResultado = (componenteIndex: number) => {
    const novosComponentes = [...componentes];
    const classificatorio = componenteEhClassificatorio(tipoExame, novosComponentes[componenteIndex]);
    const novoResultado: ResultadoExame = !classificatorio ? {
      idadeMinima: null,
      idadeMaxima: null,
      idadeUnidade: '',
      criterioSexo: 'Ambos',
      valorMinimo: null,
      valorMaximo: null,
      nomeAlteracao: '',
      subconjuntoNHBVinculado: ''
    } : {
      resultadoClassificatorio: '',
      nomeAlteracao: '',
      subconjuntoNHBVinculado: ''
    };
    
    novosComponentes[componenteIndex].resultados.push(novoResultado);
    setComponentes(novosComponentes);
  };

  const removerResultado = (componenteIndex: number, resultadoIndex: number) => {
    const novosComponentes = [...componentes];
    novosComponentes[componenteIndex].resultados = novosComponentes[componenteIndex].resultados.filter((_, i) => i !== resultadoIndex);
    setComponentes(novosComponentes);
  };

  const atualizarResultado = <K extends keyof ResultadoExame,>(
    componenteIndex: number,
    resultadoIndex: number,
    campo: K,
    valor: ResultadoExame[K]
  ) => {
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
        componentes: componentes.map(comp => ({
          ...comp,
          resultados: comp.resultados.map(res => ({
            ...res,
            subconjuntoNHBVinculado: res.subconjuntoNHBVinculado === 'none' ? '' : res.subconjuntoNHBVinculado
          }))
        }))
      };

      if (editandoExame) {
        await updateExame(editandoExame.id, dados);
        toast.success('Exame atualizado com sucesso!');
      } else {
        await addExame(dados);
        toast.success('Exame criado com sucesso!');
        // Recarregar lista de nomes após adicionar novo exame
        const nomesAtualizados = await getNomesDeExamesUnicos();
        setNomesExamesExistentes(nomesAtualizados);
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
      // Recarregar lista de nomes após excluir exame
      const nomesAtualizados = await getNomesDeExamesUnicos();
      setNomesExamesExistentes(nomesAtualizados);
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

  return (
    <div className="space-y-4">
      {/* Header com busca e botão de adicionar */}
      <div className="flex justify-between items-center">
        <Input
          placeholder="Buscar exames..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button onClick={abrirModalCriacao}>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Exame
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-6xl max-h-screen overflow-y-auto">
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
                  <label className="block text-sm font-medium mb-1.5">Nome do Exame *</label>
                  {loadingExames ? (
                    <Input value={nomeExame} onChange={(e) => setNomeExame(e.target.value)} placeholder="Carregando..." disabled />
                  ) : (
                    <Combobox
                      options={nomesExamesExistentes.map(nome => ({ value: nome, label: nome }))}
                      value={nomeExame}
                      onValueChange={setNomeExame}
                      placeholder="Selecione ou digite um novo exame..."
                      searchPlaceholder="Buscar exame..."
                      emptyText="Nenhum exame encontrado"
                    />
                  )}
                  <p className="text-[11px] text-muted-foreground mt-1">Ex: "Hemograma Completo", "Glicemia de Jejum". Selecione um exame existente para adicionar um novo componente a ele.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Descrição</label>
                  <Textarea
                    value={descricaoExame}
                    onChange={(e) => setDescricaoExame(e.target.value)}
                    placeholder="Descrição clínica do exame e sua finalidade…"
                    rows={2}
                    spellCheck
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Opcional. Descreva quando este exame é indicado ou como interpretar seus resultados.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Tipo de Exame *</label>
                  <Select value={tipoExame} onValueChange={(value: 'Laboratorial' | 'Imagem') => setTipoExame(value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Laboratorial">Laboratorial — valores numéricos com faixas de referência</SelectItem>
                      <SelectItem value="Imagem">Imagem — resultado classificatório (Normal, Alterado etc.)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground mt-1">Laboratorial = inserção de valores numéricos pelo enfermeiro. Imagem = seleção de resultado classificatório.</p>
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

                {componentes.map((componente, componenteIndex) => (
                  <div key={componenteIndex} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-md font-semibold">Componente {componenteIndex + 1}</h4>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removerComponente(componenteIndex)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remover
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Componente Analisado *</label>
                        <Input
                          value={componente.componenteAnalisado}
                          onChange={(e) => atualizarComponente(componenteIndex, 'componenteAnalisado', e.target.value)}
                          placeholder="Ex: Glicose, Hemoglobina"
                          spellCheck
                        />
                        <p className="text-[11px] text-muted-foreground mt-1">Nome exato do parâmetro. Será usado como chave no processo de enfermagem — não abrevie.</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Unidade de Medida *</label>
                        <Input
                          value={componente.unidadeMedida}
                          onChange={(e) => atualizarComponente(componenteIndex, 'unidadeMedida', e.target.value)}
                          placeholder="Ex: mg/dL, g/dL, %"
                        />
                        <p className="text-[11px] text-muted-foreground mt-1">Use a unidade padrão abreviada.</p>
                      </div>
                    </div>

                    {/* Resultados */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h5 className="text-sm font-semibold">Resultados de Referência</h5>
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
                        <div key={resultadoIndex} className="border rounded p-3 space-y-3 bg-gray-50">
                          <div className="flex justify-between items-center">
                            <h6 className="text-sm font-medium">Resultado {resultadoIndex + 1}</h6>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removerResultado(componenteIndex, resultadoIndex)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Remover
                            </Button>
                          </div>

                          {!componenteEhClassificatorio(tipoExame, componente) ? (
                            <>
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-xs font-medium mb-1">Idade Mínima</label>
                                  <Input
                                    type="number"
                                    className="h-8"
                                    value={resultado.idadeMinima || ''}
                                    onChange={(e) => atualizarResultado(componenteIndex, resultadoIndex, 'idadeMinima', e.target.value ? Number(e.target.value) : null)}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium mb-1">Idade Máxima</label>
                                  <Input
                                    type="number"
                                    className="h-8"
                                    value={resultado.idadeMaxima || ''}
                                    onChange={(e) => atualizarResultado(componenteIndex, resultadoIndex, 'idadeMaxima', e.target.value ? Number(e.target.value) : null)}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium mb-1">Unidade Idade</label>
                                  <Select
                                    value={resultado.idadeUnidade === '' ? 'not-specified' : resultado.idadeUnidade}
                                    onValueChange={(value) => atualizarResultado(componenteIndex, resultadoIndex, 'idadeUnidade', value === 'not-specified' ? '' : value)}
                                  >
                                    <SelectTrigger className="h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="not-specified">Não especificado</SelectItem>
                                      <SelectItem value="dias">Dias</SelectItem>
                                      <SelectItem value="meses">Meses</SelectItem>
                                      <SelectItem value="anos">Anos</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-xs font-medium mb-1">Critério Sexo</label>
                                  <Select
                                    value={resultado.criterioSexo}
                                    onValueChange={(value) => atualizarResultado(componenteIndex, resultadoIndex, 'criterioSexo', value)}
                                  >
                                    <SelectTrigger className="h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Ambos">Ambos</SelectItem>
                                      <SelectItem value="Masculino">Masculino</SelectItem>
                                      <SelectItem value="Feminino">Feminino</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium mb-1">Valor Mínimo</label>
                                  <Input
                                    type="number"
                                    className="h-8"
                                    value={resultado.valorMinimo || ''}
                                    onChange={(e) => atualizarResultado(componenteIndex, resultadoIndex, 'valorMinimo', e.target.value ? Number(e.target.value) : null)}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium mb-1">Valor Máximo</label>
                                  <Input
                                    type="number"
                                    className="h-8"
                                    value={resultado.valorMaximo || ''}
                                    onChange={(e) => atualizarResultado(componenteIndex, resultadoIndex, 'valorMaximo', e.target.value ? Number(e.target.value) : null)}
                                  />
                                </div>
                              </div>
                            </>
                          ) : (
                            <div>
                              <label className="block text-xs font-medium mb-1">Resultado Classificatório</label>
                              <Input
                                className="h-8"
                                value={resultado.resultadoClassificatorio || ''}
                                onChange={(e) => atualizarResultado(componenteIndex, resultadoIndex, 'resultadoClassificatorio', e.target.value)}
                                placeholder="Ex: Normal"
                              />
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium mb-1">Nome da Alteração</label>
                              <Input
                                className="h-8"
                                value={resultado.nomeAlteracao}
                                onChange={(e) => atualizarResultado(componenteIndex, resultadoIndex, 'nomeAlteracao', e.target.value)}
                                placeholder="Ex: Normal"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1">Subconjunto NHB</label>
                              <Select
                                value={resultado.subconjuntoNHBVinculado || 'none'}
                                onValueChange={(value) => atualizarResultado(componenteIndex, resultadoIndex, 'subconjuntoNHBVinculado', value === 'none' ? '' : value)}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {loadingNhb ? (
                                    <SelectItem value="loading" disabled>Carregando...</SelectItem>
                                  ) : (
                                    <>
                                      <SelectItem value="none">Nenhum</SelectItem>
                                      {listaNhb.map((nhb) => (
                                        <SelectItem key={nhb.id} value={nhb.tituloSubconjunto}>
                                          {nhb.tituloSubconjunto}
                                        </SelectItem>
                                      ))}
                                    </>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
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
              <TableHead>Componentes</TableHead>
              <TableHead className="w-40">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {examesFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  {filtro ? 'Nenhum exame encontrado' : 'Nenhum exame cadastrado'}
                </TableCell>
              </TableRow>
            ) : (
              examesFiltrados.map((exame) => (
                <TableRow key={exame.id}>
                  <TableCell className="font-medium">{exame.nomeExame}</TableCell>
                  <TableCell>{exame.tipoExame}</TableCell>
                  <TableCell>{exame.componentes?.length || 0} componente(s)</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
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
