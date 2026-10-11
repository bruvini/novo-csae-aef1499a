export interface PageInfo {
  id: string;
  label: string;
  description?: string;
}

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  allowedPageId?: string;
}

export const availablePages: PageInfo[] = [
  { 
    id: "ProcessoEnfermagem", 
    label: "Processo de Enfermagem",
    description: "Ferramenta completa para realizar e acompanhar o Processo de Enfermagem"
  },
  { 
    id: "GestaoConteudos", 
    label: "Gestão de Conteúdos",
    description: "Área administrativa para gerenciar e atualizar os conteúdos do sistema"
  },
  {
    id: "GestaoSuporte",
    label: "Gestão de Suporte",
    description: "Painel administrativo para gerenciar tickets de suporte, sugestões e avaliações NPS"
  },
];
