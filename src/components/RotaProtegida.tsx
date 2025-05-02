
import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAutenticacao } from '@/services/autenticacao';
import { verificarModuloAtivo } from '@/services/bancodados/modulosDB';
import Loading from './Loading';

interface RotaProtegidaProps {
  requereAutenticacao?: boolean;
  permiteSoAdmin?: boolean;
  permiteSoSMS?: boolean;
  modulo?: string;
}

const RotaProtegida = ({ 
  requereAutenticacao = true, 
  permiteSoAdmin = false, 
  permiteSoSMS = false,
  modulo
}: RotaProtegidaProps) => {
  const { usuario, carregando } = useAutenticacao();
  const location = useLocation();
  const [moduloAtivo, setModuloAtivo] = useState<boolean | null>(null);
  const [verificandoModulo, setVerificandoModulo] = useState<boolean>(false);

  useEffect(() => {
    const verificarModulo = async () => {
      if (modulo && usuario) {
        setVerificandoModulo(true);
        const ativo = await verificarModuloAtivo(
          modulo,
          usuario.ehAdmin,
          usuario.atuaSMS
        );
        setModuloAtivo(ativo);
        setVerificandoModulo(false);
      } else if (modulo) {
        setModuloAtivo(false);
      } else {
        setModuloAtivo(true);
      }
    };

    verificarModulo();
  }, [modulo, usuario]);

  if (carregando || (modulo && verificandoModulo)) {
    return <Loading />;
  }

  // Não está autenticado, mas a rota requer autenticação
  if (requereAutenticacao && !usuario) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Está autenticado, mas não tem permissão para acessar a rota
  if (usuario && permiteSoAdmin && !usuario.ehAdmin) {
    return <Navigate to="/sem-permissao" replace />;
  }

  if (usuario && permiteSoSMS && !usuario.atuaSMS) {
    return <Navigate to="/sem-permissao" replace />;
  }

  // Verifica se o módulo está ativo
  if (moduloAtivo === false) {
    return <Navigate to="/modulo-inativo" replace />;
  }

  return <Outlet />;
};

export default RotaProtegida;
