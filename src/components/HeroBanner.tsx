import { formatarTempoRegistrado } from '@/utils/tempoProcesso';

interface HeroBannerProps {
  stats?: {
    profissionaisAprovados: number;
    processosAndamento: number;
    processosConcluidos: number;
    totalAcessosPlataforma: number;
    totalTempoProcessosMinutos: number;
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

      {/* ── Full-bleed image on the right with seamless mask transition ── */}
      <div 
        className="absolute inset-y-0 right-0 w-1/2 lg:w-[48%] xl:w-[46%] hidden lg:block pointer-events-none select-none"
        style={{
          maskImage: 'linear-gradient(to right, transparent 0%, transparent 8%, rgba(0, 0, 0, 0.08) 12%, rgba(0, 0, 0, 0.35) 17%, rgba(0, 0, 0, 0.75) 23%, rgba(0, 0, 0, 0.96) 28%, #000 32%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, transparent 8%, rgba(0, 0, 0, 0.08) 12%, rgba(0, 0, 0, 0.35) 17%, rgba(0, 0, 0, 0.75) 23%, rgba(0, 0, 0, 0.96) 28%, #000 32%)',
        }}
      >
        <img
          src="/enfermeira-capa.png"
          alt="Profissionais de enfermagem CSAE"
          className="w-full h-full object-cover object-center"
        />
        {/* AI credit label */}
        <span className="absolute bottom-3 right-4 text-[10px] text-white/60 font-medium tracking-wide z-20 select-none drop-shadow-sm">
          Imagem gerada por IA
        </span>
      </div>

      <div className="relative z-20 flex w-full flex-col justify-center px-6 py-8 lg:px-12 lg:py-10">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Left Column - Content */}
          <div className="w-full min-w-0 text-center text-white lg:w-[64%] lg:flex-none lg:text-left">

            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.1] mb-4 tracking-tight">
              Sua plataforma para o <br />
              trabalho em <span className="text-transparent bg-clip-text bg-gradient-to-r from-csae-green-100 to-white">enfermagem</span>
            </h2>
            
            <p className="text-base text-csae-green-100/90 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0 font-medium line-clamp-2">
              Transformando o cuidado com ferramentas tecnológicas desenvolvidas especialmente para a rede municipal de Florianópolis.
            </p>
            
            <div className="mx-auto grid w-full min-w-0 grid-cols-2 gap-3 border-t border-white/10 pt-4 md:grid-cols-4 lg:mx-0">
              <div className="flex h-full min-h-[120px] min-w-0 flex-col justify-between rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm transition-colors hover:bg-white/15 sm:p-4">
                <p className="mb-3 min-h-9 text-[10px] font-black uppercase leading-relaxed tracking-wider text-csae-green-100 sm:text-[11px]">Profissionais Ativos</p>
                <p className="mt-auto whitespace-nowrap text-[clamp(1.125rem,2vw,2rem)] font-black leading-none tabular-nums text-white">
                  {loading ? '---' : stats?.profissionaisAprovados || 0}
                </p>
              </div>
              <div className="flex h-full min-h-[120px] min-w-0 flex-col justify-between rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm transition-colors hover:bg-white/15 sm:p-4">
                <p className="mb-3 min-h-9 text-[10px] font-black uppercase leading-relaxed tracking-wider text-csae-green-100 sm:text-[11px]">Processos Realizados</p>
                <p className="mt-auto whitespace-nowrap text-[clamp(1.125rem,2vw,2rem)] font-black leading-none tabular-nums text-white">
                  {loading ? '---' : totalProcessos}
                </p>
              </div>
              
              <div className="flex h-full min-h-[120px] min-w-0 flex-col justify-between rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm transition-colors hover:bg-white/15 sm:p-4">
                <p className="mb-3 min-h-9 text-[10px] font-black uppercase leading-relaxed tracking-wider text-csae-green-100 sm:text-[11px]">Logins registrados</p>
                <p className="mt-auto whitespace-nowrap text-[clamp(1.125rem,2vw,2rem)] font-black leading-none tabular-nums text-white">
                  {loading ? '---' : stats?.totalAcessosPlataforma || 0}
                </p>
              </div>
              <div className="flex h-full min-h-[120px] min-w-0 flex-col justify-between rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm transition-colors hover:bg-white/15 sm:p-4" title="Soma do tempo efetivamente registrado nas sessões encerradas do Processo de Enfermagem. Não inclui períodos sem atividade registrada.">
                <p className="mb-3 min-h-9 text-[10px] font-black uppercase leading-relaxed tracking-wider text-csae-green-100 sm:text-[11px]">Tempo de uso do PE</p>
                <p className="mt-auto whitespace-nowrap text-[clamp(1.125rem,2vw,2rem)] font-black leading-none tabular-nums text-white">
                  {loading ? '---' : formatarTempoRegistrado(stats?.totalTempoProcessosMinutos ?? 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - transparent spacer so left content doesn't overlap the image */}
          <div className="hidden lg:block lg:flex-1" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
