import React from 'react';

const HeroBanner = () => {
  return (
    <section className="relative w-full overflow-hidden rounded-3xl" role="banner">
      {/* Background with multiple gradients for depth */}
      <div className="absolute inset-0 bg-csae-green-800">
        <div className="absolute inset-0 bg-gradient-to-br from-csae-green-600/80 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 right-0 w-2/3 h-2/3 bg-gradient-to-tl from-csae-green-900/40 to-transparent"></div>
        {/* Subtle mesh pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="container relative mx-auto px-6 py-12 lg:px-12 lg:py-20 z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left Column - Content */}
          <div className="flex-1 text-white text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-6 transition-all hover:bg-white/20 underline-offset-4 decoration-white/30 decoration-1">
              <span className="flex h-2 w-2 rounded-full bg-csae-green-400 animate-pulse"></span>
              <span className="text-xs font-bold tracking-widest uppercase">Portal Oficial v2.0</span>
            </div>
            
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-[1.1] mb-6 tracking-tight">
              Empoderando o cuidado <br />
              de <span className="text-transparent bg-clip-text bg-gradient-to-r from-csae-green-200 to-white">enfermagem</span>
            </h2>
            
            <p className="text-lg sm:text-xl text-csae-green-100/90 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0 font-medium whitespace-pre-line">
              Uma plataforma inovadora desenvolvida especialmente para os profissionais da rede pública de Florianópolis.
            </p>
            
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <div className="flex -space-x-3 overflow-hidden">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-csae-green-800 bg-csae-green-100 flex items-center justify-center text-[10px] font-bold text-csae-green-900 border border-white/10 uppercase">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <p className="text-sm font-medium text-csae-green-100">
                <span className="font-bold text-white">+500</span> profissionais ativos na rede
              </p>
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="flex-shrink-0 relative group">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-csae-green-400 to-blue-400 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 rounded-3xl overflow-hidden shadow-2xl overflow-hidden border border-white/20 transform transition-all duration-500 group-hover:scale-[1.02]">
              <img
                src="/lovable-uploads/9753344e-5ca4-43b0-8479-c33f5880810f.png"
                alt="Profissional de enfermagem CSAE"
                className="w-full h-full object-cover grayscale-[0.2] contrast-[1.1] group-hover:grayscale-0 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-csae-green-900/60 via-transparent to-transparent"></div>
              
              <div className="absolute bottom-6 left-6 right-6 p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg">
                <p className="text-xs font-bold text-white uppercase tracking-widest mb-1">Destaque do Mês</p>
                <p className="text-sm font-medium text-white/90">Protocolos atualizados com sucesso conforme CIPE® 2025.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
