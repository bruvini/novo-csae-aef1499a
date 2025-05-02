
export interface ModuloDisponivel {
  id?: string;
  titulo: string;
  descricao: string;
  nome: string;
  link: string;
  icone: string;
  ativo: boolean;
  visibilidade: 'admin' | 'sms' | 'todos';
  ordem: number;
  categoria?: 'clinico' | 'educacional' | 'gestao';
  exibirDashboard?: boolean;
  exibirNavbar?: boolean;
  linkAcesso?: string;
}
