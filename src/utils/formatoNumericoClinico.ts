/**
 * O Google Sheets pode exibir "6.5" mas guardar a célula como DATA
 * (número serial do Excel). Nunca interpretar isso como um limite clínico.
 */
export function validarLimiteNumericoFonte(
  valor: unknown, formatacao: string, endereco: string,
): void {
  if (valor === undefined || valor === null || valor === '') return;
  const fmt = (formatacao || '').toLocaleLowerCase('en-US');
  const dataSerial = valor instanceof Date
    || (typeof valor === 'object' && valor !== null && 'formula' in valor)
    || /(?:d{1,4}[./-]m{1,4}|m{1,4}[./-]d{1,4}|y{2,4})/.test(fmt);
  if (dataSerial) {
    throw new Error(
      'Célula ' + endereco + ' possui data/fórmula em uma coluna de limite clínico. ' +
      'Corrija o tipo na planilha original e valide o número com a CSAE antes de conciliar.'
    );
  }
  if (typeof valor !== 'number' && typeof valor !== 'string') {
    throw new Error('Tipo de célula clínica não suportado em ' + endereco + '.');
  }
  const texto = String(valor).trim();
  if (!texto) return;
  if (!/^-?\d+(?:[.,]\d+)?$/.test(texto) || !Number.isFinite(Number(texto.replace(',', '.')))) {
    throw new Error(
      'Célula ' + endereco + ' não contém número clínico literal válido (' + texto.slice(0, 60) + '). ' +
      'Valores por percentis/curvas precisam de interpretação específica, não faixas simples.'
    );
  }
}
