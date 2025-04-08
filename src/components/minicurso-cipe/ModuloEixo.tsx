import React from 'react';
import { TermoCipe } from '@/services/bancodados/tipos';

export interface ModuloEixoProps {
  tipo: string;
  termos: TermoCipe[];
  completado?: boolean;
  onComplete?: () => void;
}

const ModuloEixo: React.FC<ModuloEixoProps> = ({ tipo, termos, completado = false, onComplete }) => {
  return (
    <div>
      <h3>{tipo}</h3>
      <ul>
        {termos.map((termo) => (
          <li key={termo.id}>{termo.termo}</li>
        ))}
      </ul>
      {completado ? (
        <p>Módulo Concluído</p>
      ) : (
        <button onClick={onComplete}>Marcar como Concluído</button>
      )}
    </div>
  );
};

export default ModuloEixo;
