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
import { Plus, Edit, Trash2, HelpCircle, Check, X } from 'lucide-react';
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
import { ValorReferencia, SinalVital, Subconjunto, DiagnosticoCompleto } from '@/services/bancodados/tipos';

const GerenciadorSinaisVitais = () => {
  const { toast } = useToast();
  const [sinaisVitais, setSinaisVitais] = useState<SinalVital[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  
  const [formSinalVital, setFormSinalVital] = useState<SinalVital>({
    nome: '',
    diferencaSexoIdade: false,
    valoresReferencia: [{ 
      unidade: '',
      representaAlteracao: false,
      variacaoPor: 'Nenhum',
      tipoValor: 'Numérico'
    }]
  });
  
  useEffect(() => {
    const carregarDados = async () => {
      try {
        const sinaisVitaisRef = collection(db, 'sinaisVitais');
        const sinaisVitaisSnapshot = await getDocs(sinaisVitaisRef);
        const sinaisVitaisData = sinaisVitaisSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as SinalVital[];
        setSinaisVitais(sinaisVitaisData);
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
  
  const abrirModalCriar = () => {
    setFormSinalVital({
      nome: '',
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
  };
  
  const abrirModalEditar = (sinalVital: SinalVital) => {
    setFormSinalVital({...sinalVital});
    setEditandoId(sinalVital.id || null);
    setModalAberto(true);
  };
  
  const adicionarValorReferencia = () => {
    setFormSinalVital({
      ...formSinalVital,
      valoresReferencia: [
        ...formSinalVital.valoresReferencia,
        { 
          unidade: '',
          representaAlteracao: false,
          variacaoPor: 'Nenhum',
          tipoValor: 'Numérico'
        }
      ]
    });
  };
  
  const removerValorReferencia = (index: number) => {
    const novosValores = [...formSinalVital.valoresReferencia];
    novosValores.splice(index, 1);
    setFormSinalVital({
      ...formSinalVital,
      valoresReferencia: novosValores
    });
  };
  
  const atualizarValorReferencia = (index: number, campo: keyof ValorReferencia, valor: any) => {
    const novosValores = [...formSinalVital.valoresReferencia];
    novosValores[index] = {
      ...novosValores[index],
      [campo]: valor
    };
    setFormSinalVital({
      ...formSinalVital,
      valoresReferencia: novosValores
    });
  };
  
  const salvarSinalVital = async () => {
    try {
      if (!formSinalVital.nome.trim()) {
        toast({
          title: "Campo obrigatório",
          description: "Nome do sinal vital é obrigatório.",
          variant: "destructive"
        });
        return;
      }
      
      if (formSinalVital.valoresReferencia.some(vr => !vr.unidade.trim())) {
        toast({
          title: "Campo obrigatório",
          description: "Unidade é obrigatória para todos os valores de referência.",
          variant: "destructive"
        });
        return;
      }
      
      if (editandoId) {
        const sinalVitalRef = doc(db, 'sinaisVitais', editandoId);
        await updateDoc(sinalVitalRef, {
          ...formSinalVital,
          updatedAt: serverTimestamp()
        });
        
        toast({
          title: "Sinal vital atualizado",
          description: `${formSinalVital.nome} foi atualizado com sucesso.`
        });
        
        setSinaisVitais(prev => 
          prev.map(sv => sv.id === editandoId ? {...formSinalVital, id: editandoId, updatedAt: new Date() as any} : sv)
        );
      } else {
        const novoSinalVital = {
          ...formSinalVital,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, 'sinaisVitais'), novoSinalVital);
        
        toast({
          title: "Sinal vital criado",
          description: `${formSinalVital.nome} foi criado com sucesso.`
        });
        
        setSinaisVitais(prev => [...prev, {...novoSinalVital, id: docRef.id, createdAt: new Date() as any, updatedAt: new Date() as any}]);
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
  
  const excluirSinalVital = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este sinal vital? Esta ação não pode ser desfeita.")) {
      try {
        await deleteDoc(doc(db, 'sinaisVitais', id));
        
        toast({
          title: "Sinal vital excluído",
          description: "O sinal vital foi excluído com sucesso."
        });
        
        setSinaisVitais(prev => prev.filter(sv => sv.id !== id));
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
                <TableHead>Valores de Referência</TableHead>
                <TableHead>Diferença Sexo/Idade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sinaisVitais.map((sinalVital) => (
                <TableRow key={sinalVital.id}>
                  <TableCell className="font-medium">{sinalVital.nome}</TableCell>
                  <TableCell>{sinalVital.valoresReferencia.length} valores configurados</TableCell>
                  <TableCell>
                    {sinalVital.diferencaSexoIdade ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="mr-2" onClick={() => abrirModalEditar(sinalVital)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => excluirSinalVital(sinalVital.id!)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      
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
                value={formSinalVital.nome}
                onChange={(e) => setFormSinalVital({...formSinalVital, nome: e.target.value})}
                placeholder="Ex: Pressão Arterial Sistólica"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                checked={formSinalVital.diferencaSexoIdade}
                onCheckedChange={(checked) => setFormSinalVital({...formSinalVital, diferencaSexoIdade: checked})}
                id="diferencaSexoIdade"
              />
              <Label htmlFor="diferencaSexoIdade">Valores de referência diferentes por sexo e idade</Label>
            </div>
            
            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label>Valores de Referência</Label>
                <Button type="button" variant="outline" size="sm" onClick={adicionarValorReferencia}>
                  <Plus className="h-4 w-4 mr-1" /> Adicionar Valor
                </Button>
              </div>
              
              {formSinalVital.valoresReferencia.map((valor, index) => (
                <Card key={index} className="p-4">
                  <div className="grid gap-3">
                    <div className="flex justify-between">
                      <h4 className="font-medium">Valor de Referência #{index + 1}</h4>
                      {formSinalVital.valoresReferencia.length > 1 && (
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
                    
                    <div className="grid gap-2">
                      <Label>Unidade</Label>
                      <Input
                        value={valor.unidade}
                        onChange={(e) => atualizarValorReferencia(index, 'unidade', e.target.value)}
                        placeholder="Ex: mmHg"
                        required
                      />
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
