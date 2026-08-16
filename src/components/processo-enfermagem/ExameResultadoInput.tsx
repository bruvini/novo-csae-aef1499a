import React from 'react';
import { Combobox } from '@/components/ui/combobox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ComponenteExame } from '@/services/bancodados/examesDB';

interface ValidationStatus {
  status: 'normal' | 'alterado' | 'neutro';
  nomeAlteracao?: string;
  nhb?: string;
}

interface ExameResultadoInputProps {
  parametro: string;
  componente: ComponenteExame;
  valorAtual: string;
  valorTextoAtual: string;
  onValueChange: (selected: string, validation: ValidationStatus, prevSelection: string) => void;
  onValorTextoChange: (resultadoClassificatorio: string, texto: string) => void;
  getInputClassName: (parametro: string) => string;
  renderValidationMessage: (parametro: string) => React.ReactNode;
  getImagemValidation: (parametro: string, selected: string) => ValidationStatus;
}

const ExameResultadoInput: React.FC<ExameResultadoInputProps> = ({
  parametro,
  componente,
  valorAtual,
  valorTextoAtual,
  onValueChange,
  onValorTextoChange,
  getInputClassName,
  renderValidationMessage,
  getImagemValidation,
}) => {
  const opcoes = Array.from(
    new Set(
      (componente.resultados || [])
        .map((r) => r.resultadoClassificatorio)
        .filter((r): r is string => !!r)
    )
  ).map((r) => ({ value: r, label: r }));

  const resultadoAtual = (componente.resultados || []).find(
    (r) => r.resultadoClassificatorio === valorAtual
  );

  const permiteTexto = resultadoAtual?.permiteValorTexto === true;
  const tipoTexto = resultadoAtual?.tipoValorTexto ?? 'livre';
  const rotulo = resultadoAtual?.rotuloValorTexto || 'Informação adicional';
  const opcoesList = resultadoAtual?.opcoesValorTexto ?? [];

  return (
    <div className="space-y-2">
      <label className="text-[11px] font-bold text-gray-600">{parametro}</label>
      <Combobox
        options={opcoes}
        value={valorAtual}
        onValueChange={(selected) => {
          const validation = getImagemValidation(parametro, selected);
          onValueChange(selected, validation, valorAtual);
        }}
        placeholder="Selecione o resultado..."
        searchPlaceholder="Buscar..."
        className={'w-full ' + getInputClassName(parametro)}
      />
      {renderValidationMessage(parametro)}

      {permiteTexto && valorAtual && (
        <div className="pt-1">
          <label className="text-[10px] font-semibold text-gray-500 mb-1 block">{rotulo}</label>
          {tipoTexto === 'lista' && opcoesList.length > 0 ? (
            <Select
              value={valorTextoAtual}
              onValueChange={(v) => onValorTextoChange(valorAtual, v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder={`Selecionar ${rotulo.toLowerCase()}...`} />
              </SelectTrigger>
              <SelectContent>
                {opcoesList.map((op) => (
                  <SelectItem key={op} value={op} className="text-xs">
                    {op}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              type="text"
              placeholder={rotulo}
              value={valorTextoAtual}
              onChange={(e) => onValorTextoChange(valorAtual, e.target.value)}
              className="h-8 text-xs"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ExameResultadoInput;
