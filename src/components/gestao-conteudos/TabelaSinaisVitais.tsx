
import React, { useState, useEffect } from 'react';
import { 
  getSinaisVitais, 
  addSinalVital, 
  updateSinalVital, 
  deleteSinalVital,
  type SinalVital,
  type ValorReferenciaVital
} from '@/services/bancodados/sinaisVitaisDB';
import { buscarNHBs } from '@/services/bancodados/subconjuntosDB';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const TabelaSinaisVitais = () => {
  const [sinaisVitais, setSinaisVitais] = useState<SinalVital[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editandoSinalVital, setEditandoSinalVital] = useState<SinalVital | null>(null);
  const [salvandoSinalVital, setSalvandoSinalVital] = useState(false);
  const [nhbOptions, setNhbOptions] = useState<string[]>([]);

  // Estados do formulário
  const [sinalVitalNome, setSinalVitalNome] = useState('');
  const [sinalVitalDescricao, setSinalVitalDescricao] = useState('');
  const [unidadeMedida, setUnidadeMedida] = useState('');
  const [valoresReferencia, setValoresReferencia] = useState<ValorReferenciaVital[]>([]);

  useEffect(() => {
    const unsubscribe = getSinaisVitais((data) => {
      setSinaisVitais(data);
      setLoading(false);
    });

    const carregarNHBs = async () => {
      try {
        const nhbs = await buscarNHBs();
        setNhbOptions(nhbs);
      } catch (error) {
        console.error('Erro ao carregar NHBs:', error);
      }
    };

    carregarNHBs();

    return () => unsubscribe();
  }, []);

  const sinaisVitaisFiltrados = sinaisVitais.filter(sinal =>
    sinal.sinalVitalNome.toLowerCase().includes(filtro.toLowerCase())
  );

  const limparFormulario = () => {
    setSinalVitalNome('');
    setSinalVitalDescricao('');
    setUnidadeMedida('');
    setValoresReferencia([]);
    setEditandoSinalVital(null);
  };

  const abrirModalCriacao = () => {
    limparFormulario();
    setSheetOpen(true);
  };

  const abrirModalEdicao = (sinal: SinalVital) => {
    setSinalVitalNome(sinal.sinalVitalNome);
    setSinalVitalDescricao(sinal.sinalVitalDescricao);
    setUnidadeMedida(sinal.unidadeMedida);
    setValoresReferencia(sinal.valoresDeReferencia || []);
    setEditandoSinalVital(sinal);
    setSheetOpen(true);
  };

  const adicionarValorReferencia = () => {
    setValoresReferencia([...valoresReferencia, {
      idadeMinima: null,
      idadeMaxima: null,
      idadeUnidade: 'not-specified',
      criterioSexo: 'Ambos',
      criterioCondicao: '',
      valorMinimo: null,
      valorMaximo: null,
      nomeAlteracao: '',
      subconjuntoNHBVinculado: ''
    }]);
  };

  const removerValorReferencia = (index: number) => {
    setValoresReferencia(valoresReferencia.filter((_, i) => i !== index));
  };

  const atualizarValorReferencia = (index: number, campo: keyof ValorReferenciaVital, valor: any) => {
    const novosValores = [...valoresReferencia];
    if (campo === 'idadeUnidade' && valor === 'not-specified') {
      valor = '';
    }
    novosValores[index] = { ...novosValores[index], [campo]: valor };
    setValoresReferencia(novosValores);
  };

  const salvarSinalVital = async () => {
    if (!sinalVitalNome.trim() || !unidadeMedida.trim()) {
      toast.error('Nome e Unidade de Medida são obrigatórios');
      return;
    }

    setSalvandoSinalVital(true);
    try {
      const dados = {
        sinalVitalNome: sinalVitalNome.trim(),
        sinalVitalDescricao: sinalVitalDescricao.trim(),
        unidadeMedida: unidadeMedida.trim(),
        valoresDeReferencia: valoresReferencia.map(vr => ({
          ...vr,
          idadeUnidade: vr.idadeUnidade === 'not-specified' ? '' : vr.idadeUnidade,
          subconjuntoNHBVinculado: vr.subconjuntoNHBVinculado === 'none' ? '' : vr.subconjuntoNHBVinculado
        }))
      };

      if (editandoSinalVital) {
        await updateSinalVital(editandoSinalVital.id, dados);
        toast.success('Sinal vital atualizado com sucesso!');
      } else {
        await addSinalVital(dados);
        toast.success('Sinal vital criado com sucesso!');
      }

      setSheetOpen(false);
      limparFormulario();
    } catch (error) {
      toast.error('Erro ao salvar sinal vital');
      console.error(error);
    } finally {
      setSalvandoSinalVital(false);
    }
  };

  const excluirSinalVital = async (sinal: SinalVital) => {
    try {
      await deleteSinalVital(sinal.id);
      toast.success('Sinal vital excluído com sucesso!');
    } catch (error) {
      toast.error('Erro ao excluir sinal vital');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com busca e botão de adicionar */}
      <div className="flex justify-between items-center">
        <Input
          placeholder="Buscar sinais vitais..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button onClick={abrirModalCriacao}>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Sinal Vital
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-4xl max-h-screen overflow-y-auto">
            <SheetHeader>
              <SheetTitle>
                {editandoSinalVital ? 'Editar Sinal Vital' : 'Novo Sinal Vital'}
              </SheetTitle>
            </SheetHeader>

            <div className="space-y-6 mt-6">
              {/* Dados básicos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Dados do Sinal Vital</h3>
                <div>
                  <label className="block text-sm font-medium mb-2">Nome do Sinal Vital *</label>
                  <Input
                    value={sinalVitalNome}
                    onChange={(e) => setSinalVitalNome(e.target.value)}
                    placeholder="Ex: Pressão Arterial"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Descrição</label>
                  <Textarea
                    value={sinalVitalDescricao}
                    onChange={(e) => setSinalVitalDescricao(e.target.value)}
                    placeholder="Descrição do sinal vital..."
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Unidade de Medida *</label>
                  <Input
                    value={unidadeMedida}
                    onChange={(e) => setUnidadeMedida(e.target.value)}
                    placeholder="Ex: mmHg"
                  />
                </div>
              </div>

              {/* Valores de referência */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Valores de Referência</h3>
                  <Button onClick={adicionarValorReferencia} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Valor
                  </Button>
                </div>

                {valoresReferencia.map((valor, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-md font-semibold">Valor de Referência {index + 1}</h4>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removerValorReferencia(index)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remover
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Idade Mínima</label>
                        <Input
                          type="number"
                          value={valor.idadeMinima || ''}
                          onChange={(e) => atualizarValorReferencia(index, 'idadeMinima', e.target.value ? Number(e.target.value) : null)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Idade Máxima</label>
                        <Input
                          type="number"
                          value={valor.idadeMaxima || ''}
                          onChange={(e) => atualizarValorReferencia(index, 'idadeMaxima', e.target.value ? Number(e.target.value) : null)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Unidade de Idade</label>
                        <Select
                          value={valor.idadeUnidade === '' ? 'not-specified' : valor.idadeUnidade}
                          onValueChange={(value) => atualizarValorReferencia(index, 'idadeUnidade', value === 'not-specified' ? '' : value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar unidade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not-specified">Não especificado</SelectItem>
                            <SelectItem value="dias">Dias</SelectItem>
                            <SelectItem value="meses">Meses</SelectItem>
                            <SelectItem value="anos">Anos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Critério Sexo</label>
                        <Select
                          value={valor.criterioSexo}
                          onValueChange={(value) => atualizarValorReferencia(index, 'criterioSexo', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Ambos">Ambos</SelectItem>
                            <SelectItem value="Masculino">Masculino</SelectItem>
                            <SelectItem value="Feminino">Feminino</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Condição</label>
                      <Input
                        value={valor.criterioCondicao}
                        onChange={(e) => atualizarValorReferencia(index, 'criterioCondicao', e.target.value)}
                        placeholder="Ex: Jejum"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Valor Mínimo</label>
                        <Input
                          type="number"
                          value={valor.valorMinimo || ''}
                          onChange={(e) => atualizarValorReferencia(index, 'valorMinimo', e.target.value ? Number(e.target.value) : null)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Valor Máximo</label>
                        <Input
                          type="number"
                          value={valor.valorMaximo || ''}
                          onChange={(e) => atualizarValorReferencia(index, 'valorMaximo', e.target.value ? Number(e.target.value) : null)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Nome da Alteração</label>
                      <Input
                        value={valor.nomeAlteracao}
                        onChange={(e) => atualizarValorReferencia(index, 'nomeAlteracao', e.target.value)}
                        placeholder="Ex: Normal"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Subconjunto NHB Vinculado</label>
                      <Select
                        value={valor.subconjuntoNHBVinculado || 'none'}
                        onValueChange={(value) => atualizarValorReferencia(index, 'subconjuntoNHBVinculado', value === 'none' ? '' : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um NHB..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {nhbOptions.map((nhb) => (
                            <SelectItem key={nhb} value={nhb}>
                              {nhb}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>

              {/* Botões de ação */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setSheetOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={salvarSinalVital} disabled={salvandoSinalVital}>
                  {salvandoSinalVital ? 'Salvando...' : 'Salvar Sinal Vital'}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Sinal Vital</TableHead>
              <TableHead>Unidade de Medida</TableHead>
              <TableHead>Valores de Referência</TableHead>
              <TableHead className="w-40">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sinaisVitaisFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  {filtro ? 'Nenhum sinal vital encontrado' : 'Nenhum sinal vital cadastrado'}
                </TableCell>
              </TableRow>
            ) : (
              sinaisVitaisFiltrados.map((sinal) => (
                <TableRow key={sinal.id}>
                  <TableCell className="font-medium">{sinal.sinalVitalNome}</TableCell>
                  <TableCell>{sinal.unidadeMedida}</TableCell>
                  <TableCell>{sinal.valoresDeReferencia?.length || 0} valor(es)</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => abrirModalEdicao(sinal)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="h-8 w-8 p-0">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o sinal vital "{sinal.sinalVitalNome}"?
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => excluirSinalVital(sinal)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TabelaSinaisVitais;
