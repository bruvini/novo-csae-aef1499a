# Graph Report - novo-csae-aef1499a  (2026-08-16)

## Corpus Check
- 172 files · ~463,754 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1141 nodes · 2796 edges · 109 communities (57 shown, 52 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 36 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9a7d9cad`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ProcessoEnfermagemModal.tsx
- import-clinical-parameters.ts
- TabelaExames.tsx
- button.tsx
- AuthContext.tsx
- GestaoUsuarios.tsx
- devDependencies
- Portal CSAE Floripa 2.0
- PainelEstatistico.tsx
- compilerOptions
- cn
- utils.ts
- compilerOptions
- sidebar.tsx
- components.json
- dependencies
- combobox.tsx
- carousel.tsx
- ModalCadastroDiagnostico.tsx
- input-otp.tsx
- menubar.tsx
- compilerOptions
- Enfermagem e Saúde Digital no Centro de Saúde Saco dos Limões
- Q: Implementar badges de respostas não visualizadas na Central de Ajuda e de novos itens na Gestão de Suporte
- EtapaAvaliacao.tsx
- context-menu.tsx
- dropdown-menu.tsx
- Shell HTML do Portal CSAE Floripa
- EtapaDiagnostico.tsx
- Profissional de Saúde com Notebook no Centro de Saúde Trindade
- breadcrumb.tsx
- drawer.tsx
- navigation-menu.tsx
- CSAE Brand Mark
- Enfermagem Florianópolis Brand Mark
- Centered Image Icon
- HistoricoProcessosModal.tsx
- approve-user.ts
- Q: Atualizar a interface do Processo de Enfermagem para exames qualitativos e híbridos, bloquear números negativos e ampliar o modal
- index.ts
- QueryContext.tsx
- pacientesDB.ts
- cmdk
- date-fns
- chart.tsx
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
- react
- ProtectedRoute.tsx
- embla-carousel-react
- Q: Como importar com segurança parâmetros clínicos em lote no Firestore e adaptar a UI para exames qualitativos?
- DashboardLayout.tsx
- avatar.tsx
- class-variance-authority
- Q: Gostaria que instalasse o graphify nesse projeto e analisasse ele por completo para podermos identificar a estrutura dele e prosseguíssemos com atualizações

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
10. `Paciente` - 24 edges

## Surprising Connections (you probably didn't know these)
- `Estrutura de pastas do projeto` --semantically_similar_to--> `Organização de componentes por UI e domínio`  [INFERRED] [semantically similar]
  README.md → GOVERNANCE.md
- `Fluxo de teste e validação` --semantically_similar_to--> `Critérios de qualidade`  [INFERRED] [semantically similar]
  README.md → GOVERNANCE.md
- `Padrões de Saúde e Interoperabilidade` --semantically_similar_to--> `Mapeamento clínico para FHIR Observation`  [INFERRED] [semantically similar]
  README.md → GOVERNANCE.md
- `Interoperabilidade do domínio de saúde` --semantically_similar_to--> `Padrões de Saúde e Interoperabilidade`  [INFERRED] [semantically similar]
  SECURITY.md → README.md
- `useChart()` --references--> `react`  [EXTRACTED]
  src/components/ui/chart.tsx → package.json

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

## Communities (109 total, 52 thin omitted)

### Community 0 - "ProcessoEnfermagemModal.tsx"
Cohesion: 0.17
Nodes (17): ProcessoEnfermagemModal(), TempoAtivoBadge(), TempoAtivoBadgeProps, IntervencaoAutoral, salvarIntervencoesAutorais(), buscarProcessoAtivo(), buscarProcessoPorId(), concluirProcesso() (+9 more)

### Community 1 - "import-clinical-parameters.ts"
Cohesion: 0.09
Nodes (37): achadoSchema, canonicalizeNhbs(), collectNhbs(), Compendio, compendioSchema, componenteExameSchema, countCollection(), documentId() (+29 more)

### Community 2 - "TabelaExames.tsx"
Cohesion: 0.06
Nodes (82): AchadoEditState, CLASSIFICACAO_SUGGESTIONS, emptyAchado(), emptyOpcao(), FormularioSistema(), FormularioSistemaProps, inferEhAlteracao(), sortedAchadosWithIndex() (+74 more)

### Community 3 - "button.tsx"
Cohesion: 0.13
Nodes (22): ModalConfirmacaoExclusaoProps, ModalConfirmacaoAprovacaoProps, ModalDetalhesUsuarioProps, ModalEdicaoPrivilegiosProps, ModalMotivoRecusaProps, FormValues, TermoResponsabilidadeModalProps, Button (+14 more)

### Community 4 - "AuthContext.tsx"
Cohesion: 0.06
Nodes (44): ModalCadastroSubconjunto(), Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle (+36 more)

### Community 5 - "GestaoUsuarios.tsx"
Cohesion: 0.05
Nodes (71): queryClient, IndicadoresConteudo(), IndicadoresData, ModalConfirmacaoAprovacao(), ModalConfirmacaoExclusao(), ModalMotivoRecusa(), HeroBanner(), HeroBannerProps (+63 more)

### Community 6 - "devDependencies"
Cohesion: 0.04
Nodes (48): autoprefixer, dotenv, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, devDependencies (+40 more)

### Community 7 - "Portal CSAE Floripa 2.0"
Cohesion: 0.06
Nodes (35): Fluxo de aprovação, Diretriz obrigatória de changelog, Terminologias clínicas LOINC e SNOMED CT, Organização de componentes por UI e domínio, Conventional Commits, Fluxo de branches de funcionalidade, Mapeamento clínico para FHIR Observation, Firebase BaaS (+27 more)

### Community 8 - "PainelEstatistico.tsx"
Cohesion: 0.10
Nodes (25): COLORS, COLORS_PROD, EXECUTOR_COLORS, PainelEstatistico(), STATUS_COLORS, STATUS_PROCESSO_COLORS, VIEW_LABELS, ViewMode (+17 more)

### Community 9 - "compilerOptions"
Cohesion: 0.08
Nodes (24): DOM, DOM.Iterable, ES2020, src, compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules (+16 more)

### Community 10 - "cn"
Cohesion: 0.15
Nodes (17): ButtonProps, buttonVariants, Calendar(), CalendarProps, Image(), ImageProps, Pagination(), PaginationContent (+9 more)

### Community 11 - "utils.ts"
Cohesion: 0.13
Nodes (11): IntervencaoItem(), IntervencaoItemProps, HoverCardContent, Progress, Slider, Switch, ToggleGroup, ToggleGroupContext (+3 more)

### Community 12 - "compilerOptions"
Cohesion: 0.11
Nodes (17): ES2023, vite.config.ts, compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection (+9 more)

### Community 13 - "sidebar.tsx"
Cohesion: 0.10
Nodes (25): navigationItems, Separator, Sidebar, SidebarContent, SidebarContext, SidebarFooter, SidebarGroup, SidebarGroupAction (+17 more)

### Community 14 - "components.json"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 15 - "dependencies"
Cohesion: 0.13
Nodes (15): clsx, dependencies, clsx, @radix-ui/react-scroll-area, @radix-ui/react-tabs, @radix-ui/react-toast, react-dom, react-input-mask (+7 more)

### Community 16 - "combobox.tsx"
Cohesion: 0.20
Nodes (11): ComboboxProps, Command, CommandDialogProps, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList (+3 more)

### Community 17 - "carousel.tsx"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 18 - "ModalCadastroDiagnostico.tsx"
Cohesion: 0.13
Nodes (17): ModalCadastroDiagnostico(), Subconjunto, ModalCadastroSubconjuntoProps, ModalDetalhesSubconjuntoProps, TabelaSubconjuntos(), DiagnosticoEnfermagem, IntervencaoEnfermagem, MaterialApoio (+9 more)

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
Cohesion: 0.11
Nodes (29): EtapaAvaliacaoProps, ValidationStatus, EtapaDiagnosticoProps, EtapaEvolucaoProps, EtapaImplementacaoProps, EtapaPlanejamentoProps, EtapaResumoProps, ModalCadastroPacienteProps (+21 more)

### Community 25 - "context-menu.tsx"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 26 - "dropdown-menu.tsx"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 27 - "Shell HTML do Portal CSAE Floripa"
Cohesion: 0.28
Nodes (9): GPT Engineer runtime, html2pdf.js runtime, Ativo logo_csae.png, Entrada /src/main.tsx, Shell HTML do Portal CSAE Floripa, Ponto de montagem root, Metadados Open Graph e Twitter Card, Googlebot Bingbot Twitterbot e Facebook crawler (+1 more)

### Community 28 - "EtapaDiagnostico.tsx"
Cohesion: 0.25
Nodes (11): ModalVisualizarDiagnosticoProps, DiagnosticoPorSubconjunto, AccordionContent, AccordionItem, AccordionTrigger, Alert, AlertDescription, alertVariants (+3 more)

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

### Community 36 - "HistoricoProcessosModal.tsx"
Cohesion: 0.20
Nodes (12): inferEhAlteracao(), ModalVisualizarSistema(), sortedAchados(), ModalHistoricoChangelogProps, HistoricoProcessosModal(), HistoricoProcessosModalProps, Badge(), BadgeProps (+4 more)

### Community 37 - "approve-user.ts"
Cohesion: 0.40
Nodes (3): app, db, firebaseConfig

### Community 38 - "Q: Atualizar a interface do Processo de Enfermagem para exames qualitativos e híbridos, bloquear números negativos e ampliar o modal"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Atualizar a interface do Processo de Enfermagem para exames qualitativos e híbridos, bloquear números negativos e ampliar o modal, Source Nodes

### Community 39 - "index.ts"
Cohesion: 0.06
Nodes (68): AppSidebar(), AuthenticatedLayout(), AuthenticatedLayoutProps, Footer(), TabelaDiagnosticos(), Header(), ModalHistoricoChangelog(), ModalNPSObrigatorio() (+60 more)

### Community 41 - "pacientesDB.ts"
Cohesion: 0.20
Nodes (7): ModalCadastroPaciente(), atualizarPaciente(), buscarPacientesPorEnfermeiro(), buscarPacientesUsuario(), cadastrarPaciente(), IndicadoresPacientes, StatusPaciente

### Community 44 - "chart.tsx"
Cohesion: 0.18
Nodes (8): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES, useChart()

### Community 101 - "react"
Cohesion: 0.25
Nodes (7): react, react, useCarousel(), Combobox(), useFormField(), useSidebar(), useIsMobile()

### Community 102 - "ProtectedRoute.tsx"
Cohesion: 0.28
Nodes (6): LoadingOverlay(), LoadingOverlayProps, ProtectedRoute(), availablePages, PageInfo, ProtectedRouteProps

### Community 104 - "Q: Como importar com segurança parâmetros clínicos em lote no Firestore e adaptar a UI para exames qualitativos?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Como importar com segurança parâmetros clínicos em lote no Firestore e adaptar a UI para exames qualitativos?, Source Nodes

### Community 105 - "DashboardLayout.tsx"
Cohesion: 0.40
Nodes (3): SidebarInset, SidebarProvider, Toaster()

### Community 106 - "avatar.tsx"
Cohesion: 0.50
Nodes (3): Avatar, AvatarFallback, AvatarImage

### Community 108 - "Q: Gostaria que instalasse o graphify nesse projeto e analisasse ele por completo para podermos identificar a estrutura dele e prosseguíssemos com atualizações"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Gostaria que instalasse o graphify nesse projeto e analisasse ele por completo para podermos identificar a estrutura dele e prosseguíssemos com atualizações, Source Nodes

## Ambiguous Edges - Review These
- `Emblema de Ponte e Lâmpada da Enfermagem` → `Identidade Local de Florianópolis`  [AMBIGUOUS]
  public/lovable-uploads/9753344e-5ca4-43b0-8479-c33f5880810f.png · relation: conceptually_related_to

## Knowledge Gaps
- **384 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+379 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **52 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Emblema de Ponte e Lâmpada da Enfermagem` and `Identidade Local de Florianópolis`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `dependencies` connect `dependencies` to `devDependencies`, `cmdk`, `date-fns`, `firebase`, `framer-motion`, `@hookform/resolvers`, `html2pdf.js`, `input-otp`, `lucide-react`, `next-themes`, `@radix-ui/react-accordion`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-aspect-ratio`, `@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-collapsible`, `@radix-ui/react-context-menu`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-hover-card`, `@radix-ui/react-label`, `@radix-ui/react-menubar`, `@radix-ui/react-navigation-menu`, `@radix-ui/react-popover`, `@radix-ui/react-progress`, `@radix-ui/react-radio-group`, `@radix-ui/react-select`, `@radix-ui/react-separator`, `@radix-ui/react-slider`, `@radix-ui/react-slot`, `@radix-ui/react-switch`, `@radix-ui/react-toggle`, `@radix-ui/react-toggle-group`, `@radix-ui/react-tooltip`, `react-beautiful-dnd`, `react-day-picker`, `react-hook-form`, `react-resizable-panels`, `react-router-dom`, `sonner`, `tailwind-merge`, `tailwindcss-animate`, `@tanstack/react-query`, `@tanstack/react-table`, `@types/react-beautiful-dnd`, `uuid`, `vaul`, `zod`, `react`, `embla-carousel-react`, `class-variance-authority`?**
  _High betweenness centrality (0.212) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `TabelaExames.tsx`, `AuthContext.tsx`, `ProtectedRoute.tsx`, `chart.tsx`, `dependencies`?**
  _High betweenness centrality (0.196) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `TabelaExames.tsx`, `button.tsx`, `AuthContext.tsx`, `GestaoUsuarios.tsx`, `utils.ts`, `sidebar.tsx`, `combobox.tsx`, `carousel.tsx`, `input-otp.tsx`, `menubar.tsx`, `EtapaAvaliacao.tsx`, `context-menu.tsx`, `dropdown-menu.tsx`, `EtapaDiagnostico.tsx`, `breadcrumb.tsx`, `drawer.tsx`, `navigation-menu.tsx`, `HistoricoProcessosModal.tsx`, `index.ts`, `chart.tsx`, `react`, `avatar.tsx`?**
  _High betweenness centrality (0.136) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _384 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `import-clinical-parameters.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08534850640113797 - nodes in this community are weakly interconnected._
- **Should `TabelaExames.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05549450549450549 - nodes in this community are weakly interconnected._