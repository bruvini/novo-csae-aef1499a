
// Re-export all the functions from specific database modules
export * from './usuariosDB';
export * from './diagnosticosDB';
export * from './sistemasDB';
export * from './pacientesDB';
export * from './evolucoesDB';
export * from './logAcessosDB';
export * from './modulosDB';
export * from './popsDB';

// Import and re-export specific functions that might be missing
import {
  fetchSubconjuntos,
  fetchDiagnosticos,
} from './diagnosticosDB';

import {
  createRevisaoSistema,
  updateRevisaoSistema,
  deleteRevisaoSistema,
  fetchSistemasCorporais,
  fetchRevisoesSistema,
  createSistemaCorporal,
  updateSistemaCorporal,
  deleteSistemaCorporal,
} from './sistemasDB';

export {
  fetchSubconjuntos,
  fetchDiagnosticos,
  createRevisaoSistema,
  updateRevisaoSistema,
  deleteRevisaoSistema,
  fetchSistemasCorporais,
  fetchRevisoesSistema,
  createSistemaCorporal,
  updateSistemaCorporal,
  deleteSistemaCorporal,
};
