import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { CasoClinico } from '@/services/bancodados/tipos';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const GerenciadorCasosClinicos = () => {
  const { toast } = useToast();
  const [casosClinicos, setCasosClinicos] = useState<CasoClinico[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Estado para o formulário
  const [formCasoClinico, setFormCasoClinico] = useState<Omit<CasoClinico, 'id' | 'updatedAt' | 'createdAt'>>({
    titulo: '',
    descricao: '',
    diagnosticos: [],
    tipoCaso: '',
    casoClinico: '',
    focoEsperado: ''
  });

  // Carregar os casos clínicos
  useEffect(() => {
    const carregarCasosClinicos = async () => {
      try {
        const casosClinicosRef = collection(db, 'casosClinicos');
        const casosClinicosSnapshot = await getDocs(casosClinicosRef);
        const casosClinicosData = casosClinicosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as CasoClinico[];
        setCasosClinicos(casosClinicosData);
      } catch (error) {
        console.error("Erro ao carregar casos clínicos:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os casos clínicos.",
          variant: "destructive"
        });
      } finally {
        setCarregando(false);
      }
    };

    carregarCasosClinicos();
  }, [toast]);

  // Abrir modal para criar novo caso clínico
  const abrirModalCriar = () => {
    setFormCasoClinico({
      titulo: '',
      descricao: '',
      diagnosticos: [],
      tipoCaso: '',
      casoClinico: '',
      focoEsperado: ''
    });
    setEditandoId(null);
    setModalAberto(true);
  };

  // Abrir modal para editar caso clínico existente
  const abrirModalEditar = (casoClinico: CasoClinico) => {
    setFormCasoClinico({
      titulo: casoClinico.titulo,
      descricao: casoClinico.descricao,
      diagnosticos: casoClinico.diagnosticos,
      tipoCaso: casoClinico.tipoCaso || '',
      casoClinico: casoClinico.casoClinico || '',
      focoEsperado: casoClinico.focoEsperado || ''
    });
    setEditandoId(casoClinico.id || null);
    setModalAberto(true);
  };

  // Salvar caso clínico (criar novo ou atualizar existente)
  const salvarCasoClinico = async () => {
    try {
      // Validação dos campos obrigatórios
      if (!formCasoClinico.titulo?.trim() || !formCasoClinico.descricao?.trim()) {
        toast({
          title: "Campos obrigatórios",
          description: "Título e descrição são obrigatórios.",
          variant: "destructive"
        });
        return;
      }

      if (editandoId) {
        // Atualizar existente
        const casoClinicoRef = doc(db, 'casosClinicos', editandoId);
        await updateDoc(casoClinicoRef, {
          ...formCasoClinico,
          updatedAt: serverTimestamp()
        });

        toast({
          title: "Caso clínico atualizado",
          description: `${formCasoClinico.titulo} foi atualizado com sucesso.`
        });

        // Atualizar lista
        setCasosClinicos(prev =>
          prev.map(c => c.id === editandoId ? { ...c, ...formCasoClinico, updatedAt: Timestamp.now() } : c)
        );
      } else {
        // Criar novo
        const novoCasoClinico = {
          ...formCasoClinico,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'casosClinicos'), novoCasoClinico);

        toast({
          title: "Caso clínico criado",
          description: `${formCasoClinico.titulo} foi criado com sucesso.`
        });

        // Adicionar à lista
        setCasosClinicos(prev => [...prev, {
          ...novoCasoClinico,
          id: docRef.id
        } as CasoClinico]);
      }

      setModalAberto(false);
    } catch (error) {
      console.error("Erro ao salvar caso clínico:", error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o caso clínico.",
        variant: "destructive"
      });
    }
  };

  // Excluir caso clínico
  const excluirCasoClinico = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este caso clínico? Esta ação não pode ser desfeita.")) {
      try {
        await deleteDoc(doc(db, 'casosClinicos', id));

        toast({
          title: "Caso clínico excluído",
          description: "O caso clínico foi excluído com sucesso."
        });

        // Remover da lista
        setCasosClinicos(prev => prev.filter(c => c.id !== id));
      } catch (error) {
        console.error("Erro ao excluir caso clínico:", error);
        toast({
          title: "Erro ao excluir",
          description: "Ocorreu um erro ao excluir o caso clínico.",
          variant: "destructive"
        });
      }
    }
  };

  // Formatar data
  const formatarData = (timestamp: any) => {
    if (!timestamp) return 'Data não definida';

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return 'Data inválida';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Gerenciamento de Casos Clínicos</span>
          <Button onClick={abrirModalCriar} className="bg-csae-green-600 hover:bg-csae-green-700">
            <Plus className="mr-2 h-4 w-4" /> Novo Caso Clínico
          </Button>
        </CardTitle>
        <CardDescription>
          Cadastre e gerencie os casos clínicos para discussão e aprendizado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {carregando ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-csae-green-600"></div>
          </div>
        ) : casosClinicos.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            Nenhum caso clínico cadastrado. Clique em "Novo Caso Clínico" para começar.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Atualizado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {casosClinicos.map((casoClinico) => (
                <TableRow key={casoClinico.id}>
                  <TableCell className="font-medium">{casoClinico.titulo}</TableCell>
                  <TableCell>{casoClinico.tipoCaso}</TableCell>
                  <TableCell>{formatarData(casoClinico.createdAt)}</TableCell>
                  <TableCell>
                    {casoClinico.updatedAt ? formatarData(casoClinico.updatedAt) : 'Não atualizado'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="mr-2" onClick={() => abrirModalEditar(casoClinico)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => excluirCasoClinico(casoClinico.id!)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Modal para criar/editar caso clínico */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editandoId ? 'Editar' : 'Novo'} Caso Clínico</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para {editandoId ? 'atualizar o' : 'cadastrar um novo'} caso clínico.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="titulo">Título do Caso Clínico*</Label>
              <Input
                id="titulo"
                value={formCasoClinico.titulo}
                onChange={(e) => setFormCasoClinico({ ...formCasoClinico, titulo: e.target.value })}
                placeholder="Ex: Paciente com HAS e DM2"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tipoCaso">Tipo de Caso Clínico</Label>
              <Input
                id="tipoCaso"
                value={formCasoClinico.tipoCaso}
                onChange={(e) => setFormCasoClinico({ ...formCasoClinico, tipoCaso: e.target.value })}
                placeholder="Ex: Urgência, Emergência, Ambulatorial"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="descricao">Descrição*</Label>
              <Textarea
                id="descricao"
                value={formCasoClinico.descricao}
                onChange={(e) => setFormCasoClinico({ ...formCasoClinico, descricao: e.target.value })}
                placeholder="Descreva brevemente a situação do paciente..."
                rows={4}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="casoClinico">Caso Clínico Detalhado</Label>
              <Textarea
                id="casoClinico"
                value={formCasoClinico.casoClinico}
                onChange={(e) => setFormCasoClinico({ ...formCasoClinico, casoClinico: e.target.value })}
                placeholder="Apresente o caso clínico detalhadamente..."
                rows={6}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="focoEsperado">Foco Esperado</Label>
              <Textarea
                id="focoEsperado"
                value={formCasoClinico.focoEsperado}
                onChange={(e) => setFormCasoClinico({ ...formCasoClinico, focoEsperado: e.target.value })}
                placeholder="Qual o foco principal deste caso clínico?"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <div className="w-full flex justify-between items-center">
              <p className="text-sm text-gray-500">* Campos obrigatórios</p>
              <div>
                <Button variant="outline" onClick={() => setModalAberto(false)} className="mr-2">
                  Cancelar
                </Button>
                <Button onClick={salvarCasoClinico} className="bg-csae-green-600 hover:bg-csae-green-700">
                  {editandoId ? 'Atualizar' : 'Cadastrar'} Caso Clínico
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default GerenciadorCasosClinicos;
