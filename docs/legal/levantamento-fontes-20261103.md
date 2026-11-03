# Levantamento técnico e institucional — Portal CSAE Floripa 2.0
Data: 03/11/2026. Escopo: somente inspeção de código, regras e evidências fornecidas pela equipe, sem consulta de dados clínicos em produção.

## Achados comprovados no repositório
- Projeto Firebase padrão: `csaefloripa`; Hosting configurado para site `csaefloripa`, diretório `dist` e regra SPA de redirecionamento (`.firebaserc`, `firebase.json`).
- Firebase Authentication, Firestore, Storage e Analytics são inicializados em `src/services/firebase.ts`. O uso explícito de Analytics em `src/services/registrationTelemetry.ts` inclui o evento `registration_progress` (correlation_id, stage e, quando houver, error_code), sem dados dos formulários. Não é um inventário exaustivo de eventos automáticos de Analytics.
- Cadastro de profissionais (`src/pages/Register.tsx`, `src/types/usuario.ts`) coleta identificação, contato e dados profissionais, incluindo CPF, RG e endereço. O aceite do Termo de Responsabilidade é gravado como flag e timestamp em `usuarios/{uid}`; o PDF não é retido pelo sistema conforme informação da equipe.
- Cadastro de pacientes (`src/services/bancodados/pacientesDB.ts`) recebe nome completo, data de nascimento, sexo; processo e evolução são armazenados no Firestore e podem conter dados de saúde. Existe exclusão de pacientes pela aplicação, mas isso não define por si só política ou prazo institucional de conservação e backup.
- A política de acesso aos registros clínicos não depende apenas da interface: `firestore.rules` permite leitura por profissional autorizado ao próprio paciente e contempla agregações administrativas autorizadas. A ausência de pesquisa de pacientes na UI não elimina acesso técnico por operadores autorizados ao projeto.
- História: a equipe informou haver dois registros reais na coleção `historiasPortal`, contendo `dataOrdenacao`, `dataReferencia`, `titulo`, `descricao`, autoria, timestamps e `curtidasPor`. O código anterior restaurado consultava erroneamente `timelineEvents`; a correção passa a consultar a coleção de produção, com regras de leitura restritas devido à presença de identificadores.
- Documentos Legais: `documentosLegais/{terms|privacy}/revisoes` tem snapshots imutáveis, histórico e publicação controlada pelo ponteiro `publicadaId`. O editor bloqueia texto com marcadores `[PREENCHER: ...]` ou afirmações de validação pendente.

## Evidência oficial externa
- ANPD: Guia de tratamento de dados pessoais pelo poder público, identificação do controlador e encarregado, bases legais e transparência.
- Prefeitura de Florianópolis: Decreto municipal nº 29.730, de 24/09/2026, publicado no DOM/SC, ato 8740364, sobre LGPD municipal. Não inferir atribuições específicas ou designação do encarregado sem consultar o texto integral e a designação atual.
- Referência municipal antiga (`devportal.pmf.sc.gov.br`) menciona o Município como controlador e as ouvidorias setoriais como canais, mas deve ser reconciliada com o Decreto de 2026 e os atos atuais antes de ser transcrita para o documento oficial.

## Informações ainda não comprovadas
1. Identidade jurídica do controlador e encarregado municipal/setorial vigente, com canal oficial de exercício dos direitos dos titulares.
2. Região efetiva do Firestore e do(s) bucket(s) Storage no projeto, eventuais fluxos de transferência, contratos e fornecedores autorizados.
3. Prazos de retenção por classe de dado, backups, exportação, descarte e tratamento do encerramento do vínculo do usuário.
4. Bases legais e instrumento de autorização institucional para uso de dados de pacientes reais neste portal e eventual utilização de métricas para pesquisa.
5. Autorização/licença de uso e divulgação dos conteúdos clínicos e das intervenções autorais.
6. Procedimento para ciência/aceite de novas versões por usuários antigos; atualmente os modais não criam automaticamente evento de aceite dos documentos.

## Confirmações sem compartilhar credenciais
- Firebase Console → Firestore Database → detalhes da instância `(default)`: verificar localização.
- Firebase Console / Google Cloud Storage → bucket de arquivos: confirmar localização de cada bucket.
- Controladoria/Ouvidoria da Prefeitura → ato e contato atual do encarregado para a Secretaria da Saúde e indicação formal do controlador.
- Equipe gestora → ato de autorização do portal, retenção e fluxo de atendimento a titulares de dados.

## Fontes
- https://github.com/bruvini/novo-csae-aef1499a/blob/main/src/services/firebase.ts
- https://github.com/bruvini/novo-csae-aef1499a/blob/main/src/services/registrationTelemetry.ts
- https://github.com/bruvini/novo-csae-aef1499a/blob/main/src/services/bancodados/pacientesDB.ts
- https://github.com/bruvini/novo-csae-aef1499a/blob/main/firestore.rules
- https://static.dom.sc.gov.br/atos/8740364
- https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia_orientativo_tratamento_de_dados_pessoais_pelo_poder_publico

**Não presumir dados de produção a partir de configuração do cliente.** A conta de deploy do GitHub tem permissões de publicação, não representa acesso de leitura a registros de pacientes nem ao banco em tempo real.
