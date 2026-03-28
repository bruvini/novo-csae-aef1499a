
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import dotenv from "dotenv";

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function promoteByEmail(email: string, promoteToAdmin: boolean) {
  try {
    const q = query(collection(db, "usuarios"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.error(`Usuário com e-mail ${email} não encontrado.`);
      return;
    }

    const userDoc = querySnapshot.docs[0];
    const uid = userDoc.id;

    await updateDoc(doc(db, "usuarios", uid), {
      statusAcesso: "Liberado",
      ehAdmin: promoteToAdmin,
      tipoUsuario: promoteToAdmin ? "Admin" : "Comum"
    });
    console.log(`Usuário ${email} (UID: ${uid}) liberado como ${promoteToAdmin ? "Admin" : "Comum"}.`);
  } catch (error) {
    console.error("Erro ao configurar usuário:", error);
  }
}

const email = process.argv[2];
const isAdmin = process.argv[3] === "admin";

if (!email) {
  console.error("Por favor, forneça o e-mail do usuário.");
  process.exit(1);
}

promoteByEmail(email, isAdmin);
