
import React, { useState, useEffect } from 'react';
import { 
  getSinaisVitais, 
  addSinalVital, 
  updateSinalVital, 
  deleteSinalVital,
  type SinalVital,
  type ValorReferenciaVital
} from '@/services/bancodados/sinaisVitaisDB';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  X, 
  Search,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const TabelaSinaisVitais = () => {
  const [sinaisVitais, setSinaisVitais] = useState<SinalVital[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editandoSinal, setEditandoSinal] = useState<SinalVital | null>(null);
  const [salvandoSinal, setSalvandoSinal] = useState(false);
  
  // Estados do formulário
  const [nomeVital, setNomeVital] = useState('');
  const [descricaoVital, setDescricaoVital] = useState('');
  const [unidadeMedida, setUnidadeMedida] = useState('');
  const [valoresReferencia, setValoresReferencia] = useState<ValorReferenciaVital[]>([]);

  useEffect(() => {
    const unsubscribe = getSinaisVitais((data) => {
      setSinaisVitais(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const sinaisFiltrados = sinaisVitais.filter(sinal =>
    sinal.sinalVitalNome.toLowerCase().includes(filtro.toLowerCase())
  );

  const limparFormulario = () => {
    setNomeVital('');
    setDescricaoVital('');
    setUnidadeMedida('');
    setValoresReferencia([]);
    setEditandoSinal(null);
  };

  const abrirModalCriacao = () => {
    limparFormulario();
    setSheetOpen(true);
  };

  const abrirModalEdicao = (sinal: SinalVital) => {
    setNomeVital(sinal.sinalVitalNome);
    setDescricaoVital(sinal.sinalVitalDescricao);
    setUnidadeMedida(sinal.unidadeMedida);
    // Convert empty strings to 'not-specified' for UI display
    setValoresReferencia(sinal.valoresDeReferencia.map(valor => ({
      ...valor,
      idadeUnidade: valor.idadeUnidade === '' ? 'not-specified' : valor.idadeUnidade
    })));
    setEditandoSinal(sinal);
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
    novosValores[index] = { ...novosValores[index], [campo]: valor };
    setValoresReferencia(novosValores);
  };

  const salvarSinal = async () => {
    if (!nomeVital.trim() || !unidadeMedida.trim()) {
      toast.error('Nome e unidade de medida são obrigatórios');
      return;
    }

    setSalvandoSinal(true);
    try {
      const dados = {
        sinalVitalNome: nomeVital.trim(),
        sinalVitalDescricao: descricaoVital.trim(),
        unidadeMedida: unidadeMedida.trim(),
        valoresDeReferencia: valoresReferencia.map(valor => ({
          ...valor,
          idadeUnidade: valor.idadeUnidade === 'not-specified' ? '' : valor.idadeUnidade
        }))
      };

      if (editandoSinal) {
        await updateSinalVital(editandoSinal.id, dados);
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
      setSalvandoSinal(false);
    }
  };

  const excluirSinal = async (sinal: SinalVital) => {
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
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar sinais vitais..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="pl-10"
          />
        </div>
        
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
                {editandoSinal ? 'Editar Sinal Vital' : 'Novo Sinal Vital'}
              </SheetTitle>
            </SheetHeader>

            <div className="space-y-6 mt-6">
              {/* Dados básicos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Dados do Sinal Vital</h3>
                <div>
                  <label className="block text-sm font-medium mb-2">Nome *</label>
                  <Input
                    value={nomeVital}
                    onChange={(e) => setNomeVital(e.target.value)}
                    placeholder="Ex: Pressão Arterial"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Descrição</label>
                  <Textarea
                    value={descricaoVital}
                    onChange={(e) => setDescricaoVital(e.target.value)}
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

              {/* Valores de Referência */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Valores de Referência</h3>
                  <Button onClick={adicionarValorReferencia} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Valor
                  </Button>
                </div>

                <Accordion type="multiple" className="w-full">
                  {valoresReferencia.map((valor, index) => (
                    <AccordionItem key={index} value={`valor-${index}`}>
                      <AccordionTrigger>
                        {valor.nomeAlteracao || `Valor ${index + 1}`}
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div className="flex justify-end">
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
                              value={valor.idadeUnidade || 'not-specified'}
                              onValueChange={(value) => atualizarValorReferencia(index, 'idadeUnidade', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecionar" />
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
                          <label className="block text-sm font-medium mb-2">Critério Condição</label>
                          <Input
                            value={valor.criterioCondicao}
                            onChange={(e) => atualizarValorReferencia(index, 'criterioCondicao', e.target.value)}
                            placeholder="Ex: Em repouso"
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
                            placeholder="Ex: Normotensão"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Subconjunto NHB Vinculado</label>
                          <Input
                            value={valor.subconjuntoNHBVinculado}
                            onChange={(e) => atualizarValorReferencia(index, 'subconjuntoNHBVinculado', e.target.value)}
                            placeholder="Subconjunto relacionado"
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              {/* Botões de ação */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setSheetOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={salvarSinal} disabled={salvandoSinal}>
                  {salvandoSinal ? 'Salvando...' : 'Salvar Sinal Vital'}
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
              <TableHead className="w-40">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sinaisFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  {filtro ? 'Nenhum sinal vital encontrado' : 'Nenhum sinal vital cadastrado'}
                </TableCell>
              </TableRow>
            ) : (
              sinaisFiltrados.map((sinal) => (
                <TableRow key={sinal.id}>
                  <TableCell className="font-medium">
                    {sinal.sinalVitalNome}
                  </TableCell>
                  <TableCell>
                    {sinal.unidadeMedida}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{sinal.sinalVitalNome}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2">Descrição:</h4>
                              <p className="text-muted-foreground">{sinal.sinalVitalDescricao || 'Sem descrição'}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Unidade de Medida:</h4>
                              <Badge variant="secondary">{sinal.unidadeMedida}</Badge>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Valores de Referência:</h4>
                              {sinal.valoresDeReferencia.length === 0 ? (
                                <p className="text-muted-foreground">Nenhum valor de referência cadastrado</p>
                              ) : (
                                <div className="space-y-3">
                                  {sinal.valoresDeReferencia.map((valor, index) => (
                                    <div key={index} className="border rounded-lg p-4">
                                      <h5 className="font-medium mb-2">{valor.nomeAlteracao}</h5>
                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                          <span className="font-medium">Faixa etária:</span>{' '}
                                          {valor.idadeMinima || valor.idadeMaxima
                                            ? `${valor.idadeMinima || 0} - ${valor.idadeMaxima || '∞'} ${valor.idadeUnidade}`
                                            : 'Não especificada'}
                                        </div>
                                        <div>
                                          <span className="font-medium">Sexo:</span> {valor.criterioSexo}
                                        </div>
                                        <div>
                                          <span className="font-medium">Condição:</span> {valor.criterioCondicao || 'Não especificada'}
                                        </div>
                                        <div>
                                          <span className="font-medium">Valores:</span>{' '}
                                          {valor.valorMinimo || valor.valorMaximo
                                            ? `${valor.valorMinimo || 0} - ${valor.valorMaximo || '∞'}`
                                            : 'Não especificados'}
                                        </div>
                                        {valor.subconjuntoNHBVinculado && (
                                          <div className="col-span-2">
                                            <span className="font-medium">Subconjunto:</span> {valor.subconjuntoNHBVinculado}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
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
                              onClick={() => excluirSinal(sinal)}
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
