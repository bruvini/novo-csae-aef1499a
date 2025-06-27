import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/services/firebase';

interface ModalCadastroSubconjuntoProps {
  onSubconjuntoCadastrado?: () => void;
}

const ModalCadastroSubconjunto = ({ onSubconjuntoCadastrado }: ModalCadastroSubconjuntoProps) => {
  const [open, setOpen] = useState(false);
  const [tipoSubconjunto, setTipoSubconjunto] = useState<'nhb' | 'protocolo'>('nhb');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Campos para NHB
  const [tituloNhb, setTituloNhb] = useState('');
  const [descricaoNhb, setDescricaoNhb] = useState('');

  // Campos para Protocolo
  const [tituloProtocolo, setTituloProtocolo] = useState('');
  const [volumeProtocolo, setVolumeProtocolo] = useState('');
  const [dataPublicacao, setDataPublicacao] = useState('');
  const [dataAtualizacao, setDataAtualizacao] = useState('');
  const [versaoProtocolo, setVersaoProtocolo] = useState('');
  const [urlProtocolo, setUrlProtocolo] = useState('');
  const [imagemCapa, setImagemCapa] = useState<File | null>(null);

  const resetForm = () => {
    setTituloNhb('');
    setDescricaoNhb('');
    setTituloProtocolo('');
    setVolumeProtocolo('');
    setDataPublicacao('');
    setDataAtualizacao('');
    setVersaoProtocolo('');
    setUrlProtocolo('');
    setImagemCapa(null);
    setTipoSubconjunto('nhb');
  };

  const verificarDuplicacao = async (tipo: string, titulo: string): Promise<boolean> => {
    const q = query(
      collection(db, 'subconjuntosEnfermagem'),
      where('tipoSubconjunto', '==', tipo),
      where('tituloSubconjunto', '==', titulo)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const uploadImagem = async (file: File): Promise<string> => {
    try {
      console.log('Iniciando upload da imagem:', file.name);
      
      // Criar uma referência única para o arquivo
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `protocolos/capa_${timestamp}.${fileExtension}`;
      
      // Criar referência no Firebase Storage
      const storageRef = ref(storage, fileName);
      
      console.log('Fazendo upload para:', fileName);
      
      // Upload do arquivo
      const snapshot = await uploadBytes(storageRef, file);
      console.log('Upload concluído:', snapshot);
      
      // Obter URL de download
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('URL de download obtida:', downloadURL);
      
      return downloadURL;
    } catch (error) {
      console.error('Erro detalhado no upload:', error);
      throw new Error(`Falha no upload da imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const validarCamposNhb = (): boolean => {
    if (!tituloNhb.trim()) {
      toast({
        title: "Erro de validação",
        description: "O título da NHB é obrigatório.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const validarCamposProtocolo = (): boolean => {
    if (!tituloProtocolo.trim()) {
      toast({
        title: "Erro de validação",
        description: "O título do protocolo é obrigatório.",
        variant: "destructive",
      });
      return false;
    }

    if (!volumeProtocolo || isNaN(Number(volumeProtocolo))) {
      toast({
        title: "Erro de validação",
        description: "O volume do protocolo deve ser um número válido.",
        variant: "destructive",
      });
      return false;
    }

    if (!dataPublicacao) {
      toast({
        title: "Erro de validação",
        description: "A data de publicação é obrigatória.",
        variant: "destructive",
      });
      return false;
    }

    if (!versaoProtocolo || isNaN(Number(versaoProtocolo))) {
      toast({
        title: "Erro de validação",
        description: "A versão do protocolo deve ser um número válido.",
        variant: "destructive",
      });
      return false;
    }

    if (!urlProtocolo.trim()) {
      toast({
        title: "Erro de validação",
        description: "A URL do protocolo é obrigatória.",
        variant: "destructive",
      });
      return false;
    }

    // Validação básica de URL
    try {
      new URL(urlProtocolo);
    } catch {
      toast({
        title: "Erro de validação",
        description: "Por favor, insira uma URL válida.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const convertToFirestoreTimestamp = (dateString: string): Timestamp => {
    // Criar data local sem conversão de fuso horário
    const [year, month, day] = dateString.split('-').map(Number);
    const localDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    return Timestamp.fromDate(localDate);
  };

  const handleSalvar = async () => {
    setLoading(true);
    
    try {
      if (tipoSubconjunto === 'nhb') {
        // Validar campos NHB
        if (!validarCamposNhb()) {
          setLoading(false);
          return;
        }

        // Verificar duplicação
        const duplicado = await verificarDuplicacao('nhb', tituloNhb);
        if (duplicado) {
          toast({
            title: "Erro de duplicação",
            description: "Já existe uma NHB com este título.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Salvar NHB
        await addDoc(collection(db, 'subconjuntosEnfermagem'), {
          tipoSubconjunto: 'nhb',
          tituloSubconjunto: tituloNhb.trim(),
          descricaoSubconjunto: descricaoNhb.trim() || null,
          dataCadastro: new Date(),
        });

        toast({
          title: "Sucesso",
          description: "Necessidade Humana Básica cadastrada com sucesso!",
        });

      } else {
        // Validar campos Protocolo
        if (!validarCamposProtocolo()) {
          setLoading(false);
          return;
        }

        // Verificar duplicação
        const duplicado = await verificarDuplicacao('Protocolo_Enfermagem', tituloProtocolo);
        if (duplicado) {
          toast({
            title: "Erro de duplicação",
            description: "Já existe um protocolo com este título.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Upload da imagem se fornecida
        let imagemCapaUrl = null;
        if (imagemCapa) {
          try {
            console.log('Iniciando processo de upload da imagem...');
            imagemCapaUrl = await uploadImagem(imagemCapa);
            console.log('Upload da imagem concluído com sucesso:', imagemCapaUrl);
          } catch (error) {
            console.error('Erro no upload da imagem:', error);
            toast({
              title: "Erro no upload",
              description: `Falha ao fazer upload da imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
              variant: "destructive",
            });
            setLoading(false);
            return;
          }
        }

        // Salvar Protocolo com datas corrigidas
        await addDoc(collection(db, 'subconjuntosEnfermagem'), {
          tipoSubconjunto: 'Protocolo_Enfermagem',
          tituloSubconjunto: tituloProtocolo.trim(),
          volumeProtocolo: parseInt(volumeProtocolo),
          dataPublicacaoProtocolo: convertToFirestoreTimestamp(dataPublicacao),
          dataAtualizacaoProtocolo: dataAtualizacao ? convertToFirestoreTimestamp(dataAtualizacao) : null,
          versaoProtocolo: parseFloat(versaoProtocolo),
          urlProtocolo: urlProtocolo.trim(),
          imagemCapaProtocolo: imagemCapaUrl,
          dataCadastro: new Date(),
        });

        toast({
          title: "Sucesso",
          description: "Protocolo de Enfermagem cadastrado com sucesso!",
        });
      }

      // Resetar formulário e fechar modal
      resetForm();
      setOpen(false);
      onSubconjuntoCadastrado?.();

    } catch (error) {
      console.error('Erro ao salvar subconjunto:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o subconjunto. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="outline" className="h-8 w-8">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Subconjunto</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Seleção do tipo */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Tipo de Subconjunto</Label>
            <RadioGroup 
              value={tipoSubconjunto} 
              onValueChange={(value: 'nhb' | 'protocolo') => setTipoSubconjunto(value)}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nhb" id="nhb" />
                <Label htmlFor="nhb">Necessidade Humana Básica</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="protocolo" id="protocolo" />
                <Label htmlFor="protocolo">Protocolo de Enfermagem</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Campos para NHB */}
          {tipoSubconjunto === 'nhb' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo-nhb">Título da NHB *</Label>
                <Input
                  id="titulo-nhb"
                  value={tituloNhb}
                  onChange={(e) => setTituloNhb(e.target.value)}
                  placeholder="Digite o título da Necessidade Humana Básica"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao-nhb">Descrição da NHB</Label>
                <Textarea
                  id="descricao-nhb"
                  value={descricaoNhb}
                  onChange={(e) => setDescricaoNhb(e.target.value)}
                  placeholder="Digite uma descrição (opcional)"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Campos para Protocolo */}
          {tipoSubconjunto === 'protocolo' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo-protocolo">Título do Protocolo *</Label>
                <Input
                  id="titulo-protocolo"
                  value={tituloProtocolo}
                  onChange={(e) => setTituloProtocolo(e.target.value)}
                  placeholder="Digite o título do protocolo"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="volume-protocolo">Volume do Protocolo *</Label>
                  <Input
                    id="volume-protocolo"
                    type="number"
                    value={volumeProtocolo}
                    onChange={(e) => setVolumeProtocolo(e.target.value)}
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="versao-protocolo">Versão do Protocolo *</Label>
                  <Input
                    id="versao-protocolo"
                    type="number"
                    step="0.1"
                    value={versaoProtocolo}
                    onChange={(e) => setVersaoProtocolo(e.target.value)}
                    placeholder="1.0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data-publicacao">Data de Publicação *</Label>
                  <Input
                    id="data-publicacao"
                    type="date"
                    value={dataPublicacao}
                    onChange={(e) => setDataPublicacao(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data-atualizacao">Data de Atualização</Label>
                  <Input
                    id="data-atualizacao"
                    type="date"
                    value={dataAtualizacao}
                    onChange={(e) => setDataAtualizacao(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="url-protocolo">URL do Protocolo *</Label>
                <Input
                  id="url-protocolo"
                  type="url"
                  value={urlProtocolo}
                  onChange={(e) => setUrlProtocolo(e.target.value)}
                  placeholder="https://exemplo.com/protocolo.pdf"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imagem-capa">Imagem da Capa</Label>
                <Input
                  id="imagem-capa"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImagemCapa(e.target.files?.[0] || null)}
                />
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button onClick={handleSalvar} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModalCadastroSubconjunto;
