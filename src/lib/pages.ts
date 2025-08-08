
export interface PageInfo {
  id: string;
  label: string;
  description?: string;
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
    id: "GestaoUsuarios", 
    label: "Gestão de Usuários",
    description: "Painel de controle para administrar profissionais cadastrados"
  },
];
