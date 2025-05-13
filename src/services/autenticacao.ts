
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { SessaoUsuario, UsuarioAutenticado } from '@/types/usuario';

// Register a new user
export const registerWithEmailAndPassword = async (email: string, password: string, userData: any): Promise<SessaoUsuario | null> => {
  try {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const user = res.user;
    
    if (userData.nome) {
      await updateProfile(user, {
        displayName: userData.nome
      });
    }
    
    const userDocRef = doc(db, "usuarios", user.uid);
    
    // Prepare user data for Firestore
    const userToSave: UsuarioAutenticado = {
      uid: user.uid,
      email: user.email || email,
      nome: userData.nome || '',
      ehAdmin: false,
      createdAt: new Date(),
      statusAprovacao: "Pendente" as const
    };
    
    await setDoc(userDocRef, userToSave);
    
    // Return session data
    const session: SessaoUsuario = {
      uid: user.uid,
      email: user.email || email,
      nome: userData.nome || '',
      ehAdmin: false
    };
    
    return session;
  } catch (err) {
    console.error("Error registering user:", err);
    throw err;
  }
};

// Log in user
export const loginWithEmailAndPassword = async (email: string, password: string): Promise<SessaoUsuario | null> => {
  try {
    const res = await signInWithEmailAndPassword(auth, email, password);
    const user = res.user;
    
    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, "usuarios", user.uid));
    if (!userDoc.exists()) {
      throw new Error("Usuário não encontrado no banco de dados");
    }
    
    const userData = userDoc.data() as UsuarioAutenticado;
    
    // Return session data
    const session: SessaoUsuario = {
      uid: user.uid,
      email: user.email || email,
      nome: userData.nome || '',
      ehAdmin: userData.ehAdmin || false
    };
    
    return session;
  } catch (err) {
    console.error("Error logging in:", err);
    throw err;
  }
};

// Reset password
export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (err) {
    console.error("Error sending password reset:", err);
    throw err;
  }
};
