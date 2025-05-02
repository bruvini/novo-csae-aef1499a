
import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { CasoClinico, TermoCipe } from '@/services/bancodados/tipos';
import { PencilIcon, TrashIcon, PlusCircle, Search, Eye } from 'lucide-react';
import { db } from '@/services/firebase';
import { 
  collection, 
  getDocs, 
  getDoc,
  doc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  addDoc, 
  serverTimestamp,
  query,
  where
} from 'firebase/firestore';

const GerenciadorCasosClinicos: React.FC = () => {
  const { toast } = useToast();
  const [casos, setCasos] = useState<CasoClinico[]>([]);
  const [filteredCasos, setFilteredCasos] = useState<CasoClinico[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [selectedCaso, setSelectedCaso] = useState<CasoClinico | null>(null);
  
  // Lista de termos para os selects
  const [termosFoco, setTermosFoco] = useState<{id: string, termo: string}[]>([]);
  const [termosJulgamento, setTermosJulgamento] = useState<{id: string, termo: string}[]>([]);
  const [termosMeios, setTermosMeios] = useState<{id: string, termo: string}[]>([]);
  const [termosAcao, setTermosAcao] = useState<{id: string, termo: string}[]>([]);
  const [termosTempo, setTermosTempo] = useState<{id: string, termo: string}[]>([]);
  const [termosLocalizacao, setTermosLocalizacao] = useState<{id: string, termo: string}[]>([]);
  const [termosCliente, setTermosCliente] = useState<{id: string, termo: string}[]>([]);
  
  const [formData, setFormData] = useState<Omit<CasoClinico, 'id' | 'createdAt' | 'updatedAt'>>({
    tipoCaso: 'Diagnóstico',
    casoClinico: '',
    focoEsperado: null,
    julgamentoEsperado: null,
    meioEsperado: null,
    acaoEsperado: null,
    tempoEsperado: null,
    localizacaoEsperado: null,
    clienteEsperado: null,
    arrayVencedor: []
  });
  
  useEffect(() => {
    fetchCasos();
    fetchTermos();
  }, []);
  
  useEffect(() => {
    if (searchTerm) {
      const filtered = casos.filter(caso => 
        caso.casoClinico.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCasos(filtered);
    } else {
      setFilteredCasos(casos);
    }
  }, [searchTerm, casos]);
  
  const fetchTermos = async () => {
    try {
      const termosSnapshot = await getDocs(collection(db, 'termosCipe'));
      
      if (!termosSnapshot.empty) {
        const docData = termosSnapshot.docs[0].data();
        
        // Processar cada tipo de termo
        const extractTermos = (array: any[], fieldName: string) => {
          if (array && Array.isArray(array)) {
            return array.map(item => ({
              id: item[fieldName] || '', 
              termo: item[fieldName] || ''
            }));
          }
          return [];
        };
        
        setTermosFoco(extractTermos(docData.arrayFoco || [], 'termoFoco'));
        setTermosJulgamento(extractTermos(docData.arrayJulgamento || [], 'termoJulgamento'));
        setTermosMeios(extractTermos(docData.arrayMeios || [], 'termoMeios'));
        setTermosAcao(extractTermos(docData.arrayAcao || [], 'termoAcao'));
        setTermosTempo(extractTermos(docData.arrayTempo || [], 'termoTempo'));
        setTermosLocalizacao(extractTermos(docData.arrayLocalizacao || [], 'termoLocalizacao'));
        setTermosCliente(extractTermos(docData.arrayCliente || [], 'termoCliente'));
      }
    } catch (error) {
      console.error("Erro ao carregar termos:", error);
    }
  };

  const fetchCasos = async () => {
    setIsLoading(true);
    try {
      const casosRef = collection(db, 'casosClinicos');
      const casosSnapshot = await getDocs(casosRef);
      
      const casosData: CasoClinico[] = [];
      casosSnapshot.forEach(doc => {
        casosData.push({
          id: doc.id,
          ...doc.data() as Omit<CasoClinico, 'id'>
        });
      });
      
      setCasos(casosData);
      setFilteredCasos(casosData);
    } catch (error) {
      console.error("Erro ao buscar casos clínicos:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar casos clínicos",
        description: "Não foi possível carregar os casos clínicos. Tente novamente mais tarde."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string, fieldName: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value || null }));
  };

  const resetForm = () => {
    setFormData({
      tipoCaso: 'Diagnóstico',
      casoClinico: '',
      focoEsperado: null,
      julgamentoEsperado: null,
      meioEsperado: null,
      acaoEsperado: null,
      tempoEsperado: null,
      localizacaoEsperado: null,
      clienteEsperado: null,
      arrayVencedor: []
    });
    setSelectedCaso(null);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (caso: CasoClinico) => {
    setSelectedCaso(caso);
    setFormData({
      tipoCaso: caso.tipoCaso,
      casoClinico: caso.casoClinico,
      focoEsperado: caso.focoEsperado,
      julgamentoEsperado: caso.julgamentoEsperado,
      meioEsperado: caso.meioEsperado,
      acaoEsperado: caso.acaoEsperado,
      tempoEsperado: caso.tempoEsperado,
      localizacaoEsperado: caso.localizacaoEsperado,
      clienteEsperado: caso.clienteEsperado,
      arrayVencedor: caso.arrayVencedor || []
    });
    setDialogOpen(true);
  };

  const openViewDialog = (caso: CasoClinico) => {
    setSelectedCaso(caso);
    setViewDialogOpen(true);
  };

  const openDeleteDialog = (caso: CasoClinico) => {
    setSelectedCaso(caso);
    setAlertDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.casoClinico.trim()) {
        toast({
          variant: "destructive",
          title: "Campo obrigatório",
          description: "O caso clínico não pode estar vazio."
        });
        return;
      }

      const casoData = {
        ...formData,
        updatedAt: serverTimestamp()
      };

      // Verificar se é edição ou criação
      if (selectedCaso?.id) {
        // Editar caso existente
        const casoRef = doc(db, 'casosClinicos', selectedCaso.id);
        await updateDoc(casoRef, casoData);
        
        toast({
          title: "Caso clínico atualizado",
          description: "O caso clínico foi atualizado com sucesso."
        });
      } else {
        // Criar novo caso
        const newCasoData = {
          ...casoData,
          createdAt: serverTimestamp()
        };
        
        await addDoc(collection(db, 'casosClinicos'), newCasoData);
        
        toast({
          title: "Caso clínico criado",
          description: "O caso clínico foi criado com sucesso."
        });
      }
      
      // Recarregar casos e fechar diálogo
      fetchCasos();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Erro ao salvar caso clínico:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível salvar o caso clínico. Tente novamente mais tarde."
      });
    }
  };

  const handleDelete = async () => {
    try {
      if (selectedCaso?.id) {
        const casoRef = doc(db, 'casosClinicos', selectedCaso.id);
        await deleteDoc(casoRef);
        
        toast({
          title: "Caso clínico excluído",
          description: "O caso clínico foi excluído com sucesso."
        });
        
        // Recarregar casos
        fetchCasos();
      }
    } catch (error) {
      console.error("Erro ao excluir caso clínico:", error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: "Não foi possível excluir o caso clínico. Tente novamente mais tarde."
      });
    } finally {
      setAlertDialogOpen(false);
      setSelectedCaso(null);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Gerenciamento de Casos Clínicos</span>
          <Button onClick={openAddDialog} variant="outline" className="ml-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Caso Clínico
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filtro de busca */}
        <div className="flex w-full max-w-sm items-center space-x-2 mb-6">
          <Input
            type="text"
            placeholder="Buscar caso clínico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
          <Button variant="outline" type="button">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabela de casos clínicos */}
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
                  <TableHead>Caso Clínico</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCasos.length > 0 ? (
                  filteredCasos.map((caso) => (
                    <TableRow key={caso.id}>
                      <TableCell className="font-medium">{caso.tipoCaso}</TableCell>
                      <TableCell className="max-w-md truncate">{caso.casoClinico}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openViewDialog(caso)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(caso)}>
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(caso)}>
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      Nenhum caso clínico encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Dialog para adicionar/editar caso clínico */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedCaso ? "Editar Caso Clínico" : "Novo Caso Clínico"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
            <div className="grid w-full gap-1.5">
              <Label htmlFor="tipoCaso">Tipo de Caso</Label>
              <Select 
                value={formData.tipoCaso} 
                onValueChange={(value) => handleSelectChange(value, 'tipoCaso')}
              >
                <SelectTrigger id="tipoCaso">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Diagnóstico">Diagnóstico</SelectItem>
                  <SelectItem value="Ações">Ações</SelectItem>
                  <SelectItem value="Resultados">Resultados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid w-full gap-1.5">
              <Label htmlFor="casoClinico">Caso Clínico</Label>
              <Textarea
                id="casoClinico"
                name="casoClinico"
                value={formData.casoClinico}
                onChange={handleInputChange}
                placeholder="Descreva o caso clínico"
                rows={5}
                required
              />
            </div>
            
            {/* Selects para os termos esperados */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Foco */}
              <div className="grid w-full gap-1.5">
                <Label htmlFor="focoEsperado">Foco Esperado</Label>
                <Select 
                  value={formData.focoEsperado || ""} 
                  onValueChange={(value) => handleSelectChange(value, 'focoEsperado')}
                >
                  <SelectTrigger id="focoEsperado">
                    <SelectValue placeholder="Selecione o termo" />
                  </SelectTrigger>
                  <SelectContent>
                    {termosFoco.map((termo) => (
                      <SelectItem key={termo.id} value={termo.termo}>
                        {termo.termo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Julgamento */}
              <div className="grid w-full gap-1.5">
                <Label htmlFor="julgamentoEsperado">Julgamento Esperado</Label>
                <Select 
                  value={formData.julgamentoEsperado || ""} 
                  onValueChange={(value) => handleSelectChange(value, 'julgamentoEsperado')}
                >
                  <SelectTrigger id="julgamentoEsperado">
                    <SelectValue placeholder="Selecione o termo" />
                  </SelectTrigger>
                  <SelectContent>
                    {termosJulgamento.map((termo) => (
                      <SelectItem key={termo.id} value={termo.termo}>
                        {termo.termo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Meios */}
              <div className="grid w-full gap-1.5">
                <Label htmlFor="meioEsperado">Meio Esperado</Label>
                <Select 
                  value={formData.meioEsperado || ""} 
                  onValueChange={(value) => handleSelectChange(value, 'meioEsperado')}
                >
                  <SelectTrigger id="meioEsperado">
                    <SelectValue placeholder="Selecione o termo" />
                  </SelectTrigger>
                  <SelectContent>
                    {termosMeios.map((termo) => (
                      <SelectItem key={termo.id} value={termo.termo}>
                        {termo.termo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Ação */}
              <div className="grid w-full gap-1.5">
                <Label htmlFor="acaoEsperado">Ação Esperada</Label>
                <Select 
                  value={formData.acaoEsperado || ""} 
                  onValueChange={(value) => handleSelectChange(value, 'acaoEsperado')}
                >
                  <SelectTrigger id="acaoEsperado">
                    <SelectValue placeholder="Selecione o termo" />
                  </SelectTrigger>
                  <SelectContent>
                    {termosAcao.map((termo) => (
                      <SelectItem key={termo.id} value={termo.termo}>
                        {termo.termo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Tempo */}
              <div className="grid w-full gap-1.5">
                <Label htmlFor="tempoEsperado">Tempo Esperado</Label>
                <Select 
                  value={formData.tempoEsperado || ""} 
                  onValueChange={(value) => handleSelectChange(value, 'tempoEsperado')}
                >
                  <SelectTrigger id="tempoEsperado">
                    <SelectValue placeholder="Selecione o termo" />
                  </SelectTrigger>
                  <SelectContent>
                    {termosTempo.map((termo) => (
                      <SelectItem key={termo.id} value={termo.termo}>
                        {termo.termo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Localização */}
              <div className="grid w-full gap-1.5">
                <Label htmlFor="localizacaoEsperado">Localização Esperada</Label>
                <Select 
                  value={formData.localizacaoEsperado || ""} 
                  onValueChange={(value) => handleSelectChange(value, 'localizacaoEsperado')}
                >
                  <SelectTrigger id="localizacaoEsperado">
                    <SelectValue placeholder="Selecione o termo" />
                  </SelectTrigger>
                  <SelectContent>
                    {termosLocalizacao.map((termo) => (
                      <SelectItem key={termo.id} value={termo.termo}>
                        {termo.termo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Cliente */}
              <div className="grid w-full gap-1.5">
                <Label htmlFor="clienteEsperado">Cliente Esperado</Label>
                <Select 
                  value={formData.clienteEsperado || ""} 
                  onValueChange={(value) => handleSelectChange(value, 'clienteEsperado')}
                >
                  <SelectTrigger id="clienteEsperado">
                    <SelectValue placeholder="Selecione o termo" />
                  </SelectTrigger>
                  <SelectContent>
                    {termosCliente.map((termo) => (
                      <SelectItem key={termo.id} value={termo.termo}>
                        {termo.termo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {selectedCaso ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para visualizar caso clínico */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Caso Clínico</DialogTitle>
          </DialogHeader>
          {selectedCaso && (
            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
              <div className="grid w-full gap-1.5">
                <h3 className="font-semibold">Tipo de Caso</h3>
                <p>{selectedCaso.tipoCaso}</p>
              </div>
              
              <div className="grid w-full gap-1.5">
                <h3 className="font-semibold">Caso Clínico</h3>
                <div className="p-4 border rounded bg-slate-50 whitespace-pre-wrap">
                  {selectedCaso.casoClinico}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid w-full gap-1.5">
                  <h3 className="font-semibold">Foco Esperado</h3>
                  <p>{selectedCaso.focoEsperado || "Não definido"}</p>
                </div>
                
                <div className="grid w-full gap-1.5">
                  <h3 className="font-semibold">Julgamento Esperado</h3>
                  <p>{selectedCaso.julgamentoEsperado || "Não definido"}</p>
                </div>
                
                <div className="grid w-full gap-1.5">
                  <h3 className="font-semibold">Meio Esperado</h3>
                  <p>{selectedCaso.meioEsperado || "Não definido"}</p>
                </div>
                
                <div className="grid w-full gap-1.5">
                  <h3 className="font-semibold">Ação Esperada</h3>
                  <p>{selectedCaso.acaoEsperado || "Não definido"}</p>
                </div>
                
                <div className="grid w-full gap-1.5">
                  <h3 className="font-semibold">Tempo Esperado</h3>
                  <p>{selectedCaso.tempoEsperado || "Não definido"}</p>
                </div>
                
                <div className="grid w-full gap-1.5">
                  <h3 className="font-semibold">Localização Esperada</h3>
                  <p>{selectedCaso.localizacaoEsperado || "Não definido"}</p>
                </div>
                
                <div className="grid w-full gap-1.5">
                  <h3 className="font-semibold">Cliente Esperado</h3>
                  <p>{selectedCaso.clienteEsperado || "Não definido"}</p>
                </div>
              </div>
              
              <div className="grid w-full gap-1.5">
                <h3 className="font-semibold">Acertos (Vencedores)</h3>
                {selectedCaso.arrayVencedor && selectedCaso.arrayVencedor.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {selectedCaso.arrayVencedor.map((vencedor, index) => (
                      <li key={index}>{vencedor}</li>
                    ))}
                  </ul>
                ) : (
                  <p>Nenhum vencedor registrado</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewDialogOpen(false)}>
              Fechar
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
              Tem certeza que deseja excluir este caso clínico?
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

export default GerenciadorCasosClinicos;
