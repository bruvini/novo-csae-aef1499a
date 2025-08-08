
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireGestorConteudos?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false,
  requireGestorConteudos = false 
}) => {
  const { isAuthenticated, sessionData, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-csae-green-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !sessionData) {
    return <Navigate to="/login" replace />;
  }

  // Verificar permissões específicas
  if (requireAdmin && !sessionData.ehAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireGestorConteudos && !sessionData.gestorConteudos) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
