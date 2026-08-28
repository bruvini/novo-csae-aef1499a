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

export const PERMISSION_SCHEMA_VERSION = 2;

export const DEFAULT_COMMON_PAGE_IDS = [
  "Dashboard",
  "ProcessoEnfermagem",
  "CentralAjuda",
];

export const availablePages: PageInfo[] = [
  {
    id: "Dashboard",
    label: "Dashboard",
    description:
      "Página inicial com atalhos, novidades e visão geral do portal",
  },
  {
    id: "ProcessoEnfermagem",
    label: "Processo de Enfermagem",
    description:
      "Ferramenta completa para realizar e acompanhar o Processo de Enfermagem",
  },
  {
    id: "CentralAjuda",
    label: "Central de Ajuda",
    description:
      "Canal para relatar problemas, sugerir melhorias e acompanhar respostas",
  },
  {
    id: "GestaoConteudos",
    label: "Gestão de Conteúdos",
    description:
      "Área administrativa para gerenciar e atualizar os conteúdos do sistema",
  },
  {
    id: "GestaoUsuarios",
    label: "Gestão de Usuários",
    description:
      "Painel de controle para administrar profissionais cadastrados",
  },
  {
    id: "PainelEstatistico",
    label: "Painel Estatístico",
    description:
      "Módulo Business Intelligence com visão global de métricas e indicadores de produção da rede",
  },
  {
    id: "GestaoSuporte",
    label: "Gestão de Suporte",
    description:
      "Painel administrativo para gerenciar tickets de suporte, sugestões e avaliações NPS",
  },
];

export const ALL_PAGE_IDS = availablePages.map((pagina) => pagina.id);

export const paginasPadraoPorTipo = (isAdmin: boolean) =>
  isAdmin ? [...ALL_PAGE_IDS] : [...DEFAULT_COMMON_PAGE_IDS];

export const normalizarSelecaoPaginas = (
  isAdmin: boolean,
  paginasPermitidas: string[],
) => {
  const paginasValidas = [
    ...new Set(
      paginasPermitidas.filter((pagina) => ALL_PAGE_IDS.includes(pagina)),
    ),
  ];
  return paginasValidas.length ? paginasValidas : paginasPadraoPorTipo(isAdmin);
};

export const temPermissaoPagina = (
  isAdmin: boolean,
  paginasPermitidas: string[] | undefined,
  paginaId: string,
) => {
  // Compatibilidade temporária com administradores antigos que usavam [] = tudo.
  if (isAdmin && (!paginasPermitidas || paginasPermitidas.length === 0)) {
    return true;
  }
  return paginasPermitidas?.includes(paginaId) ?? false;
};
