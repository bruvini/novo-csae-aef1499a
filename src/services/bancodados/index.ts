

// Re-export all the functions from specific database modules
export * from './usuariosDB';
export * from './gestaoUsuariosDB';
export * from './subconjuntosDB';

// Explicit type re-exports from diagnosticosDB to avoid conflicts
export type {
  MaterialApoio as DiagnosticoMaterialApoio,
  IntervencaoEnfermagem,
  ResultadoEsperado as DiagnosticoResultadoEsperado,
  SubconjuntoVinculado,
  DiagnosticoEnfermagem
} from './diagnosticosDB';

// Function re-exports from diagnosticosDB
export {
  verificarDiagnosticoDuplicado,
  uploadMaterialApoio,
  salvarDiagnostico
} from './diagnosticosDB';

// Explicit type re-exports from rolEnfermagemDB to avoid conflicts
export type {
  MaterialApoio as RolMaterialApoio,
  Intervencao,
  ResultadoEsperado as RolResultadoEsperado,
  Subconjunto,
  Diagnostico
} from './rolEnfermagemDB';

// Function re-exports from rolEnfermagemDB
export {
  getDiagnosticos,
  addDiagnostico,
  updateDiagnostico,
  deleteDiagnostico
} from './rolEnfermagemDB';

// Changelog exports
export type { Changelog } from './changelogDB';
export { buscarChangelogsRecentes, seedChangelogInicial, salvarChangelog } from './changelogDB';

