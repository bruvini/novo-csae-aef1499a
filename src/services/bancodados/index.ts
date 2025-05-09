
import { verificarUsuarioExistente, cadastrarUsuario, buscarUsuarioPorUid } from './usuariosDB';
import { 
  cadastrarPaciente, 
  buscarPacientesPorProfissional, 
  atualizarPaciente, 
  excluirPaciente 
} from './pacientesDB';
import {
  iniciarEvolucao,
  salvarProgressoEvolucao,
  finalizarEvolucao
} from './evolucoesDB';
import {
  registrarAcesso,
  obterHistoricoAcessos
} from './logAcessosDB';

// Re-export all types from the types directory
export * from '../../types';

export {
  // Usuários
  verificarUsuarioExistente,
  cadastrarUsuario,
  buscarUsuarioPorUid,
  
  // Pacientes
  cadastrarPaciente,
  buscarPacientesPorProfissional,
  atualizarPaciente,
  excluirPaciente,
  
  // Evoluções
  iniciarEvolucao,
  salvarProgressoEvolucao,
  finalizarEvolucao,
  
  // Log de acessos
  registrarAcesso,
  obterHistoricoAcessos
};
