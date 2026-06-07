
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, ChevronRight, Loader2, Heart, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { salvarPesquisaNPS } from '@/services/bancodados/suporteDB';

interface ModalNPSObrigatorioProps {
  usuarioId: string;
  nomeUsuario: string;
  onConcluido: () => void;
}

// ─── ScoreButton (idêntico ao da CentralAjuda) ───────────────
function ScoreButton({
  value,
  selected,
  max,
  onClick,
}: {
  value: number;
  selected: number | null;
  max: number;
  onClick: (v: number) => void;
}) {
  const isSelected = selected === value;
  const ratio = max === 1 ? 1 : (value - 1) / (max - 1);
  const hue = Math.round(ratio * 120);
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`w-10 h-10 rounded-xl text-sm font-bold transition-all duration-150 border-2 ${
        isSelected
          ? 'text-white scale-110 shadow-md border-transparent'
          : 'bg-white text-gray-600 border-gray-200 hover:scale-105 hover:border-gray-300'
      }`}
      style={
        isSelected
          ? { backgroundColor: `hsl(${hue}, 70%, 45%)`, borderColor: `hsl(${hue}, 70%, 45%)` }
          : {}
      }
      aria-pressed={isSelected}
      aria-label={`Nota ${value}`}
    >
      {value}
    </button>
  );
}

// ─── Modal ────────────────────────────────────────────────────

const ModalNPSObrigatorio: React.FC<ModalNPSObrigatorioProps> = ({
  usuarioId,
  nomeUsuario,
  onConcluido,
}) => {
  const [notaGeral, setNotaGeral] = useState<number | null>(null);
  const [notaUsabilidade, setNotaUsabilidade] = useState<number | null>(null);
  const [notaPerformance, setNotaPerformance] = useState<number | null>(null);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [concluido, setConcluido] = useState(false);

  const podeConcluir =
    notaGeral !== null && notaUsabilidade !== null && notaPerformance !== null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!podeConcluir || enviando) return;

    setEnviando(true);
    try {
      // Não incluir comentario se vazio — evita enviar undefined para o Firestore
      const dadosNPS = {
        usuarioId,
        nomeUsuario,
        notaGeral: notaGeral!,
        notaUsabilidade: notaUsabilidade!,
        notaPerformance: notaPerformance!,
        ...(comentario.trim() ? { comentario: comentario.trim() } : {}),
      };
      await salvarPesquisaNPS(dadosNPS);
      setConcluido(true);
      // Fecha automaticamente após 2,5s
      setTimeout(() => onConcluido(), 2500);
    } catch (error) {
      console.error('Erro ao enviar NPS:', error);
      toast.error(
        'Não foi possível enviar sua avaliação. Verifique sua conexão e tente novamente.'
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    // Overlay fixo que cobre toda a tela — não pode ser fechado
    <div
      className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      // Prevent any click-through
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        {/* Header verde */}
        <div className="bg-gradient-to-r from-csae-green-600 to-csae-green-700 rounded-t-2xl px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">Sua opinião faz a diferença!</h2>
              <p className="text-sm text-csae-green-100 mt-0.5">Portal CSAE Floripa</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          {concluido ? (
            /* ── Estado pós-envio ── */
            <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
              <div className="w-16 h-16 bg-csae-green-100 rounded-full flex items-center justify-center">
                <Heart className="w-8 h-8 text-csae-green-600 fill-current" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Obrigado pelo feedback!</h3>
              <p className="text-gray-500 text-sm max-w-xs">
                Sua avaliação nos ajuda a melhorar continuamente o Portal CSAE. Seguindo...
              </p>
            </div>
          ) : (
            /* ── Formulário ── */
            <>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                Como você está achando o Portal CSAE? Reserve um minuto para avaliar — suas
                respostas são fundamentais para que continuemos evoluindo a ferramenta.
              </p>

              <form onSubmit={handleSubmit} className="space-y-7">
                {/* Nota Geral 1-10 */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700">
                    Nota Geral do Portal{' '}
                    <span className="font-normal text-gray-400">(1 = Péssimo, 10 = Excelente)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
                      <ScoreButton
                        key={v}
                        value={v}
                        selected={notaGeral}
                        max={10}
                        onClick={setNotaGeral}
                      />
                    ))}
                  </div>
                </div>

                {/* Nota Usabilidade 1-5 */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700">
                    Facilidade de Uso / Usabilidade{' '}
                    <span className="font-normal text-gray-400">(1 = Difícil, 5 = Muito Fácil)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 5 }, (_, i) => i + 1).map((v) => (
                      <ScoreButton
                        key={v}
                        value={v}
                        selected={notaUsabilidade}
                        max={5}
                        onClick={setNotaUsabilidade}
                      />
                    ))}
                  </div>
                </div>

                {/* Nota Performance 1-5 */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700">
                    Velocidade / Performance{' '}
                    <span className="font-normal text-gray-400">(1 = Muito Lento, 5 = Muito Rápido)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 5 }, (_, i) => i + 1).map((v) => (
                      <ScoreButton
                        key={v}
                        value={v}
                        selected={notaPerformance}
                        max={5}
                        onClick={setNotaPerformance}
                      />
                    ))}
                  </div>
                </div>

                {/* Comentário */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Comentário{' '}
                    <span className="font-normal text-gray-400">(opcional)</span>
                  </label>
                  <Textarea
                    placeholder="Conte-nos o que podemos melhorar ou o que você mais gosta no portal..."
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    rows={3}
                    className="resize-none focus-visible:ring-csae-green-600"
                  />
                </div>

                {/* Aviso quando notas incompletas */}
                {!podeConcluir && (
                  <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Preencha as três notas para continuar.</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={!podeConcluir || enviando}
                  className="w-full bg-csae-green-600 hover:bg-csae-green-700 font-semibold gap-2 h-11"
                >
                  {enviando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <ChevronRight className="w-4 h-4" />
                      Enviar avaliação e continuar
                    </>
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalNPSObrigatorio;
