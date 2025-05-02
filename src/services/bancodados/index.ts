
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
import {
  cadastrarPacientePerinatal,
  buscarPacientesPerinatalPorProfissional,
  atualizarPacientePerinatal,
  excluirPacientePerinatal,
  buscarPacientePerinatalPorId,
  registrarConsultaPreNatal,
  buscarConsultasPreNatalPorPaciente,
  registrarConsultaPuerperio,
  buscarConsultasPuerperioPorPaciente,
  registrarConsultaPuericultura,
  buscarConsultasPuericulturaPorPaciente,
  registrarNascimentoBebe
} from './perinatalDB';

// Re-exportar todos os tipos e funções
export * from './tipos';
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
  obterHistoricoAcessos,
  
  // Acompanhamento Perinatal
  cadastrarPacientePerinatal,
  buscarPacientesPerinatalPorProfissional,
  atualizarPacientePerinatal,
  excluirPacientePerinatal,
  buscarPacientePerinatalPorId,
  registrarConsultaPreNatal,
  buscarConsultasPreNatalPorPaciente,
  registrarConsultaPuerperio,
  buscarConsultasPuerperioPorPaciente,
  registrarConsultaPuericultura,
  buscarConsultasPuericulturaPorPaciente,
  registrarNascimentoBebe
};
