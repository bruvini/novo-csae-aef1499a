
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

interface SinalVital {
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

const GerenciadorSinaisVitais = () => {
  const { toast } = useToast();
  const [sinaisVitais, setSinaisVitais] = useState<SinalVital[]>([]);
  const [nhbs, setNhbs] = useState<NHB[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  
  // Estado para o formulário
  const [formSinal, setFormSinal] = useState<SinalVital>({
    nome: '',
    diferencaSexoIdade: false,
    valoresReferencia: [{ unidade: '' }]
  });
  
  // Carregar os dados iniciais
  useEffect(() => {
    const carregarDados = async () => {
      try {
        // Carregar sinais vitais
        const sinaisRef = collection(db, 'sinaisVitais');
        const sinaisSnapshot = await getDocs(sinaisRef);
        const sinaisData = sinaisSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as SinalVital[];
        setSinaisVitais(sinaisData);
        
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
          description: "Não foi possível carregar os sinais vitais.",
          variant: "destructive"
        });
      } finally {
        setCarregando(false);
      }
    };
    
    carregarDados();
  }, [toast]);
  
  // Abrir modal para criar novo sinal vital
  const abrirModalCriar = () => {
    setFormSinal({
      nome: '',
      diferencaSexoIdade: false,
      valoresReferencia: [{ unidade: '' }]
    });
    setEditandoId(null);
    setModalAberto(true);
  };
  
  // Abrir modal para editar sinal vital existente
  const abrirModalEditar = (sinal: SinalVital) => {
    setFormSinal({...sinal});
    setEditandoId(sinal.id || null);
    setModalAberto(true);
  };
  
  // Adicionar valor de referência
  const adicionarValorReferencia = () => {
    setFormSinal({
      ...formSinal,
      valoresReferencia: [
        ...formSinal.valoresReferencia,
        { unidade: '' }
      ]
    });
  };
  
  // Remover valor de referência
  const removerValorReferencia = (index: number) => {
    const novosValores = [...formSinal.valoresReferencia];
    novosValores.splice(index, 1);
    setFormSinal({
      ...formSinal,
      valoresReferencia: novosValores
    });
  };
  
  // Atualizar valor de referência
  const atualizarValorReferencia = (index: number, campo: keyof ValorReferencia, valor: any) => {
    const novosValores = [...formSinal.valoresReferencia];
    novosValores[index] = {
      ...novosValores[index],
      [campo]: valor
    };
    setFormSinal({
      ...formSinal,
      valoresReferencia: novosValores
    });
  };
  
  // Salvar sinal vital (criar novo ou atualizar existente)
  const salvarSinalVital = async () => {
    try {
      if (!formSinal.nome.trim()) {
        toast({
          title: "Campo obrigatório",
          description: "Nome do sinal vital é obrigatório.",
          variant: "destructive"
        });
        return;
      }
      
      if (formSinal.valoresReferencia.some(vr => !vr.unidade.trim())) {
        toast({
          title: "Campo obrigatório",
          description: "Unidade é obrigatória para todos os valores de referência.",
          variant: "destructive"
        });
        return;
      }
      
      if (editandoId) {
        // Atualizar existente
        const sinalRef = doc(db, 'sinaisVitais', editandoId);
        await updateDoc(sinalRef, {
          ...formSinal,
          updatedAt: serverTimestamp()
        });
        
        toast({
          title: "Sinal vital atualizado",
          description: `${formSinal.nome} foi atualizado com sucesso.`
        });
        
        // Atualizar lista
        setSinaisVitais(prev => 
          prev.map(s => s.id === editandoId ? {...formSinal, id: editandoId, updatedAt: new Date()} : s)
        );
      } else {
        // Criar novo
        const novoSinal = {
          ...formSinal,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, 'sinaisVitais'), novoSinal);
        
        toast({
          title: "Sinal vital criado",
          description: `${formSinal.nome} foi criado com sucesso.`
        });
        
        // Adicionar à lista
        setSinaisVitais(prev => [...prev, {...novoSinal, id: docRef.id, createdAt: new Date(), updatedAt: new Date()}]);
      }
      
      setModalAberto(false);
    } catch (error) {
      console.error("Erro ao salvar sinal vital:", error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o sinal vital.",
        variant: "destructive"
      });
    }
  };
  
  // Excluir sinal vital
  const excluirSinalVital = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este sinal vital? Esta ação não pode ser desfeita.")) {
      try {
        await deleteDoc(doc(db, 'sinaisVitais', id));
        
        toast({
          title: "Sinal vital excluído",
          description: "O sinal vital foi excluído com sucesso."
        });
        
        // Remover da lista
        setSinaisVitais(prev => prev.filter(s => s.id !== id));
      } catch (error) {
        console.error("Erro ao excluir sinal vital:", error);
        toast({
          title: "Erro ao excluir",
          description: "Ocorreu um erro ao excluir o sinal vital.",
          variant: "destructive"
        });
      }
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Gerenciamento de Sinais Vitais</span>
          <Button onClick={abrirModalCriar} className="bg-csae-green-600 hover:bg-csae-green-700">
            <Plus className="mr-2 h-4 w-4" /> Novo Sinal Vital
          </Button>
        </CardTitle>
        <CardDescription>
          Cadastre e gerencie os sinais vitais utilizados no processo de enfermagem.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {carregando ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-csae-green-600"></div>
          </div>
        ) : sinaisVitais.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            Nenhum sinal vital cadastrado. Clique em "Novo Sinal Vital" para começar.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Sinal Vital</TableHead>
                <TableHead>Diferencia por Sexo/Idade</TableHead>
                <TableHead>Valores de Referência</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sinaisVitais.map((sinal) => (
                <TableRow key={sinal.id}>
                  <TableCell className="font-medium">{sinal.nome}</TableCell>
                  <TableCell>
                    {sinal.diferencaSexoIdade ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <X className="h-5 w-5 text-gray-400" />
                    )}
                  </TableCell>
                  <TableCell>{sinal.valoresReferencia.length} valores configurados</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="mr-2" onClick={() => abrirModalEditar(sinal)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => excluirSinalVital(sinal.id!)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      
      {/* Modal para criar/editar sinal vital */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editandoId ? 'Editar' : 'Novo'} Sinal Vital</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para {editandoId ? 'atualizar o' : 'cadastrar um novo'} sinal vital.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome do Sinal Vital</Label>
              <Input
                id="nome"
                value={formSinal.nome}
                onChange={(e) => setFormSinal({...formSinal, nome: e.target.value})}
                placeholder="Ex: Pressão Arterial"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="diferencaSexoIdade">Diferencia por Sexo/Idade</Label>
              <Switch
                id="diferencaSexoIdade"
                checked={formSinal.diferencaSexoIdade}
                onCheckedChange={(checked) => setFormSinal({...formSinal, diferencaSexoIdade: checked})}
              />
            </div>
            
            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label>Valores de Referência</Label>
                <Button type="button" variant="outline" size="sm" onClick={adicionarValorReferencia}>
                  <Plus className="h-4 w-4 mr-1" /> Adicionar Valor
                </Button>
              </div>
              
              {formSinal.valoresReferencia.map((valor, index) => (
                <Card key={index} className="p-4">
                  <div className="grid gap-3">
                    <div className="flex justify-between">
                      <h4 className="font-medium">Valor de Referência #{index + 1}</h4>
                      {formSinal.valoresReferencia.length > 1 && (
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
                    
                    {formSinal.diferencaSexoIdade && (
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
                          placeholder="Ex: 120"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Valor Máximo</Label>
                        <Input
                          type="number"
                          value={valor.valorMaximo || ''}
                          onChange={(e) => atualizarValorReferencia(index, 'valorMaximo', Number(e.target.value))}
                          placeholder="Ex: 139"
                        />
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label>Unidade</Label>
                      <Input
                        value={valor.unidade}
                        onChange={(e) => atualizarValorReferencia(index, 'unidade', e.target.value)}
                        placeholder="Ex: mmHg"
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
            <Button onClick={salvarSinalVital} className="bg-csae-green-600 hover:bg-csae-green-700">
              {editandoId ? 'Atualizar' : 'Cadastrar'} Sinal Vital
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default GerenciadorSinaisVitais;
