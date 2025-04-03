
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
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';

interface ValorReferencia {
  idadeMinima?: number;
  idadeMaxima?: number;
  sexo?: 'Masculino' | 'Feminino' | 'Todos';
  valorMinimo?: number;
  valorMaximo?: number;
  unidade: string;
  nhbVinculada?: string;
}

interface ExameLaboratorial {
  id?: string;
  nome: string;
  diferencaSexoIdade: boolean;
  valoresReferencia: ValorReferencia[];
  createdAt?: any;
  updatedAt?: any;
}

interface NHB {
  id: string;
  nome: string;
}

const GerenciadorExamesLaboratoriais = () => {
  const { toast } = useToast();
  const [exames, setExames] = useState<ExameLaboratorial[]>([]);
  const [nhbs, setNhbs] = useState<NHB[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  
  // Estado para o formulário
  const [formExame, setFormExame] = useState<ExameLaboratorial>({
    nome: '',
    diferencaSexoIdade: false,
    valoresReferencia: [{ unidade: '' }]
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
        
        // Carregar NHBs
        const nhbsRef = collection(db, 'nhbs');
        const nhbsSnapshot = await getDocs(nhbsRef);
        const nhbsData = nhbsSnapshot.docs.map(doc => ({
          id: doc.id,
          nome: doc.data().nome
        })) as NHB[];
        setNhbs(nhbsData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os exames laboratoriais.",
          variant: "destructive"
        });
      } finally {
        setCarregando(false);
      }
    };
    
    carregarDados();
  }, [toast]);
  
  // Abrir modal para criar novo exame
  const abrirModalCriar = () => {
    setFormExame({
      nome: '',
      diferencaSexoIdade: false,
      valoresReferencia: [{ unidade: '' }]
    });
    setEditandoId(null);
    setModalAberto(true);
  };
  
  // Abrir modal para editar exame existente
  const abrirModalEditar = (exame: ExameLaboratorial) => {
    setFormExame({...exame});
    setEditandoId(exame.id || null);
    setModalAberto(true);
  };
  
  // Adicionar valor de referência
  const adicionarValorReferencia = () => {
    setFormExame({
      ...formExame,
      valoresReferencia: [
        ...formExame.valoresReferencia,
        { unidade: '' }
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
  const atualizarValorReferencia = (index: number, campo: keyof ValorReferencia, valor: any) => {
    const novosValores = [...formExame.valoresReferencia];
    novosValores[index] = {
      ...novosValores[index],
      [campo]: valor
    };
    setFormExame({
      ...formExame,
      valoresReferencia: novosValores
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
      
      if (formExame.valoresReferencia.some(vr => !vr.unidade.trim())) {
        toast({
          title: "Campo obrigatório",
          description: "Unidade é obrigatória para todos os valores de referência.",
          variant: "destructive"
        });
        return;
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
          prev.map(e => e.id === editandoId ? {...formExame, id: editandoId, updatedAt: new Date()} : e)
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
        setExames(prev => [...prev, {...novoExame, id: docRef.id, createdAt: new Date(), updatedAt: new Date()}]);
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
          <span>Gerenciamento de Exames Laboratoriais</span>
          <Button onClick={abrirModalCriar} className="bg-csae-green-600 hover:bg-csae-green-700">
            <Plus className="mr-2 h-4 w-4" /> Novo Exame
          </Button>
        </CardTitle>
        <CardDescription>
          Cadastre e gerencie os exames laboratoriais utilizados no processo de enfermagem.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {carregando ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-csae-green-600"></div>
          </div>
        ) : exames.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            Nenhum exame laboratorial cadastrado. Clique em "Novo Exame" para começar.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Exame</TableHead>
                <TableHead>Diferencia por Sexo/Idade</TableHead>
                <TableHead>Valores de Referência</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exames.map((exame) => (
                <TableRow key={exame.id}>
                  <TableCell className="font-medium">{exame.nome}</TableCell>
                  <TableCell>
                    {exame.diferencaSexoIdade ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <X className="h-5 w-5 text-gray-400" />
                    )}
                  </TableCell>
                  <TableCell>{exame.valoresReferencia.length} valores configurados</TableCell>
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
      
      {/* Modal para criar/editar exame - é praticamente o mesmo do GerenciadorSinaisVitais */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editandoId ? 'Editar' : 'Novo'} Exame Laboratorial</DialogTitle>
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
            
            <div className="flex items-center gap-2">
              <Label htmlFor="diferencaSexoIdade">Diferencia por Sexo/Idade</Label>
              <Switch
                id="diferencaSexoIdade"
                checked={formExame.diferencaSexoIdade}
                onCheckedChange={(checked) => setFormExame({...formExame, diferencaSexoIdade: checked})}
              />
            </div>
            
            {/* Valores de referência - mesmo código do GerenciadorSinaisVitais */}
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
                    
                    {formExame.diferencaSexoIdade && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="grid gap-2">
                            <Label>Idade Mínima (anos)</Label>
                            <Input
                              type="number"
                              value={valor.idadeMinima || ''}
                              onChange={(e) => atualizarValorReferencia(index, 'idadeMinima', Number(e.target.value))}
                              placeholder="Ex: 18"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>Idade Máxima (anos)</Label>
                            <Input
                              type="number"
                              value={valor.idadeMaxima || ''}
                              onChange={(e) => atualizarValorReferencia(index, 'idadeMaxima', Number(e.target.value))}
                              placeholder="Ex: 65"
                            />
                          </div>
                        </div>
                        
                        <div className="grid gap-2">
                          <Label>Sexo</Label>
                          <Select
                            value={valor.sexo || 'Todos'}
                            onValueChange={(v) => atualizarValorReferencia(index, 'sexo', v)}
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
                      </>
                    )}
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2">
                        <Label>Valor Mínimo</Label>
                        <Input
                          type="number"
                          value={valor.valorMinimo || ''}
                          onChange={(e) => atualizarValorReferencia(index, 'valorMinimo', Number(e.target.value))}
                          placeholder="Ex: 12"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Valor Máximo</Label>
                        <Input
                          type="number"
                          value={valor.valorMaximo || ''}
                          onChange={(e) => atualizarValorReferencia(index, 'valorMaximo', Number(e.target.value))}
                          placeholder="Ex: 16"
                        />
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label>Unidade</Label>
                      <Input
                        value={valor.unidade}
                        onChange={(e) => atualizarValorReferencia(index, 'unidade', e.target.value)}
                        placeholder="Ex: g/dL"
                        required
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label>NHB Vinculada</Label>
                      <Select
                        value={valor.nhbVinculada || ''}
                        onValueChange={(v) => atualizarValorReferencia(index, 'nhbVinculada', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma NHB" />
                        </SelectTrigger>
                        <SelectContent>
                          {nhbs.map((nhb) => (
                            <SelectItem key={nhb.id} value={nhb.id}>
                              {nhb.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
