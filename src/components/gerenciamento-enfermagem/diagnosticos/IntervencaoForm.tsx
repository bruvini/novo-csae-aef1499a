
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, File, X, Upload, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DocumentoApoio, Intervencao } from '@/types';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/services/firebase';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

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
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [documentoNome, setDocumentoNome] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const resetUploadState = () => {
    setUploading(false);
    setUploadProgress(0);
    setSelectedFile(null);
    setDocumentoNome('');
  };

  // Handle document file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não permitido. Use PDF, JPEG, JPG ou PNG.');
      e.target.value = '';
      return;
    }
    
    setSelectedFile(file);
    setDocumentoNome(file.name); // Set default document name
  };

  // Handle document upload
  const handleUpload = async () => {
    if (!selectedFile || !documentoNome.trim()) {
      toast.error('Selecione um arquivo e defina um nome para o documento.');
      return;
    }
    
    try {
      setUploading(true);
      setUploadProgress(10);
      
      // Create a reference to the storage location
      const fileId = uuidv4();
      const fileExtension = selectedFile.name.split('.').pop();
      const storageRef = ref(storage, `documentos-apoio/${fileId}.${fileExtension}`);
      
      // Upload file
      const uploadTask = uploadBytes(storageRef, selectedFile);
      setUploadProgress(50);
      
      await uploadTask;
      setUploadProgress(75);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      setUploadProgress(90);
      
      // Create documento apoio object
      const novoDocumento: DocumentoApoio = {
        id: fileId,
        nome: documentoNome,
        arquivo: downloadURL,
        tipo: selectedFile.type
      };
      
      // Update intervention with new document
      const documentosAtuais = intervencao.documentosApoio || [];
      onAtualizarIntervencao(
        resultadoIndex,
        intervencaoIndex,
        'documentosApoio',
        [...documentosAtuais, novoDocumento]
      );
      
      setUploadProgress(100);
      toast.success('Documento adicionado com sucesso!');
      
      // Reset form
      resetUploadState();
    } catch (error) {
      console.error('Erro ao fazer upload do arquivo:', error);
      toast.error('Erro ao fazer upload do arquivo. Tente novamente.');
    } finally {
      setTimeout(() => resetUploadState(), 1500);
    }
  };

  // Cancel document upload
  const cancelUpload = () => {
    resetUploadState();
  };

  // Remove document from intervention
  const removerDocumento = async (documentoId: string) => {
    if (!intervencao.documentosApoio) return;
    
    try {
      const documentoParaRemover = intervencao.documentosApoio.find(doc => doc.id === documentoId);
      if (!documentoParaRemover) return;
      
      // Try to delete file from storage
      try {
        const fileRef = ref(storage, documentoParaRemover.arquivo);
        await deleteObject(fileRef);
      } catch (storageError) {
        console.error('Erro ao excluir arquivo do storage:', storageError);
        // Continue even if storage deletion fails
      }
      
      const documentosAtualizados = intervencao.documentosApoio.filter(
        doc => doc.id !== documentoId
      );
      
      onAtualizarIntervencao(
        resultadoIndex, 
        intervencaoIndex, 
        'documentosApoio', 
        documentosAtualizados
      );
      
      toast.success('Documento removido com sucesso!');
    } catch (error) {
      console.error('Erro ao remover documento:', error);
      toast.error('Erro ao remover o documento. Tente novamente.');
    }
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
          <Label className="text-xs mb-2">Documentos de Apoio</Label>
          
          {/* Documentos já adicionados */}
          {intervencao.documentosApoio && intervencao.documentosApoio.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {intervencao.documentosApoio.map((documento) => (
                <Badge 
                  key={documento.id} 
                  variant="outline" 
                  className="flex items-center gap-1 p-1 pr-2"
                >
                  <File className="h-3 w-3" />
                  <a 
                    href={documento.arquivo} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs truncate max-w-[150px] hover:text-blue-600"
                  >
                    {documento.nome}
                  </a>
                  <button 
                    onClick={() => removerDocumento(documento.id!)}
                    type="button"
                    className="text-red-500 hover:text-red-700 ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          
          {/* Upload de novo documento */}
          <div className="grid gap-2">
            {!selectedFile ? (
              <div className="flex items-center gap-2">
                <label 
                  htmlFor={`documento-${resultadoIndex}-${intervencaoIndex}`}
                  className="flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded cursor-pointer text-xs"
                >
                  <Plus className="h-3 w-3" />
                  Selecionar documento
                </label>
                <input
                  id={`documento-${resultadoIndex}-${intervencaoIndex}`}
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </div>
            ) : (
              <div className="border border-dashed border-gray-300 rounded p-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4 text-blue-500" />
                    <span className="text-xs truncate max-w-[200px]">{selectedFile.name}</span>
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={cancelUpload}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid gap-2">
                  <div className="grid gap-1">
                    <Label className="text-xs">Nome do documento</Label>
                    <Input
                      value={documentoNome}
                      onChange={(e) => setDocumentoNome(e.target.value)}
                      placeholder="Digite um nome para o documento"
                      className="text-xs"
                    />
                  </div>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="w-full flex items-center justify-center gap-2"
                    onClick={handleUpload}
                    disabled={uploading || !documentoNome.trim()}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Enviando... {uploadProgress}%</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-3 w-3" />
                        <span>Enviar documento</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
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
