# Portal CSAE Floripa 2.0

**Versão**: 2.0.0
**Data de Atualização**: 28/03/2026 20:45:00

## 1. Propósito do Sistema
O Portal CSAE Floripa é uma plataforma desenvolvida para a Secretaria Municipal de Saúde de Florianópolis, com foco na digitalização e gestão do **Processo de Enfermagem**. O sistema visa centralizar dados profissionais, conteúdos clínicos (diagnósticos, intervenções, etc.) e a gestão de usuários da rede de saúde municipal.

## 2. Stack Tecnológica
Este projeto é construído com as seguintes tecnologias principais:
- **Core**: React 18 (Vite) + TypeScript
- **Styling**: Tailwind CSS + shadcn-ui + Framer Motion
- **Backend/Services**: Firebase (Auth, Firestore, Storage, Analytics, Hosting)
- **Formulários/Validação**: React Hook Form + Zod
- **Request Management**: TanStack Query (React Query)

## 3. Estrutura de Pastas e Convenções
A organização do projeto segue o padrão:
- `src/components/`: Componentes reutilizáveis.
  - `ui/`: Componentes básicos (shadcn-ui).
  - `[domínio]/`: Componentes específicos de cada área (ex: `gestao-usuarios/`).
- `src/pages/`: Páginas da aplicação.
- `src/hooks/`: Hooks customizados para lógica compartilhada.
- `src/services/`: Integrações de dados (ex: `firebase.ts`, `bancodados/usuariosDB.ts`).
- `src/types/`: Definições de interfaces e tipos TypeScript.
- `src/lib/`: Utilitários e configurações de bibliotecas (ex: validators).

## 4. Como Rodar o Projeto Localmente

### Pré-requisitos
- Node.js (v18 ou superior)
- npm (v9 ou superior)
- Configuração do Firebase Project (veja `.env.example`)

### Passo-a-passo
1. Clone o repositório.
2. Crie um arquivo `.env` na raiz, copiando de `.env.example` e preenchendo as chaves do Firebase.
3. Instale as dependências:
   ```bash
   npm install --legacy-peer-deps
   ```
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
5. Acesse: `http://localhost:8080`

## 5. Como Testar e Validar
- **Linting**: `npm run lint` - Verifica erros estáticos e de padrões de código.
- **Build**: `npm run build` - Valida se a aplicação pode ser compilada para produção.
- **Agent Browser**: Durante o desenvolvimento, o Antigravity utiliza o Agent Browser para validar visualmente as rotas e fluxos críticos.

## 6. Deployment e CI/CD
O deploy é automatizado via Firebase Hosting. 
- **Destino Principal**: `csaefloripa.web.app` (Firebase default) / `csae.com.br` (Custom Domain).
- **Processo**: Todo merge na branch `main` dispara o pipeline de build e deploy no Firebase.

## 7. Informações Adicionais
- **Governança**: Veja [GOVERNANCE.md](GOVERNANCE.md) para regras de contribuição.
- **Segurança**: Veja [SECURITY.md](SECURITY.md) para políticas de proteção de dados e LGPD.
- **Termo de Responsabilidade**: É obrigatório o aceite do termo no primeiro acesso (modal em `src/components/TermoResponsabilidadeModal.tsx`).

## 8. Pendências Conhecidas (Backlog)
- [ ] Implementar gestão completa do Processo de Enfermagem (Fase 2).
- [ ] Refatorar tipos `any` remanescentes em serviços de banco de dados.
- [ ] Migração de modelagem de dados para padrão FHIR/HL7.
- [ ] Adicionar testes automatizados (unitários e e2e).