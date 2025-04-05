
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription,
  CardHeader, 
  CardTitle,
  CardFooter 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, PlusIcon, Edit2, Trash2, Check, X, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { ExameLaboratorial, ValorReferencia, NHB, DiagnosticoCompleto } from '@/services/bancodados/tipos';

const GerenciadorExamesLaboratoriais = () => {
  const { toast } = useToast();
  const [exames, setExames] = useState<ExameLaboratorial[]>([]);
  const [nhbs, setNhbs] = useState<NHB[]>([]);
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(false);
  const [selecionando, setSelecionando] = useState(false);
  const [exameAtual, setExameAtual] = useState<ExameLaboratorial | null>(null);
  
  // Estado para o formulário
  const [nome, setNome] = useState('');
  const [diferencaSexoIdade, setDiferencaSexoIdade] = useState(false);
  const [valoresReferenciaAtuais, setValoresReferenciaAtuais] = useState<ValorReferencia[]>([]);
  
  // Dados do modal de valor de referência
  const [valorRefModal, setValorRefModal] = useState<Partial<ValorReferencia>>({
    valorMinimo: undefined,
    valorMaximo: undefined,
    valorTexto: '',
    tipoValor: 'Numérico',
    unidade: '',
    representaAlteracao: false,
    tituloAlteracao: '',
    variacaoPor: 'Nenhum'
  });
  const [showIdade, setShowIdade] = useState(false);
  const [showSexo, setShowSexo] = useState(false);
  const [modalValorRefAberto, setModalValorRefAberto] = useState(false);
  const [editandoValorRef, setEditandoValorRef] = useState(false);
  const [indexValorRef, setIndexValorRef] = useState(-1);
  
  // NHB e diagnóstico selecionados
  const [nhbSelecionada, setNhbSelecionada] = useState<string | undefined>(undefined);
  const [diagnosticosSelecionados, setDiagnosticosSelecionados] = useState<DiagnosticoCompleto[]>([]);
  const [diagnosticoSelecionado, setDiagnosticoSelecionado] = useState<string | undefined>(undefined);
  
  // Carregar os dados iniciais
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        // Carregar exames
        const examesRef = collection(db, 'examesLaboratoriais');
        const examesSnapshot = await getDocs(examesRef);
        const examesData = examesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ExameLaboratorial[];
        setExames(examesData);
        
        // Carregar NHBs
        const nhbsRef = collection(db, 'nhbs');
        const nhbsSnapshot = await getDocs(nhbsRef);
        const nhbsData = nhbsSnapshot.docs.map(doc => ({
          id: doc.id,
          nome: doc.data().nome
        })) as NHB[];
        setNhbs(nhbsData);
        
        // Carregar diagnósticos
        const diagnosticosSnapshot = await getDocs(collection(db, 'diagnosticos'));
        const diagnosticosData = diagnosticosSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id
        })) as DiagnosticoCompleto[];
        setDiagnosticos(diagnosticosData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os exames laboratoriais.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    carregarDados();
  }, [toast]);

  const handleExibirModal = (editar = false, exame: ExameLaboratorial | null = null) => {
    setEditando(editar);
    if (editar && exame) {
      setExameAtual(exame);
      setNome(exame.nome);
      setDiferencaSexoIdade(exame.diferencaSexoIdade || false);
      setValoresReferenciaAtuais([...exame.valoresReferencia]);
    } else {
      setExameAtual(null);
      setNome('');
      setDiferencaSexoIdade(false);
      setValoresReferenciaAtuais([]);
    }
    setModalAberto(true);
  };
  
  const handleFecharModal = () => {
    setModalAberto(false);
    setExameAtual(null);
    setNome('');
    setDiferencaSexoIdade(false);
    setValoresReferenciaAtuais([]);
    setNhbSelecionada(undefined);
    setDiagnosticoSelecionado(undefined);
    setDiagnosticosSelecionados([]);
  };
  
  const handleSalvar = async () => {
    if (!nome) {
      toast({
        title: "Campo obrigatório",
        description: "O nome do exame laboratorial é obrigatório.",
        variant: "destructive"
      });
      return;
    }
    
    setSelecionando(true);
    
    try {
      if (editando && exameAtual?.id) {
        // Atualizar exame existente
        const exameRef = doc(db, 'examesLaboratoriais', exameAtual.id);
        await updateDoc(exameRef, {
          nome,
          diferencaSexoIdade,
          valoresReferencia: valoresReferenciaAtuais,
          updatedAt: Timestamp.now()
        });
        
        toast({
          title: "Exame atualizado",
          description: `${nome} foi atualizado com sucesso.`
        });
      } else {
        // Criar novo exame
        const novoExame: Omit<ExameLaboratorial, 'id'> = {
          nome,
          diferencaSexoIdade,
          valoresReferencia: valoresReferenciaAtuais,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        
        const docRef = await addDoc(collection(db, 'examesLaboratoriais'), novoExame);
        
        toast({
          title: "Exame cadastrado",
          description: `${nome} foi cadastrado com sucesso.`
        });
      }
      
      // Recarregar lista
      const examesSnapshot = await getDocs(collection(db, 'examesLaboratoriais'));
      const examesData = examesSnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id
      })) as ExameLaboratorial[];
      setExames(examesData);
      
      handleFecharModal();
    } catch (error) {
      console.error("Erro ao salvar exame:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o exame. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSelecionando(false);
    }
  };
  
  const handleExcluir = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'examesLaboratoriais', id));
      setExames(exames.filter((exame) => exame.id !== id));
      
      toast({
        title: "Exame excluído",
        description: "O exame foi excluído com sucesso."
      });
    } catch (error) {
      console.error("Erro ao excluir exame:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o exame. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  
  // Funções para manipular valores de referência
  const handleExibirModalValorRef = (editar = false, index = -1) => {
    setEditandoValorRef(editar);
    
    if (editar && index >= 0) {
      const valorRef = valoresReferenciaAtuais[index];
      setValorRefModal({...valorRef});
      setIndexValorRef(index);
      
      // Configurar visualização de campos condicionais
      if (valorRef.variacaoPor === 'Idade' || valorRef.variacaoPor === 'Ambos') {
        setShowIdade(true);
      } else {
        setShowIdade(false);
      }
      
      if (valorRef.variacaoPor === 'Sexo' || valorRef.variacaoPor === 'Ambos') {
        setShowSexo(true);
      } else {
        setShowSexo(false);
      }
    } else {
      setValorRefModal({
        valorMinimo: undefined,
        valorMaximo: undefined,
        valorTexto: '',
        tipoValor: 'Numérico',
        unidade: '',
        representaAlteracao: false,
        tituloAlteracao: '',
        variacaoPor: 'Nenhum'
      });
      setIndexValorRef(-1);
      setShowIdade(false);
      setShowSexo(false);
    }
    
    setModalValorRefAberto(true);
  };
  
  const handleFecharModalValorRef = () => {
    setModalValorRefAberto(false);
    setValorRefModal({
      valorMinimo: undefined,
      valorMaximo: undefined,
      valorTexto: '',
      tipoValor: 'Numérico',
      unidade: '',
      representaAlteracao: false,
      tituloAlteracao: '',
      variacaoPor: 'Nenhum'
    });
    setIndexValorRef(-1);
    setShowIdade(false);
    setShowSexo(false);
  };
  
  const handleVariacaoPorChange = (value: string) => {
    setValorRefModal({
      ...valorRefModal,
      variacaoPor: value as 'Sexo' | 'Idade' | 'Ambos' | 'Nenhum'
    });
    
    // Mostrar/esconder campos condicionalmente
    if (value === 'Idade' || value === 'Ambos') {
      setShowIdade(true);
    } else {
      setShowIdade(false);
      setValorRefModal(prev => ({
        ...prev,
        idadeMinima: undefined,
        idadeMaxima: undefined
      }));
    }
    
    if (value === 'Sexo' || value === 'Ambos') {
      setShowSexo(true);
    } else {
      setShowSexo(false);
      setValorRefModal(prev => ({
        ...prev,
        sexo: 'Todos'
      }));
    }
  };
  
  const handleTipoValorChange = (value: string) => {
    setValorRefModal({
      ...valorRefModal,
      tipoValor: value as 'Numérico' | 'Texto',
      // Limpar campos não relevantes ao tipo
      valorMinimo: value === 'Texto' ? undefined : valorRefModal.valorMinimo,
      valorMaximo: value === 'Texto' ? undefined : valorRefModal.valorMaximo,
      valorTexto: value === 'Numérico' ? '' : valorRefModal.valorTexto
    });
  };
  
  const handleSalvarValorRef = () => {
    // Validações básicas
    if (valorRefModal.tipoValor === 'Numérico' && 
        valorRefModal.valorMinimo === undefined && 
        valorRefModal.valorMaximo === undefined) {
      toast({
        title: "Campos obrigatórios",
        description: "Informe pelo menos um dos valores: mínimo ou máximo.",
        variant: "destructive"
      });
      return;
    }
    
    if (valorRefModal.tipoValor === 'Texto' && !valorRefModal.valorTexto) {
      toast({
        title: "Campo obrigatório",
        description: "O valor de texto é obrigatório para este tipo de valor.",
        variant: "destructive"
      });
      return;
    }
    
    if (!valorRefModal.unidade) {
      toast({
        title: "Campo obrigatório",
        description: "A unidade de medida é obrigatória.",
        variant: "destructive"
      });
      return;
    }
    
    if (valorRefModal.representaAlteracao && !valorRefModal.tituloAlteracao) {
      toast({
        title: "Campo obrigatório",
        description: "O título da alteração é obrigatório quando representa uma alteração.",
        variant: "destructive"
      });
      return;
    }
    
    // Validações condicionais
    if (showIdade) {
      if (valorRefModal.idadeMinima === undefined && valorRefModal.idadeMaxima === undefined) {
        toast({
          title: "Campos obrigatórios",
          description: "Informe pelo menos um dos valores: idade mínima ou máxima.",
          variant: "destructive"
        });
        return;
      }
    }
    
    // Preparar o objeto completo
    const valorRef: ValorReferencia = {
      tipoValor: valorRefModal.tipoValor as 'Numérico' | 'Texto',
      valorMinimo: valorRefModal.valorMinimo,
      valorMaximo: valorRefModal.valorMaximo,
      valorTexto: valorRefModal.valorTexto,
      unidade: valorRefModal.unidade || '',
      representaAlteracao: valorRefModal.representaAlteracao || false,
      tituloAlteracao: valorRefModal.tituloAlteracao,
      variacaoPor: valorRefModal.variacaoPor as 'Sexo' | 'Idade' | 'Ambos' | 'Nenhum',
      nhbId: nhbSelecionada,
      diagnosticoId: diagnosticoSelecionado
    };
    
    // Se é diferenciado por idade, incluir as idades
    if (showIdade) {
      valorRef.idadeMinima = valorRefModal.idadeMinima;
      valorRef.idadeMaxima = valorRefModal.idadeMaxima;
    }
    
    // Se é diferenciado por sexo, incluir o sexo
    if (showSexo) {
      valorRef.sexo = valorRefModal.sexo as 'Masculino' | 'Feminino' | 'Todos';
    } else {
      valorRef.sexo = 'Todos';
    }
    
    // Atualizar ou adicionar à lista
    if (editandoValorRef && indexValorRef >= 0) {
      const novosValoresRef = [...valoresReferenciaAtuais];
      novosValoresRef[indexValorRef] = valorRef;
      setValoresReferenciaAtuais(novosValoresRef);
    } else {
      setValoresReferenciaAtuais([...valoresReferenciaAtuais, valorRef]);
    }
    
    handleFecharModalValorRef();
  };
  
  const handleExcluirValorRef = (index: number) => {
    const novosValores = [...valoresReferenciaAtuais];
    novosValores.splice(index, 1);
    setValoresReferenciaAtuais(novosValores);
  };
  
  // Função para filtrar diagnósticos quando uma NHB é selecionada
  const handleNhbChange = (id: string) => {
    setNhbSelecionada(id);
    setDiagnosticoSelecionado(undefined);
    
    // Filtrar diagnósticos pela NHB selecionada
    const diagnosticosFiltrados = diagnosticos.filter(diag => 
      diag.subconjunto === 'Necessidades Humanas Básicas' && 
      diag.subitemId === id
    );
    setDiagnosticosSelecionados(diagnosticosFiltrados);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-csae-green-700">Exames Laboratoriais</h2>
        <Button 
          onClick={() => handleExibirModal(false)} 
          className="bg-csae-green-600 hover:bg-csae-green-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Exame Laboratorial
        </Button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-csae-green-600" />
        </div>
      ) : exames.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 border rounded-lg">
          <p className="text-gray-500 mb-4">Nenhum exame laboratorial cadastrado</p>
          <Button 
            onClick={() => handleExibirModal(false)}
            className="bg-csae-green-600 hover:bg-csae-green-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Cadastrar Exame Laboratorial
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Diferenciação</TableHead>
                <TableHead>Valores de Referência</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exames.map((exame) => (
                <TableRow key={exame.id}>
                  <TableCell className="font-medium">{exame.nome}</TableCell>
                  <TableCell>{exame.diferencaSexoIdade ? 'Sim' : 'Não'}</TableCell>
                  <TableCell>{exame.valoresReferencia?.length || 0} valores cadastrados</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleExibirModal(true, exame)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500" 
                        onClick={() => handleExcluir(exame.id!)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Modal para adicionar/editar exame */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editando ? `Editar ${nome}` : 'Cadastrar Novo Exame Laboratorial'}</DialogTitle>
            <DialogDescription>
              {editando 
                ? 'Atualize as informações do exame laboratorial selecionado.' 
                : 'Preencha as informações para cadastrar um novo exame laboratorial.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-6">
              {/* Dados básicos */}
              <div>
                <Label htmlFor="nome">Nome do Exame Laboratorial</Label>
                <Input 
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Hemoglobina, Glicemia"
                  className="mt-1"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="diferencaSexoIdade"
                  checked={diferencaSexoIdade}
                  onCheckedChange={setDiferencaSexoIdade}
                />
                <Label htmlFor="diferencaSexoIdade">Este parâmetro tem valores de referência que variam conforme idade/sexo</Label>
              </div>
              
              {/* Valores de referência */}
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Valores de Referência</h3>
                  <Button type="button" variant="outline" onClick={() => handleExibirModalValorRef(false)}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Adicionar Valor
                  </Button>
                </div>
                
                {valoresReferenciaAtuais.length === 0 ? (
                  <div className="text-center py-8 border border-dashed rounded-md">
                    <p className="text-gray-500">Nenhum valor de referência cadastrado</p>
                    <p className="text-gray-500 text-sm mt-2">Clique em "Adicionar Valor" para cadastrar</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {valoresReferenciaAtuais.map((valorRef, index) => (
                      <div key={index} className="border p-3 rounded-md bg-gray-50">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium">
                              {valorRef.tipoValor === 'Numérico' ? (
                                valorRef.valorMinimo !== undefined && valorRef.valorMaximo !== undefined
                                  ? `${valorRef.valorMinimo} - ${valorRef.valorMaximo} ${valorRef.unidade}`
                                  : valorRef.valorMinimo !== undefined
                                    ? `Mínimo: ${valorRef.valorMinimo} ${valorRef.unidade}`
                                    : `Máximo: ${valorRef.valorMaximo} ${valorRef.unidade}`
                              ) : (
                                `Valor: ${valorRef.valorTexto || 'N/A'} ${valorRef.unidade}`
                              )}
                            </p>
                            
                            <div className="mt-1 text-sm text-gray-500">
                              {valorRef.variacaoPor === 'Nenhum' ? (
                                <span>Valor único para todos</span>
                              ) : (
                                <>
                                  <span>Variação por: {valorRef.variacaoPor}</span>
                                  
                                  {(valorRef.variacaoPor === 'Idade' || valorRef.variacaoPor === 'Ambos') && (
                                    <span className="ml-2">
                                      {valorRef.idadeMinima !== undefined && valorRef.idadeMaxima !== undefined
                                        ? `Idade: ${valorRef.idadeMinima} - ${valorRef.idadeMaxima} anos`
                                        : valorRef.idadeMinima !== undefined
                                          ? `Idade: a partir de ${valorRef.idadeMinima} anos`
                                          : `Idade: até ${valorRef.idadeMaxima} anos`}
                                    </span>
                                  )}
                                  
                                  {(valorRef.variacaoPor === 'Sexo' || valorRef.variacaoPor === 'Ambos') && (
                                    <span className="ml-2">
                                      Sexo: {valorRef.sexo}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                            
                            {valorRef.representaAlteracao && (
                              <div className="mt-1">
                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                  Alteração: {valorRef.tituloAlteracao}
                                </span>
                              </div>
                            )}
                            
                            {valorRef.nhbId && valorRef.diagnosticoId && (
                              <div className="mt-1 text-xs text-gray-500">
                                <span>Vinculado a: {nhbs.find(n => n.id === valorRef.nhbId)?.nome} - </span>
                                <span>{diagnosticos.find(d => d.id === valorRef.diagnosticoId)?.descricao}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => handleExibirModalValorRef(true, index)}>
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleExcluirValorRef(index)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleFecharModal}>
              Cancelar
            </Button>
            <Button 
              className="bg-csae-green-600 hover:bg-csae-green-700"
              onClick={handleSalvar}
              disabled={selecionando}
            >
              {selecionando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal para adicionar/editar valor de referência */}
      <Dialog open={modalValorRefAberto} onOpenChange={setModalValorRefAberto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editandoValorRef ? 'Editar Valor de Referência' : 'Adicionar Valor de Referência'}
            </DialogTitle>
            <DialogDescription>
              Defina os valores de referência para este exame laboratorial
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de valor</Label>
              <RadioGroup
                value={valorRefModal.tipoValor || 'Numérico'}
                onValueChange={handleTipoValorChange}
                className="grid grid-cols-2 gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Numérico" id="numerico" />
                  <Label htmlFor="numerico">Numérico (faixa de valores)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Texto" id="texto" />
                  <Label htmlFor="texto">Texto (descrição)</Label>
                </div>
              </RadioGroup>
            </div>
            
            {valorRefModal.tipoValor === 'Numérico' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valorMinimo">Valor Mínimo</Label>
                  <Input 
                    id="valorMinimo"
                    type="number"
                    value={valorRefModal.valorMinimo || ''}
                    onChange={(e) => setValorRefModal({
                      ...valorRefModal,
                      valorMinimo: e.target.value === '' ? undefined : parseFloat(e.target.value)
                    })}
                    placeholder="Valor mínimo"
                  />
                </div>
                
                <div>
                  <Label htmlFor="valorMaximo">Valor Máximo</Label>
                  <Input 
                    id="valorMaximo"
                    type="number"
                    value={valorRefModal.valorMaximo || ''}
                    onChange={(e) => setValorRefModal({
                      ...valorRefModal,
                      valorMaximo: e.target.value === '' ? undefined : parseFloat(e.target.value)
                    })}
                    placeholder="Valor máximo"
                  />
                </div>
              </div>
            ) : (
              <div>
                <Label htmlFor="valorTexto">Descrição do Valor</Label>
                <Input 
                  id="valorTexto"
                  value={valorRefModal.valorTexto || ''}
                  onChange={(e) => setValorRefModal({
                    ...valorRefModal,
                    valorTexto: e.target.value
                  })}
                  placeholder="Ex: Ausente, Presente, Normal, etc."
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="unidade">Unidade de Medida</Label>
              <Input 
                id="unidade"
                value={valorRefModal.unidade || ''}
                onChange={(e) => setValorRefModal({
                  ...valorRefModal,
                  unidade: e.target.value
                })}
                placeholder="Ex: g/dL, mg/dL, mm³"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Este valor varia conforme:</Label>
              <RadioGroup
                value={valorRefModal.variacaoPor || 'Nenhum'}
                onValueChange={handleVariacaoPorChange}
                className="grid grid-cols-2 gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Nenhum" id="nenhum" />
                  <Label htmlFor="nenhum">Nenhum (valor único)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Sexo" id="sexo" />
                  <Label htmlFor="sexo">Sexo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Idade" id="idade" />
                  <Label htmlFor="idade">Idade</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Ambos" id="ambos" />
                  <Label htmlFor="ambos">Ambos (sexo e idade)</Label>
                </div>
              </RadioGroup>
            </div>
            
            {/* Campos condicionais para sexo */}
            {showSexo && (
              <div className="space-y-2">
                <Label>Sexo</Label>
                <RadioGroup
                  value={valorRefModal.sexo || 'Todos'}
                  onValueChange={(value) => setValorRefModal({
                    ...valorRefModal,
                    sexo: value as 'Masculino' | 'Feminino' | 'Todos'
                  })}
                  className="grid grid-cols-3 gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Masculino" id="masculino" />
                    <Label htmlFor="masculino">Masculino</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Feminino" id="feminino" />
                    <Label htmlFor="feminino">Feminino</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Todos" id="todos" />
                    <Label htmlFor="todos">Todos</Label>
                  </div>
                </RadioGroup>
              </div>
            )}
            
            {/* Campos condicionais para idade */}
            {showIdade && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="idadeMinima">Idade Mínima (anos)</Label>
                  <Input 
                    id="idadeMinima"
                    type="number"
                    value={valorRefModal.idadeMinima || ''}
                    onChange={(e) => setValorRefModal({
                      ...valorRefModal,
                      idadeMinima: e.target.value === '' ? undefined : parseFloat(e.target.value)
                    })}
                    placeholder="Idade mínima"
                  />
                </div>
                
                <div>
                  <Label htmlFor="idadeMaxima">Idade Máxima (anos)</Label>
                  <Input 
                    id="idadeMaxima"
                    type="number"
                    value={valorRefModal.idadeMaxima || ''}
                    onChange={(e) => setValorRefModal({
                      ...valorRefModal,
                      idadeMaxima: e.target.value === '' ? undefined : parseFloat(e.target.value)
                    })}
                    placeholder="Idade máxima"
                  />
                </div>
              </div>
            )}
            
            {/* Campos para alteração e diagnóstico */}
            <div className="pt-4 border-t">
              <div className="flex items-center space-x-2 mb-4">
                <Switch 
                  id="representaAlteracao"
                  checked={valorRefModal.representaAlteracao || false}
                  onCheckedChange={(checked) => setValorRefModal({
                    ...valorRefModal,
                    representaAlteracao: checked
                  })}
                />
                <Label htmlFor="representaAlteracao">Este valor representa uma alteração</Label>
              </div>
              
              {valorRefModal.representaAlteracao && (
                <div className="mb-4">
                  <Label htmlFor="tituloAlteracao">Título da Alteração</Label>
                  <Input 
                    id="tituloAlteracao"
                    value={valorRefModal.tituloAlteracao || ''}
                    onChange={(e) => setValorRefModal({
                      ...valorRefModal,
                      tituloAlteracao: e.target.value
                    })}
                    placeholder="Ex: Anemia, Hiperglicemia, etc."
                  />
                </div>
              )}
              
              {valorRefModal.representaAlteracao && (
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium">Vínculo com Diagnóstico</h4>
                  
                  <div>
                    <Label htmlFor="nhb">1. Selecione uma NHB</Label>
                    <Select 
                      value={nhbSelecionada} 
                      onValueChange={handleNhbChange}
                    >
                      <SelectTrigger id="nhb" className="w-full">
                        <SelectValue placeholder="Selecione uma NHB" />
                      </SelectTrigger>
                      <SelectContent>
                        {nhbs.map((nhb) => (
                          <SelectItem key={nhb.id} value={nhb.id!}>
                            {nhb.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {nhbSelecionada && (
                    <div>
                      <Label htmlFor="diagnostico">2. Selecione um diagnóstico de enfermagem</Label>
                      <Select 
                        value={diagnosticoSelecionado}
                        onValueChange={(value) => setDiagnosticoSelecionado(value)}
                        disabled={!nhbSelecionada || diagnosticosSelecionados.length === 0}
                      >
                        <SelectTrigger id="diagnostico" className="w-full">
                          <SelectValue placeholder={
                            diagnosticosSelecionados.length > 0 
                              ? "Selecione um diagnóstico" 
                              : "Nenhum diagnóstico disponível para esta NHB"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {diagnosticosSelecionados.map((diagnostico) => (
                            <SelectItem key={diagnostico.id} value={diagnostico.id!}>
                              {diagnostico.descricao}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleFecharModalValorRef}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarValorRef}>
              {editandoValorRef ? 'Atualizar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GerenciadorExamesLaboratoriais;
