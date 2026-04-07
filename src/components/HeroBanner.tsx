interface HeroBannerProps {
  stats?: {
    profissionaisAprovados: number;
    processosAndamento: number;
    processosConcluidos: number;
    totalAcessosPlataforma: number;
  };
  loading?: boolean;
}

const HeroBanner: React.FC<HeroBannerProps> = ({ stats, loading = false }) => {
  const totalProcessos = (stats?.processosAndamento || 0) + (stats?.processosConcluidos || 0);

  return (
    <section className="relative w-full overflow-hidden rounded-3xl min-h-[320px]" role="banner">
      {/* Background with multiple gradients for depth */}
      <div className="absolute inset-0 bg-csae-green-800">
        <div className="absolute inset-0 bg-gradient-to-br from-csae-green-600/80 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 right-0 w-2/3 h-2/3 bg-gradient-to-tl from-csae-green-900/40 to-transparent"></div>
        {/* Subtle mesh pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      {/* ── Full-bleed image on the right ── */}
      <div className="absolute inset-y-0 right-0 w-1/2 lg:w-5/12 hidden lg:block">
        <img
          src="/enfermeira-capa.png"
          alt="Profissional de enfermagem CSAE"
          className="w-full h-full object-cover grayscale-[0.15] contrast-[1.1]"
        />
        {/* Gradient fade from left → transparent (blends into green bg) */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-csae-green-800 to-transparent z-10" />
        {/* Dark overlay for legibility */}
        <div className="absolute inset-0 bg-gradient-to-tr from-csae-green-900/50 to-transparent" />
        {/* AI credit label */}
        <span className="absolute bottom-3 right-4 text-[10px] text-white/50 font-medium tracking-wide z-20 select-none">
          Imagem gerada por IA
        </span>
      </div>

      <div className="container relative mx-auto px-6 py-8 lg:px-12 lg:py-10 z-20 flex flex-col justify-center">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Left Column - Content */}
          <div className="flex-1 text-white text-center lg:text-left max-w-2xl">

            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.1] mb-4 tracking-tight">
              Sua plataforma para o <br />
              trabalho em <span className="text-transparent bg-clip-text bg-gradient-to-r from-csae-green-100 to-white">enfermagem</span>
            </h2>
            
            <p className="text-base text-csae-green-100/90 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0 font-medium line-clamp-2">
              Transformando o cuidado com ferramentas tecnológicas desenvolvidas especialmente para a rede municipal de Florianópolis.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto lg:mx-0 pt-4 border-t border-white/10">
              <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors flex flex-col justify-between h-full">
                <p className="text-[10px] text-csae-green-200 uppercase font-black tracking-widest mb-2 leading-relaxed">Profissionais Ativos</p>
                <p className="text-2xl font-black text-white mt-auto">
                  {loading ? '---' : stats?.profissionaisAprovados || 0}
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors flex flex-col justify-between h-full">
                <p className="text-[10px] text-csae-green-200 uppercase font-black tracking-widest mb-2 leading-relaxed">Processos de Enfermagem Realizados</p>
                <div className="flex items-baseline gap-2 mt-auto">
                  <p className="text-2xl font-black text-white">
                    {loading ? '---' : totalProcessos}
                  </p>
                </div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors flex flex-col justify-between h-full">
                <p className="text-[10px] text-csae-green-200 uppercase font-black tracking-widest mb-2 leading-relaxed">Acessos ao Portal</p>
                <p className="text-2xl font-black text-white mt-auto">
                  {loading ? '---' : stats?.totalAcessosPlataforma || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - transparent spacer so left content doesn't overlap the image */}
          <div className="hidden lg:block lg:w-5/12 flex-shrink-0" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
