
import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { SistemaCorporal, ExamePropedeutico, Achado, addSistema, updateSistema } from '@/services/bancodados/revisaoSistemasDB';
import { getSubconjuntosNhb } from '@/services/bancodados/subconjuntosDB';

interface FormularioSistemaProps {
  sistema: SistemaCorporal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const FormularioSistema: React.FC<FormularioSistemaProps> = ({
  sistema,
  open,
  onOpenChange,
  onSuccess
}) => {
  const [formData, setFormData] = useState<Omit<SistemaCorporal, 'id' | 'dataCadastro'>>({
    nomeSistema: '',
    descricaoSistema: '',
    exames: []
  });
  const [loading, setLoading] = useState(false);
  const [nhbOptions, setNhbOptions] = useState<{ id: string; tituloSubconjunto: string }[]>([]);
  const [editingExame, setEditingExame] = useState<{ index: number; exame: ExamePropedeutico } | null>(null);
  const [editingAchado, setEditingAchado] = useState<{ exameIndex: number; achadoIndex: number; achado: Achado } | null>(null);

  useEffect(() => {
    if (open) {
      if (sistema) {
        setFormData({
          nomeSistema: sistema.nomeSistema,
          descricaoSistema: sistema.descricaoSistema,
          exames: sistema.exames || []
        });
      } else {
        setFormData({
          nomeSistema: '',
          descricaoSistema: '',
          exames: []
        });
      }
      loadNhbOptions();
    }
  }, [sistema, open]);

  const loadNhbOptions = async () => {
    try {
      const nhbs = await getSubconjuntosNhb();
      setNhbOptions(nhbs);
    } catch (error) {
      console.error('Erro ao carregar NHBs:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.nomeSistema.trim()) {
      toast.error('Nome do sistema é obrigatório');
      return;
    }

    setLoading(true);
    try {
      if (sistema) {
        await updateSistema(sistema.id, formData);
        toast.success('Sistema atualizado com sucesso!');
      } else {
        await addSistema(formData);
        toast.success('Sistema cadastrado com sucesso!');
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao salvar sistema');
    } finally {
      setLoading(false);
    }
  };

  const addExame = () => {
    setEditingExame({
      index: -1,
      exame: { nomeExame: '', propedeutica: '', achados: [] }
    });
  };

  const editExame = (index: number) => {
    setEditingExame({
      index,
      exame: { ...formData.exames[index] }
    });
  };

  const saveExame = () => {
    if (!editingExame) return;
    
    const newExames = [...formData.exames];
    if (editingExame.index === -1) {
      newExames.push(editingExame.exame);
    } else {
      newExames[editingExame.index] = editingExame.exame;
    }
    
    setFormData({ ...formData, exames: newExames });
    setEditingExame(null);
  };

  const deleteExame = (index: number) => {
    const newExames = formData.exames.filter((_, i) => i !== index);
    setFormData({ ...formData, exames: newExames });
  };

  const addAchado = (exameIndex: number) => {
    setEditingAchado({
      exameIndex,
      achadoIndex: -1,
      achado: {
        idadeMinima: null,
        idadeMaxima: null,
        idadeUnidade: '',
        criterioSexo: 'Ambos',
        descricaoAchado: '',
        nomeAlteracao: '',
        subconjuntoNHBVinculado: ''
      }
    });
  };

  const editAchado = (exameIndex: number, achadoIndex: number) => {
    setEditingAchado({
      exameIndex,
      achadoIndex,
      achado: { ...formData.exames[exameIndex].achados[achadoIndex] }
    });
  };

  const saveAchado = () => {
    if (!editingAchado) return;
    
    const newExames = [...formData.exames];
    const exame = { ...newExames[editingAchado.exameIndex] };
    
    if (editingAchado.achadoIndex === -1) {
      exame.achados.push(editingAchado.achado);
    } else {
      exame.achados[editingAchado.achadoIndex] = editingAchado.achado;
    }
    
    newExames[editingAchado.exameIndex] = exame;
    setFormData({ ...formData, exames: newExames });
    setEditingAchado(null);
  };

  const deleteAchado = (exameIndex: number, achadoIndex: number) => {
    const newExames = [...formData.exames];
    newExames[exameIndex].achados = newExames[exameIndex].achados.filter((_, i) => i !== achadoIndex);
    setFormData({ ...formData, exames: newExames });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {sistema ? 'Editar Sistema' : 'Cadastrar Sistema'}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="nomeSistema">Nome do Sistema *</Label>
              <Input
                id="nomeSistema"
                value={formData.nomeSistema}
                onChange={(e) => setFormData({ ...formData, nomeSistema: e.target.value })}
                placeholder="Ex: Sistema Respiratório"
              />
            </div>

            <div>
              <Label htmlFor="descricaoSistema">Descrição do Sistema</Label>
              <Textarea
                id="descricaoSistema"
                value={formData.descricaoSistema}
                onChange={(e) => setFormData({ ...formData, descricaoSistema: e.target.value })}
                placeholder="Descrição detalhada do sistema"
                rows={3}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base font-semibold">Exames Propedêuticos</Label>
              <Button onClick={addExame} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Exame
              </Button>
            </div>

            <div className="space-y-4">
              {formData.exames.map((exame, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">
                        {exame.nomeExame} - {exame.propedeutica}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => editExame(index)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => deleteExame(index)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Achados ({exame.achados.length})</span>
                        <Button variant="outline" size="sm" onClick={() => addAchado(index)}>
                          <Plus className="w-4 h-4 mr-1" />
                          Achado
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {exame.achados.map((achado, achadoIndex) => (
                          <div key={achadoIndex} className="flex items-center gap-1">
                            <Badge variant="secondary" className="text-xs">
                              {achado.nomeAlteracao}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => editAchado(index, achadoIndex)}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => deleteAchado(index, achadoIndex)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>

        {/* Modal para editar exame */}
        {editingExame && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">
                {editingExame.index === -1 ? 'Adicionar Exame' : 'Editar Exame'}
              </h3>
              <div className="space-y-4">
                <div>
                  <Label>Nome do Exame</Label>
                  <Input
                    value={editingExame.exame.nomeExame}
                    onChange={(e) => setEditingExame({
                      ...editingExame,
                      exame: { ...editingExame.exame, nomeExame: e.target.value }
                    })}
                    placeholder="Ex: Coloração da Pele"
                  />
                </div>
                <div>
                  <Label>Propedêutica</Label>
                  <Select
                    value={editingExame.exame.propedeutica}
                    onValueChange={(value) => setEditingExame({
                      ...editingExame,
                      exame: { ...editingExame.exame, propedeutica: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a propedêutica" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inspeção">Inspeção</SelectItem>
                      <SelectItem value="Palpação">Palpação</SelectItem>
                      <SelectItem value="Percussão">Percussão</SelectItem>
                      <SelectItem value="Ausculta">Ausculta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setEditingExame(null)}>
                  Cancelar
                </Button>
                <Button onClick={saveExame}>
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal para editar achado */}
        {editingAchado && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">
                {editingAchado.achadoIndex === -1 ? 'Adicionar Achado' : 'Editar Achado'}
              </h3>
              <div className="space-y-4">
                <div>
                  <Label>Descrição do Achado</Label>
                  <Textarea
                    value={editingAchado.achado.descricaoAchado}
                    onChange={(e) => setEditingAchado({
                      ...editingAchado,
                      achado: { ...editingAchado.achado, descricaoAchado: e.target.value }
                    })}
                    placeholder="Descreva o achado encontrado"
                  />
                </div>
                <div>
                  <Label>Nome da Alteração</Label>
                  <Input
                    value={editingAchado.achado.nomeAlteracao}
                    onChange={(e) => setEditingAchado({
                      ...editingAchado,
                      achado: { ...editingAchado.achado, nomeAlteracao: e.target.value }
                    })}
                    placeholder="Nome da alteração identificada"
                  />
                </div>
                <div>
                  <Label>Critério de Sexo</Label>
                  <Select
                    value={editingAchado.achado.criterioSexo}
                    onValueChange={(value: 'Masculino' | 'Feminino' | 'Ambos') => setEditingAchado({
                      ...editingAchado,
                      achado: { ...editingAchado.achado, criterioSexo: value }
                    })}
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
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label>Idade Mínima</Label>
                    <Input
                      type="number"
                      value={editingAchado.achado.idadeMinima || ''}
                      onChange={(e) => setEditingAchado({
                        ...editingAchado,
                        achado: { ...editingAchado.achado, idadeMinima: e.target.value ? Number(e.target.value) : null }
                      })}
                    />
                  </div>
                  <div>
                    <Label>Idade Máxima</Label>
                    <Input
                      type="number"
                      value={editingAchado.achado.idadeMaxima || ''}
                      onChange={(e) => setEditingAchado({
                        ...editingAchado,
                        achado: { ...editingAchado.achado, idadeMaxima: e.target.value ? Number(e.target.value) : null }
                      })}
                    />
                  </div>
                  <div>
                    <Label>Unidade</Label>
                    <Select
                      value={editingAchado.achado.idadeUnidade}
                      onValueChange={(value: 'dias' | 'meses' | 'anos' | '') => setEditingAchado({
                        ...editingAchado,
                        achado: { ...editingAchado.achado, idadeUnidade: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">-</SelectItem>
                        <SelectItem value="dias">Dias</SelectItem>
                        <SelectItem value="meses">Meses</SelectItem>
                        <SelectItem value="anos">Anos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>NHB Vinculada</Label>
                  <Select
                    value={editingAchado.achado.subconjuntoNHBVinculado}
                    onValueChange={(value) => setEditingAchado({
                      ...editingAchado,
                      achado: { ...editingAchado.achado, subconjuntoNHBVinculado: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma NHB" />
                    </SelectTrigger>
                    <SelectContent>
                      {nhbOptions.map((nhb) => (
                        <SelectItem key={nhb.id} value={nhb.tituloSubconjunto}>
                          {nhb.tituloSubconjunto}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setEditingAchado(null)}>
                  Cancelar
                </Button>
                <Button onClick={saveAchado}>
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default FormularioSistema;
