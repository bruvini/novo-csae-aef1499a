# Termos de Uso e Política de Privacidade — pendências de validação

Minuta técnica de 03/11/2026. **Não publicar como documento vigente sem revisão institucional e jurídica**.

## Evidências observadas no código
- Cadastro: nome, RG, CPF, endereço, e-mail, formação e informações profissionais; termo de responsabilidade personalizado com PDF.
- Aceite atual: `termoResponsabilidadeAceito: true` e `termoResponsabilidadeData` no perfil `usuarios/{uid}`. Não há campo de versão.
- `firestore.rules` usa allowlists estritas na criação e na atualização de `usuarios/{uid}`: adicionar campos para versionamento sem ajustar/testar as regras causa `permission-denied`.
- Dados de pacientes e Processos de Enfermagem em `pacientesProcessoEnfermagem`; dados sensíveis de saúde.
- Firebase Authentication, Firestore, Storage, Hosting e Analytics no código; a presença do SDK não comprova configurações de coleta, localização de dados ou contratos.
- Regras de acesso por perfil; relatório interno de segurança reconhece leitura global de dados de pacientes por perfil habilitado ao BI.

## Perguntas necessárias para aprovar o conteúdo
1. Quem é formalmente o **controlador** dos dados: Secretaria Municipal de Saúde de Florianópolis, outra entidade ou responsabilidade conjunta? Quem responde pela decisão das finalidades?
2. Qual é o **contato oficial do encarregado LGPD** e o canal para solicitações dos titulares e incidentes? Os e-mails de suporte no rodapé são canais institucionais reconhecidos para esses pedidos?
3. O portal guarda **dados reais de pacientes** em produção? Seu registro é complementar, oficial, experimental ou educativo? Os pacientes recebem informação sobre esse tratamento por qual canal?
4. Quais serviços Google/Firebase estão habilitados, qual a **região do Firestore e Storage**, quais eventos do Analytics são coletados e quais fornecedores têm acesso?
5. Quais são os **prazos de retenção, exclusão, backups e exportação** para cadastros, dados clínicos, logs, suporte e sugestões, inclusive após descredenciamento de residentes?
6. Quem detém os direitos/licenças sobre os **catálogos clínicos, materiais de apoio e intervenções autorais**? Qual autorização de uso e reprodução é concedida?
7. O cadastro está reservado a preceptores e residentes autorizados ou existem outros perfis aprovados (técnicos, estudantes, gestores)? Como tratar o cadastro de pessoas inelegíveis?
8. Quais **bases legais por finalidade** foram definidas pela área responsável? Existe instrumento de formalização entre instituição, desenvolvedor e operadores?
9. A instituição aprovou a linguagem do Termo de Responsabilidade atual, que declara monitoramento pela auditoria da SMS e uso de prontuários eletrônicos? O documento personalizado precisa ser atualizado?
10. Quando aprovada a versão 1.0, haverá **novo aceite obrigatório para usuários antigos**, ou apenas ciência? Como será feita a comunicação?

## Próxima etapa técnica após aprovação jurídica
- Consolidar documento final e seus dados de publicação, não exibir a faixa de minuta.
- Versionar formalmente termos, política e termo de responsabilidade, sem inferir aceite retroativo.
- Criar campos e histórico de aceite com regras Firestore restritivas, validações de emulador e trilha de auditoria imutável ou serviço seguro no backend.
- Registrar comunicação das alterações e, conforme `GOVERNANCE.md`, changelog no Firestore na publicação real.
- Validar acessibilidade, legibilidade no celular, testes e revisão jurídica antes do deploy de produção.

## Decisões de implementação (03/11/2026)
- Responsável institucional indicado pela equipe: Elizimara Ferreira Siqueira, enfermeira responsável técnica na SMS Florianópolis e coordenadora da CSAE. **Não** confundir essa função com a qualificação formal de controlador LGPD, a confirmar pela instituição.
- O portal armazena nome, data de nascimento, sexo e histórico clínico do paciente no Firestore, por conta do profissional. Gera texto para **cópia e colagem** no prontuário utilizado na SMS; não é apresentado como prontuário oficial substitutivo.
- O PDF do termo de responsabilidade do cadastro é disponibilizado ao usuário; o portal guarda apenas o registro estruturado de aceite e data, sem cópia do PDF no servidor.
- Os documentos legais passam a usar `documentosLegais/{terms|privacy}` e snapshots imutáveis `revisoes/*`: criar rascunho sempre duplica a última versão publicada, cada salvamento gera revisão e publicação aponta a versão vigente.
- Os textos iniciais não são publicados automaticamente; os trechos pendentes bloqueiam a publicação, que exige confirmação expressa do administrador de revisão pela equipe do portal.
- É necessário validar canal do encarregado, retenção, bases legais e localização/contratos Firebase antes da primeira publicação. Também revisar necessidade de uma ciência/versionamento de aceite dos usuários após aprovação.
