import React from 'react';

export interface ModuloElaboracaoProps {
  id: string;
  tipo: string;
  completado: boolean;
  onComplete: () => void;
}

const ModuloElaboracao: React.FC<ModuloElaboracaoProps> = ({ id, tipo, completado, onComplete }) => {
  return (
    <div>
      <h2>Módulo de Elaboração</h2>
      <p>ID: {id}</p>
      <p>Tipo: {tipo}</p>
      <p>Completado: {completado ? 'Sim' : 'Não'}</p>
      <button onClick={onComplete} disabled={completado}>
        {completado ? 'Módulo Concluído' : 'Marcar como Concluído'}
      </button>
    </div>
  );
};

export default ModuloElaboracao;
