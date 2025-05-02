
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
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { RevisaoSistema, SistemaCorporal } from '@/services/bancodados/tipos';

const GerenciadorRevisaoSistemas = () => {
  const { toast } = useToast();
  const [revisoesSistema, setRevisoesSistema] = useState<RevisaoSistema[]>([]);
  const [sistemasCorporais, setSistemasCorporais] = useState<SistemaCorporal[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [revisaoSistema, setRevisaoSistema] = useState<RevisaoSistema>({
    nome: "",
    sistemaCorporalId: "",
    sistemaId: "",
    sistemaNome: "",
    diferencaSexoIdade: false,
    valoresReferencia: [
      {
        unidade: "",
        representaAlteracao: false,
        variacaoPor: "Nenhum",
        tipoValor: "Numérico"
      }
    ]
  });

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const revisoesRef = collection(db, 'revisoesSistema');
        const revisoesSnapshot = await getDocs(revisoesRef);
        const revisoesData = revisoesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as RevisaoSistema[];
        setRevisoesSistema(revisoesData);

        const sistemasRef = collection(db, 'sistemasCorporais');
        const sistemasSnapshot = await getDocs(sistemasRef);
        const sistemasData = sistemasSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as SistemaCorporal[];
        setSistemasCorporais(sistemasData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados.",
          variant: "destructive"
        });
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, [toast]);

  const abrirModalCriar = () => {
    setRevisaoSistema({
      nome: "",
      sistemaCorporalId: "",
      sistemaId: "",
      sistemaNome: "",
      diferencaSexoIdade: false,
      valoresReferencia: [
        {
          unidade: "",
          representaAlteracao: false,
          variacaoPor: "Nenhum",
          tipoValor: "Numérico"
        }
      ]
    });
    setEditandoId(null);
    setModalAberto(true);
  };

  const abrirModalEditar = (revisao: RevisaoSistema) => {
    setRevisaoSistema(revisao);
    setEditandoId(revisao.id || null);
    setModalAberto(true);
  };

  const salvarRevisaoSistema = async () => {
    try {
      if (!revisaoSistema.nome?.trim() || !revisaoSistema.sistemaId?.trim()) {
        toast({
          title: "Campos obrigatórios",
          description: "Nome e Sistema Corporal são obrigatórios.",
          variant: "destructive"
        });
        return;
      }

      if (editandoId) {
        const revisaoRef = doc(db, 'revisoesSistema', editandoId);
        await updateDoc(revisaoRef, {
          ...revisaoSistema,
          updatedAt: serverTimestamp()
        });

        toast({
          title: "Revisão de Sistema atualizada",
          description: `${revisaoSistema.nome} foi atualizada com sucesso.`
        });

        setRevisoesSistema(prev =>
          prev.map(r => r.id === editandoId ? { ...revisaoSistema, id: editandoId } : r)
        );
      } else {
        const novaRevisao = {
          ...revisaoSistema,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'revisoesSistema'), novaRevisao);

        toast({
          title: "Revisão de Sistema criada",
          description: `${revisaoSistema.nome} foi criada com sucesso.`
        });

        // Fix type issue: add type assertion for novaRevisao with serverTimestamp
        setRevisoesSistema(prev => [...prev, { ...revisaoSistema, id: docRef.id, createdAt: Timestamp.now(), updatedAt: Timestamp.now() }]);
      }

      setModalAberto(false);
    } catch (error) {
      console.error("Erro ao salvar revisão de sistema:", error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar a revisão de sistema.",
        variant: "destructive"
      });
    }
  };

  const excluirRevisaoSistema = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta revisão de sistema? Esta ação não pode ser desfeita.")) {
      try {
        await deleteDoc(doc(db, 'revisoesSistema', id));

        toast({
          title: "Revisão de Sistema excluída",
          description: "A revisão de sistema foi excluída com sucesso."
        });

        setRevisoesSistema(prev => prev.filter(r => r.id !== id));
      } catch (error) {
        console.error("Erro ao excluir revisão de sistema:", error);
        toast({
          title: "Erro ao excluir",
          description: "Ocorreu um erro ao excluir a revisão de sistema.",
          variant: "destructive"
        });
      }
    }
  };

  const handleSistemaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSistemaId = e.target.value;
    const selectedSistema = sistemasCorporais.find(s => s.id === selectedSistemaId);

    if (selectedSistema) {
      setRevisaoSistema({
        nome: revisaoSistema.nome,
        sistemaCorporalId: "", // Add this missing field
        sistemaId: selectedSistemaId,
        sistemaNome: selectedSistema.nome,
        diferencaSexoIdade: false,
        valoresReferencia: [
          {
            unidade: "",
            representaAlteracao: false,
            variacaoPor: "Nenhum",
            tipoValor: "Numérico"
          }
        ]
      });
    }
  };

  const handleNomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    const selectedSistemaId = revisaoSistema.sistemaId;
    const selectedSistemaNome = revisaoSistema.sistemaNome;

    setRevisaoSistema({
      nome: newName,
      sistemaCorporalId: "", // Add this missing field
      sistemaId: selectedSistemaId,
      sistemaNome: selectedSistemaNome,
      diferencaSexoIdade: false,
      valoresReferencia: [
        {
          unidade: "",
          representaAlteracao: false,
          variacaoPor: "Nenhum",
          tipoValor: "Numérico"
        }
      ]
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Gerenciamento de Revisão de Sistemas</span>
          <Button onClick={abrirModalCriar} className="bg-csae-green-600 hover:bg-csae-green-700">
            <Plus className="mr-2 h-4 w-4" /> Nova Revisão
          </Button>
        </CardTitle>
        <CardDescription>
          Cadastre e gerencie as revisões de sistemas do corpo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {carregando ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-csae-green-600"></div>
          </div>
        ) : revisoesSistema.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            Nenhuma revisão de sistema cadastrada. Clique em "Nova Revisão" para começar.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Sistema Corporal</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revisoesSistema.map((revisao) => (
                <TableRow key={revisao.id}>
                  <TableCell>{revisao.nome}</TableCell>
                  <TableCell>{revisao.sistemaNome}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="mr-2" onClick={() => abrirModalEditar(revisao)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => excluirRevisaoSistema(revisao.id!)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Modal para criar/editar revisão de sistema */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editandoId ? 'Editar' : 'Nova'} Revisão de Sistema</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para {editandoId ? 'atualizar' : 'cadastrar'} uma revisão de sistema.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome da Revisão*</Label>
              <Input
                id="nome"
                value={revisaoSistema.nome}
                onChange={handleNomeChange}
                placeholder="Ex: Revisão do Sistema Cardiovascular"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sistemaCorporal">Sistema Corporal*</Label>
              <select
                id="sistemaCorporal"
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                onChange={handleSistemaChange}
                value={revisaoSistema.sistemaId}
                required
              >
                <option value="">Selecione um sistema corporal</option>
                {sistemasCorporais.map(sistema => (
                  <option key={sistema.id} value={sistema.id}>{sistema.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <div className="w-full flex justify-between items-center">
              <p className="text-sm text-gray-500">* Campos obrigatórios</p>
              <div>
                <Button variant="outline" onClick={() => setModalAberto(false)} className="mr-2">
                  Cancelar
                </Button>
                <Button onClick={salvarRevisaoSistema} className="bg-csae-green-600 hover:bg-csae-green-700">
                  {editandoId ? 'Atualizar' : 'Cadastrar'} Revisão
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default GerenciadorRevisaoSistemas;
