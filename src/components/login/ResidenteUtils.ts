
import { addDays, isPast, parseISO } from 'date-fns';

/**
 * Verifica se a residência de enfermagem está expirada
 * @param dataInicioResidencia String da data de início no formato YYYY-MM-DD
 * @returns Booleano indicando se a residência está expirada
 */
export const isResidenteExpirado = (dataInicioResidencia?: string): boolean => {
  if (!dataInicioResidencia) {
    console.error("Data de início da residência não informada");
    return true; // Se não tiver data, consideramos expirado por segurança
  }

  try {
    // Converter a string para data
    const dataInicio = parseISO(dataInicioResidencia);
    
    // Adicionar 2 anos (730 dias) à data de início
    const dataExpiracao = addDays(dataInicio, 730); // 365 dias * 2 anos
    
    // Verificar se a data atual é posterior à data de expiração
    const expirado = isPast(dataExpiracao);
    
    console.log("Residente:", {
      dataInicio: dataInicio.toISOString(),
      dataExpiracao: dataExpiracao.toISOString(),
      expirado
    });
    
    return expirado;
  } catch (error) {
    console.error("Erro ao verificar expiração da residência:", error);
    return true; // Em caso de erro, bloquear por segurança
  }
};

/**
 * Calcula a nova data de expiração após prorrogação
 * @param dataInicioResidencia String da data de início no formato YYYY-MM-DD
 * @param diasProrrogacao Número de dias para prorrogar (padrão: 30 dias)
 * @returns Nova data de expiração formatada como YYYY-MM-DD
 */
export const calcularDataProrrogacao = (
  dataInicioResidencia: string,
  diasProrrogacao: number = 30
): string => {
  // Converter a string para data
  const dataInicio = parseISO(dataInicioResidencia);
  
  // Adicionar 2 anos (730 dias) à data de início
  const dataExpiracao = addDays(dataInicio, 730);
  
  // Adicionar os dias de prorrogação à data de expiração
  const dataProrrogada = addDays(dataExpiracao, diasProrrogacao);
  
  // Retornar a data formatada como YYYY-MM-DD
  return dataProrrogada.toISOString().split('T')[0];
};
