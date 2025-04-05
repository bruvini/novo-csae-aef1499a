
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { X, Plus, Pencil, Trash2, FileText, Info, Save, Loader2, FilePlus2, ClipboardList } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Firebase
import { db } from '@/services/firebase';
import { 
  collection, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  Timestamp 
} from 'firebase/firestore';

// Tipos
import { DiagnosticoCompleto, Intervencao, NHB, ProtocoloEnfermagem } from '@/services/bancodados/tipos';

// Componentes
import GerenciadorSubconjuntos from './GerenciadorSubconjuntos';

const GerenciadorDiagnosticos = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('diagnosticos');
  
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoCompleto[]>([]);
  const [nhbs, setNHBs] = useState<NHB[]>([]);
  const [protocolos, setProtocolos] = useState<ProtocoloEnfermagem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  
  // Estado para o formulário de diagnóstico
  const [formDiagnostico, setFormDiagnostico] = useState<Partial<DiagnosticoCompleto>>({
    descricao: '',
    subconjunto: 'Necessidades Humanas Básicas', // Valor padrão
    subitemId: '',
    subitemNome: '',
    explicacao: '',
    intervencoes: []
  });
  
  // Estado para nova intervenção
  const [novaIntervencao, setNovaIntervencao] = useState({
    descricao: '',
    linkArquivo: '',
    verboPresentePrimeiraPessoa: '',
    verboInfinitivo: '',
    complementoIntervencao: ''
  });
  
  // Estado para as opções de subitem
  const [subitensDisponiveis, setSubitensDisponiveis] = useState<{id: string, nome: string}[]>([]);
  
  // Carregar dados iniciais
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setCarregando(true);

        // Carregar diagnósticos
        const diagnosticosSnapshot = await getDocs(collection(db, 'diagnosticos'));
        const diagnosticosData = diagnosticosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as DiagnosticoCompleto[];
        setDiagnosticos(diagnosticosData);

        // Carregar NHBs
        const nhbsSnapshot = await getDocs(collection(db, 'nhbs'));
        const nhbsData = nhbsSnapshot.docs.map(doc => ({
          id: doc.id,
          nome: doc.data().nome
        })) as NHB[];
        setNHBs(nhbsData);
        
        // Carregar Protocolos
        const protocolosSnapshot = await getDocs(collection(db, 'protocolos'));
        const protocolosData = protocolosSnapshot.docs.map(doc => ({
          id: doc.id,
          nome: doc.data().nome,
          volume: doc.data().volume
        })) as ProtocoloEnfermagem[];
        setProtocolos(protocolosData);

        setCarregando(false);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os diagnósticos de enfermagem.",
          variant: "destructive"
        });
        setCarregando(false);
      }
    };

    carregarDados();
  }, [toast]);

  // Atualizar subitens disponíveis quando o subconjunto mudar
  useEffect(() => {
    if (formDiagnostico.subconjunto === 'Necessidades Humanas Básicas') {
      // Ordenar NHBs por nome
      const sortedNHBs = [...nhbs].sort((a, b) => a.nome.localeCompare(b.nome));
      setSubitensDisponiveis(sortedNHBs.map(nhb => ({ id: nhb.id!, nome: nhb.nome })));
    } else if (formDiagnostico.subconjunto === 'Protocolo de Enfermagem') {
      // Ordenar protocolos por nome
      const sortedProtocolos = [...protocolos].sort((a, b) => a.nome.localeCompare(b.nome));
      setSubitensDisponiveis(sortedProtocolos.map(p => ({ id: p.id!, nome: `${p.volume} - ${p.nome}` })));
    } else {
      setSubitensDisponiveis([]);
    }
  }, [formDiagnostico.subconjunto, nhbs, protocolos]);

  const abrirModalCriar = () => {
    setFormDiagnostico({
      descricao: '',
      subconjunto: 'Necessidades Humanas Básicas', // Valor padrão
      subitemId: '',
      subitemNome: '',
      explicacao: '',
      intervencoes: []
    });
    setEditando(false);
    setModalAberto(true);
  };

  const abrirModalEditar = (diagnostico: DiagnosticoCompleto) => {
    setFormDiagnostico({
      ...diagnostico
    });
    setEditando(true);
    setModalAberto(true);
  };

  const handleSubconjuntoChange = (value: string) => {
    setFormDiagnostico({
      ...formDiagnostico,
      subconjunto: value as 'Protocolo de Enfermagem' | 'Necessidades Humanas Básicas',
      subitemId: '', // Resetar o subitem quando mudar o subconjunto
      subitemNome: ''
    });
  };

  const handleSubitemChange = (id: string) => {
    const subitemSelecionado = subitensDisponiveis.find(item => item.id === id);
    
    setFormDiagnostico({
      ...formDiagnostico,
      subitemId: id,
      subitemNome: subitemSelecionado?.nome || ''
    });
  };

  const adicionarIntervencao = () => {
    if (!novaIntervencao.descricao.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "A descrição da intervenção é obrigatória.",
        variant: "destructive"
      });
      return;
    }

    if (!novaIntervencao.verboPresentePrimeiraPessoa.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O verbo no presente do indicativo (1ª pessoa) é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    if (!novaIntervencao.verboInfinitivo.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O verbo no infinitivo é obrigatório.",
        variant: "destructive"
      });
      return;
    }
    
    // Validar URL do link se foi preenchido
    if (novaIntervencao.linkArquivo && !isValidURL(novaIntervencao.linkArquivo)) {
      toast({
        title: "URL inválida",
        description: "Por favor, insira uma URL válida para o arquivo.",
        variant: "destructive"
      });
      return;
    }

    const novaIntervencaoObj: Intervencao = {
      id: `interv_${Date.now()}`,
      descricao: novaIntervencao.descricao,
      verboPresentePrimeiraPessoa: novaIntervencao.verboPresentePrimeiraPessoa,
      verboInfinitivo: novaIntervencao.verboInfinitivo,
      complementoIntervencao: novaIntervencao.complementoIntervencao,
      linkArquivo: novaIntervencao.linkArquivo || undefined
    };

    setFormDiagnostico({
      ...formDiagnostico,
      intervencoes: [...(formDiagnostico.intervencoes || []), novaIntervencaoObj]
    });

    setNovaIntervencao({
      descricao: '',
      linkArquivo: '',
      verboPresentePrimeiraPessoa: '',
      verboInfinitivo: '',
      complementoIntervencao: ''
    });
  };

  const removerIntervencao = (id: string) => {
    setFormDiagnostico({
      ...formDiagnostico,
      intervencoes: formDiagnostico.intervencoes?.filter(i => i.id !== id) || []
    });
  };

  const isValidURL = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch (e) {
      return false;
    }
  };

  const salvarDiagnostico = async () => {
    // Validações
    if (!formDiagnostico.descricao?.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "A descrição do diagnóstico é obrigatória.",
        variant: "destructive"
      });
      return;
    }

    if (!formDiagnostico.subitemId) {
      toast({
        title: "Campo obrigatório",
        description: "Selecione um subitem para o diagnóstico.",
        variant: "destructive"
      });
      return;
    }

    if (!formDiagnostico.intervencoes?.length) {
      toast({
        title: "Intervenções necessárias",
        description: "Adicione pelo menos uma intervenção para o diagnóstico.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSalvando(true);

      if (editando && formDiagnostico.id) {
        // Atualizar diagnóstico existente
        const diagnosticoRef = doc(db, 'diagnosticos', formDiagnostico.id);
        await updateDoc(diagnosticoRef, {
          ...formDiagnostico,
          updatedAt: Timestamp.now()
        });

        toast({
          title: "Diagnóstico atualizado",
          description: "O diagnóstico foi atualizado com sucesso."
        });
      } else {
        // Criar novo diagnóstico
        const novoDiagnostico = {
          ...formDiagnostico,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };

        const docRef = await addDoc(collection(db, 'diagnosticos'), novoDiagnostico);
        
        toast({
          title: "Diagnóstico criado",
          description: "O novo diagnóstico foi criado com sucesso."
        });
      }

      // Atualizar lista de diagnósticos
      const diagnosticosSnapshot = await getDocs(collection(db, 'diagnosticos'));
      const diagnosticosData = diagnosticosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DiagnosticoCompleto[];
      setDiagnosticos(diagnosticosData);

      // Fechar modal
      setModalAberto(false);
    } catch (error) {
      console.error('Erro ao salvar diagnóstico:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o diagnóstico.",
        variant: "destructive"
      });
    } finally {
      setSalvando(false);
    }
  };

  const excluirDiagnostico = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este diagnóstico? Esta ação não pode ser desfeita.')) {
      try {
        await deleteDoc(doc(db, 'diagnosticos', id));
        
        setDiagnosticos(diagnosticos.filter(d => d.id !== id));
        
        toast({
          title: "Diagnóstico excluído",
          description: "O diagnóstico foi excluído com sucesso."
        });
      } catch (error) {
        console.error('Erro ao excluir diagnóstico:', error);
        toast({
          title: "Erro ao excluir",
          description: "Ocorreu um erro ao excluir o diagnóstico.",
          variant: "destructive"
        });
      }
    }
  };

  const DiagnosticosContent = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-csae-green-700">Diagnósticos</h3>
          <p className="text-sm text-gray-500">Lista de diagnósticos de enfermagem cadastrados</p>
        </div>
        <Button onClick={abrirModalCriar} className="bg-csae-green-600 hover:bg-csae-green-700">
          <Plus className="mr-2 h-4 w-4" /> Novo Diagnóstico
        </Button>
      </div>
      
      {carregando ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-12 w-12 animate-spin text-csae-green-600" />
        </div>
      ) : diagnosticos.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Nenhum diagnóstico de enfermagem cadastrado.</p>
          <p className="text-gray-500 mt-2">Clique em "Novo Diagnóstico" para começar.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Diagnóstico</TableHead>
              <TableHead>Subconjunto</TableHead>
              <TableHead>Subitem</TableHead>
              <TableHead>Intervenções</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {diagnosticos.map((diagnostico) => (
              <TableRow key={diagnostico.id}>
                <TableCell className="font-medium">{diagnostico.descricao}</TableCell>
                <TableCell>{diagnostico.subconjunto}</TableCell>
                <TableCell>{diagnostico.subitemNome}</TableCell>
                <TableCell>{diagnostico.intervencoes?.length || 0} intervenções</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm" onClick={() => abrirModalEditar(diagnostico)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-500"
                      onClick={() => excluirDiagnostico(diagnostico.id!)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Modal para criar/editar diagnóstico */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Diagnóstico' : 'Novo Diagnóstico'}</DialogTitle>
            <DialogDescription>
              {editando 
                ? 'Atualize as informações do diagnóstico de enfermagem.' 
                : 'Preencha as informações para cadastrar um novo diagnóstico de enfermagem.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Seleção de Subconjunto */}
            <div className="grid gap-2">
              <Label htmlFor="subconjunto">Subconjunto</Label>
              <Select
                value={formDiagnostico.subconjunto}
                onValueChange={handleSubconjuntoChange}
              >
                <SelectTrigger id="subconjunto">
                  <SelectValue placeholder="Selecione o subconjunto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Necessidades Humanas Básicas">Necessidades Humanas Básicas</SelectItem>
                  <SelectItem value="Protocolo de Enfermagem">Protocolo de Enfermagem</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Seleção de Subitem baseado no Subconjunto */}
            <div className="grid gap-2">
              <Label htmlFor="subitem">
                {formDiagnostico.subconjunto === 'Necessidades Humanas Básicas' 
                  ? 'Necessidade Humana Básica' 
                  : 'Protocolo de Enfermagem'}
              </Label>
              <Select
                value={formDiagnostico.subitemId}
                onValueChange={handleSubitemChange}
                disabled={subitensDisponiveis.length === 0}
              >
                <SelectTrigger id="subitem">
                  <SelectValue placeholder={
                    subitensDisponiveis.length === 0
                      ? `Nenhum ${formDiagnostico.subconjunto === 'Necessidades Humanas Básicas' ? 'NHB' : 'protocolo'} disponível`
                      : `Selecione ${formDiagnostico.subconjunto === 'Necessidades Humanas Básicas' ? 'uma NHB' : 'um protocolo'}`
                  } />
                </SelectTrigger>
                <SelectContent>
                  {subitensDisponiveis.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nome do Diagnóstico */}
            <div className="grid gap-2">
              <Label htmlFor="descricao">Diagnóstico de Enfermagem</Label>
              <Input
                id="descricao"
                value={formDiagnostico.descricao || ''}
                onChange={(e) => setFormDiagnostico({...formDiagnostico, descricao: e.target.value})}
                placeholder="Digite o diagnóstico de enfermagem"
              />
            </div>

            {/* Explicação (opcional) */}
            <div className="grid gap-2">
              <Label htmlFor="explicacao">Explicação (opcional)</Label>
              <Textarea
                id="explicacao"
                value={formDiagnostico.explicacao || ''}
                onChange={(e) => setFormDiagnostico({...formDiagnostico, explicacao: e.target.value})}
                placeholder="Explicação ou observações sobre este diagnóstico"
                rows={3}
              />
            </div>

            {/* Intervenções */}
            <div className="border-t pt-4 mt-2">
              <h3 className="text-lg font-medium mb-4">Intervenções</h3>
              
              {/* Lista de intervenções já adicionadas */}
              {formDiagnostico.intervencoes && formDiagnostico.intervencoes.length > 0 && (
                <div className="space-y-2 mb-4">
                  {formDiagnostico.intervencoes.map((intervencao) => (
                    <div key={intervencao.id} className="flex items-start justify-between border p-3 rounded-md">
                      <div className="space-y-1">
                        <p className="font-medium">{intervencao.descricao}</p>
                        <div className="text-sm text-gray-600">
                          <p>Presente (1ª pessoa): <span className="font-medium">{intervencao.verboPresentePrimeiraPessoa}</span></p>
                          <p>Infinitivo: <span className="font-medium">{intervencao.verboInfinitivo}</span></p>
                          {intervencao.complementoIntervencao && (
                            <p>Complemento: <span className="font-medium">{intervencao.complementoIntervencao}</span></p>
                          )}
                        </div>
                        {intervencao.linkArquivo && (
                          <div className="flex items-center text-sm text-blue-600 mt-2">
                            <FileText className="h-4 w-4 mr-1" />
                            <a href={intervencao.linkArquivo} target="_blank" rel="noopener noreferrer">
                              Material de apoio
                            </a>
                          </div>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500" 
                        onClick={() => removerIntervencao(intervencao.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Formulário para adicionar nova intervenção */}
              <div className="space-y-3 border-t pt-3">
                <h4 className="text-sm font-medium">Adicionar intervenção</h4>
                
                <div className="grid gap-2">
                  <Label htmlFor="intervencao">Descrição da intervenção</Label>
                  <Input
                    id="intervencao"
                    value={novaIntervencao.descricao}
                    onChange={(e) => setNovaIntervencao({...novaIntervencao, descricao: e.target.value})}
                    placeholder="Descrição completa da intervenção"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="verboPresentePrimeiraPessoa">Verbo no presente (1ª pessoa)</Label>
                    <Input
                      id="verboPresentePrimeiraPessoa"
                      value={novaIntervencao.verboPresentePrimeiraPessoa}
                      onChange={(e) => setNovaIntervencao({...novaIntervencao, verboPresentePrimeiraPessoa: e.target.value})}
                      placeholder="Ex: administro, avalio, verifico"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="verboInfinitivo">Verbo no infinitivo</Label>
                    <Input
                      id="verboInfinitivo"
                      value={novaIntervencao.verboInfinitivo}
                      onChange={(e) => setNovaIntervencao({...novaIntervencao, verboInfinitivo: e.target.value})}
                      placeholder="Ex: administrar, avaliar, verificar"
                    />
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="complementoIntervencao">Complemento da intervenção</Label>
                  <Input
                    id="complementoIntervencao"
                    value={novaIntervencao.complementoIntervencao}
                    onChange={(e) => setNovaIntervencao({...novaIntervencao, complementoIntervencao: e.target.value})}
                    placeholder="Complemento da intervenção (opcional)"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="linkArquivo">Link para material de apoio (opcional)</Label>
                  <Input
                    id="linkArquivo"
                    value={novaIntervencao.linkArquivo}
                    onChange={(e) => setNovaIntervencao({...novaIntervencao, linkArquivo: e.target.value})}
                    placeholder="URL do documento (PDF, DOC, etc.)"
                  />
                  <p className="text-xs text-gray-500">
                    <Info className="h-3 w-3 inline-block mr-1" />
                    Insira um link válido para um documento que será entregue ao paciente.
                  </p>
                </div>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={adicionarIntervencao}
                >
                  <Plus className="mr-2 h-4 w-4" /> Adicionar Intervenção
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button
              onClick={salvarDiagnostico}
              disabled={salvando}
              className="bg-csae-green-600 hover:bg-csae-green-700"
            >
              {salvando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {editando ? 'Atualizar' : 'Cadastrar'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diagnósticos de Enfermagem</CardTitle>
        <CardDescription>
          Gerencie subconjuntos, subitens e diagnósticos utilizados no processo de enfermagem.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="subconjuntos">
              <FilePlus2 className="mr-2 h-4 w-4" />
              Subconjuntos e Subitens
            </TabsTrigger>
            <TabsTrigger value="diagnosticos">
              <ClipboardList className="mr-2 h-4 w-4" />
              Diagnósticos
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="subconjuntos">
            <GerenciadorSubconjuntos />
          </TabsContent>
          
          <TabsContent value="diagnosticos">
            <DiagnosticosContent />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default GerenciadorDiagnosticos;
