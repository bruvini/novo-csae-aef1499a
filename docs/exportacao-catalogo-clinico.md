# Exportação do catálogo clínico

A Gestão de Conteúdos lê exclusivamente `SinaisVitais`, `ExamesLabImagem`, `RevisaoSistemas`, `subconjuntosEnfermagem` e `rolEnfermagem`. Antes de baixar, compara a contagem de cada coleção com a quantidade lida; erros de permissão, leituras parciais e alterações detectadas interrompem a geração.

O JSON guarda os documentos e seus campos originais, convertendo timestamps para ISO 8601. XLSX e ZIP/CSV contêm 15 tabelas ligadas por IDs. Cada ID de estrutura aninhada é formado por `ID do documento/campo/índice no array`, por exemplo `dg/resultadosEsperados/0/intervencoes/1`. Ele é estável para o mesmo retrato, mas pode mudar se o catálogo for reordenado; não é gravado no Firestore. Campos opcionais adicionais são mantidos nas colunas da entidade e objetos não tabulares são serializados como JSON na célula. Textos iniciados como fórmulas são prefixados com apóstrofo em XLSX e CSV.

As cinco coleções são lidas separadamente. Uma alteração simultânea pode ocorrer sem mudar a contagem e, nesse caso, a exportação não representa um snapshot transacional único. As horas de início e fim são incluídas no JSON e exibidas no modal. O acesso à página é protegido pela permissão `GestaoConteudos` já existente.
