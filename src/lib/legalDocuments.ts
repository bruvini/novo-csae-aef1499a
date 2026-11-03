/**
 * Minutas editoriais iniciais. Criar rascunho pelo painel NÃO publica os textos.
 * Identificar controlador, canal oficial e regras de retenção antes da 1ª publicação.
 */
export type LegalDocumentKind = "terms" | "privacy";

export interface LegalSection { title: string; paragraphs: string[]; }
export interface LegalDocument {
  title: string; version: string; updatedAt: string; status: string;
  introduction: string; sections: LegalSection[];
}

export const LEGAL_DOCUMENTS: Record<LegalDocumentKind, LegalDocument> = {
  "terms": {
    "title": "Termos de Uso",
    "version": "0.2 — minuta",
    "updatedAt": "03/11/2026",
    "status": "Minuta para validação da equipe do Portal CSAE; não é uma versão publicada.",
    "introduction": "Bem-vindo ao Portal CSAE Floripa 2.0. Estes Termos de Uso orientam o acesso e a utilização da plataforma de apoio ao Processo de Enfermagem, desenvolvida para apoiar as atividades autorizadas na rede municipal de saúde de Florianópolis. Ao utilizar a ferramenta, o profissional deve observar as regras institucionais, o sigilo profissional e a legislação aplicável. O documento deve ser revisado pela equipe responsável antes de sua primeira publicação.",
    "sections": [
      {
        "title": "1. Finalidade da plataforma",
        "paragraphs": [
          "O Portal CSAE oferece recursos digitais de apoio à organização das etapas do Processo de Enfermagem, incluindo avaliação, diagnóstico, planejamento, implementação e evolução, de acordo com as funcionalidades disponíveis em cada versão.",
          "A ferramenta é um recurso de apoio ao trabalho profissional. Não substitui a avaliação clínica individualizada, o julgamento clínico, os protocolos aplicáveis, a supervisão necessária nem o prontuário eletrônico oficial utilizado pela instituição."
        ]
      },
      {
        "title": "2. Acesso e elegibilidade",
        "paragraphs": [
          "O acesso depende de cadastro individual, verificação dos dados e aprovação pela equipe gestora. A disponibilização de uma conta não garante acesso permanente: a autorização pode ser revista em caso de alteração do vínculo, perda de elegibilidade ou necessidade de segurança.",
          "O uso é restrito aos perfis e finalidades autorizados. Contas de estudantes, residentes e profissionais com diferentes permissões devem seguir as limitações correspondentes às suas atribuições."
        ]
      },
      {
        "title": "3. Responsabilidades dos usuários",
        "paragraphs": [
          "Cada usuário é responsável pela correção e adequação das informações inseridas, pela guarda de suas credenciais e pelo uso da plataforma somente para atividades autorizadas. É proibido compartilhar senhas, acessar registros sem justificativa assistencial ou divulgar dados de pacientes a pessoas não autorizadas.",
          "Antes de utilizar a evolução gerada, o profissional deve revisar seu conteúdo, confirmar sua compatibilidade com a assistência efetivamente prestada e copiar o texto para o prontuário institucional conforme o fluxo de registro vigente."
        ]
      },
      {
        "title": "4. Proteção de dados e sigilo",
        "paragraphs": [
          "O uso de informações de pacientes exige observância do sigilo profissional, das normas institucionais e da Lei Geral de Proteção de Dados Pessoais (LGPD). Não é permitido utilizar dados reais para demonstrações públicas, apresentações, publicações ou testes não autorizados.",
          "O Termo de Responsabilidade e Sigilo apresentado no cadastro permanece independente destes Termos de Uso. O tratamento de dados pessoais pela plataforma é descrito na Política de Privacidade."
        ]
      },
      {
        "title": "5. Conteúdo clínico e propriedade intelectual",
        "paragraphs": [
          "Textos, classificações, protocolos, imagens e componentes tecnológicos disponibilizados podem possuir titulares e condições próprias de utilização. O acesso ao portal não autoriza a extração, reprodução integral, distribuição ou exploração de conteúdos protegidos fora das finalidades permitidas.",
          "Os usuários podem encaminhar sugestões e intervenções autorais pelos canais previstos. A análise e eventual incorporação ao catálogo dependem de avaliação da equipe responsável e das condições específicas de contribuição aplicáveis, sem presumir cessão automática de direitos autorais."
        ]
      },
      {
        "title": "6. Atualizações e disponibilidade",
        "paragraphs": [
          "A equipe responsável poderá realizar manutenções, correções e melhorias, que podem ocasionar indisponibilidades temporárias. Sempre que possível, alterações relevantes serão comunicadas pelos canais da plataforma.",
          "Acesso e funcionalidades poderão ser suspensos em situações justificadas de segurança, uso indevido ou decisão administrativa relacionada à finalidade institucional, respeitadas as obrigações aplicáveis aos registros assistenciais."
        ]
      },
      {
        "title": "7. Dúvidas e versões do documento",
        "paragraphs": [
          "As dúvidas sobre o uso da ferramenta podem ser encaminhadas pelos canais de suporte divulgados no portal. Questões sobre dados pessoais devem seguir o canal oficial indicado na Política de Privacidade.",
          "Novas versões destes termos terão identificação e data de publicação. Alterações substanciais poderão exigir comunicação e confirmação específica dos usuários, quando cabível."
        ]
      }
    ]
  },
  "privacy": {
    "title": "Política de Privacidade",
    "version": "0.2 — minuta",
    "updatedAt": "03/11/2026",
    "status": "Minuta para validação institucional e jurídica; não é uma versão publicada.",
    "introduction": "Esta Política de Privacidade apresenta, em linguagem acessível, como o Portal CSAE Floripa 2.0 trata informações pessoais de profissionais e pacientes. A plataforma é utilizada como apoio à documentação do Processo de Enfermagem e à gestão de acessos. A versão oficial somente deverá ser publicada após a identificação dos responsáveis e a confirmação das condições de tratamento indicadas abaixo.",
    "sections": [
      {
        "title": "1. Responsáveis e contato",
        "paragraphs": [
          "A coordenação técnico-assistencial do portal é exercida pela equipe vinculada à Comissão Permanente de Sistematização da Assistência de Enfermagem da Secretaria Municipal de Saúde de Florianópolis, com referência à Enfermeira Responsável Técnica Elizimara Ferreira Siqueira. A função de responsável técnica não equivale, por si só, à condição jurídica de controlador da LGPD.",
          "[PREENCHER: identificação formal do controlador dos dados pessoais, do encarregado e do canal institucional para solicitações relacionadas à privacidade.]"
        ]
      },
      {
        "title": "2. Quais dados são tratados",
        "paragraphs": [
          "Para identificação e autorização de acesso, são cadastrados dados como nome, CPF, RG, endereço, e-mail e informações profissionais, incluindo formação, COREN, vínculo, lotação e dados da residência quando aplicável. A autenticação utiliza recursos do Firebase Authentication.",
          "Na criação de um paciente, a plataforma solicita nome completo, data de nascimento e sexo. As informações clínicas e os registros inseridos durante o Processo de Enfermagem também são armazenados e podem conter outros dados pessoais sensíveis descritos livremente pelo profissional.",
          "O sistema também pode tratar registros de acesso, aprovações de usuários, chamados de suporte, avaliações da ferramenta, sugestões e métricas técnicas de utilização. A aplicação inclui Firebase Analytics e demais serviços que precisam ser inventariados na configuração institucional."
        ]
      },
      {
        "title": "3. Finalidades do tratamento",
        "paragraphs": [
          "As informações cadastrais e profissionais permitem verificar a elegibilidade, autenticar usuários, administrar permissões e oferecer suporte. Os dados clínicos são utilizados para registrar as etapas do Processo de Enfermagem, consultar atendimentos anteriores e gerar uma evolução que o profissional revisa e copia manualmente para o prontuário institucional.",
          "Informações operacionais e agregadas podem ser utilizadas para segurança, auditoria, manutenção, avaliação de uso e melhoria do portal, respeitando as permissões e as finalidades autorizadas."
        ]
      },
      {
        "title": "4. Bases legais e proteção especial aos dados de saúde",
        "paragraphs": [
          "O tratamento deverá observar hipóteses legais adequadas a cada finalidade, conforme os artigos 7º, 11 e 23 da LGPD e os instrumentos institucionais aplicáveis. Dados relacionados à saúde recebem proteção específica por sua natureza sensível.",
          "O aceite de Termos de Uso ou do Termo de Responsabilidade não equivale a consentimento genérico ou irrestrito do paciente para todas as formas de tratamento. Dados reais não devem ser reutilizados para publicidade, testes, demonstrações ou pesquisa sem fundamento legal e autorizações apropriadas."
        ]
      },
      {
        "title": "5. Acesso, fornecedores e compartilhamento",
        "paragraphs": [
          "A plataforma utiliza serviços do Google Firebase, incluindo autenticação, banco de dados Firestore, armazenamento, Hosting e componentes de análise. Registros assistenciais são associados à conta do profissional que os cadastrou. As permissões podem prever acessos técnicos ou administrativos específicos e relatórios agregados de gestão.",
          "A ausência de uma função de busca administrativa de pacientes na interface não impede necessariamente acessos técnicos realizados por pessoas com autorização ao ambiente de infraestrutura. Qualquer compartilhamento deverá observar as finalidades, as competências e as regras de segurança aplicáveis.",
          "[PREENCHER: regiões de armazenamento, eventuais transferências internacionais, fornecedores e categorias de destinatários autorizados.]"
        ]
      },
      {
        "title": "6. Conservação e eliminação dos dados",
        "paragraphs": [
          "O portal mantém dados de cadastro e registros clínicos durante os períodos necessários às finalidades autorizadas e às obrigações legais e administrativas aplicáveis. A saída ou o descredenciamento de um usuário não implica necessariamente a eliminação imediata dos registros assistenciais.",
          "O Termo de Responsabilidade e Sigilo é gerado em PDF para o usuário no cadastro; a plataforma mantém o registro estruturado do aceite e da data, mas não armazena uma cópia desse PDF como arquivo institucional.",
          "[PREENCHER: prazos e critérios de conservação, exportação, eliminação e gestão de cópias de segurança para cada categoria de dado.]"
        ]
      },
      {
        "title": "7. Direitos dos titulares",
        "paragraphs": [
          "Os titulares podem solicitar informações sobre o tratamento de seus dados e exercer os direitos previstos na LGPD, observadas as limitações legais pertinentes aos registros assistenciais, à atuação do poder público e à preservação de direitos de terceiros.",
          "As solicitações deverão ser encaminhadas ao canal oficial do controlador informado nesta política. Pedidos de correção, acesso ou eliminação serão analisados conforme a legislação e os procedimentos institucionais."
        ]
      },
      {
        "title": "8. Segurança e atualizações",
        "paragraphs": [
          "A plataforma adota autenticação individual e controles de permissão nas regras do banco de dados. Nenhuma medida técnica elimina completamente os riscos, e incidentes devem ser tratados pelos responsáveis segundo os procedimentos de segurança e comunicação aplicáveis.",
          "Alterações relevantes nesta política serão identificadas por número de versão e data de publicação. As versões anteriores poderão ser mantidas para fins de rastreabilidade institucional."
        ]
      }
    ]
  }
};
