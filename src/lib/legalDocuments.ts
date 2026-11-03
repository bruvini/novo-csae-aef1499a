/**
 * Minutas para revisão jurídica e institucional.
 * Não declaram consentimento LGPD nem substituem o Termo de Responsabilidade
 * já aceito no fluxo de cadastro. Não publicar sem validar as pendências.
 */
export type LegalDocumentKind = "terms" | "privacy";

export interface LegalSection {
  title: string;
  paragraphs: string[];
}

export interface LegalDocument {
  title: string;
  version: string;
  updatedAt: string;
  status: string;
  introduction: string;
  sections: LegalSection[];
}

export const LEGAL_DOCUMENTS: Record<LegalDocumentKind, LegalDocument> = {
  terms: {
    title: "Termos de Uso",
    version: "0.1 — minuta",
    updatedAt: "03/11/2026",
    status: "Minuta para validação institucional e jurídica; ainda não constitui documento vigente.",
    introduction: "O Portal CSAE Floripa 2.0 apoia a organização e a documentação do Processo de Enfermagem. Estas condições descrevem o uso previsto da plataforma e precisam de aprovação pela gestão responsável antes de sua publicação definitiva.",
    sections: [
      {
        title: "1. Finalidade e público autorizado",
        paragraphs: [
          "O portal destina-se, nesta implantação, a usuários com vínculo e finalidade de acesso aprovados pela equipe gestora. Solicitar cadastro não garante autorização; a manutenção do acesso depende da elegibilidade e das atribuições profissionais.",
          "O uso fora da finalidade institucional, inclusive a eventual abertura a estudantes, profissionais externos ou outras redes de saúde, depende de definição e autorização específicas."
        ]
      },
      {
        title: "2. Responsabilidade profissional e documentação clínica",
        paragraphs: [
          "A ferramenta oferece recursos para avaliação, diagnóstico, planejamento, implementação e evolução de enfermagem, conforme a Resolução Cofen nº 736/2024. O conteúdo apresentado não substitui a avaliação individualizada, o julgamento clínico, os protocolos aplicáveis nem as responsabilidades legais do profissional.",
          "A ferramenta gera uma evolução para cópia à área de transferência e inserção manual no prontuário institucional. O usuário deve revisar integralmente o texto e confirmar seu registro no sistema oficial. O Portal CSAE não substitui o prontuário adotado pela Secretaria Municipal de Saúde nem envia automaticamente a evolução ao prontuário."
        ]
      },
      {
        title: "3. Credenciais e proteção dos pacientes",
        paragraphs: [
          "O acesso é pessoal. O usuário deve manter suas credenciais sob sigilo, não compartilhar a conta, comunicar suspeitas de acesso indevido e utilizar somente informações necessárias à assistência ou à finalidade expressamente autorizada.",
          "É vedada a divulgação não autorizada de informações identificáveis de pacientes, inclusive por capturas de tela, vídeos, mensagens, exportações ou demonstrações públicas."
        ]
      },
      {
        title: "4. Conteúdo institucional e contribuições",
        paragraphs: [
          "Protocolos, classificações, textos, materiais de apoio e componentes do portal podem estar sujeitos a direitos autorais e a condições de uso próprias de seus titulares. O acesso à plataforma não concede licença para reproduzir ou distribuir materiais protegidos fora da finalidade autorizada.",
          "Sugestões de intervenções e outros conteúdos enviados por usuários estão sujeitos à análise da equipe competente. As condições de autoria, revisão e incorporação dessas contribuições precisam ser formalizadas antes da publicação definitiva destes termos."
        ]
      },
      {
        title: "5. Disponibilidade, suspensão e atualizações",
        paragraphs: [
          "O acesso pode ser revisto em razão de mudança do vínculo, descumprimento de regras, necessidade de segurança ou decisão administrativa fundamentada. Manutenções e alterações tecnológicas podem afetar temporariamente a disponibilidade.",
          "Alterações materiais destes termos devem ser comunicadas aos usuários por meio apropriado. Novos aceites, quando necessários, exigirão fluxo próprio e registro da versão correspondente."
        ]
      },
      {
        title: "6. Relação com o termo de sigilo e a privacidade",
        paragraphs: [
          "Estes Termos de Uso não substituem o Termo de Responsabilidade e Sigilo atualmente apresentado durante o cadastro. O tratamento de dados pessoais é descrito separadamente na Política de Privacidade, que deve ser disponibilizada de forma acessível.",
          "Dúvidas sobre suporte clínico podem ser dirigidas ao contato institucional divulgado no rodapé; solicitações relativas a proteção de dados deverão utilizar o canal oficial a ser confirmado pela instituição responsável."
        ]
      }
    ]
  },
  privacy: {
    title: "Política de Privacidade",
    version: "0.1 — minuta",
    updatedAt: "03/11/2026",
    status: "Minuta para validação do controlador, do encarregado e dos fluxos de tratamento; ainda não constitui documento vigente.",
    introduction: "Esta minuta descreve os tratamentos identificados no código do Portal CSAE Floripa 2.0. As bases legais, os prazos de retenção, os responsáveis e os destinatários precisam ser confirmados antes da publicação oficial.",
    sections: [
      {
        title: "1. Quem responde pelo tratamento",
        paragraphs: [
          "A responsável técnico-assistencial indicada pela equipe é Elizimara Ferreira Siqueira, Enfermeira Responsável Técnica da Secretaria Municipal de Saúde de Florianópolis e coordenadora da Comissão Permanente de Sistematização da Assistência de Enfermagem. Essa função não equivale automaticamente à condição de controladora de dados na LGPD. A identificação formal do controlador institucional, de eventuais operadores, do encarregado e do canal oficial para exercício de direitos está pendente de validação pela instituição e deve constar expressamente na versão aprovada."
        ]
      },
      {
        title: "2. Informações coletadas",
        paragraphs: [
          "O cadastro solicita identificação e contato, incluindo nome, CPF, RG, endereço e e-mail, além de informações profissionais, vínculo institucional, formação, registro no COREN e dados da residência quando aplicável. A autenticação é realizada com Firebase Authentication.",
          "O cadastro do paciente solicita nome completo, data de nascimento e sexo; não solicita CPF, CNS nem número do prontuário nesse formulário. A aplicação armazena também as informações clínicas e assistenciais registradas nas etapas do Processo de Enfermagem, que podem conter outros dados identificáveis inseridos livremente pelo profissional. Dados de saúde são dados pessoais sensíveis.",
          "Também são tratados registros de acesso e autorizações, solicitações de suporte, sugestões de melhoria ou intervenções, respostas de avaliações de uso e informações técnicas de funcionamento. A aplicação inicializa Firebase Analytics; é necessário auditar seus eventos e configurações antes de descrever integralmente o monitoramento."
        ]
      },
      {
        title: "3. Para que os dados são utilizados",
        paragraphs: [
          "Os dados cadastrais e profissionais apoiam a verificação de elegibilidade, a autorização de acesso e a administração da conta. Os dados clínicos são utilizados para elaborar o Processo de Enfermagem e gerar um texto que o profissional revisa e copia manualmente ao prontuário institucional; os registros também permanecem associados à sua conta para consulta e continuidade na plataforma.",
          "Registros de utilização e suporte podem apoiar segurança, auditoria, atendimento às solicitações, manutenção, melhoria da ferramenta e indicadores internos, observados os limites de acesso e as finalidades institucionais."
        ]
      },
      {
        title: "4. Bases legais e dados sensíveis",
        paragraphs: [
          "As hipóteses legais da LGPD devem ser definidas por finalidade e por categoria de dado pela instituição responsável. Aceitar os Termos de Uso não equivale a consentimento genérico para qualquer tratamento de dados de saúde.",
          "Qualquer uso de informações identificáveis para pesquisa, demonstração, treinamento ou divulgação exige avaliação própria de finalidade, necessidade, base legal e salvaguardas."
        ]
      },
      {
        title: "5. Infraestrutura, acesso e compartilhamentos",
        paragraphs: [
          "O código utiliza serviços Google Firebase, incluindo Authentication, Cloud Firestore, Storage, Hosting e Analytics. É necessário confirmar a região de armazenamento, os contratos aplicáveis, as transferências internacionais e os demais destinatários efetivos antes da versão final.",
          "Na interface, os registros assistenciais ficam associados ao enfermeiro que cadastrou o paciente; os administradores consultam dados de cadastro e autorização dos profissionais. A ausência de pesquisa administrativa de pacientes na interface não impede, por si só, acesso técnico de pessoas autorizadas ao console do Firebase. O código também prevê leitura ampliada para rotinas de BI autorizadas. Regras e permissões não representam garantia absoluta e precisam de auditoria institucional."
        ]
      },
      {
        title: "6. Retenção, exclusão e direitos dos titulares",
        paragraphs: [
          "No cadastro, o portal registra o aceite do Termo de Responsabilidade e Sigilo e a data, mas não armazena uma cópia do PDF gerado para o usuário. Os prazos de conservação e as regras de eliminação ou anonimização de cadastros, registros assistenciais, auditoria, PDFs e backups ainda precisam ser definidos conforme as obrigações legais e administrativas aplicáveis.",
          "Os titulares poderão exercer os direitos previstos na LGPD por canal oficial que deverá constar na versão aprovada. Solicitações de eliminação serão avaliadas considerando as hipóteses de conservação legalmente permitidas."
        ]
      },
      {
        title: "7. Segurança, incidentes e atualizações",
        paragraphs: [
          "O uso de credenciais pessoais, perfis de acesso e regras do banco de dados integra as medidas de proteção identificadas. A instituição deverá validar também seus procedimentos de resposta a incidentes, atendimento aos titulares, revisão de permissões e gestão de fornecedores.",
          "Esta minuta não é uma declaração de conformidade ou auditoria concluída. A data, a versão vigente e eventuais mudanças relevantes serão informadas no documento após sua aprovação."
        ]
      }
    ]
  }
};
