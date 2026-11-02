# Registro de acessos: implantação pendente

Novos logins escrevem `eventosAcesso/{uid}_{numero}` junto ao incremento de `usuarios.totalAcessos` em uma transação. O evento contém somente UID, número sequencial e timestamp do servidor. A chave sequencial evita reutilizar um evento e a regra exige o incremento na mesma operação. Como o cliente inicia a gravação, um usuário autenticado ainda pode simular logins; comprovação de autenticação exige backend confiável.

O marco de transição é a publicação do novo cliente: ele deixa de acrescentar ao array legado. Clientes antigos continuam usando o array, portanto ambos os conjuntos podem ser somados sem duplicar o mesmo registro. Falhas anteriores e o intervalo após o limite de 200 não são reconstruídos. Clientes antigos e dados já inconsistentes exigem acompanhamento. O histórico anterior não é alterado. O indicador não é prova de uso completo da plataforma.

A versão 6 do cache força recálculo e o XLSX usa a mesma série da tela. O recálculo atualmente lê a coleção inteira de eventos: o custo cresce com o volume; antes da produção é necessário definir retenção e uma estratégia de agregação incremental. As regras preparadas devem ser testadas no Emulator e revisadas antes de qualquer publicação; o frontend requer essas regras e não deve ser publicado primeiro. Testar migração, concorrência, autenticação e NPS com contas fictícias em ambiente isolado. Ao publicar, aguardar expiração de clientes e acompanhar registros com falha.

A função `publicarChangelogPorId` aceita um ID estável, grava `dataHora` com timestamp do servidor em transação e não substitui documentos existentes. Deve ser executada somente após a validação funcional da respectiva entrega; não foi executada nesta alteração.
