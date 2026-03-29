
import React from 'react';

const HeroBanner = () => {
  return (
    <section className="relative w-full bg-gradient-to-r from-csae-green-600 to-csae-green-700 overflow-hidden" role="banner">
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          {/* Coluna Esquerda - Texto (60-70%) */}
          <div className="lg:col-span-2 text-white space-y-6">
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                Empoderando o cuidado de enfermagem através da 
                <span className="text-csae-green-200"> tecnologia</span>
              </h2>
              <p className="text-xl sm:text-2xl font-medium text-csae-green-100">
                Versão 2.0 - Feito por enfermeiros para enfermeiros
              </p>
            </div>
            
            <div className="space-y-3">
              <p className="text-lg text-csae-green-100 leading-relaxed">
                Uma plataforma inovadora desenvolvida especialmente para os profissionais 
                de enfermagem da rede pública de Florianópolis.
              </p>
              <div className="inline-block bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3 border border-white/20">
                <p className="text-sm font-semibold text-white">
                  Portal CSAE Floripa 2.0 - Inovação e humanização no cuidado
                </p>
              </div>
            </div>
          </div>

          {/* Coluna Direita - Imagem (30-40%) */}
          <div className="lg:col-span-1 flex justify-center lg:justify-end">
            <div className="relative">
              <div className="w-64 h-64 sm:w-80 sm:h-80 lg:w-72 lg:h-72 xl:w-80 xl:h-80 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20">
                <img
                  src="/lovable-uploads/9753344e-5ca4-43b0-8479-c33f5880810f.png"
                  alt="Profissional de enfermagem em frente ao Centro de Saúde com laptop mostrando o Portal CSAE"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Efeito de brilho */}
              <div className="absolute -inset-4 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-3xl blur-xl"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Padrão decorativo de fundo simplificado */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full" style={{
          backgroundImage: 'radial-gradient(circle at 20px 20px, rgba(255,255,255,0.15) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>
    </section>
  );
};

export default HeroBanner;
