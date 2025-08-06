
// Re-export all the functions from specific database modules
export * from './usuariosDB';
export * from './gestaoUsuariosDB';
export * from './subconjuntosDB';

// Explicit re-exports from diagnosticosDB to avoid conflicts
export {
  MaterialApoio as DiagnosticoMaterialApoio,
  IntervencaoEnfermagem,
  ResultadoEsperado as DiagnosticoResultadoEsperado,
  SubconjuntoVinculado,
  DiagnosticoEnfermagem,
  verificarDiagnosticoDuplicado,
  uploadMaterialApoio,
  salvarDiagnostico
} from './diagnosticosDB';

// Explicit re-exports from rolEnfermagemDB to avoid conflicts
export {
  MaterialApoio as RolMaterialApoio,
  Intervencao,
  ResultadoEsperado as RolResultadoEsperado,
  Subconjunto,
  Diagnostico,
  getDiagnosticos,
  addDiagnostico,
  updateDiagnostico,
  deleteDiagnostico
} from './rolEnfermagemDB';
