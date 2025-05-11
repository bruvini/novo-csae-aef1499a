
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription,
  CardHeader, 
  CardTitle 
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, Edit, Trash2, Check, X, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  query,
  where 
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { ValorReferenciaExame, ExameLaboratorial, SubconjuntoDiagnostico, DiagnosticoCompleto } from '@/types/exames';

const GerenciadorExamesLaboratoriais = () => {
  const { toast } = useToast();
  const [exames, setExames] = useState<ExameLaboratorial[]>([]);
  const [subconjuntos, setSubconjuntos] = useState<SubconjuntoDiagnostico[]>([]);
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoCompleto[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [nhbSelecionadas, setNhbSelecionadas] = useState<string[]>([]);
  const [diagnosticosFiltrados, setDiagnosticosFiltrados] = useState<DiagnosticoCompleto[]>([]);
  
  // Estado para o formulário
  const [formExame, setFormExame] = useState<ExameLaboratorial>({
    nome: '',
    tipoExame: 'Laboratorial',
    diferencaSexoIdade: false,
    valoresReferencia: [{ 
      unidade: '',
      representaAlteracao: false,
      variacaoPor: 'Nenhum',
      tipoValor: 'Numérico'
    }]
  });
  
  // Carregar os dados iniciais
  useEffect(() => {
    const carregarDados = async () => {
      try {
        // Carregar exames
        const examesRef = collection(db, 'examesLaboratoriais');
        const examesSnapshot = await getDocs(examesRef);
        const examesData = examesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ExameLaboratorial[];
        setExames(examesData);
        
        // Carregar subconjuntos (NHBs)
        const subconjuntosRef = query(
          collection(db, 'subconjuntosDiagnosticos'), 
          where('tipo', '==', 'NHB')
        );
        const subconjuntosSnapshot = await getDocs(subconjuntosRef);
        const subconjuntosData = subconjuntosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as SubconjuntoDiagnostico[];
        setSubconjuntos(subconjuntosData);

        // Carregar Diagnósticos
        const diagnosticosRef = collection(db, 'diagnosticosEnfermagem');
        const diagnosticosSnapshot = await getDocs(diagnosticosRef);
        const diagnosticosData = diagnosticosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as DiagnosticoCompleto[];
        setDiagnosticos(diagnosticosData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os exames.",
          variant: "destructive"
        });
      } finally {
        setCarregando(false);
      }
    };
    
    carregarDados();
  }, [toast]);
  
  // Filtrar diagnósticos quando uma NHB é selecionada
  useEffect(() => {
    if (nhbSelecionadas.length > 0) {
      // Filtrar diagnósticos que pertencem a pelo menos uma das NHBs selecionadas
      const filtrados = diagnosticos.filter(d => {
        return d.subconjuntoIds?.some(id => nhbSelecionadas.includes(id)) || false;
      });
      setDiagnosticosFiltrados(filtrados);
    } else {
      setDiagnosticosFiltrados([]);
    }
  }, [nhbSelecionadas, diagnosticos]);
  
  // Abrir modal para criar novo exame
  const abrirModalCriar = () => {
    setFormExame({
      nome: '',
      tipoExame: 'Laboratorial',
      diferencaSexoIdade: false,
      valoresReferencia: [{ 
        unidade: '',
        representaAlteracao: false,
        variacaoPor: 'Nenhum',
        tipoValor: 'Numérico'
      }]
    });
    setEditandoId(null);
    setModalAberto(true);
    setNhbSelecionadas([]);
  };
  
  // Abrir modal para editar exame existente
  const abrirModalEditar = (exame: ExameLaboratorial) => {
    // Garantir que todos os valores de referência tenham os novos campos
    const valoresAtualizados = exame.valoresReferencia.map(valor => {
      // Converter nhbId antigo para array nhbIds se necessário
      const nhbIds = valor.nhbIds || (valor.nhbId ? [valor.nhbId] : []);
      
      // Converter diagnosticoId antigo para array diagnosticoIds se necessário
      const diagnosticoIds = valor.diagnosticoIds || (valor.diagnosticoId ? [valor.diagnosticoId] : []);
      
      return {
        ...valor,
        representaAlteracao: valor.representaAlteracao !== undefined ? valor.representaAlteracao : false,
        variacaoPor: valor.variacaoPor || 'Nenhum',
        tipoValor: valor.tipoValor || 'Numérico',
        nhbIds,
        diagnosticoIds
      };
    });

    setFormExame({
      ...exame,
      valoresReferencia: valoresAtualizados
    });
    setEditandoId(exame.id || null);
    setModalAberto(true);
    
    // Coletar todos os IDs de NHB de todos os valores para pré-selecionar
    const allNhbIds = valoresAtualizados.reduce((ids: string[], valor) => {
      if (valor.nhbIds && valor.nhbIds.length > 0) {
        return [...ids, ...valor.nhbIds];
      }
      return ids;
    }, []);
    
    // Definir IDs únicos de NHB
    const uniqueNhbIds = [...new Set(allNhbIds)];
    setNhbSelecionadas(uniqueNhbIds);
    
    // Filtrar diagnósticos para todas as NHBs selecionadas
    if (uniqueNhbIds.length > 0) {
      const relevantDiagnosticos = diagnosticos.filter(d => 
        d.subconjuntoIds?.some(id => uniqueNhbIds.includes(id))
      );
      setDiagnosticosFiltrados(relevantDiagnosticos);
    }
  };
  
  // Adicionar valor de referência
  const adicionarValorReferencia = () => {
    setFormExame({
      ...formExame,
      valoresReferencia: [
        ...formExame.valoresReferencia,
        { 
          unidade: '',
          representaAlteracao: false,
          variacaoPor: 'Nenhum',
          tipoValor: 'Numérico'
        }
      ]
    });
  };
  
  // Remover valor de referência
  const removerValorReferencia = (index: number) => {
    const novosValores = [...formExame.valoresReferencia];
    novosValores.splice(index, 1);
    setFormExame({
      ...formExame,
      valoresReferencia: novosValores
    });
  };
  
  // Atualizar valor de referência
  const atualizarValorReferencia = (index: number, campo: keyof ValorReferenciaExame, valor: any) => {
    const novosValores = [...formExame.valoresReferencia];
    novosValores[index] = {
      ...novosValores[index],
      [campo]: valor
    };

    // Quando o tipo de valor muda, ajustar os campos correspondentes
    if (campo === 'tipoValor') {
      if (valor === 'Texto') {
        novosValores[index].valorTexto = '';
        novosValores[index].valorMinimo = undefined;
        novosValores[index].valorMaximo = undefined;
      } else {
        novosValores[index].valorTexto = undefined;
      }
    }

    // Quando a variação muda, ajustamos os campos necessários
    if (campo === 'variacaoPor') {
      if (valor === 'Nenhum') {
        // Remover campos desnecessários para variação única
        delete novosValores[index].idadeMinima;
        delete novosValores[index].idadeMaxima;
        delete novosValores[index].sexo;
      } else if (valor === 'Sexo') {
        // Adicionar campo de sexo e remover idade
        novosValores[index].sexo = 'Todos';
        delete novosValores[index].idadeMinima;
        delete novosValores[index].idadeMaxima;
      } else if (valor === 'Idade') {
        // Adicionar campos de idade e remover sexo
        novosValores[index].idadeMinima = 0;
        novosValores[index].idadeMaxima = 100;
        delete novosValores[index].sexo;
      }
      // 'Ambos' mantém todos os campos
    }

    // Se desmarcar "representa alteração", limpar os campos relacionados
    if (campo === 'representaAlteracao' && valor === false) {
      delete novosValores[index].tituloAlteracao;
      novosValores[index].nhbIds = [];
      novosValores[index].diagnosticoIds = [];
      
      // Resetar os estados relacionados se estamos editando o valor atual
      setNhbSelecionadas([]);
      setDiagnosticosFiltrados([]);
    }

    setFormExame({
      ...formExame,
      valoresReferencia: novosValores
    });
  };

  // Helper para obter o nome da NHB
  const getNhbName = (id: string): string => {
    const nhb = subconjuntos.find(s => s.id === id);
    return nhb ? nhb.nome : 'Desconhecido';
  };
  
  // Helper para obter o nome do diagnóstico
  const getDiagnosticoName = (id: string): string => {
    const diag = diagnosticos.find(d => d.id === id);
    return diag ? (diag.nome || diag.descricao || 'Sem nome') : 'Desconhecido';
  };

  // Function to toggle a value in array
  const toggleValueInArray = (array: string[], value: string): string[] => {
    return array.includes(value) 
      ? array.filter(item => item !== value) 
      : [...array, value];
  };

  // Atualizar NHBs selecionadas para um valor específico
  const handleNhbChange = (index: number, nhbIds: string[]) => {
    const novosValores = [...formExame.valoresReferencia];
    novosValores[index] = {
      ...novosValores[index],
      nhbIds: nhbIds
    };
    
    setFormExame({
      ...formExame,
      valoresReferencia: novosValores
    });
    
    // Atualizar o estado global de NHBs selecionadas
    setNhbSelecionadas(nhbIds);
    
    // Filtrar diagnósticos para todas as NHBs selecionadas
    if (nhbIds.length > 0) {
      const diagnosticosDaNhb = diagnosticos.filter(d => 
        d.subconjuntoIds?.some(id => nhbIds.includes(id))
      );
      setDiagnosticosFiltrados(diagnosticosDaNhb);
    } else {
      setDiagnosticosFiltrados([]);
    }
  };

  // Toggle NHB selection for a specific value
  const toggleNhb = (index: number, nhbId: string) => {
    const currentNhbIds = formExame.valoresReferencia[index].nhbIds || [];
    const newNhbIds = toggleValueInArray(currentNhbIds, nhbId);
    handleNhbChange(index, newNhbIds);
  };

  // Atualizar diagnósticos selecionados
  const handleDiagnosticoChange = (index: number, diagnosticoIds: string[]) => {
    const novosValores = [...formExame.valoresReferencia];
    novosValores[index] = {
      ...novosValores[index],
      diagnosticoIds: diagnosticoIds
    };

    setFormExame({
      ...formExame,
      valoresReferencia: novosValores
    });
  };

  // Toggle diagnóstico selection for a specific value
  const toggleDiagnostico = (index: number, diagId: string) => {
    const currentDiagIds = formExame.valoresReferencia[index].diagnosticoIds || [];
    const newDiagIds = toggleValueInArray(currentDiagIds, diagId);
    handleDiagnosticoChange(index, newDiagIds);
  };
  
  // Atualizar tipo de exame
  const atualizarTipoExame = (tipo: 'Laboratorial' | 'Imagem') => {
    setFormExame({
      ...formExame,
      tipoExame: tipo
    });
  };
  
  // Salvar exame (criar novo ou atualizar existente)
  const salvarExame = async () => {
    try {
      if (!formExame.nome.trim()) {
        toast({
          title: "Campo obrigatório",
          description: "Nome do exame é obrigatório.",
          variant: "destructive"
        });
        return;
      }
      
      // Validar campos dos valores de referência
      for (const valor of formExame.valoresReferencia) {
        // Unidade só é obrigatória para valores numéricos
        if (valor.tipoValor === "Numérico" && !valor.unidade?.trim()) {
          toast({
            title: "Campo obrigatório",
            description: "Unidade é obrigatória para valores numéricos.",
            variant: "destructive"
          });
          return;
        }

        // Validar campos específicos de acordo com a variação
        if (valor.variacaoPor === 'Sexo' || valor.variacaoPor === 'Ambos') {
          if (!valor.sexo) {
            toast({
              title: "Campo obrigatório",
              description: "Sexo é obrigatório quando a variação inclui sexo.",
              variant: "destructive"
            });
            return;
          }
        }
        
        if (valor.variacaoPor === 'Idade' || valor.variacaoPor === 'Ambos') {
          if (valor.idadeMinima === undefined || valor.idadeMaxima === undefined) {
            toast({
              title: "Campo obrigatório",
              description: "Idade mínima e máxima são obrigatórias quando a variação inclui idade.",
              variant: "destructive"
            });
            return;
          }
        }

        // Validar campos do tipo de valor
        if (valor.tipoValor === 'Numérico') {
          if (valor.valorMinimo === undefined && valor.valorMaximo === undefined) {
            toast({
              title: "Campo obrigatório",
              description: "Pelo menos um valor (mínimo ou máximo) é obrigatório para valores numéricos.",
              variant: "destructive"
            });
            return;
          }
        } else if (valor.tipoValor === 'Texto') {
          if (!valor.valorTexto?.trim()) {
            toast({
              title: "Campo obrigatório",
              description: "Valor textual é obrigatório quando o tipo é texto.",
              variant: "destructive"
            });
            return;
          }
        }

        if (valor.representaAlteracao) {
          if (!valor.tituloAlteracao?.trim()) {
            toast({
              title: "Campo obrigatório",
              description: "Título da alteração é obrigatório quando o valor representa uma alteração.",
              variant: "destructive"
            });
            return;
          }

          if (!valor.nhbIds || valor.nhbIds.length === 0) {
            toast({
              title: "Campo obrigatório",
              description: "Pelo menos uma Necessidade Humana Básica (NHB) é obrigatória para valores que representam alteração.",
              variant: "destructive"
            });
            return;
          }

          if (!valor.diagnosticoIds || valor.diagnosticoIds.length === 0) {
            toast({
              title: "Campo obrigatório",
              description: "Pelo menos um Diagnóstico de Enfermagem é obrigatório para valores que representam alteração.",
              variant: "destructive"
            });
            return;
          }
        }
      }
      
      if (editandoId) {
        // Atualizar existente
        const exameRef = doc(db, 'examesLaboratoriais', editandoId);
        await updateDoc(exameRef, {
          ...formExame,
          updatedAt: serverTimestamp()
        });
        
        toast({
          title: "Exame atualizado",
          description: `${formExame.nome} foi atualizado com sucesso.`
        });
        
        // Atualizar lista
        setExames(prev => 
          prev.map(e => e.id === editandoId ? {...formExame, id: editandoId, updatedAt: new Date() as any} : e)
        );
      } else {
        // Criar novo
        const novoExame = {
          ...formExame,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, 'examesLaboratoriais'), novoExame);
        
        toast({
          title: "Exame criado",
          description: `${formExame.nome} foi criado com sucesso.`
        });
        
        // Adicionar à lista
        setExames(prev => [...prev, {...novoExame, id: docRef.id, createdAt: new Date() as any, updatedAt: new Date() as any}]);
      }
      
      setModalAberto(false);
    } catch (error) {
      console.error("Erro ao salvar exame:", error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o exame.",
        variant: "destructive"
      });
    }
  };
  
  // Excluir exame
  const excluirExame = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este exame? Esta ação não pode ser desfeita.")) {
      try {
        await deleteDoc(doc(db, 'examesLaboratoriais', id));
        
        toast({
          title: "Exame excluído",
          description: "O exame foi excluído com sucesso."
        });
        
        // Remover da lista
        setExames(prev => prev.filter(e => e.id !== id));
      } catch (error) {
        console.error("Erro ao excluir exame:", error);
        toast({
          title: "Erro ao excluir",
          description: "Ocorreu um erro ao excluir o exame.",
          variant: "destructive"
        });
      }
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Gerenciamento de Exames</span>
          <Button onClick={abrirModalCriar} className="bg-csae-green-600 hover:bg-csae-green-700">
            <Plus className="mr-2 h-4 w-4" /> Novo Exame
          </Button>
        </CardTitle>
        <CardDescription>
          Cadastre e gerencie os exames laboratoriais e de imagem utilizados no processo de enfermagem.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {carregando ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-csae-green-600"></div>
          </div>
        ) : exames.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            Nenhum exame cadastrado. Clique em "Novo Exame" para começar.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Exame</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valores de Referência</TableHead>
                <TableHead>Valores com Alteração</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exames.map((exame) => (
                <TableRow key={exame.id}>
                  <TableCell className="font-medium">{exame.nome}</TableCell>
                  <TableCell>{exame.tipoExame || "Laboratorial"}</TableCell>
                  <TableCell>{exame.valoresReferencia.length} valores configurados</TableCell>
                  <TableCell>
                    {exame.valoresReferencia.filter(v => v.representaAlteracao).length} valores
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="mr-2" onClick={() => abrirModalEditar(exame)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => excluirExame(exame.id!)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      
      {/* Modal para criar/editar exame */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editandoId ? 'Editar' : 'Novo'} Exame</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para {editandoId ? 'atualizar o' : 'cadastrar um novo'} exame.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome do Exame</Label>
              <Input
                id="nome"
                value={formExame.nome}
                onChange={(e) => setFormExame({...formExame, nome: e.target.value})}
                placeholder="Ex: Hemoglobina"
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Tipo de Exame</Label>
              <RadioGroup 
                value={formExame.tipoExame || 'Laboratorial'} 
                onValueChange={(v: 'Laboratorial' | 'Imagem') => atualizarTipoExame(v)}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Laboratorial" id="laboratorial" />
                  <Label htmlFor="laboratorial">Laboratorial</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Imagem" id="imagem" />
                  <Label htmlFor="imagem">Imagem</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label>Valores de Referência</Label>
                <Button type="button" variant="outline" size="sm" onClick={adicionarValorReferencia}>
                  <Plus className="h-4 w-4 mr-1" /> Adicionar Valor
                </Button>
              </div>
              
              {formExame.valoresReferencia.map((valor, index) => (
                <Card key={index} className="p-4">
                  <div className="grid gap-3">
                    <div className="flex justify-between">
                      <h4 className="font-medium">Valor de Referência #{index + 1}</h4>
                      {formExame.valoresReferencia.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removerValorReferencia(index)}
                          className="h-7 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    {/* Tipo de valor: Numérico ou Textual */}
                    <div className="grid gap-2">
                      <Label>O valor é numérico ou textual?</Label>
                      <RadioGroup 
                        value={valor.tipoValor || 'Numérico'} 
                        onValueChange={(v: 'Numérico' | 'Texto') => atualizarValorReferencia(index, 'tipoValor', v)}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Numérico" id={`numerico-${index}`} />
                          <Label htmlFor={`numerico-${index}`}>Numérico</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Texto" id={`texto-${index}`} />
                          <Label htmlFor={`texto-${index}`}>Textual</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    {/* Campos condicionais baseados no tipo de valor */}
                    {valor.tipoValor === 'Numérico' ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <Label>Valor Mínimo</Label>
                          <Input
                            type="number"
                            value={valor.valorMinimo !== undefined ? valor.valorMinimo : ''}
                            onChange={(e) => atualizarValorReferencia(index, 'valorMinimo', e.target.value ? Number(e.target.value) : undefined)}
                            placeholder="Ex: 12"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Valor Máximo</Label>
                          <Input
                            type="number"
                            value={valor.valorMaximo !== undefined ? valor.valorMaximo : ''}
                            onChange={(e) => atualizarValorReferencia(index, 'valorMaximo', e.target.value ? Number(e.target.value) : undefined)}
                            placeholder="Ex: 16"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        <Label>Valor Textual</Label>
                        <Input
                          value={valor.valorTexto || ''}
                          onChange={(e) => atualizarValorReferencia(index, 'valorTexto', e.target.value)}
                          placeholder="Ex: Normal, Presente, Ausente, etc."
                        />
                      </div>
                    )}
                    
                    <div className="grid gap-2">
                      <Label>Varia por</Label>
                      <Select
                        value={valor.variacaoPor}
                        onValueChange={(v: 'Sexo' | 'Idade' | 'Ambos' | 'Nenhum') => atualizarValorReferencia(index, 'variacaoPor', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione como o valor varia" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Nenhum">Nenhum (valor único)</SelectItem>
                          <SelectItem value="Sexo">Sexo</SelectItem>
                          <SelectItem value="Idade">Idade</SelectItem>
                          <SelectItem value="Ambos">Ambos (Sexo e Idade)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {(valor.variacaoPor === 'Sexo' || valor.variacaoPor === 'Ambos') && (
                      <div className="grid gap-2">
                        <Label>Sexo</Label>
                        <Select
                          value={valor.sexo || 'Todos'}
                          onValueChange={(v: 'Masculino' | 'Feminino' | 'Todos') => atualizarValorReferencia(index, 'sexo', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Todos">Todos</SelectItem>
                            <SelectItem value="Masculino">Masculino</SelectItem>
                            <SelectItem value="Feminino">Feminino</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {(valor.variacaoPor === 'Idade' || valor.variacaoPor === 'Ambos') && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <Label>Idade Mínima (anos)</Label>
                          <Input
                            type="number"
                            value={valor.idadeMinima !== undefined ? valor.idadeMinima : ''}
                            onChange={(e) => atualizarValorReferencia(index, 'idadeMinima', Number(e.target.value))}
                            placeholder="Ex: 18"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Idade Máxima (anos)</Label>
                          <Input
                            type="number"
                            value={valor.idadeMaxima !== undefined ? valor.idadeMaxima : ''}
                            onChange={(e) => atualizarValorReferencia(index, 'idadeMaxima', Number(e.target.value))}
                            placeholder="Ex: 65"
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="grid gap-2">
                      <Label>Unidade {valor.tipoValor === "Texto" ? "(opcional)" : "(obrigatório)"}</Label>
                      <Input
                        value={valor.unidade}
                        onChange={(e) => atualizarValorReferencia(index, 'unidade', e.target.value)}
                        placeholder="Ex: g/dL"
                        required={valor.tipoValor === "Numérico"}
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 pt-2">
                      <Switch 
                        checked={valor.representaAlteracao || false}
                        onCheckedChange={(checked) => 
                          atualizarValorReferencia(index, 'representaAlteracao', checked)
                        }
                        id={`alteracao-${index}`}
                      />
                      <Label htmlFor={`alteracao-${index}`}>Este valor representa uma alteração</Label>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0 ml-1">
                              <HelpCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Marque se este valor representa uma condição alterada.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    {valor.representaAlteracao && (
                      <>
                        <div className="grid gap-2">
                          <Label>Título da Alteração</Label>
                          <Input
                            value={valor.tituloAlteracao || ''}
                            onChange={(e) => atualizarValorReferencia(index, 'tituloAlteracao', e.target.value)}
                            placeholder="Ex: Anemia, Leucocitose, etc."
                          />
                        </div>
                        
                        <div className="grid gap-2 border-t pt-3 mt-2">
                          <Label>Vínculo com Diagnóstico</Label>
                          
                          <div className="grid gap-3">
                            <div>
                              <Label className="text-sm text-muted-foreground mb-1 block">
                                1. Selecione as Necessidades Humanas Básicas (NHB)
                              </Label>
                              <div className="flex flex-wrap gap-1 mb-2">
                                {(valor.nhbIds || []).map((id) => (
                                  <Badge 
                                    key={id} 
                                    variant="secondary"
                                    className="flex items-center gap-1"
                                  >
                                    {getNhbName(id)}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-4 w-4 p-0"
                                      onClick={() => toggleNhb(index, id)}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </Badge>
                                ))}
                              </div>
                              
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                                    <Plus className="h-4 w-4" /> Adicionar NHB
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                  <ScrollArea className="h-72">
                                    <div className="space-y-2">
                                      {subconjuntos.map((nhb) => (
                                        <div 
                                          key={nhb.id} 
                                          className="flex items-center gap-2 p-2 hover:bg-muted rounded-md cursor-pointer"
                                          onClick={() => toggleNhb(index, nhb.id!)}
                                        >
                                          <div className={`w-4 h-4 border rounded-sm flex items-center justify-center ${(valor.nhbIds || []).includes(nhb.id!) ? 'bg-primary border-primary' : 'border-input'}`}>
                                            {(valor.nhbIds || []).includes(nhb.id!) && <div className="w-2 h-2 bg-white rounded-sm" />}
                                          </div>
                                          <span>{nhb.nome}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </ScrollArea>
                                </PopoverContent>
                              </Popover>
                            </div>
                            
                            {(valor.nhbIds || []).length > 0 && (
                              <div>
                                <Label className="text-sm text-muted-foreground mb-1 block">
                                  2. Selecione os Diagnósticos
                                </Label>
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {(valor.diagnosticoIds || []).map((id) => (
                                    <Badge 
                                      key={id} 
                                      variant="secondary"
                                      className="flex items-center gap-1 max-w-full"
                                    >
                                      <span className="truncate">{getDiagnosticoName(id)}</span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-4 w-4 p-0 flex-shrink-0"
                                        onClick={() => toggleDiagnostico(index, id)}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </Badge>
                                  ))}
                                </div>
                                
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                                      <Plus className="h-4 w-4" /> Adicionar Diagnóstico
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-80">
                                    {diagnosticosFiltrados.length > 0 ? (
                                      <ScrollArea className="h-72">
                                        <div className="space-y-2">
                                          {diagnosticosFiltrados.map((diag) => (
                                            <div 
                                              key={diag.id} 
                                              className="flex items-center gap-2 p-2 hover:bg-muted rounded-md cursor-pointer"
                                              onClick={() => toggleDiagnostico(index, diag.id!)}
                                            >
                                              <div className={`w-4 h-4 border rounded-sm flex items-center justify-center ${(valor.diagnosticoIds || []).includes(diag.id!) ? 'bg-primary border-primary' : 'border-input'}`}>
                                                {(valor.diagnosticoIds || []).includes(diag.id!) && <div className="w-2 h-2 bg-white rounded-sm" />}
                                              </div>
                                              <span className="truncate">{diag.nome || diag.descricao}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </ScrollArea>
                                    ) : (
                                      <div className="text-sm text-muted-foreground p-2">
                                        Selecione pelo menos uma NHB para ver os diagnósticos disponíveis
                                      </div>
                                    )}
                                  </PopoverContent>
                                </Popover>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarExame} className="bg-csae-green-600 hover:bg-csae-green-700">
              {editandoId ? 'Atualizar' : 'Cadastrar'} Exame
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default GerenciadorExamesLaboratoriais;
