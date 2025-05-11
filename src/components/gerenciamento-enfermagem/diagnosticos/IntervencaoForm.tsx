
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, File, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DocumentoApoio, Intervencao } from '@/types';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/services/firebase';
import { v4 as uuidv4 } from 'uuid';

interface IntervencaoFormProps {
  intervencao: Intervencao;
  intervencaoIndex: number;
  resultadoIndex: number;
  onRemoverIntervencao: (resultadoIndex: number, intervencaoIndex: number) => void;
  onAtualizarIntervencao: (resultadoIndex: number, intervencaoIndex: number, campo: keyof Intervencao, valor: any) => void;
  showRemoveButton: boolean;
}

const IntervencaoForm = ({
  intervencao,
  intervencaoIndex,
  resultadoIndex,
  onRemoverIntervencao,
  onAtualizarIntervencao,
  showRemoveButton
}: IntervencaoFormProps) => {
  const [uploading, setUploading] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');

  // Handle document file selection and upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    
    if (!allowedTypes.includes(file.type)) {
      alert('Tipo de arquivo não permitido. Use PDF, JPEG, JPG ou PNG.');
      return;
    }
    
    try {
      setUploading(true);
      setFileName(file.name);
      
      // Create a reference to the storage location
      const fileId = uuidv4();
      const fileExtension = file.name.split('.').pop();
      const storageRef = ref(storage, `documentos-apoio/${fileId}.${fileExtension}`);
      
      // Upload file
      await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Create documento apoio object
      const novoDocumento: DocumentoApoio = {
        id: fileId,
        nome: file.name,
        arquivo: downloadURL,
        tipo: file.type
      };
      
      // Update intervention with new document
      const documentosAtuais = intervencao.documentosApoio || [];
      onAtualizarIntervencao(
        resultadoIndex,
        intervencaoIndex,
        'documentosApoio',
        [...documentosAtuais, novoDocumento]
      );
      
      // Reset file input
      e.target.value = '';
      setFileName('');
    } catch (error) {
      console.error('Erro ao fazer upload do arquivo:', error);
      alert('Erro ao fazer upload do arquivo. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  // Remove document from intervention
  const removerDocumento = (documentoId: string) => {
    if (!intervencao.documentosApoio) return;
    
    const documentosAtualizados = intervencao.documentosApoio.filter(
      doc => doc.id !== documentoId
    );
    
    onAtualizarIntervencao(
      resultadoIndex, 
      intervencaoIndex, 
      'documentosApoio', 
      documentosAtualizados
    );
  };

  return (
    <Card className="p-3 border-dashed">
      <div className="grid gap-3">
        <div className="flex justify-between items-center">
          <Label className="text-sm">Intervenção #{intervencaoIndex + 1}</Label>
          {showRemoveButton && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemoverIntervencao(resultadoIndex, intervencaoIndex)}
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="grid gap-1">
            <Label className="text-xs">Verbo em 1ª pessoa (Enfermeiro)</Label>
            <Input
              value={intervencao.verboPrimeiraEnfermeiro || ''}
              onChange={(e) => onAtualizarIntervencao(resultadoIndex, intervencaoIndex, 'verboPrimeiraEnfermeiro', e.target.value)}
              placeholder="Ex: Avalio"
              required
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-xs">Verbo infinitivo (3ª pessoa)</Label>
            <Input
              value={intervencao.verboOutraPessoa || ''}
              onChange={(e) => onAtualizarIntervencao(resultadoIndex, intervencaoIndex, 'verboOutraPessoa', e.target.value)}
              placeholder="Ex: Avaliar"
              required
            />
          </div>
        </div>
        
        <div className="grid gap-1">
          <Label className="text-xs">Restante da intervenção</Label>
          <Input
            value={intervencao.descricaoRestante || ''}
            onChange={(e) => onAtualizarIntervencao(resultadoIndex, intervencaoIndex, 'descricaoRestante', e.target.value)}
            placeholder="Ex: a intensidade da dor periodicamente"
            required
          />
        </div>
        
        <div className="grid gap-1 mt-2 pt-2 border-t border-dashed">
          <Label className="text-xs">Documentos de Apoio</Label>
          
          {/* Documentos já adicionados */}
          {intervencao.documentosApoio && intervencao.documentosApoio.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {intervencao.documentosApoio.map((documento) => (
                <Badge 
                  key={documento.id} 
                  variant="outline" 
                  className="flex items-center gap-1 p-1"
                >
                  <File className="h-3 w-3" />
                  <span className="text-xs truncate max-w-[150px]">{documento.nome}</span>
                  <button 
                    onClick={() => removerDocumento(documento.id!)}
                    type="button"
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          
          {/* Upload de novo documento */}
          <div className="flex items-center gap-2">
            <label 
              htmlFor={`documento-${resultadoIndex}-${intervencaoIndex}`}
              className="flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded cursor-pointer text-xs"
            >
              <Plus className="h-3 w-3" />
              Adicionar documento
            </label>
            <input
              id={`documento-${resultadoIndex}-${intervencaoIndex}`}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept=".pdf,.jpg,.jpeg,.png"
              disabled={uploading}
            />
            {uploading && <span className="text-xs text-gray-500">Enviando {fileName}...</span>}
          </div>
          <p className="text-xs text-gray-500 mt-1">Formatos aceitos: PDF, JPEG, JPG, PNG</p>
        </div>
        
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <span className="font-medium">Prévia:</span><br />
          Enfermeiro: <span className="text-green-700">{intervencao.verboPrimeiraEnfermeiro}</span> {intervencao.descricaoRestante}<br />
          Outra pessoa: <span className="text-blue-700">{intervencao.verboOutraPessoa}</span> {intervencao.descricaoRestante}
        </div>
      </div>
    </Card>
  );
};

export default IntervencaoForm;
