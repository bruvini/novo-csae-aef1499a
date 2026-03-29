import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoadingOverlay from "./LoadingOverlay";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { user, sessionData, loading, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingOverlay />;
  }

  if (!user || !sessionData) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const status = (sessionData.statusAcesso || "").toLowerCase();

  if (status === "aguardando") {
    return <Navigate to="/waiting-approval" replace />;
  }

  if (status === "recusado" || status === "rejeitado") {
    logout();
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !sessionData.ehAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
