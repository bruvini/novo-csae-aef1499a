# Governança do Projeto - Portal CSAE Floripa 2.0

**Versão**: 1.0.0
**Data de Atualização**: 28/03/2026 20:30:00

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
- **Segurança**: Nenhuma credencial ou segredo deve ser versionado no código-fonte. Uso obrigatório de `.env`.

## 5. Papéis e Responsabilidades
- **Desenvolvedor**: Responsável pela implementação e testes unitários.
- **AI Agent (Antigravity)**: Responsável por revisões de conformidade, saneamento arquitetural e documentação inicial.
- **Stakeholders**: Responsáveis pela definição de requisitos de negócio e validação funcional.
