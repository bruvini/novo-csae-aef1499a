interface HeroBannerProps {
  stats?: {
    profissionaisAprovados: number;
    processosAndamento: number;
    processosConcluidos: number;
  };
  loading?: boolean;
}

const HeroBanner: React.FC<HeroBannerProps> = ({ stats, loading = false }) => {
  const totalProcessos = (stats?.processosAndamento || 0) + (stats?.processosConcluidos || 0);

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

      <div className="container relative mx-auto px-6 py-8 lg:px-12 lg:py-10 z-10 flex flex-col justify-center">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Left Column - Content */}
          <div className="flex-1 text-white text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-4 transition-all hover:bg-white/20 underline-offset-4 decoration-white/30 decoration-1">
              <span className="flex h-1.5 w-1.5 rounded-full bg-csae-green-400 animate-pulse"></span>
              <span className="text-[10px] font-bold tracking-widest uppercase">Portal Oficial v2.0</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.1] mb-4 tracking-tight">
              Sua plataforma para o <br />
              trabalho em <span className="text-transparent bg-clip-text bg-gradient-to-r from-csae-green-100 to-white">enfermagem</span>
            </h2>
            
            <p className="text-base text-csae-green-100/90 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0 font-medium line-clamp-2">
              Transformando o cuidado com ferramentas tecnológicas desenvolvidas especialmente para a rede municipal de Florianópolis.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto lg:mx-0 pt-4 border-t border-white/10">
              <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                <p className="text-[10px] text-csae-green-200 uppercase font-black tracking-widest mb-1">Profissionais cadastrados</p>
                <p className="text-2xl font-black text-white">
                  {loading ? '---' : stats?.profissionaisAprovados || 0}
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                <p className="text-[10px] text-csae-green-200 uppercase font-black tracking-widest mb-1">Processos de Enfermagem realizados</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black text-white">
                    {loading ? '---' : totalProcessos}
                  </p>
                  {!loading && (
                    <span className="text-[10px] text-white/40 font-medium">
                      ({stats?.processosAndamento} ativos / {stats?.processosConcluidos} concluídos)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="flex-shrink-0 relative group hidden lg:block">
            {/* Glow effect */}
            <div className="absolute -inset-2 bg-gradient-to-r from-csae-green-400/30 to-blue-400/30 rounded-full blur-2xl opacity-50 group-hover:opacity-80 transition duration-1000"></div>
            
            <div className="relative w-56 h-56 lg:w-64 lg:h-64 rounded-full overflow-hidden shadow-2xl border border-white/20 transform transition-all duration-700 group-hover:scale-[1.03]">
              <img
                src="/lovable-uploads/9753344e-5ca4-43b0-8479-c33f5880810f.png"
                alt="Profissional de enfermagem CSAE"
                className="w-full h-full object-cover grayscale-[0.2] contrast-[1.1] group-hover:grayscale-0 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-csae-green-900/60 to-transparent"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
