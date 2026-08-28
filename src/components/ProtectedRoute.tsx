import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoadingOverlay from "./LoadingOverlay";
import { toast } from "sonner";

import { ProtectedRouteProps } from "@/lib/pages";
import { temPermissaoPagina } from "@/lib/pages";

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  allowedPageId,
}) => {
  const { user, sessionData, loading } = useAuth();
  const location = useLocation();

  const isAuthorized = React.useMemo(() => {
    if (loading) return true;
    if (!user || !sessionData) return false;
    if (requireAdmin) return sessionData.ehAdmin === true;
    if (allowedPageId) {
      return temPermissaoPagina(
        sessionData.ehAdmin === true,
        sessionData.paginasPermitidas,
        allowedPageId,
      );
    }
    return true;
  }, [user, sessionData, loading, requireAdmin, allowedPageId]);

  useEffect(() => {
    if (!loading && user && sessionData && !isAuthorized) {
      toast.error("Acesso Negado", {
        description: "Você não tem permissão para acessar esta página.",
      });
    }
  }, [isAuthorized, loading, user, sessionData]);

  if (loading) {
    return <LoadingOverlay />;
  }

  if (!user || !sessionData) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (!isAuthorized) {
    return <Navigate to="/perfil" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
