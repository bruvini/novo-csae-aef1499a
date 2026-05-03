import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function registerChangelog() {
  try {
    const docRef = await addDoc(collection(db, 'changelogs'), {
      titulo: 'Correções críticas de bugs e performance',
      descricao:
        'Corrigida a edição de pacientes que não funcionava (modal exibia mensagem de "não implementado"). ' +
        'Eliminado vazamento de memória no carregamento de diagnósticos (listener Firestore não era removido ao fechar o processo). ' +
        'Corrigidos re-carregamentos desnecessários de dados ao preencher a avaliação. ' +
        'Centralizada a lógica de progresso das etapas do processo de enfermagem para evitar divergências futuras.',
      dataHora: Timestamp.now(),
    });
    console.log('Changelog registrado com ID:', docRef.id);
    process.exit(0);
  } catch (e) {
    console.error('Erro ao registrar changelog:', e);
    process.exit(1);
  }
}

registerChangelog();
