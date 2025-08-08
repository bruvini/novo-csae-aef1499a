
import React from 'react';

const HeroBanner = () => {
  return (
    <section className="relative w-full h-64 sm:h-80 lg:h-96 overflow-hidden" role="banner">
      <div className="absolute inset-0">
        <img
          src="/lovable-uploads/9753344e-5ca4-43b0-8479-c33f5880810f.png"
          alt="Profissional de enfermagem em frente ao Centro de Saúde com laptop mostrando o Portal CSAE"
          className="w-full h-full object-cover"
        />
        {/* Overlay para melhor contraste do texto */}
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 h-full flex items-center justify-center">
        <div className="text-center text-white max-w-3xl">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 drop-shadow-lg">
            Empoderando o cuidado de enfermagem através da tecnologia
          </h2>
          <p className="text-lg sm:text-xl font-medium drop-shadow-md">
            Versão 2.0 - Feito por enfermeiros para enfermeiros
          </p>
          <div className="mt-4 inline-block bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-4 py-2">
            <p className="text-sm font-medium">
              Portal CSAE Floripa 2.0 - Inovação e humanização no cuidado
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
