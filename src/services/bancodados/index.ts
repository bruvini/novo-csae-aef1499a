
// Re-export all the functions from specific database modules
export * from './usuariosDB';
export * from './diagnosticosDB';
export * from './logAcessosDB';
export * from './modulosDB';
export * from './popsDB';

// Import and re-export specific functions that might be missing
import {
  fetchSubconjuntos,
  fetchDiagnosticos,
} from './diagnosticosDB';

// Re-export everything explicitly to ensure availability
export {
  fetchSubconjuntos,
  fetchDiagnosticos,
};
