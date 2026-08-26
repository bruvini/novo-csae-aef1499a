# Graph Report - novo-csae-aef1499a  (2026-08-26)

## Corpus Check
- 173 files · ~466,858 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1154 nodes · 2824 edges · 130 communities (65 shown, 65 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 36 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0a1e93b6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- FormularioSistema.tsx
- import-clinical-parameters.ts
- TabelaDiagnosticos.tsx
- GestaoUsuarios.tsx
- hooks/use-toast.ts
- Dashboard.tsx
- devDependencies
- Portal CSAE Floripa 2.0
- PainelEstatistico.tsx
- compilerOptions
- cn
- scripts
- compilerOptions
- sidebar.tsx
- components.json
- dependencies
- combobox.tsx
- carousel.tsx
- clsx
- input-otp.tsx
- menubar.tsx
- compilerOptions
- Enfermagem e Saúde Digital no Centro de Saúde Saco dos Limões
- Q: Implementar badges de respostas não visualizadas na Central de Ajuda e de novos itens na Gestão de Suporte
- EtapaAvaliacao.tsx
- context-menu.tsx
- dropdown-menu.tsx
- Shell HTML do Portal CSAE Floripa
- package.json
- Profissional de Saúde com Notebook no Centro de Saúde Trindade
- breadcrumb.tsx
- drawer.tsx
- navigation-menu.tsx
- CSAE Brand Mark
- Enfermagem Florianópolis Brand Mark
- Centered Image Icon
- dotenv
- approve-user.ts
- Q: Atualizar a interface do Processo de Enfermagem para exames qualitativos e híbridos, bloquear números negativos e ampliar o modal
- CentralAjuda.tsx
- QueryContext.tsx
- ModalCadastroPaciente.tsx
- cmdk
- date-fns
- eslint
- firebase
- framer-motion
- @hookform/resolvers
- html2pdf.js
- input-otp
- lucide-react
- next-themes
- @radix-ui/react-accordion
- @radix-ui/react-alert-dialog
- @radix-ui/react-aspect-ratio
- @radix-ui/react-avatar
- @radix-ui/react-checkbox
- @radix-ui/react-collapsible
- @radix-ui/react-context-menu
- @radix-ui/react-dialog
- @radix-ui/react-dropdown-menu
- @radix-ui/react-hover-card
- @radix-ui/react-label
- @radix-ui/react-menubar
- @radix-ui/react-navigation-menu
- @radix-ui/react-popover
- @radix-ui/react-progress
- @radix-ui/react-radio-group
- @radix-ui/react-select
- @radix-ui/react-separator
- @radix-ui/react-slider
- @radix-ui/react-slot
- @radix-ui/react-switch
- @radix-ui/react-toggle
- @radix-ui/react-toggle-group
- @radix-ui/react-tooltip
- react-beautiful-dnd
- react-day-picker
- react-hook-form
- react-resizable-panels
- react-router-dom
- sonner
- tailwind-merge
- tailwindcss-animate
- @tanstack/react-query
- @tanstack/react-table
- @types/react-beautiful-dnd
- uuid
- vaul
- zod
- set-storage-cors.sh
- Controles de segurança Firebase
- @eslint/js
- eslint-plugin-react-hooks
- embla-carousel-react
- Q: Como importar com segurança parâmetros clínicos em lote no Firestore e adaptar a UI para exames qualitativos?
- postcss
- IntervencaoItem.tsx
- tailwindcss
- Q: Gostaria que instalasse o graphify nesse projeto e analisasse ele por completo para podermos identificar a estrutura dele e prosseguíssemos com atualizações
- @tailwindcss/typography
- @types/node
- @types/react
- @types/react-dom
- typescript-eslint
- vite
- @vitejs/plugin-react-swc
- ProcessoEnfermagemModal.tsx
- TabelaExames.tsx
- useAuth
- ModalCadastroDiagnostico.tsx
- index.ts
- TabelaSinaisVitais.tsx
- GestaoSuporte.tsx
- App.tsx
- chart.tsx
- react
- ProtectedRoute.tsx
- DashboardLayout.tsx
- firebase.ts
- utils.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 82 edges
2. `Button` - 41 edges
3. `useAuth()` - 29 edges
4. `Card` - 25 edges
5. `CardContent` - 25 edges
6. `CardHeader` - 24 edges
7. `DialogContent` - 24 edges
8. `DialogHeader()` - 24 edges
9. `db` - 24 edges
10. `CardTitle` - 23 edges

## Surprising Connections (you probably didn't know these)
- `Estrutura de pastas do projeto` --semantically_similar_to--> `Organização de componentes por UI e domínio`  [INFERRED] [semantically similar]
  README.md → GOVERNANCE.md
- `Fluxo de teste e validação` --semantically_similar_to--> `Critérios de qualidade`  [INFERRED] [semantically similar]
  README.md → GOVERNANCE.md
- `Padrões de Saúde e Interoperabilidade` --semantically_similar_to--> `Mapeamento clínico para FHIR Observation`  [INFERRED] [semantically similar]
  README.md → GOVERNANCE.md
- `Interoperabilidade do domínio de saúde` --semantically_similar_to--> `Padrões de Saúde e Interoperabilidade`  [INFERRED] [semantically similar]
  SECURITY.md → README.md
- `ListaPacientes()` --references--> `react`  [EXTRACTED]
  src/components/processo-enfermagem/ListaPacientes.tsx → package.json

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Sistema de governança e qualidade de entrega** — governance_feature_branch_workflow, governance_conventional_commits, governance_approval_flow, governance_quality_gates [INFERRED 0.95]
- **Programa de interoperabilidade clínica** — readme_nursing_process_management, readme_health_interoperability_backlog, readme_fhir_hl7_snomed_architecture, readme_health_standards [EXTRACTED 1.00]
- **Defesa em profundidade da aplicação** — security_short_session_authentication, security_firestore_role_authorization, security_protected_route, security_user_access_audit, security_firebase_security_controls [INFERRED 0.95]
- **Ecossistema Institucional de Atenção Primária** — public_enfermeira_capa_centro_saude_saco_dos_limoes, public_enfermeira_capa_sistema_unico_de_saude, public_enfermeira_capa_secretaria_municipal_saude_florianopolis, public_enfermeira_capa_ministerio_da_saude, public_enfermeira_capa_saude_na_hora, public_enfermeira_capa_saude_da_familia [INFERRED 0.85]
- **Fluxo Visual de Colaboração Digital em Saúde** — public_enfermeira_capa_equipe_de_enfermagem, public_enfermeira_capa_interface_digital_de_saude, public_enfermeira_capa_colaboracao_digital_atencao_primaria [INFERRED 0.85]
- **Integrated Engineering, Education, and Sustainability Identity** — public_logo_csae_engineering, public_logo_csae_education, public_logo_csae_sustainability [INFERRED 0.85]
- **Florianópolis Municipal Nursing Visual Identity** — public_logo_enfermagem_floripa_enfermagem, public_logo_enfermagem_floripa_florianopolis, public_logo_enfermagem_floripa_secretaria_municipal_saude, public_logo_enfermagem_floripa_suspension_bridge, public_logo_enfermagem_floripa_nursing_lamp, public_logo_enfermagem_floripa_green_flame [INFERRED 0.95]
- **Integração Clínica Digital na Atenção Primária** — public_lovable_uploads_9753344e_5ca4_43b0_8479_c33f5880810f_profissional_de_saude, public_lovable_uploads_9753344e_5ca4_43b0_8479_c33f5880810f_notebook_clinico, public_lovable_uploads_9753344e_5ca4_43b0_8479_c33f5880810f_centro_saude_trindade, public_lovable_uploads_9753344e_5ca4_43b0_8479_c33f5880810f_saude_digital_na_atencao_primaria [INFERRED 0.85]
- **Centered Placeholder Composition** — public_placeholder_centered_image_icon, public_placeholder_radial_alignment_guides, public_placeholder_concentric_focus_rings, public_placeholder_monochrome_visual_system [INFERRED 0.95]

## Communities (130 total, 65 thin omitted)

### Community 0 - "FormularioSistema.tsx"
Cohesion: 0.11
Nodes (25): AchadoEditState, CLASSIFICACAO_SUGGESTIONS, emptyAchado(), emptyOpcao(), FormularioSistema(), FormularioSistemaProps, inferEhAlteracao(), sortedAchadosWithIndex() (+17 more)

### Community 1 - "import-clinical-parameters.ts"
Cohesion: 0.09
Nodes (37): achadoSchema, canonicalizeNhbs(), collectNhbs(), Compendio, compendioSchema, componenteExameSchema, countCollection(), documentId() (+29 more)

### Community 2 - "TabelaDiagnosticos.tsx"
Cohesion: 0.20
Nodes (22): ModalConfirmacaoExclusao(), ModalConfirmacaoExclusaoProps, ListaPacientes(), AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter() (+14 more)

### Community 3 - "GestaoUsuarios.tsx"
Cohesion: 0.08
Nodes (34): ModalCadastroSubconjunto(), ModalCadastroSubconjuntoProps, ModalDetalhesSubconjuntoProps, ModalConfirmacaoAprovacao(), ModalConfirmacaoAprovacaoProps, ModalConfirmacaoExclusao(), ModalDetalhesUsuarioProps, ModalEdicaoPrivilegiosProps (+26 more)

### Community 4 - "hooks/use-toast.ts"
Cohesion: 0.08
Nodes (36): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+28 more)

### Community 5 - "Dashboard.tsx"
Cohesion: 0.17
Nodes (14): HeroBannerProps, ModalHistoricoChangelog(), Dashboard(), formatarDataHora(), buscarChangelogsRecentes(), buscarTodosChangelogs(), Changelog, CHANGELOGS_SISTEMA (+6 more)

### Community 6 - "devDependencies"
Cohesion: 0.18
Nodes (11): autoprefixer, eslint-plugin-react-refresh, globals, devDependencies, autoprefixer, eslint-plugin-react-refresh, globals, tsx (+3 more)

### Community 7 - "Portal CSAE Floripa 2.0"
Cohesion: 0.06
Nodes (35): Fluxo de aprovação, Diretriz obrigatória de changelog, Terminologias clínicas LOINC e SNOMED CT, Organização de componentes por UI e domínio, Conventional Commits, Fluxo de branches de funcionalidade, Mapeamento clínico para FHIR Observation, Firebase BaaS (+27 more)

### Community 8 - "PainelEstatistico.tsx"
Cohesion: 0.09
Nodes (29): agregarRegistros(), agruparTemporal(), COLORS, COLORS_PROD, EXECUTOR_COLORS, PainelEstatistico(), rankingFromValues(), STATUS_COLORS (+21 more)

### Community 9 - "compilerOptions"
Cohesion: 0.08
Nodes (24): DOM, DOM.Iterable, ES2020, src, compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules (+16 more)

### Community 10 - "cn"
Cohesion: 0.13
Nodes (19): Header(), ButtonProps, buttonVariants, Calendar(), CalendarProps, Image(), ImageProps, Pagination() (+11 more)

### Community 11 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, build:dev, deploy, dev, import:clinical, lint, preview

### Community 12 - "compilerOptions"
Cohesion: 0.11
Nodes (17): ES2023, vite.config.ts, compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection (+9 more)

### Community 13 - "sidebar.tsx"
Cohesion: 0.10
Nodes (24): navigationItems, Sidebar, SidebarContent, SidebarContext, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent (+16 more)

### Community 14 - "components.json"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 15 - "dependencies"
Cohesion: 0.13
Nodes (15): class-variance-authority, dependencies, class-variance-authority, @radix-ui/react-scroll-area, @radix-ui/react-tabs, @radix-ui/react-toast, react-dom, react-input-mask (+7 more)

### Community 16 - "combobox.tsx"
Cohesion: 0.20
Nodes (11): ComboboxProps, Command, CommandDialogProps, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList (+3 more)

### Community 17 - "carousel.tsx"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 19 - "input-otp.tsx"
Cohesion: 0.40
Nodes (4): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot

### Community 20 - "menubar.tsx"
Cohesion: 0.17
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 21 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, allowJs, baseUrl, noImplicitAny, noUnusedLocals, noUnusedParameters, paths, skipLibCheck (+3 more)

### Community 22 - "Enfermagem e Saúde Digital no Centro de Saúde Saco dos Limões"
Cohesion: 0.33
Nodes (10): Centro de Saúde Saco dos Limões, Colaboração Digital na Atenção Primária, Equipe de Enfermagem Colaborativa, Enfermagem e Saúde Digital no Centro de Saúde Saco dos Limões, Interface Digital de Saúde em Notebook, Ministério da Saúde do Brasil, Saúde da Família, Saúde na Hora (+2 more)

### Community 23 - "Q: Implementar badges de respostas não visualizadas na Central de Ajuda e de novos itens na Gestão de Suporte"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Implementar badges de respostas não visualizadas na Central de Ajuda e de novos itens na Gestão de Suporte, Source Nodes

### Community 24 - "EtapaAvaliacao.tsx"
Cohesion: 0.06
Nodes (73): ModalConfirmacaoExclusaoProps, ModalVisualizarDiagnosticoProps, inferEhAlteracao(), ModalVisualizarSistema(), sortedAchados(), ModalHistoricoChangelogProps, EtapaAvaliacaoProps, ValidationStatus (+65 more)

### Community 25 - "context-menu.tsx"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 26 - "dropdown-menu.tsx"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 27 - "Shell HTML do Portal CSAE Floripa"
Cohesion: 0.28
Nodes (9): GPT Engineer runtime, html2pdf.js runtime, Ativo logo_csae.png, Entrada /src/main.tsx, Shell HTML do Portal CSAE Floripa, Ponto de montagem root, Metadados Open Graph e Twitter Card, Googlebot Bingbot Twitterbot e Facebook crawler (+1 more)

### Community 28 - "package.json"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 29 - "Profissional de Saúde com Notebook no Centro de Saúde Trindade"
Cohesion: 0.43
Nodes (8): Centro de Saúde Trindade, Emblema de Ponte e Lâmpada da Enfermagem, Profissional de Saúde com Notebook no Centro de Saúde Trindade, Identidade Local de Florianópolis, Notebook para Uso Clínico, Profissional de Saúde, Saúde Digital na Atenção Primária, Secretaria Municipal de Saúde de Florianópolis

### Community 30 - "breadcrumb.tsx"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 31 - "drawer.tsx"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 32 - "navigation-menu.tsx"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 33 - "CSAE Brand Mark"
Cohesion: 0.43
Nodes (7): CSAE Brand Mark, Education and Knowledge, Engineering and Infrastructure, Green Flame, Knowledge Lamp, Suspension Bridge, Environmental Sustainability

### Community 34 - "Enfermagem Florianópolis Brand Mark"
Cohesion: 0.43
Nodes (7): Enfermagem Florianópolis Brand Mark, Enfermagem, Florianópolis, Green Flame, Nursing Lamp, Secretaria Municipal de Saúde de Florianópolis, Suspension Bridge

### Community 35 - "Centered Image Icon"
Cohesion: 0.53
Nodes (6): Centered Image Icon, Concentric Focus Rings, Generic Image Placeholder, Monochrome Gray Visual System, Neutral Placeholder Design, Radial Alignment Guides

### Community 37 - "approve-user.ts"
Cohesion: 0.40
Nodes (3): app, db, firebaseConfig

### Community 38 - "Q: Atualizar a interface do Processo de Enfermagem para exames qualitativos e híbridos, bloquear números negativos e ampliar o modal"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Atualizar a interface do Processo de Enfermagem para exames qualitativos e híbridos, bloquear números negativos e ampliar o modal, Source Nodes

### Community 39 - "CentralAjuda.tsx"
Cohesion: 0.16
Nodes (16): ModalNPSObrigatorio(), ModalNPSObrigatorioProps, AlertTitle, CATEGORIAS_SUGESTAO, CentralAjuda(), formatarData(), MODULOS, buscarMeusTickets() (+8 more)

### Community 41 - "ModalCadastroPaciente.tsx"
Cohesion: 0.18
Nodes (9): FormValues, ModalCadastroPaciente(), ModalCadastroPacienteProps, atualizarPaciente(), buscarPacientesPorEnfermeiro(), buscarPacientesUsuario(), cadastrarPaciente(), IndicadoresPacientes (+1 more)

### Community 104 - "Q: Como importar com segurança parâmetros clínicos em lote no Firestore e adaptar a UI para exames qualitativos?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Como importar com segurança parâmetros clínicos em lote no Firestore e adaptar a UI para exames qualitativos?, Source Nodes

### Community 106 - "IntervencaoItem.tsx"
Cohesion: 0.21
Nodes (11): consolidarAprazamento(), IntervencaoItem(), IntervencaoItemProps, OPCOES_EXECUTORES, parseAprazamento(), PRESETS_APRAZAMENTO, ToggleGroup, ToggleGroupContext (+3 more)

### Community 108 - "Q: Gostaria que instalasse o graphify nesse projeto e analisasse ele por completo para podermos identificar a estrutura dele e prosseguíssemos com atualizações"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Gostaria que instalasse o graphify nesse projeto e analisasse ele por completo para podermos identificar a estrutura dele e prosseguíssemos com atualizações, Source Nodes

### Community 116 - "ProcessoEnfermagemModal.tsx"
Cohesion: 0.08
Nodes (39): EtapaPlanejamento(), ProcessoEnfermagemModal(), ICONES_ETAPAS, StepperProcesso(), StepperProcessoProps, TempoAtivoBadge(), TempoAtivoBadgeProps, Register() (+31 more)

### Community 117 - "TabelaExames.tsx"
Cohesion: 0.20
Nodes (17): TabelaExames(), EtapaAvaliacao(), EtapaResumo(), ExameResultadoInput(), ExameResultadoInputProps, Input, addExame(), componenteEhClassificatorio() (+9 more)

### Community 118 - "useAuth"
Cohesion: 0.21
Nodes (13): NavigationCards(), IndicadoresProducaoModal(), useAuth(), contagemInicial, SupportNotificationsContext, SupportNotificationsContextType, SupportNotificationsProvider(), useSupportNotifications() (+5 more)

### Community 119 - "ModalCadastroDiagnostico.tsx"
Cohesion: 0.13
Nodes (15): ModalCadastroDiagnostico(), Subconjunto, TabelaSubconjuntos(), SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton (+7 more)

### Community 120 - "index.ts"
Cohesion: 0.20
Nodes (16): TabelaDiagnosticos(), DiagnosticoEnfermagem, IntervencaoEnfermagem, MaterialApoio, ResultadoEsperado, salvarDiagnostico(), SubconjuntoVinculado, verificarDiagnosticoDuplicado() (+8 more)

### Community 121 - "TabelaSinaisVitais.tsx"
Cohesion: 0.24
Nodes (13): IndicadoresConteudo(), IndicadoresData, TabelaSinaisVitais(), Skeleton(), getExamesCount(), addSinalVital(), deleteSinalVital(), getSinaisVitais() (+5 more)

### Community 123 - "GestaoSuporte.tsx"
Cohesion: 0.30
Nodes (13): formatarData(), GestaoSuporte(), media(), buscarAvaliacoesNPS(), buscarTodasSugestoes(), buscarTodosTickets(), marcarSugestaoComoVisualizadaPeloSuporte(), marcarTicketComoVisualizadoPeloSuporte() (+5 more)

### Community 124 - "App.tsx"
Cohesion: 0.13
Nodes (12): queryClient, AuthenticatedLayout(), AuthenticatedLayoutProps, Footer(), Toaster(), ToasterProps, TabsContent, TabsList (+4 more)

### Community 125 - "chart.tsx"
Cohesion: 0.20
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 126 - "react"
Cohesion: 0.22
Nodes (8): react, react, useCarousel(), useChart(), Combobox(), useFormField(), useSidebar(), useIsMobile()

### Community 129 - "ProtectedRoute.tsx"
Cohesion: 0.40
Nodes (4): LoadingOverlay(), LoadingOverlayProps, ProtectedRoute(), ProtectedRouteProps

### Community 130 - "DashboardLayout.tsx"
Cohesion: 0.40
Nodes (3): AppSidebar(), SidebarInset, SidebarProvider

### Community 131 - "firebase.ts"
Cohesion: 0.12
Nodes (16): HistoricoProcessosModal(), Toaster(), AuthContext, AuthContextType, AuthProvider(), AuthProviderProps, SessionData, useToast() (+8 more)

### Community 132 - "utils.ts"
Cohesion: 0.14
Nodes (7): Avatar, AvatarFallback, AvatarImage, HoverCardContent, Progress, Slider, Switch

## Ambiguous Edges - Review These
- `Emblema de Ponte e Lâmpada da Enfermagem` → `Identidade Local de Florianópolis`  [AMBIGUOUS]
  public/lovable-uploads/9753344e-5ca4-43b0-8479-c33f5880810f.png · relation: conceptually_related_to

## Knowledge Gaps
- **388 isolated node(s):** `EtapaPlanejamentoProps`, `CHANGELOGS_SISTEMA`, `DiagnosticoSelecionado`, `$schema`, `style` (+383 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **65 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Work-memory lessons

**Preferred sources** — corroborated by past sessions; start here.
- `Exame` (2× useful, score=1.578344392)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Emblema de Ponte e Lâmpada da Enfermagem` and `Identidade Local de Florianópolis`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `dependencies` connect `dependencies` to `clsx`, `package.json`, `cmdk`, `date-fns`, `firebase`, `framer-motion`, `@hookform/resolvers`, `html2pdf.js`, `input-otp`, `lucide-react`, `next-themes`, `@radix-ui/react-accordion`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-aspect-ratio`, `@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-collapsible`, `@radix-ui/react-context-menu`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-hover-card`, `@radix-ui/react-label`, `@radix-ui/react-menubar`, `@radix-ui/react-navigation-menu`, `@radix-ui/react-popover`, `@radix-ui/react-progress`, `@radix-ui/react-radio-group`, `@radix-ui/react-select`, `@radix-ui/react-separator`, `@radix-ui/react-slider`, `@radix-ui/react-slot`, `@radix-ui/react-switch`, `@radix-ui/react-toggle`, `@radix-ui/react-toggle-group`, `@radix-ui/react-tooltip`, `react-beautiful-dnd`, `react-day-picker`, `react-hook-form`, `react-resizable-panels`, `react-router-dom`, `sonner`, `tailwind-merge`, `tailwindcss-animate`, `@tanstack/react-query`, `@tanstack/react-table`, `@types/react-beautiful-dnd`, `uuid`, `vaul`, `zod`, `embla-carousel-react`, `react`?**
  _High betweenness centrality (0.240) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `ProtectedRoute.tsx`, `TabelaDiagnosticos.tsx`, `firebase.ts`, `hooks/use-toast.ts`, `dependencies`?**
  _High betweenness centrality (0.219) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `FormularioSistema.tsx`, `TabelaDiagnosticos.tsx`, `GestaoUsuarios.tsx`, `utils.ts`, `hooks/use-toast.ts`, `sidebar.tsx`, `combobox.tsx`, `carousel.tsx`, `input-otp.tsx`, `menubar.tsx`, `EtapaAvaliacao.tsx`, `context-menu.tsx`, `dropdown-menu.tsx`, `breadcrumb.tsx`, `drawer.tsx`, `navigation-menu.tsx`, `ModalCadastroPaciente.tsx`, `IntervencaoItem.tsx`, `ProcessoEnfermagemModal.tsx`, `TabelaExames.tsx`, `ModalCadastroDiagnostico.tsx`, `TabelaSinaisVitais.tsx`, `App.tsx`, `chart.tsx`, `react`?**
  _High betweenness centrality (0.125) - this node is a cross-community bridge._
- **What connects `EtapaPlanejamentoProps`, `CHANGELOGS_SISTEMA`, `DiagnosticoSelecionado` to the rest of the system?**
  _388 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `FormularioSistema.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11330049261083744 - nodes in this community are weakly interconnected._
- **Should `import-clinical-parameters.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08534850640113797 - nodes in this community are weakly interconnected._