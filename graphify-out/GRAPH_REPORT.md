# Graph Report - novo-csae-aef1499a  (2026-09-21)

## Corpus Check
- 192 files · ~478,686 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1291 nodes · 3276 edges · 139 communities (73 shown, 66 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 38 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8a551669`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- EtapaAvaliacao.tsx
- import-clinical-parameters.ts
- index.ts
- GestaoUsuarios.tsx
- ModalCadastroDiagnostico.tsx
- TabelaExames.tsx
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
- FormularioSistema.tsx
- chart.tsx
- clsx
- AuthContext.tsx
- menubar.tsx
- compilerOptions
- Enfermagem e Saúde Digital no Centro de Saúde Saco dos Limões
- Q: Implementar badges de respostas não visualizadas na Central de Ajuda e de novos itens na Gestão de Suporte
- ListaPacientes.tsx
- context-menu.tsx
- dropdown-menu.tsx
- Shell HTML do Portal CSAE Floripa
- package.json
- Profissional de Saúde com Notebook no Centro de Saúde Trindade
- usuario.ts
- input-otp.tsx
- navigation-menu.tsx
- CSAE Brand Mark
- Enfermagem Florianópolis Brand Mark
- Centered Image Icon
- dotenv
- approve-user.ts
- Q: Atualizar a interface do Processo de Enfermagem para exames qualitativos e híbridos, bloquear números negativos e ampliar o modal
- ProcessoEnfermagemModal.tsx
- QueryContext.tsx
- toggle-group.tsx
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
- IntervencaoItem.tsx
- TabelaSinaisVitais.tsx
- @radix-ui/react-dialog
- TabelaSubconjuntos.tsx
- @radix-ui/react-hover-card
- @radix-ui/react-label
- @radix-ui/react-menubar
- @radix-ui/react-navigation-menu
- @radix-ui/react-popover
- firebase.ts
- @radix-ui/react-radio-group
- @radix-ui/react-select
- @radix-ui/react-separator
- @radix-ui/react-slider
- @radix-ui/react-slot
- @radix-ui/react-switch
- @radix-ui/react-toggle
- @radix-ui/react-toggle-group
- exceljs
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
- carousel.tsx
- tailwindcss
- Q: Gostaria que instalasse o graphify nesse projeto e analisasse ele por completo para podermos identificar a estrutura dele e prosseguíssemos com atualizações
- @tailwindcss/typography
- breadcrumb.tsx
- @types/react
- @types/react-dom
- typescript-eslint
- vite
- @vitejs/plugin-react-swc
- ProfessionalInfoForm.tsx
- @radix-ui/react-scroll-area
- @radix-ui/react-toast
- combobox.tsx
- react-dom
- @types/node
- react-input-mask
- react
- recharts
- DashboardLayout.tsx
- App.tsx
- drawer.tsx
- Painel_Estatistico_validacao_08c2c08c.md
- pages.ts
- GestaoSuporte.tsx
- TabelaDiagnosticos.tsx
- Perfil.tsx
- AuthenticatedLayout.tsx
- useAuth
- resultadosExames.ts
- Register.tsx
- listarAlteracoesProfissionais
- avatar.tsx

## God Nodes (most connected - your core abstractions)
1. `cn()` - 82 edges
2. `Button` - 44 edges
3. `useAuth()` - 31 edges
4. `Card` - 26 edges
5. `CardContent` - 26 edges
6. `DialogContent` - 26 edges
7. `DialogHeader()` - 26 edges
8. `db` - 26 edges
9. `CardHeader` - 25 edges
10. `DialogTitle` - 25 edges

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

## Communities (139 total, 66 thin omitted)

### Community 0 - "EtapaAvaliacao.tsx"
Cohesion: 0.06
Nodes (73): ModalCadastroSubconjuntoProps, ModalConfirmacaoExclusaoProps, ModalDetalhesSubconjuntoProps, ModalVisualizarDiagnosticoProps, inferEhAlteracao(), ModalVisualizarSistema(), sortedAchados(), ModalHistoricoChangelogProps (+65 more)

### Community 1 - "import-clinical-parameters.ts"
Cohesion: 0.09
Nodes (37): achadoSchema, canonicalizeNhbs(), collectNhbs(), Compendio, compendioSchema, componenteExameSchema, countCollection(), documentId() (+29 more)

### Community 2 - "index.ts"
Cohesion: 0.23
Nodes (19): AlertTitle, CATEGORIAS_SUGESTAO, CentralAjuda(), formatarData(), MODULOS, buscarMeusTickets(), buscarMinhasSugestoes(), ContagemNotificacoesSuporte (+11 more)

### Community 3 - "GestaoUsuarios.tsx"
Cohesion: 0.19
Nodes (22): ModalMotivoRecusa(), ModalRevogacaoAcesso(), normalizarSelecaoPaginas(), GestaoUsuarios(), KpiUsuarioProps, aprovarAlteracaoCadastral(), aprovarUsuario(), buscarUsuariosAguardando() (+14 more)

### Community 4 - "ModalCadastroDiagnostico.tsx"
Cohesion: 0.06
Nodes (48): ModalCadastroDiagnostico(), Subconjunto, Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps (+40 more)

### Community 5 - "TabelaExames.tsx"
Cohesion: 0.24
Nodes (14): TabelaExames(), ExameResultadoInput(), ExameResultadoInputProps, Input, addExame(), componenteEhClassificatorio(), ComponenteExame, deleteExame() (+6 more)

### Community 6 - "devDependencies"
Cohesion: 0.18
Nodes (11): autoprefixer, eslint-plugin-react-refresh, globals, devDependencies, autoprefixer, eslint-plugin-react-refresh, globals, tsx (+3 more)

### Community 7 - "Portal CSAE Floripa 2.0"
Cohesion: 0.06
Nodes (35): Fluxo de aprovação, Diretriz obrigatória de changelog, Terminologias clínicas LOINC e SNOMED CT, Organização de componentes por UI e domínio, Conventional Commits, Fluxo de branches de funcionalidade, Mapeamento clínico para FHIR Observation, Firebase BaaS (+27 more)

### Community 8 - "PainelEstatistico.tsx"
Cohesion: 0.06
Nodes (64): COLORS, COLORS_PROD, EXECUTOR_COLORS, PainelEstatistico(), STATUS_COLORS, STATUS_PROCESSO_COLORS, VIEW_LABELS, ViewMode (+56 more)

### Community 9 - "compilerOptions"
Cohesion: 0.08
Nodes (24): DOM, DOM.Iterable, ES2020, src, compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules (+16 more)

### Community 10 - "cn"
Cohesion: 0.12
Nodes (19): ButtonProps, buttonVariants, Calendar(), CalendarProps, HoverCardContent, Image(), ImageProps, Pagination() (+11 more)

### Community 11 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, build:dev, deploy, dev, import:clinical, lint, preview

### Community 12 - "compilerOptions"
Cohesion: 0.11
Nodes (17): ES2023, vite.config.ts, compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection (+9 more)

### Community 13 - "sidebar.tsx"
Cohesion: 0.10
Nodes (25): navigationItems, Sidebar, SidebarContent, SidebarContext, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent (+17 more)

### Community 14 - "components.json"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 15 - "dependencies"
Cohesion: 0.13
Nodes (15): class-variance-authority, dependencies, class-variance-authority, @radix-ui/react-collapsible, @radix-ui/react-context-menu, @radix-ui/react-dropdown-menu, @radix-ui/react-progress, @radix-ui/react-tabs (+7 more)

### Community 16 - "FormularioSistema.tsx"
Cohesion: 0.19
Nodes (15): AchadoEditState, CLASSIFICACAO_SUGGESTIONS, emptyAchado(), emptyOpcao(), FormularioSistema(), FormularioSistemaProps, inferEhAlteracao(), sortedAchadosWithIndex() (+7 more)

### Community 17 - "chart.tsx"
Cohesion: 0.20
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 19 - "AuthContext.tsx"
Cohesion: 0.18
Nodes (13): ModalEdicaoPrivilegios(), AuthContext, AuthContextType, AuthProvider(), AuthProviderProps, garantirPermissoesAtuais(), SessionData, IndicadoresTempoReal (+5 more)

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

### Community 24 - "ListaPacientes.tsx"
Cohesion: 0.23
Nodes (16): TabelaRevisaoSistemas(), ModalConfirmacaoExclusao(), ModalConfirmacaoExclusaoProps, ListaPacientes(), AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription (+8 more)

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

### Community 30 - "usuario.ts"
Cohesion: 0.12
Nodes (20): ModalConfirmacaoAprovacao(), ModalConfirmacaoAprovacaoProps, ModalDetalhesUsuarioProps, ModalEdicaoPrivilegiosProps, ModalMotivoRecusaProps, ModalRevisaoCadastralProps, ModalRevogacaoAcessoProps, TabelaUsuariosProps (+12 more)

### Community 31 - "input-otp.tsx"
Cohesion: 0.40
Nodes (4): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot

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

### Community 39 - "ProcessoEnfermagemModal.tsx"
Cohesion: 0.07
Nodes (37): ModalCadastroSubconjunto(), HistoricoProcessosModal(), ModalCadastroPaciente(), ProcessoEnfermagemModal(), ICONES_ETAPAS, StepperProcesso(), StepperProcessoProps, TempoAtivoBadge() (+29 more)

### Community 41 - "toggle-group.tsx"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 57 - "IntervencaoItem.tsx"
Cohesion: 0.18
Nodes (14): consolidarAprazamento(), IntervencaoItem(), IntervencaoItemProps, OPCOES_EXECUTORES, parseAprazamento(), PRESETS_APRAZAMENTO, SelectContent, SelectItem (+6 more)

### Community 58 - "TabelaSinaisVitais.tsx"
Cohesion: 0.22
Nodes (14): IndicadoresConteudo(), IndicadoresData, TabelaSinaisVitais(), Skeleton(), getExamesCount(), addSinalVital(), deleteSinalVital(), getSinaisVitais() (+6 more)

### Community 60 - "TabelaSubconjuntos.tsx"
Cohesion: 0.18
Nodes (15): ModalConfirmacaoExclusao(), TabelaSubconjuntos(), Badge(), BadgeProps, badgeVariants, Table, TableBody, TableCaption (+7 more)

### Community 66 - "firebase.ts"
Cohesion: 0.13
Nodes (18): HeroBannerProps, ModalHistoricoChangelog(), Dashboard(), formatarDataHora(), buscarChangelogsRecentes(), buscarTodosChangelogs(), Changelog, CHANGELOGS_SISTEMA (+10 more)

### Community 104 - "Q: Como importar com segurança parâmetros clínicos em lote no Firestore e adaptar a UI para exames qualitativos?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Como importar com segurança parâmetros clínicos em lote no Firestore e adaptar a UI para exames qualitativos?, Source Nodes

### Community 106 - "carousel.tsx"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 108 - "Q: Gostaria que instalasse o graphify nesse projeto e analisasse ele por completo para podermos identificar a estrutura dele e prosseguíssemos com atualizações"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Gostaria que instalasse o graphify nesse projeto e analisasse ele por completo para podermos identificar a estrutura dele e prosseguíssemos com atualizações, Source Nodes

### Community 110 - "breadcrumb.tsx"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 116 - "ProfessionalInfoForm.tsx"
Cohesion: 0.18
Nodes (17): AccessInfoFormProps, PersonalInfoFormProps, ProfessionalInfoFormProps, FormControl, FormDescription, FormField(), FormFieldContext, FormFieldContextValue (+9 more)

### Community 119 - "combobox.tsx"
Cohesion: 0.23
Nodes (10): ComboboxProps, Command, CommandDialogProps, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList (+2 more)

### Community 123 - "react"
Cohesion: 0.22
Nodes (8): react, react, useCarousel(), useChart(), Combobox(), useFormField(), useSidebar(), useIsMobile()

### Community 125 - "DashboardLayout.tsx"
Cohesion: 0.40
Nodes (3): SidebarInset, SidebarProvider, Toaster()

### Community 126 - "App.tsx"
Cohesion: 0.15
Nodes (11): queryClient, Toaster(), ToasterProps, TabsContent, TabsList, TabsTrigger, useIndicadoresTempoReal(), DebugUsers() (+3 more)

### Community 127 - "drawer.tsx"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 128 - "Painel_Estatistico_validacao_08c2c08c.md"
Cohesion: 0.17
Nodes (11): Sheet: Avaliação, Sheet: Diagnósticos, Sheet: Evolução Clínica, Sheet: Evolução Enfermagem, Sheet: Evolução Usuários, Sheet: Implementação, Sheet: Planejamento, Sheet: Produtividade (+3 more)

### Community 129 - "pages.ts"
Cohesion: 0.23
Nodes (9): LoadingOverlay(), LoadingOverlayProps, ProtectedRoute(), ALL_PAGE_IDS, availablePages, DEFAULT_COMMON_PAGE_IDS, PageInfo, ProtectedRouteProps (+1 more)

### Community 130 - "GestaoSuporte.tsx"
Cohesion: 0.20
Nodes (18): BlocoKpisProps, formatarData(), GestaoSuporte(), media(), buscarAvaliacoesNPS(), buscarTodasSugestoes(), buscarTodosTickets(), marcarSugestaoComoVisualizadaPeloSuporte() (+10 more)

### Community 131 - "TabelaDiagnosticos.tsx"
Cohesion: 0.18
Nodes (16): TabelaDiagnosticos(), SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+8 more)

### Community 132 - "Perfil.tsx"
Cohesion: 0.24
Nodes (15): TabelaUsuarios(), PersonalInfoForm(), Perfil(), atualizarDadosPessoais(), buscarMeuPerfil(), solicitarRevisaoDadosProfissionais(), DadosPessoais, DadosProfissionais (+7 more)

### Community 133 - "AuthenticatedLayout.tsx"
Cohesion: 0.24
Nodes (6): AuthenticatedLayout(), AuthenticatedLayoutProps, Footer(), ModalNPSObrigatorio(), ModalNPSObrigatorioProps, ehDetratorNps()

### Community 134 - "useAuth"
Cohesion: 0.23
Nodes (13): AppSidebar(), Header(), NavigationCards(), IndicadoresProducaoModal(), useAuth(), contagemInicial, SupportNotificationsContext, SupportNotificationsContextType (+5 more)

### Community 135 - "resultadosExames.ts"
Cohesion: 0.27
Nodes (11): EtapaAvaliacao(), EtapaResumo(), ordenarExamesParaExibicao(), getSistemas(), encontrarFaixaNumerica(), formatarResultadoExame(), formatarValorClinico(), resolverStatusReferencia() (+3 more)

### Community 136 - "Register.tsx"
Cohesion: 0.29
Nodes (9): Register(), TermoData, cadastrarUsuario(), DadosPessoais, DadosProfissionais, UsuarioData, cadastroEmAndamento(), finalizarFluxoCadastro() (+1 more)

### Community 137 - "listarAlteracoesProfissionais"
Cohesion: 0.50
Nodes (4): ModalRevisaoCadastral(), exibirValor(), listarAlteracoesProfissionais(), rotulosProfissionais

### Community 138 - "avatar.tsx"
Cohesion: 0.50
Nodes (3): Avatar, AvatarFallback, AvatarImage

## Ambiguous Edges - Review These
- `Emblema de Ponte e Lâmpada da Enfermagem` → `Identidade Local de Florianópolis`  [AMBIGUOUS]
  public/lovable-uploads/9753344e-5ca4-43b0-8479-c33f5880810f.png · relation: conceptually_related_to

## Knowledge Gaps
- **413 isolated node(s):** `COLORS`, `STATUS_COLORS`, `COLORS_PROD`, `STATUS_PROCESSO_COLORS`, `EXECUTOR_COLORS` (+408 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **66 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Work-memory lessons

**Preferred sources** — corroborated by past sessions; start here.
- `Exame` (2× useful, score=0.866382454)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Emblema de Ponte e Lâmpada da Enfermagem` and `Identidade Local de Florianópolis`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `dependencies` connect `dependencies` to `clsx`, `package.json`, `cmdk`, `date-fns`, `firebase`, `framer-motion`, `@hookform/resolvers`, `html2pdf.js`, `input-otp`, `lucide-react`, `next-themes`, `@radix-ui/react-accordion`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-aspect-ratio`, `@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-dialog`, `@radix-ui/react-hover-card`, `@radix-ui/react-label`, `@radix-ui/react-menubar`, `@radix-ui/react-navigation-menu`, `@radix-ui/react-popover`, `@radix-ui/react-radio-group`, `@radix-ui/react-select`, `@radix-ui/react-separator`, `@radix-ui/react-slider`, `@radix-ui/react-slot`, `@radix-ui/react-switch`, `@radix-ui/react-toggle`, `@radix-ui/react-toggle-group`, `exceljs`, `react-beautiful-dnd`, `react-day-picker`, `react-hook-form`, `react-resizable-panels`, `react-router-dom`, `sonner`, `tailwind-merge`, `tailwindcss-animate`, `@tanstack/react-query`, `@tanstack/react-table`, `@types/react-beautiful-dnd`, `uuid`, `vaul`, `zod`, `embla-carousel-react`, `@radix-ui/react-scroll-area`, `@radix-ui/react-toast`, `react-dom`, `react-input-mask`, `react`, `recharts`?**
  _High betweenness centrality (0.211) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `pages.ts`, `ModalCadastroDiagnostico.tsx`, `ProcessoEnfermagemModal.tsx`, `dependencies`, `ListaPacientes.tsx`?**
  _High betweenness centrality (0.201) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `EtapaAvaliacao.tsx`, `TabelaDiagnosticos.tsx`, `ModalCadastroDiagnostico.tsx`, `TabelaExames.tsx`, `useAuth`, `avatar.tsx`, `sidebar.tsx`, `FormularioSistema.tsx`, `chart.tsx`, `menubar.tsx`, `ListaPacientes.tsx`, `context-menu.tsx`, `dropdown-menu.tsx`, `input-otp.tsx`, `navigation-menu.tsx`, `ProcessoEnfermagemModal.tsx`, `toggle-group.tsx`, `IntervencaoItem.tsx`, `TabelaSinaisVitais.tsx`, `TabelaSubconjuntos.tsx`, `carousel.tsx`, `breadcrumb.tsx`, `ProfessionalInfoForm.tsx`, `combobox.tsx`, `react`, `App.tsx`, `drawer.tsx`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **What connects `COLORS`, `STATUS_COLORS`, `COLORS_PROD` to the rest of the system?**
  _413 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `EtapaAvaliacao.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06424097027855524 - nodes in this community are weakly interconnected._
- **Should `import-clinical-parameters.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08534850640113797 - nodes in this community are weakly interconnected._