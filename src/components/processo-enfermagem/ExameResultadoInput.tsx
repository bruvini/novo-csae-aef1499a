import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ComponenteExame, ResultadoExame, componenteEhClassificatorio, Exame } from '@/services/bancodados/examesDB';
import { obterOpcoesValorComplementar } from '@/utils/resultadoExameUtils';

interface ExameResultadoInputProps {
  tipoExame: Exame['tipoExame'];
  componente: ComponenteExame;
  valor: string | number;
  valorTexto?: string;
  className?: string;
  onResultadoChange: (valor: string) => void;
  onValorTextoChange: (resultado: ResultadoExame, valor: string) => void;
}

export function ExameResultadoInput({
  tipoExame,
  componente,
  valor,
  valorTexto = '',
  className,
  onResultadoChange,
  onValorTextoChange,
}: ExameResultadoInputProps) {
  if (!componenteEhClassificatorio(tipoExame, componente)) {
    return (
      <Input
        type="number"
        min="0"
        step="any"
        placeholder="Resultado"
        value={valor}
        onChange={(event) => {
          const nextValue = event.target.value;
          if (nextValue === '' || Number(nextValue) >= 0) onResultadoChange(nextValue);
        }}
        className={className}
      />
    );
  }

  const resultadosComRotulo = componente.resultados.filter(
    (resultado): resultado is ResultadoExame & { resultadoClassificatorio: string } =>
      Boolean(resultado.resultadoClassificatorio)
  );
  const opcoes = Array.from(new Set(resultadosComRotulo.map((resultado) => resultado.resultadoClassificatorio)))
    .map((resultado) => ({ value: resultado, label: resultado }));
  const resultadoSelecionado = resultadosComRotulo.find(
    (resultado) => resultado.resultadoClassificatorio === String(valor)
  );
  const opcoesValorTexto = resultadoSelecionado
    ? obterOpcoesValorComplementar(resultadoSelecionado)
    : [];

  return (
    <div className="space-y-2">
      <Select
        value={String(valor)}
        onValueChange={onResultadoChange}
      >
        <SelectTrigger className={className}>
          <SelectValue placeholder="Selecione o resultado..." />
        </SelectTrigger>
        <SelectContent>
          {opcoes.map((opcao) => (
            <SelectItem key={opcao.value} value={opcao.value}>{opcao.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {resultadoSelecionado?.permiteValorTexto && (
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-gray-600">
            {resultadoSelecionado.rotuloValorTexto || 'Informação complementar'}
            {resultadoSelecionado.valorTextoObrigatorio && <span className="text-red-600"> *</span>}
          </label>
          {opcoesValorTexto.length > 0 ? (
            <Select
              value={valorTexto || undefined}
              onValueChange={(value) => onValorTextoChange(resultadoSelecionado, value)}
              required={resultadoSelecionado.valorTextoObrigatorio}
            >
              <SelectTrigger aria-required={resultadoSelecionado.valorTextoObrigatorio}>
                <SelectValue placeholder={resultadoSelecionado.rotuloValorTexto || 'Selecione uma opção'} />
              </SelectTrigger>
              <SelectContent>
                {opcoesValorTexto.map((opcao) => (
                  <SelectItem key={opcao} value={opcao}>{opcao}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              type="text"
              value={valorTexto}
              required={resultadoSelecionado.valorTextoObrigatorio}
              aria-required={resultadoSelecionado.valorTextoObrigatorio}
              placeholder={resultadoSelecionado.rotuloValorTexto || 'Informe o valor'}
              onChange={(event) => onValorTextoChange(resultadoSelecionado, event.target.value)}
            />
          )}
        </div>
      )}
    </div>
  );
}
