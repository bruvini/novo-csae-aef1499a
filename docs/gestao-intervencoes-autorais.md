# Gestão de intervenções autorais

As sugestões novas usam o SHA-256 dos IDs do processo e diagnóstico, resultado, texto e UID do autor como ID idempotente. O processo é concluído antes do envio administrativo; uma falha mantém uma fila local sem dados do paciente para retentativa ao abrir novamente o Processo de Enfermagem no mesmo navegador. Se o armazenamento local for apagado antes da retentativa, a sugestão pode não chegar à fila, embora a intervenção permaneça no processo clínico.

Registros antigos sem diagnóstico de origem continuam na fila. A origem ausente é exibida como indisponível. Nenhum vínculo é inferido. O título do resultado é usado como identidade apenas dentro do documento do diagnóstico e somente quando é único. Alterações no catálogo entre a seleção e a publicação causam falha da transação e exigem nova análise.

A publicação grava em uma transação a sugestão aprovada, a decisão imutável e todos os diagnósticos de destino. O campo `ultimaSugestaoPublicada` liga cada diagnóstico à transação. O gestor declara a referência da homologação; o Portal não comprova independentemente a autenticidade da ata. Como o cliente inicia a transação, um gestor com acesso legítimo ao catálogo continua sendo uma parte confiável do fluxo. As regras impedem publicação por enfermeiros comuns, mas não substituem a governança institucional nem um backend com verificação documental externa.

As sugestões e decisões administrativas não armazenam identificadores de pacientes. Os eventos de auditoria não podem ser alterados ou excluídos pelo cliente. A consulta da fila é restrita a gestores de conteúdo e usa filtros locais. Recomenda-se paginação antes de volumes grandes de sugestões.
