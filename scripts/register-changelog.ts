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
      titulo: 'Processo de Enfermagem mais rápido e preciso',
      descricao:
        'A navegação entre as etapas do Processo de Enfermagem está muito mais ágil — ' +
        'trocar de etapa agora é instantâneo, sem esperar o sistema salvar antes de avançar. ' +
        'Também corrigimos um erro em que intervenções delegadas à equipe ainda apareciam ' +
        'como executadas pelo enfermeiro no Resumo Final após o executor ser alterado na ' +
        'etapa de Implementação. O sistema agora reflete corretamente quem fez o quê.',
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
