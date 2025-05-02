
export * from './usuariosDB';
export * from './evolucoesDB';
export * from './logAcessosDB';
export * from './pacientesDB';
export * from './popsDB';

// Re-export only what's needed from modulosDB to avoid duplicates
export { verificarModuloAtivo } from './modulosDB';
