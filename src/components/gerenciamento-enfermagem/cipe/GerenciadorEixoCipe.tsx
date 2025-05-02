
import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
} from '@/components/ui/alert-dialog';
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { TermoCipe } from '@/services/bancodados/tipos';
import { PencilIcon, TrashIcon, PlusCircle, Search } from 'lucide-react';
import { db } from '@/services/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore';

interface GerenciadorEixoCipeProps {
  eixo: string;
  arrayName: string;
}

const GerenciadorEixoCipe: React.FC<GerenciadorEixoCipeProps> = ({ eixo, arrayName }) => {
  const { toast } = useToast();
  const [termos, setTermos] = useState<TermoCipe[]>([]);
  const [filteredTermos, setFilteredTermos] = useState<TermoCipe[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [selectedTermo, setSelectedTermo] = useState<TermoCipe | null>(null);
  const [formData, setFormData] = useState({
    tipo: '',
    termo: '',
    descricao: ''
  });
  
  // Campos específicos baseados no eixo
  const tipoField = `tipo${eixo}`;
  const termoField = `termo${eixo}`;
  const descricaoField = `descricao${eixo}`;
  
  useEffect(() => {
    fetchTermos();
  }, []);
  
  useEffect(() => {
    if (searchTerm) {
      const filtered = termos.filter(termo => 
        termo.termo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (termo.descricao && termo.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredTermos(filtered);
    } else {
      setFilteredTermos(termos);
    }
  }, [searchTerm, termos]);

  const fetchTermos = async () => {
    setIsLoading(true);
    try {
      const termosRef = collection(db, 'termosCipe');
      const termosSnapshot = await getDocs(termosRef);
      
      const termosData: TermoCipe[] = [];
      termosSnapshot.forEach(doc => {
        // Verificar se o documento tem o array específico
        const data = doc.data();
        if (data[arrayName] && Array.isArray(data[arrayName])) {
          // Mapear cada item do array para incluir o ID do documento
          data[arrayName].forEach((item: any) => {
            termosData.push({
              id: doc.id + '_' + item.termo, // ID composto para identificação única
              termo: item[termoField] || '',
              eixo: eixo,
              codigo: '',
              definicao: '',
              tipo: item[tipoField] || '',
              descricao: item[descricaoField] || '',
              createdAt: item.createdAt,
              updatedAt: item.updatedAt
            });
          });
        }
      });
      
      setTermos(termosData);
      setFilteredTermos(termosData);
    } catch (error) {
      console.error("Erro ao buscar termos:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar termos",
        description: "Não foi possível carregar os termos. Tente novamente mais tarde."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      tipo: '',
      termo: '',
      descricao: ''
    });
    setSelectedTermo(null);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (termo: TermoCipe) => {
    setSelectedTermo(termo);
    setFormData({
      tipo: termo.tipo || '',
      termo: termo.termo,
      descricao: termo.descricao || ''
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (termo: TermoCipe) => {
    setSelectedTermo(termo);
    setAlertDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.termo.trim()) {
        toast({
          variant: "destructive",
          title: "Campo obrigatório",
          description: "O termo não pode estar vazio."
        });
        return;
      }

      // Verificar se é edição ou criação
      if (selectedTermo) {
        // Lógica para editar termo existente
        const docId = selectedTermo.id.split('_')[0]; // Extrair ID do documento
        const docRef = doc(db, 'termosCipe', docId);
        
        // Buscar documento atual
        const docSnap = await getDocs(query(collection(db, 'termosCipe'), where('__name__', '==', docId)));
        if (!docSnap.empty) {
          const docData = docSnap.docs[0].data();
          const arrayData = docData[arrayName] || [];
          
          // Encontrar e atualizar o item específico no array
          const updatedArray = arrayData.map((item: any) => {
            if (item[termoField] === selectedTermo.termo) {
              return {
                [tipoField]: formData.tipo,
                [termoField]: formData.termo,
                [descricaoField]: formData.descricao,
                createdAt: item.createdAt || serverTimestamp(),
                updatedAt: serverTimestamp()
              };
            }
            return item;
          });
          
          // Atualizar o documento com o array atualizado
          await updateDoc(docRef, {
            [arrayName]: updatedArray
          });
          
          toast({
            title: "Termo atualizado",
            description: `O termo "${formData.termo}" foi atualizado com sucesso.`
          });
        }
      } else {
        // Lógica para criar novo termo
        // Verificar se já existe um documento para termosCipe
        const termosRef = collection(db, 'termosCipe');
        const termosSnapshot = await getDocs(termosRef);
        
        if (termosSnapshot.empty) {
          // Criar novo documento se não existir
          const newDoc = {
            [arrayName]: [{
              [tipoField]: formData.tipo,
              [termoField]: formData.termo,
              [descricaoField]: formData.descricao,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            }]
          };
          
          await addDoc(termosRef, newDoc);
        } else {
          // Usar o primeiro documento existente
          const docRef = doc(db, 'termosCipe', termosSnapshot.docs[0].id);
          await updateDoc(docRef, {
            [arrayName]: [
              ...termosSnapshot.docs[0].data()[arrayName] || [],
              {
                [tipoField]: formData.tipo,
                [termoField]: formData.termo,
                [descricaoField]: formData.descricao,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              }
            ]
          });
        }
        
        toast({
          title: "Termo criado",
          description: `O termo "${formData.termo}" foi criado com sucesso.`
        });
      }
      
      // Recarregar termos e fechar diálogo
      fetchTermos();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Erro ao salvar termo:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível salvar o termo. Tente novamente mais tarde."
      });
    }
  };

  const handleDelete = async () => {
    try {
      if (selectedTermo) {
        const docId = selectedTermo.id.split('_')[0]; // Extrair ID do documento
        const docRef = doc(db, 'termosCipe', docId);
        
        // Buscar documento atual
        const docSnap = await getDocs(query(collection(db, 'termosCipe'), where('__name__', '==', docId)));
        if (!docSnap.empty) {
          const docData = docSnap.docs[0].data();
          const arrayData = docData[arrayName] || [];
          
          // Filtrar o array para remover o item
          const updatedArray = arrayData.filter((item: any) => 
            item[termoField] !== selectedTermo.termo
          );
          
          // Atualizar o documento com o array atualizado
          await updateDoc(docRef, {
            [arrayName]: updatedArray
          });
          
          toast({
            title: "Termo excluído",
            description: `O termo "${selectedTermo.termo}" foi excluído com sucesso.`
          });
          
          // Recarregar termos
          fetchTermos();
        }
      }
    } catch (error) {
      console.error("Erro ao excluir termo:", error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: "Não foi possível excluir o termo. Tente novamente mais tarde."
      });
    } finally {
      setAlertDialogOpen(false);
      setSelectedTermo(null);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Gerenciamento de {eixo}</span>
          <Button onClick={openAddDialog} variant="outline" className="ml-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Termo
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filtro de busca */}
        <div className="flex w-full max-w-sm items-center space-x-2 mb-6">
          <Input
            type="text"
            placeholder={`Buscar termo de ${eixo}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
          <Button variant="outline" type="button">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabela de termos */}
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-csae-green-500"></div>
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Termo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTermos.length > 0 ? (
                  filteredTermos.map((termo) => (
                    <TableRow key={termo.id}>
                      <TableCell className="font-medium">{termo.tipo}</TableCell>
                      <TableCell>{termo.termo}</TableCell>
                      <TableCell className="max-w-md truncate">{termo.descricao}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(termo)}>
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(termo)}>
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      Nenhum termo encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Dialog para adicionar/editar termo */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTermo ? `Editar Termo de ${eixo}` : `Novo Termo de ${eixo}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid w-full gap-1.5">
              <Label htmlFor="tipo">Tipo</Label>
              <Input
                id="tipo"
                name="tipo"
                value={formData.tipo}
                onChange={handleInputChange}
                placeholder={`Tipo de ${eixo}`}
              />
            </div>
            <div className="grid w-full gap-1.5">
              <Label htmlFor="termo">Termo</Label>
              <Input
                id="termo"
                name="termo"
                value={formData.termo}
                onChange={handleInputChange}
                placeholder={`Termo de ${eixo}`}
                required
              />
            </div>
            <div className="grid w-full gap-1.5">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                name="descricao"
                value={formData.descricao}
                onChange={handleInputChange}
                placeholder="Descrição do termo"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {selectedTermo ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert dialog para confirmação de exclusão */}
      <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o termo "{selectedTermo?.termo}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default GerenciadorEixoCipe;
