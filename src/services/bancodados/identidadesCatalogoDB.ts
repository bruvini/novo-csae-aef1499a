import { collection, doc, runTransaction, serverTimestamp, type Transaction } from 'firebase/firestore';
import { db } from '../firebase';
import { identidadeParametroVital, normalizarNomeClinico } from '@/utils/referenciasClinicas';

/**
 * Índice imutável de reserva para novos cadastros. As entradas antigas do
 * catálogo não são migradas nem reservadas em lote por este mecanismo.
 * Para o legado, as verificações por coleção continuam obrigatórias.
 */
export type TipoIdentidadeCatalogo = 'parametro' | 'exame' | 'sistema' | 'exame-fisico';

export function chaveCatalogo(tipo: TipoIdentidadeCatalogo, nome: string): string {
  const normalizado = tipo === 'parametro'
    ? identidadeParametroVital(nome)
    : normalizarNomeClinico(nome);
  if (!normalizado) throw new Error('O nome de um parâmetro ou exame não pode estar vazio.');
  const chave = tipo + '--' + normalizado.replace(/ /g, '_');
  if (chave.length > 1400) throw new Error('Nome clínico muito longo para gerar uma identificação segura.');
  return chave;
}

export function chavesNovas(chavesAtuais: string[], chavesPropostas: string[]): string[] {
  const anteriores = new Set(chavesAtuais);
  return [...new Set(chavesPropostas)].filter(chave => !anteriores.has(chave));
}

export async function reservarIdentidades(
  transaction: Transaction,
  chaves: string[],
  origem: 'SinaisVitais' | 'ExamesLabImagem' | 'RevisaoSistemas',
  documentoId: string,
): Promise<void> {
  const unicas = [...new Set(chaves)];
  const referencias = unicas.map(chave => doc(db, 'identidadesCatalogoClinico', chave));
  // Transações Firestore exigem todas as leituras antes de qualquer escrita.
  const existentes = await Promise.all(referencias.map(referencia => transaction.get(referencia)));
  const indice = existentes.findIndex(snapshot => snapshot.exists());
  if (indice !== -1) {
    throw new Error('Este parâmetro ou exame foi reservado por outra operação: ' +
      unicas[indice] + '. Atualize a página e utilize o cadastro existente.');
  }
  referencias.forEach((referencia, index) => {
    transaction.set(referencia, {
      chave: unicas[index],
      colecaoOrigem: origem,
      documentoId,
      criadoEm: serverTimestamp(),
    });
  });
}

export { runTransaction, collection, doc, db, serverTimestamp };
