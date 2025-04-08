import React from 'react';

export interface CursoSidebarProps {
  modulos: { id: string; nome: string; }[];
  moduloAtivo: string;
  setModuloAtivo: React.Dispatch<React.SetStateAction<string>>;
}

const CursoSidebar: React.FC<CursoSidebarProps> = ({ modulos, moduloAtivo, setModuloAtivo }) => {
  return (
    <div className="w-64 bg-gray-100 p-4 space-y-2">
      <h2 className="text-lg font-semibold mb-2">Módulos do Curso</h2>
      {modulos.map((modulo) => (
        <button
          key={modulo.id}
          className={`w-full text-left py-2 px-4 rounded ${modulo.id === moduloAtivo ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}
          onClick={() => setModuloAtivo(modulo.id)}
        >
          {modulo.nome}
        </button>
      ))}
    </div>
  );
};

export default CursoSidebar;
