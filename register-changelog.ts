
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from './src/services/firebase';

async function registrarChangelog() {
  try {
    await addDoc(collection(db, 'changelogs'), {
      titulo: 'Correções críticas de bugs e performance',
      descricao:
        'Corrigida a edição de pacientes que não funcionava (modal exibia mensagem de "não implementado"). ' +
        'Eliminado vazamento de memória no carregamento de diagnósticos (listener Firestore não era removido ao fechar o processo). ' +
        'Corrigidos re-carregamentos desnecessários de dados ao preencher a avaliação. ' +
        'Centralizada a lógica de progresso das etapas do processo de enfermagem para evitar divergências futuras.',
      dataHora: Timestamp.now(),
    });
    console.log('Changelog registrado com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao registrar changelog:', error);
    process.exit(1);
  }
}

registrarChangelog();
