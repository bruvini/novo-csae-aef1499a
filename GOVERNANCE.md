# Governança do Projeto - Portal CSAE Floripa 2.0

**Versão**: 1.1.0
**Data de Atualização**: 07/04/2026 20:12:00

## 1. Visão Arquitetural
O projeto utiliza uma stack moderna baseada em:
- **Frontend**: React (Vite) + TypeScript
- **Estilização**: Tailwind CSS + shadcn-ui
- **Backend/BaaS**: Firebase (Auth, Firestore, Storage)
- **Gerenciamento de Estado**: React Query (TanStack Query)
- **Formulários**: React Hook Form + Zod

## 2. Regras de Alteração e Desenvolvimento
- **Branching**: O desenvolvimento deve ocorrer em branches de funcionalidade (`feature/`), correção (`fix/`) ou saneamento (`refactor/`). Nunca fazer commit direto na `main`.
- **Mensagens de Commit**: Devem seguir o padrão Conventional Commits (ex: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`).
- **TypeScript**: É obrigatório o uso de tipos estritos. Evitar o uso de `any`.
- **Componentização**: Seguir o padrão de componentes compartilhados em `src/components/ui` (shadcn) e componentes de domínio em `src/components/[domínio]`.

## 3. Fluxo de Aprovação
1. Criação de branch a partir da `main`.
2. Desenvolvimento e testes locais.
3. Pull Request (PR) com descrição clara das mudanças.
4. Validação por um AI Agent e/ou revisor humano.
5. Merge na `main` após aprovação e sucesso no pipeline de CI/CD.

## 4. Critérios de Qualidade
- **Linting**: O comando `npm run lint` não deve retornar erros bloqueantes.
- **Build**: O comando `npm run build` deve passar sem falhas.
- **Segurança**: Nenhuma credencial ou segredo deve ser versionado no código-fonte. Uso obrigatório de `.env`. Uso obrigatório de política de sessão curta (`browserSessionPersistence`) e auditoria contínua de últimos acessos dos usuários.
- **Banco de Dados**: Todas as métricas totalizadoras em dashboards devem obrigatoriamente usar Aggregation Queries (sum, count, average) do Firestore para prevenir sobrecarga de faturamento.
- **Business Intelligence**: O módulo "Painel Estatístico" atua como central de BI. Gráficos futuros devem ser implementados com queries agregadas nativas do servidor.

## 5. Papéis e Responsabilidades
- **Desenvolvedor**: Responsável pela implementação e testes unitários.
- **AI Agent (Antigravity)**: Responsável por revisões de conformidade, saneamento arquitetural e documentação inicial.
- **Stakeholders**: Responsáveis pela definição de requisitos de negócio e validação funcional.

## 6. Diretriz de Changelog Obrigatório
> **OBRIGATÓRIO**: Todo novo deploy de funcionalidade, correção relevante ou alteração visível ao usuário final **deve** ser acompanhado de uma inserção na coleção `changelogs` do Firestore contendo:
> - `titulo` (string): Resumo conciso da mudança.
> - `descricao` (string): Descrição detalhada do impacto para o usuário.
> - `dataHora` (Timestamp): Timestamp do momento do deploy.
>
> Essa diretriz garante que o mural de "Atualizações Recentes" no Dashboard mantenha os usuários informados sobre melhorias e correções do sistema. O não-cumprimento desta regra é considerado uma **violação de governança**.


### Diretrizes de Interoperabilidade (Fase 4+)
1. **Mapeamento de Dados**: Toda a coleta de dados de Exame Físico, Sinais Vitais e Exames Diagnósticos deve ser progressivamente mapeada para o recurso 'Observation' do padrão FHIR (HL7).
2. **Terminologias**: Utilizar LOINC para exames laboratoriais e SNOMED CT para achados propedêuticos.
