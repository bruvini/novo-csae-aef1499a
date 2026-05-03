
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import * as dotenv from "dotenv";

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addChangelog() {
  try {
    const docRef = await addDoc(collection(db, "changelogs"), {
      titulo: "Novo Design do Exame Físico",
      descricao: "A aba de Exame Físico foi completamente redesenhada. Agora os sinais vitais, exames e revisão de sistemas estão organizados em painéis interativos mais claros, com feedback de cores inteligente para alterações clínicas, facilitando e agilizando o registro durante a consulta.",
      data: serverTimestamp(),
      autor: "Antigravity AI",
      versao: "2.1.0"
    });
    console.log("Changelog added with ID: ", docRef.id);
    process.exit(0);
  } catch (e) {
    console.error("Error adding changelog: ", e);
    process.exit(1);
  }
}

addChangelog();
