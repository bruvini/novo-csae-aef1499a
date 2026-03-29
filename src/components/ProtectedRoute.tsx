
import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "@/services/firebase";
import { doc, getDoc } from "firebase/firestore";
import LoadingOverlay from "./LoadingOverlay";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireGestor?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false, requireGestor = false }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGestor, setIsGestor] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAuthenticated(true);
        
        // Fetch user doc
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsAdmin(userData.ehAdmin === true);
          setIsGestor(userData.gestorConteudos === true || userData.ehAdmin === true);
          setStatus(userData.statusAcesso || "Aguardando");
        } else {
          setStatus("SemPerfil");
        }
      } else {
        setAuthenticated(false);
        setIsAdmin(false);
        setIsGestor(false);
        setStatus(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <LoadingOverlay />;
  }

  if (!authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (status === "Aguardando") {
    return <Navigate to="/waiting-approval" replace />;
  }

  if (status === "Recusado") {
    // If refused, logout user and send back to login
    signOut(auth);
    return <Navigate to="/login" replace />;
  }

  if (status === "SemPerfil") {
    // Authenticated but no Firestore doc? Something is wrong.
    return <Navigate to="/registrar" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireGestor && !isGestor) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
