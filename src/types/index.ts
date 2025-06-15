
// Re-exporta todos os tipos para garantir a compilação do projeto.
// Muitos arquivos que deveriam ser removidos são "read-only" e ainda dependem
// destes tipos. Esta é uma solução temporária para que o projeto possa ser construído.
export * from './cipe';
export * from './configuracao';
export * from './diagnosticos';
export * from './evolucao';
export * from './exames';
export * from './intervencoes';
export * from './paciente';
export * from './sinais-vitais';
export * from './usuario';
