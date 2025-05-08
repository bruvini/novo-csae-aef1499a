
import React, { useState } from 'react';

const GerenciadorDiagnosticos = () => {
  const [tipoSubconjuntoSelecionado, setTipoSubconjuntoSelecionado] = useState<'NHB' | 'Protocolo'>('NHB');

  // Fixed function to properly restrict the parameter type
  const handleSubconjuntoTipoChange = (tipo: 'NHB' | 'Protocolo') => {
    setTipoSubconjuntoSelecionado(tipo);
  };

  return (
    <div>
      <h2>Gerenciador de Diagnósticos</h2>
      {/* Component content will go here */}
    </div>
  );
};

export default GerenciadorDiagnosticos;
