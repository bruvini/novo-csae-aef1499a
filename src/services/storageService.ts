
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export const uploadTermoResponsabilidade = async (
  pdfBlob: Blob, 
  uid: string
): Promise<string> => {
  try {
    // Criar referência para o arquivo no Firebase Storage
    const termoRef = ref(storage, `termos-responsabilidade/${uid}.pdf`);
    
    // Upload do arquivo
    const snapshot = await uploadBytes(termoRef, pdfBlob);
    
    // Obter URL de download
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Erro ao fazer upload do termo:', error);
    throw new Error('Falha ao salvar o termo de responsabilidade');
  }
};
