
import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Edit2, Check, X, Info } from 'lucide-react';
import { toast } from 'sonner';
import {
  SistemaCorporal,
  ExamePropedeutico,
  Achado,
  OpcaoAchado,
  addSistema,
  updateSistema,
} from '@/services/bancodados/revisaoSistemasDB';
import { getSubconjuntosNhb } from '@/services/bancodados/subconjuntosDB';

interface FormularioSistemaProps {
  sistema: SistemaCorporal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CLASSIFICACAO_SUGGESTIONS = ['Normal', 'Padrão Normal', 'Padrão Anormal', 'Não se aplica'];

const emptyAchado = (): Achado => ({
  descricaoAchado: '',
  ehAlteracao: false,
  nomeAlteracao: 'Normal',
  criterioSexo: 'Ambos',
  idadeMinima: null,
  idadeMaxima: null,
  idadeUnidade: '',
  subconjuntoNHBVinculado: '',
  dicaAchado: '',
  exigeDescricao: false,
  tipoAchado: 'simples',
  opcoes: [],
});

const emptyOpcao = (): OpcaoAchado => ({
  textoOpcao: '',
  ehAlteracao: false,
  nomeAlteracao: '',
  subconjuntoNHBVinculado: '',
  exigeDescricao: false,
});

type AchadoEditState =
  | { mode: 'adding'; exameIndex: number; formData: Achado }
  | { mode: 'editing'; exameIndex: number; achadoIndex: number; formData: Achado }
  | null;

const inferEhAlteracao = (achado: Achado): boolean =>
  achado.ehAlteracao ?? !!achado.subconjuntoNHBVinculado;

const sortedAchadosWithIndex = (achados: Achado[]) =>
  achados
    .map((achado, index) => ({ achado, index }))
    .sort((a, b) => {
      const aScore = inferEhAlteracao(a.achado) ? 1 : 0;
      const bScore = inferEhAlteracao(b.achado) ? 1 : 0;
      return aScore - bScore;
    });

// ─── Helper text component ──────────────────────────────────────
const HelperText: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{children}</p>
);

const FormularioSistema: React.FC<FormularioSistemaProps> = ({
  sistema,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<Omit<SistemaCorporal, 'id' | 'dataCadastro'>>({
    nomeSistema: '',
    descricaoSistema: '',
    exames: [],
  });
  const [loading, setLoading] = useState(false);
  const [nhbOptions, setNhbOptions] = useState<{ id: string; tituloSubconjunto: string }[]>([]);
  const [editingExame, setEditingExame] = useState<{ index: number; exame: ExamePropedeutico } | null>(null);
  const [achadoEditState, setAchadoEditState] = useState<AchadoEditState>(null);

  useEffect(() => {
    if (open) {
      setFormData(
        sistema
          ? { nomeSistema: sistema.nomeSistema, descricaoSistema: sistema.descricaoSistema, exames: sistema.exames || [] }
          : { nomeSistema: '', descricaoSistema: '', exames: [] }
      );
      setAchadoEditState(null);
      setEditingExame(null);
      loadNhbOptions();
    }
  }, [sistema, open]);

  const loadNhbOptions = async () => {
    try {
      const nhbs = await getSubconjuntosNhb();
      setNhbOptions(nhbs);
    } catch {
      console.error('Erro ao carregar NHBs');
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
    } catch {
      toast.error('Erro ao salvar sistema');
    } finally {
      setLoading(false);
    }
  };

  // ─── Exames ──────────────────────────────────────────────────────
  const addExame = () => {
    setAchadoEditState(null);
    setEditingExame({ index: -1, exame: { nomeExame: '', propedeutica: '', achados: [] } });
  };

  const editExame = (index: number) => {
    setAchadoEditState(null);
    setEditingExame({ index, exame: { ...formData.exames[index] } });
  };

  const saveExame = () => {
    if (!editingExame) return;
    if (!editingExame.exame.nomeExame.trim()) { toast.error('Nome do exame é obrigatório'); return; }
    if (!editingExame.exame.propedeutica) { toast.error('Selecione a propedêutica'); return; }
    const newExames = [...formData.exames];
    if (editingExame.index === -1) newExames.push(editingExame.exame);
    else newExames[editingExame.index] = editingExame.exame;
    setFormData({ ...formData, exames: newExames });
    setEditingExame(null);
  };

  const deleteExame = (index: number) => {
    if (achadoEditState?.exameIndex === index) setAchadoEditState(null);
    setFormData({ ...formData, exames: formData.exames.filter((_, i) => i !== index) });
  };

  // ─── Achados ─────────────────────────────────────────────────────
  const startAddAchado = (exameIndex: number) => {
    setAchadoEditState({ mode: 'adding', exameIndex, formData: emptyAchado() });
  };

  const startEditAchado = (exameIndex: number, achadoIndex: number) => {
    const src = formData.exames[exameIndex].achados[achadoIndex];
    setAchadoEditState({
      mode: 'editing',
      exameIndex,
      achadoIndex,
      formData: {
        ...src,
        ehAlteracao: inferEhAlteracao(src),
        tipoAchado: src.tipoAchado || 'simples',
        opcoes: src.opcoes || [],
        dicaAchado: src.dicaAchado || '',
        exigeDescricao: src.exigeDescricao || false,
      },
    });
  };

  const cancelAchadoEdit = () => setAchadoEditState(null);

  const updateAchadoForm = (field: keyof Achado, value: unknown) => {
    if (!achadoEditState) return;
    setAchadoEditState({ ...achadoEditState, formData: { ...achadoEditState.formData, [field]: value } });
  };

  const toggleEhAlteracao = (checked: boolean) => {
    if (!achadoEditState) return;
    setAchadoEditState({
      ...achadoEditState,
      formData: {
        ...achadoEditState.formData,
        ehAlteracao: checked,
        nomeAlteracao: checked ? '' : 'Normal',
        subconjuntoNHBVinculado: checked ? achadoEditState.formData.subconjuntoNHBVinculado : '',
      },
    });
  };

  const toggleTipoAchado = (isOpcoes: boolean) => {
    if (!achadoEditState) return;
    setAchadoEditState({
      ...achadoEditState,
      formData: {
        ...achadoEditState.formData,
        tipoAchado: isOpcoes ? 'opcoes' : 'simples',
        opcoes: isOpcoes ? (achadoEditState.formData.opcoes?.length ? achadoEditState.formData.opcoes : []) : [],
      },
    });
  };

  const saveAchado = () => {
    if (!achadoEditState) return;
    const { formData: achado } = achadoEditState;
    if (!achado.descricaoAchado.trim()) { toast.error('Descrição do achado é obrigatória'); return; }
    if (achado.tipoAchado === 'simples') {
      if (!achado.nomeAlteracao.trim()) {
        toast.error(achado.ehAlteracao ? 'Nome da alteração é obrigatório' : 'Classificação é obrigatória');
        return;
      }
    } else if (!achado.opcoes?.length) {
      toast.error('Adicione ao menos uma opção ao achado');
      return;
    }

    const saved: Achado = {
      ...achado,
      subconjuntoNHBVinculado: achado.tipoAchado === 'simples' && achado.ehAlteracao
        ? achado.subconjuntoNHBVinculado
        : '',
    };

    const newExames = [...formData.exames];
    const exame = { ...newExames[achadoEditState.exameIndex] };
    const achados = [...exame.achados];
    if (achadoEditState.mode === 'adding') achados.push(saved);
    else achados[achadoEditState.achadoIndex] = saved;
    exame.achados = achados;
    newExames[achadoEditState.exameIndex] = exame;
    setFormData({ ...formData, exames: newExames });
    setAchadoEditState(null);
  };

  const deleteAchado = (exameIndex: number, achadoIndex: number) => {
    if (
      achadoEditState?.mode === 'editing' &&
      achadoEditState.exameIndex === exameIndex &&
      achadoEditState.achadoIndex === achadoIndex
    ) setAchadoEditState(null);
    const newExames = [...formData.exames];
    newExames[exameIndex] = { ...newExames[exameIndex], achados: newExames[exameIndex].achados.filter((_, i) => i !== achadoIndex) };
    setFormData({ ...formData, exames: newExames });
  };

  // ─── Opcoes management ────────────────────────────────────────────
  const addOpcao = () => {
    if (!achadoEditState) return;
    const opcoes = [...(achadoEditState.formData.opcoes || []), emptyOpcao()];
    setAchadoEditState({ ...achadoEditState, formData: { ...achadoEditState.formData, opcoes } });
  };

  const updateOpcao = (index: number, field: keyof OpcaoAchado, value: unknown) => {
    if (!achadoEditState) return;
    const opcoes = [...(achadoEditState.formData.opcoes || [])];
    opcoes[index] = { ...opcoes[index], [field]: value };
    setAchadoEditState({ ...achadoEditState, formData: { ...achadoEditState.formData, opcoes } });
  };

  const removeOpcao = (index: number) => {
    if (!achadoEditState) return;
    const opcoes = (achadoEditState.formData.opcoes || []).filter((_, i) => i !== index);
    setAchadoEditState({ ...achadoEditState, formData: { ...achadoEditState.formData, opcoes } });
  };

  // ─── Inline achado form ───────────────────────────────────────────
  const renderAchadoForm = (label: string) => {
    if (!achadoEditState) return null;
    const { formData: achado } = achadoEditState;
    const isOpcoes = achado.tipoAchado === 'opcoes';

    return (
      <div className="border border-csae-green-200 rounded-lg p-4 bg-green-50/40 space-y-4 mt-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-csae-green-700">{label}</span>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={cancelAchadoEdit}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Descrição */}
        <div>
          <Label className="text-sm">Descrição do Achado *</Label>
          <Textarea
            value={achado.descricaoAchado}
            onChange={(e) => updateAchadoForm('descricaoAchado', e.target.value)}
            placeholder="Nome curto e objetivo do achado. Ex: Temperatura axilar"
            className="mt-1 resize-none"
            rows={2}
            spellCheck
          />
          <HelperText>
            Use um nome curto e clínico. Não coloque instruções ou detalhes aqui — use o campo "Dica" para isso.
          </HelperText>
        </div>

        {/* Tipo do achado */}
        <div className="flex items-center justify-between rounded-md border bg-white px-4 py-3">
          <div>
            <span className="text-sm font-medium">Este achado tem opções para escolher?</span>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isOpcoes
                ? 'Sim — o enfermeiro escolherá uma ou mais opções (ex: formato, coloração)'
                : 'Não — é um achado único e direto'}
            </p>
          </div>
          <Switch checked={isOpcoes} onCheckedChange={toggleTipoAchado} />
        </div>

        {/* SIMPLES */}
        {!isOpcoes && (
          <>
            <div className="flex items-center justify-between rounded-md border bg-white px-4 py-3">
              <div>
                <span className="text-sm font-medium">É uma alteração clínica?</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {achado.ehAlteracao
                    ? 'Sim — descreva o nome clínico e vincule a NHB afetada'
                    : 'Não — achado esperado ou de referência'}
                </p>
              </div>
              <Switch checked={!!achado.ehAlteracao} onCheckedChange={toggleEhAlteracao} />
            </div>

            {!achado.ehAlteracao ? (
              <div>
                <Label className="text-sm">Classificação *</Label>
                <Input
                  list="classificacao-suggestions"
                  value={achado.nomeAlteracao}
                  onChange={(e) => updateAchadoForm('nomeAlteracao', e.target.value)}
                  placeholder="Normal, Padrão Normal, Padrão Anormal…"
                  className="mt-1"
                />
                <datalist id="classificacao-suggestions">
                  {CLASSIFICACAO_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
                </datalist>
                <HelperText>Escolha uma sugestão ou escreva o termo clínico correto.</HelperText>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label className="text-sm">Nome da Alteração *</Label>
                  <Input
                    value={achado.nomeAlteracao}
                    onChange={(e) => updateAchadoForm('nomeAlteracao', e.target.value)}
                    placeholder="Ex: Hiperemia, Edema, Hipotrofia…"
                    className="mt-1"
                    spellCheck
                  />
                  <HelperText>Nome clínico que aparecerá como alerta no processo de enfermagem.</HelperText>
                </div>
                <div>
                  <Label className="text-sm">NHB Vinculada</Label>
                  <Select
                    value={achado.subconjuntoNHBVinculado || 'none'}
                    onValueChange={(v) => updateAchadoForm('subconjuntoNHBVinculado', v === 'none' ? '' : v)}
                  >
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione uma NHB" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      {nhbOptions.map((nhb) => (
                        <SelectItem key={nhb.id} value={nhb.tituloSubconjunto}>{nhb.tituloSubconjunto}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <HelperText>NHB que será automaticamente marcada quando este achado for selecionado.</HelperText>
                </div>
              </div>
            )}
          </>
        )}

        {/* OPCOES */}
        {isOpcoes && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Opções do Achado</Label>
              <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={addOpcao}>
                <Plus className="w-3 h-3 mr-1" />Opção
              </Button>
            </div>
            <HelperText>Cada opção é uma variante que o enfermeiro poderá marcar. Ex: "Simétricas", "Assimétricas".</HelperText>

            {(achado.opcoes || []).length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-3 border rounded-md">
                Nenhuma opção. Clique em "+ Opção" para adicionar.
              </p>
            )}

            {(achado.opcoes || []).map((opcao, i) => (
              <div key={i} className="border rounded-md p-3 bg-white space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={opcao.textoOpcao}
                    onChange={(e) => updateOpcao(i, 'textoOpcao', e.target.value)}
                    placeholder="Texto da opção. Ex: Mamas simétricas"
                    className="flex-1 h-8 text-sm"
                    spellCheck
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => removeOpcao(i)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">É uma alteração?</span>
                  <Switch
                    checked={!!opcao.ehAlteracao}
                    onCheckedChange={(v) => {
                      updateOpcao(i, 'ehAlteracao', v);
                      if (!v) { updateOpcao(i, 'nomeAlteracao', ''); updateOpcao(i, 'subconjuntoNHBVinculado', ''); }
                    }}
                  />
                </div>

                {!opcao.ehAlteracao ? (
                  <div>
                    <Input
                      list="classificacao-suggestions"
                      value={opcao.nomeAlteracao || ''}
                      onChange={(e) => updateOpcao(i, 'nomeAlteracao', e.target.value)}
                      placeholder="Classificação (ex: Normal, Padrão Anormal)"
                      className="h-8 text-sm"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={opcao.nomeAlteracao || ''}
                      onChange={(e) => updateOpcao(i, 'nomeAlteracao', e.target.value)}
                      placeholder="Nome da alteração"
                      className="h-8 text-sm"
                      spellCheck
                    />
                    <Select
                      value={opcao.subconjuntoNHBVinculado || 'none'}
                      onValueChange={(v) => updateOpcao(i, 'subconjuntoNHBVinculado', v === 'none' ? '' : v)}
                    >
                      <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="NHB vinculada" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        {nhbOptions.map((nhb) => (
                          <SelectItem key={nhb.id} value={nhb.tituloSubconjunto}>{nhb.tituloSubconjunto}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`opcao-desc-${i}`}
                    checked={!!opcao.exigeDescricao}
                    onChange={(e) => updateOpcao(i, 'exigeDescricao', e.target.checked)}
                    className="h-3.5 w-3.5 accent-csae-green-600"
                  />
                  <label htmlFor={`opcao-desc-${i}`} className="text-xs text-muted-foreground cursor-pointer">
                    Exige descrição do enfermeiro ao selecionar
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}

        <Separator />

        {/* Dica do achado */}
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Info className="w-3.5 h-3.5 text-csae-green-600" />
            <Label className="text-sm">Dica para o Enfermeiro</Label>
          </div>
          <Textarea
            value={achado.dicaAchado || ''}
            onChange={(e) => updateAchadoForm('dicaAchado', e.target.value)}
            placeholder="Orientação técnica que aparecerá para o enfermeiro no processo de enfermagem. Ex: Avaliar tipo de hímen e verificar se oclui o canal vaginal."
            className="mt-1 resize-none text-sm"
            rows={2}
            spellCheck
          />
          <HelperText>
            Esta dica <strong>não vai para o resumo final</strong>. Ela aparece como orientação clínica no momento da avaliação.
            {achado.exigeDescricao && ' Quando "Exige descrição" estiver ativo, esta dica vira o placeholder do campo de texto.'}
          </HelperText>
        </div>

        {/* Exige descrição */}
        {!isOpcoes && (
          <div className="flex items-center justify-between rounded-md border bg-white px-4 py-3">
            <div>
              <span className="text-sm font-medium">Exige descrição do enfermeiro?</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                {achado.exigeDescricao
                  ? 'Sim — um campo de texto será aberto ao selecionar este achado'
                  : 'Não — o enfermeiro apenas marca este achado'}
              </p>
            </div>
            <Switch
              checked={!!achado.exigeDescricao}
              onCheckedChange={(v) => updateAchadoForm('exigeDescricao', v)}
            />
          </div>
        )}

        <Separator />

        {/* Critérios opcionais */}
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Critérios Opcionais de Aplicação</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Critério de Sexo</Label>
              <Select
                value={achado.criterioSexo}
                onValueChange={(v: 'Masculino' | 'Feminino' | 'Ambos') => updateAchadoForm('criterioSexo', v)}
              >
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ambos">Ambos</SelectItem>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Feminino">Feminino</SelectItem>
                </SelectContent>
              </Select>
              <HelperText>Deixe "Ambos" se aplicar para todos os sexos.</HelperText>
            </div>
            <div>
              <Label className="text-sm">Unidade de Idade</Label>
              <Select
                value={achado.idadeUnidade || 'nao-especificado'}
                onValueChange={(v) => updateAchadoForm('idadeUnidade', v === 'nao-especificado' ? '' : v)}
              >
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nao-especificado">Não especificado</SelectItem>
                  <SelectItem value="dias">Dias</SelectItem>
                  <SelectItem value="meses">Meses</SelectItem>
                  <SelectItem value="anos">Anos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Idade Mínima</Label>
              <Input type="number" value={achado.idadeMinima ?? ''} placeholder="—" className="mt-1"
                onChange={(e) => updateAchadoForm('idadeMinima', e.target.value ? Number(e.target.value) : null)} />
            </div>
            <div>
              <Label className="text-sm">Idade Máxima</Label>
              <Input type="number" value={achado.idadeMaxima ?? ''} placeholder="—" className="mt-1"
                onChange={(e) => updateAchadoForm('idadeMaxima', e.target.value ? Number(e.target.value) : null)} />
            </div>
          </div>
          <HelperText>Preencha faixa etária apenas se este achado se aplica a uma faixa específica (ex: achados exclusivos de neonatos).</HelperText>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={cancelAchadoEdit}>Cancelar</Button>
          <Button size="sm" onClick={saveAchado}>
            <Check className="w-3.5 h-3.5 mr-1" />
            {achadoEditState?.mode === 'adding' ? 'Adicionar' : 'Salvar'}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{sistema ? 'Editar Sistema' : 'Cadastrar Sistema'}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Dados do sistema */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="nomeSistema">Nome do Sistema *</Label>
              <Input id="nomeSistema" value={formData.nomeSistema} placeholder="Ex: Sistema Ginecológico" className="mt-1"
                onChange={(e) => setFormData({ ...formData, nomeSistema: e.target.value })} spellCheck />
              <HelperText>Nome do sistema corporal que agrupa os exames. Ex: "Sistema Respiratório", "Sistema Ginecológico".</HelperText>
            </div>
            <div>
              <Label htmlFor="descricaoSistema">Descrição do Sistema</Label>
              <Textarea id="descricaoSistema" value={formData.descricaoSistema} rows={2} className="mt-1 resize-none"
                placeholder="Descreva resumidamente o que será avaliado neste sistema."
                onChange={(e) => setFormData({ ...formData, descricaoSistema: e.target.value })} spellCheck />
              <HelperText>Opcional. Descrição clínica do sistema para orientar o enfermeiro.</HelperText>
            </div>
          </div>

          {/* Exames */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-semibold">Exames Propedêuticos</Label>
              <Button onClick={addExame} size="sm"><Plus className="w-4 h-4 mr-1.5" />Adicionar Exame</Button>
            </div>
            <HelperText>
              Cada exame corresponde a uma ação propedêutica específica (inspeção, palpação, percussão ou ausculta).
              Cadastre um exame separado para cada propedêutica — não misture técnicas no mesmo exame.
            </HelperText>

            <div className="space-y-4 mt-3">
              {formData.exames.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8 border rounded-lg">
                  Nenhum exame cadastrado. Clique em "Adicionar Exame" para começar.
                </p>
              )}

              {formData.exames.map((exame, exameIndex) => {
                const sorted = sortedAchadosWithIndex(exame.achados);
                const isAddingHere = achadoEditState?.mode === 'adding' && achadoEditState.exameIndex === exameIndex;

                return (
                  <Card key={exameIndex} className="overflow-hidden">
                    <CardHeader className="pb-3 pt-4 px-4 bg-muted/20">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold leading-tight">
                            {exame.nomeExame || <span className="text-muted-foreground italic">Sem nome</span>}
                          </p>
                          {exame.propedeutica && (
                            <Badge variant="outline" className="text-xs mt-1">{exame.propedeutica}</Badge>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => editExame(exameIndex)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => deleteExame(exameIndex)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="px-4 pt-3 pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Achados ({exame.achados.length})
                        </span>
                        <Button variant="outline" size="sm" className="h-7 text-xs px-2.5"
                          onClick={() => isAddingHere ? cancelAchadoEdit() : startAddAchado(exameIndex)}>
                          {isAddingHere
                            ? <><X className="w-3 h-3 mr-1" />Cancelar</>
                            : <><Plus className="w-3 h-3 mr-1" />Achado</>}
                        </Button>
                      </div>

                      <div className="space-y-1.5">
                        {exame.achados.length === 0 && !isAddingHere && (
                          <p className="text-xs text-muted-foreground text-center py-4">
                            Nenhum achado. Clique em "+ Achado" para adicionar.
                          </p>
                        )}

                        {sorted.map(({ achado, index: originalIndex }) => {
                          const isEditing =
                            achadoEditState?.mode === 'editing' &&
                            achadoEditState.exameIndex === exameIndex &&
                            achadoEditState.achadoIndex === originalIndex;

                          if (isEditing) return <div key={originalIndex}>{renderAchadoForm('Editar Achado')}</div>;

                          const isAlteracao = inferEhAlteracao(achado);
                          const isOpcoes = achado.tipoAchado === 'opcoes';

                          return (
                            <div key={originalIndex}
                              className="flex items-start justify-between p-2.5 bg-muted/30 border rounded-md hover:bg-muted/50 transition-colors group">
                              <div className="flex flex-col flex-1 min-w-0 pr-2">
                                <span className="text-sm leading-snug line-clamp-2">{achado.descricaoAchado}</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {isOpcoes ? (
                                    <Badge className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-50">
                                      {achado.opcoes?.length || 0} opções
                                    </Badge>
                                  ) : isAlteracao ? (
                                    <Badge className="text-[10px] bg-red-50 text-red-700 border border-red-200 hover:bg-red-50">
                                      {achado.nomeAlteracao || 'Alterado'}
                                    </Badge>
                                  ) : (
                                    <Badge className="text-[10px] bg-green-50 text-green-700 border border-green-200 hover:bg-green-50">
                                      {achado.nomeAlteracao || 'Normal'}
                                    </Badge>
                                  )}
                                  {achado.exigeDescricao && (
                                    <Badge className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-50">
                                      Exige descrição
                                    </Badge>
                                  )}
                                  {achado.dicaAchado && (
                                    <Badge className="text-[10px] bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-50">
                                      <Info className="w-2.5 h-2.5 mr-0.5" />Dica
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                                  onClick={() => startEditAchado(exameIndex, originalIndex)}>
                                  <Edit2 className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="sm"
                                  className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => deleteAchado(exameIndex, originalIndex)}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {isAddingHere && renderAchadoForm('Novo Achado')}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Salvando...' : sistema ? 'Salvar Alterações' : 'Cadastrar Sistema'}
            </Button>
          </div>
        </div>

        {/* Modal de exame */}
        {editingExame && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
              <h3 className="text-lg font-semibold mb-4">
                {editingExame.index === -1 ? 'Adicionar Exame' : 'Editar Exame'}
              </h3>
              <div className="space-y-4">
                <div>
                  <Label>Nome do Exame</Label>
                  <Input value={editingExame.exame.nomeExame} placeholder="Ex: Inspeção de Períneo e Vulva" className="mt-1" spellCheck
                    onChange={(e) => setEditingExame({ ...editingExame, exame: { ...editingExame.exame, nomeExame: e.target.value } })} />
                  <HelperText>Nome descritivo. Inclua a região anatômica. Ex: "Exame clínico das mamas".</HelperText>
                </div>
                <div>
                  <Label>Propedêutica</Label>
                  <Select value={editingExame.exame.propedeutica}
                    onValueChange={(v) => setEditingExame({ ...editingExame, exame: { ...editingExame.exame, propedeutica: v } })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione a propedêutica" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inspeção">Inspeção — avaliação visual</SelectItem>
                      <SelectItem value="Palpação">Palpação — avaliação pelo toque</SelectItem>
                      <SelectItem value="Percussão">Percussão — avaliação por percussão</SelectItem>
                      <SelectItem value="Ausculta">Ausculta — avaliação por sons</SelectItem>
                    </SelectContent>
                  </Select>
                  <HelperText>
                    Escolha corretamente: achados visuais = Inspeção; toque = Palpação; sons com estetoscópio = Ausculta.
                    Não misture propedêuticas — crie exames separados.
                  </HelperText>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setEditingExame(null)}>Cancelar</Button>
                <Button onClick={saveExame}>Salvar</Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default FormularioSistema;
