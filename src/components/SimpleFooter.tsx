
import React from 'react';
import { Heart } from 'lucide-react';

const SimpleFooter = () => {
  return (
    <footer className="py-6 text-center text-sm text-gray-500">
      <p className="flex items-center justify-center gap-1.5">
        Desenvolvido com 
        <Heart className="w-4 h-4 fill-csae-green-500 text-csae-green-500" /> 
        por Bruno Vinícius, em colaboração com a Comissão Permanente de Sistematização da Assistência de Enfermagem (CSAE) de Florianópolis
      </p>
    </footer>
  );
};

export default SimpleFooter;
