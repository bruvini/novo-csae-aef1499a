
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
  const { usuario, obterSessao, carregando } = useAutenticacao();
  const location = useLocation();
  const [moduloAtivo, setModuloAtivo] = useState<boolean | null>(null);
  const [verificandoModulo, setVerificandoModulo] = useState<boolean>(false);
  
  // Get user session for access to extra properties
  const sessao = obterSessao();

  useEffect(() => {
    const verificarModulo = async () => {
      if (modulo && sessao) {
        setVerificandoModulo(true);
        const ativo = await verificarModuloAtivo(
          modulo,
          sessao.ehAdmin,
          sessao.atuaSMS
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
  }, [modulo, sessao]);

  if (carregando || (modulo && verificandoModulo)) {
    return <Loading />;
  }

  // Não está autenticado, mas a rota requer autenticação
  if (requereAutenticacao && !usuario) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Está autenticado, mas não tem permissão para acessar a rota
  if (usuario && permiteSoAdmin && sessao && !sessao.ehAdmin) {
    return <Navigate to="/sem-permissao" replace />;
  }

  if (usuario && permiteSoSMS && sessao && !sessao.atuaSMS) {
    return <Navigate to="/sem-permissao" replace />;
  }

  // Verifica se o módulo está ativo
  if (moduloAtivo === false) {
    return <Navigate to="/modulo-inativo" replace />;
  }

  return <Outlet />;
};

export default RotaProtegida;
