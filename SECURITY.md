# Política de Segurança e Proteção de Dados - Portal CSAE Floripa 2.0

**Versão**: 1.0.0
**Data de Atualização**: 28/03/2026 20:35:00

## 1. Proteção de Dados (LGPD)
O sistema manipula dados sensíveis de saúde e informações pessoais (CPF, RG, Coren).
- **Dados Pessoais**: Armazenados de forma segura no Firestore.
- **Dados Sensíveis**: O tratamento deve seguir as recomendações da Lei Geral de Proteção de Dados (LGPD).
- **Dívida Técnica**: No futuro, considerar criptografia adicional para campos extremamente sensíveis em repouso.

## 2. Autenticação e Autorização
- **Autenticação**: Gerida pelo Firebase Auth.
- **Autorização**: Realizada através de verificação no Firestore (`usuarios/{uid}`). O campo `ehAdmin` determina permissões administrativas.
- **Proteção de Rotas**: Vias protegidas pelo componente `ProtectedRoute`. Nenhuma rota administrativa deve ser acessível sem autenticação e autorização adequadas.

## 3. Estratégia de Segredos e Variáveis de Ambiente
- **Regra de Ouro**: Nenhuma senha, chave privada ou API Key real deve permanecer hardcoded no código versionado.
- **Implementação**: Uso de arquivo `.env` para configurações locais e segredos no ambiente de CI/CD.
- **Exemplo**: Fornecido em `.env.example`.

## 4. Segurança no Firebase
- **Firestore Security Rules**: Devem ser rigorosamente definidas para permitir leitura/escrita apenas a usuários autorizados.
- **Firebase Storage CORS**: Configurado para domínios autorizados.
- **Firebase Hosting**: Uso de HTTPS obrigatório.

## 5. Riscos Identificados e Mitigação
- **Exposição de Dados de Teste**: Garantir que dados de produção não sejam usados em ambientes de desenvolvimento sem anonimização.
- **Injeção**: Uso de bibliotecas de validação (`zod`) para sanitização de inputs em todos os formulários.
- **Acesso Indevido**: Auditoria periódica de logs do Firebase.
- **Domínio de Saúde**: A modelagem futura deve seguir os padrões FHIR/HL7 para interoperabilidade e terminologias clínicas adequadas.
