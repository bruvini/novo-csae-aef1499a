# Matriz de permissões Firebase

Esta matriz descreve o protótipo de regras do Portal CSAE. A autorização de páginas é controlada pelo perfil canônico `usuarios/{uid}`; o cliente não pode alterar seu próprio papel, status de aprovação ou páginas permitidas.

| Recurso | Visitante | Cadastro pendente/recusado/revogado | Profissional aprovado | Gestor de conteúdo/suporte/BI | Administrador ativo |
| --- | --- | --- | --- | --- | --- |
| `usuarios` | sem acesso | lê apenas o próprio perfil para validar o estado | lê/atualiza apenas o próprio perfil não privilegiado | sem leitura ampliada por papel de página | lê perfis; altera somente campos de gestão; sem exclusão pelo cliente |
| `pacientesProcessoEnfermagem` | sem acesso | sem acesso | lê/cria/atualiza/exclui somente registros próprios | BI autorizado recebe leitura global, sem escrita em prontuários alheios | BI autorizado recebe leitura global; não altera prontuários alheios |
| Catálogos clínicos (`ExamesLabImagem`, `RevisaoSistemas`, `SinaisVitais`, `rolEnfermagem`, `diagnosticosEnfermagem`, `subconjuntosEnfermagem`) | sem acesso | sem acesso | leitura quando autorizado à página Processo de Enfermagem | gestor autorizado pode manter os catálogos | leitura/manutenção |
| `tickets_suporte`, `sugestoes_melhoria` | sem acesso | sem acesso | cria e consulta apenas seus registros; pode marcar resposta como vista | Gestão de Suporte consulta e responde | consulta/responde |
| `pesquisas_nps` | sem acesso | sem acesso | cria/consulta apenas suas avaliações | Gestão de Suporte consulta avaliações | consulta avaliações |
| `estatisticas` | sem acesso | sem acesso | sem acesso | sem acesso para perfis não administradores | leitura/escrita limitada aos dois documentos de cache BI |
| `changelogs` | sem acesso | sem acesso | leitura | leitura | cria entradas; cliente não edita/exclui entradas existentes |
| `intervencoesAutorais` | sem acesso | sem acesso | cria e lê somente registros próprios | idem | idem |
| Storage `materiais-apoio/**`, `protocolos/**` | sem acesso | sem acesso | leitura com acesso à página Processo de Enfermagem | leitura; gestor pode enviar, substituir ou excluir arquivos permitidos | leitura/manutenção |
| qualquer outra coleção/caminho | sem acesso | sem acesso | sem acesso | sem acesso | sem acesso |

## Coleções inventariadas no projeto

`ExamesLabImagem`, `RevisaoSistemas`, `SinaisVitais`, `changelogs`, `estatisticas`, `intervencoesAutorais`, `pacientesProcessoEnfermagem`, `pesquisas_nps`, `rolEnfermagem`, `subconjuntosEnfermagem`, `sugestoes_melhoria`, `tickets_suporte`, `usuarios`. O código também possui escrita na coleção `diagnosticosEnfermagem`; ela não apareceu no inventário atual do Firestore, mas está coberta pelas regras para eventual uso.

## Limitações e decisões

- A autenticação usa os documentos de perfil `usuarios/{uid}` como fonte de autorização. Contas com perfis legados cujo ID de documento não seja o UID precisam de migração administrativa revisada antes de adotar estas regras; as regras não fazem consultas amplas para descobrir esse vínculo.
- O Painel Estatístico executa hoje leituras globais de pacientes e perfis no cliente. A regra permite essa leitura somente quando a página BI foi explicitamente autorizada; o ideal futuro é mover agregações para backend e reduzir exposição de prontuários.
- URLs de download com token do Firebase Storage são URLs portadoras: quem já possui uma URL ativa pode acessá-la sem passar pelas regras do SDK. Não armazenar dados sensíveis nesses arquivos e revisar/rotacionar tokens antigos.
- O validador de conteúdo limita o tamanho do documento e restringe o acesso de escrita a gestores de conteúdo, mas não substitui um schema clínico versionado para cada parâmetro.
- As regras são um protótipo: devem passar por revisão clínica/operacional e pelos testes de emulador antes da publicação.
