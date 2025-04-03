
import { collection, getDocs, addDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

interface NHB {
  id?: string;
  nome: string;
  descricao?: string;
}

// Função para inicializar a coleção de NHBs se ela não existir
export const inicializarNHBs = async () => {
  try {
    // Verificar se já existem NHBs cadastradas
    const nhbsRef = collection(db, 'nhbs');
    const snapshot = await getDocs(nhbsRef);
    
    if (snapshot.empty) {
      // Lista inicial de NHBs
      const nhbsIniciais: NHB[] = [
        { nome: "Oxigenação", descricao: "Necessidade de o organismo obter o oxigênio através da ventilação, da difusão do oxigênio e dióxido de carbono entre os alvéolos e o sangue, do transporte do oxigênio para os tecidos periféricos e da remoção do dióxido de carbono." },
        { nome: "Hidratação", descricao: "Necessidade de manter em nível ótimo os líquidos corporais, compostos por água e substâncias nela dissolvidas, com o objetivo de favorecer o metabolismo corporal." },
        { nome: "Nutrição", descricao: "Necessidade de obter os nutrientes necessários com o objetivo de nutrir o corpo e manter a vida." },
        { nome: "Eliminação", descricao: "Necessidade de eliminação de substâncias indesejáveis ou presentes em quantidades excessivas com o objetivo de manter a homeostase corporal." },
        { nome: "Sono e Repouso", descricao: "Necessidade de manter, durante um certo período do dia, a suspensão natural, periódica e relativa da consciência; corpo e mente em estado de imobilidade parcial ou completa e as funções corporais parcialmente diminuídas com o objetivo de obter restauração." },
        { nome: "Atividade Física", descricao: "Necessidade de mover-se intencionalmente, sob determinadas circunstâncias, através do uso da capacidade de controle e relaxamento dos grupos musculares com o objetivo de evitar lesões tissulares, exercitar-se, trabalhar, satisfazer outras necessidades, realizar desejos, sentir-se bem etc." },
        { nome: "Sexualidade", descricao: "Necessidade de integrar aspectos somáticos, emocionais, intelectuais e sociais do ser humano com o objetivo de obter prazer e consumar o relacionamento sexual com um parceiro ou parceira e procriar." },
        { nome: "Segurança Física / Meio Ambiente", descricao: "Necessidade de manter um meio ambiente seguro e prevenir riscos à integridade física." },
        { nome: "Cuidado Corporal", descricao: "Necessidade de cuidados com o corpo com o objetivo de preservar, melhorar ou recuperar a higiene e a aparência." },
        { nome: "Integridade Física", descricao: "Necessidade de manter as características orgânicas de elasticidade, sensibilidade, vascularização, umidade, coloração, continuidade e consistência de pele, mucosa e tecido subcutâneo." },
        { nome: "Regulação Vascular", descricao: "Necessidade de transportar e distribuir nutrientes vitais através do sangue para os tecidos e de remover substâncias desnecessárias com o objetivo de manter a homeostase dos líquidos corporais e a sobrevivência do organismo." },
        { nome: "Regulação Térmica", descricao: "Necessidade de manter a temperatura central (temperatura interna) entre 36°C e 37,3°C com o objetivo de obter um equilíbrio da temperatura corporal." },
        { nome: "Regulação Neurológica", descricao: "Necessidade de preservar e/ou restabelecer o funcionamento do sistema nervoso com o objetivo de controlar e coordenar as funções e atividades do corpo e alguns aspectos do comportamento." },
        { nome: "Regulação Hormonal", descricao: "Necessidade de preservar e/ou restabelecer a liberação e ação das substâncias ou fatores que ajudam a regular as funções corporais com o objetivo de coordenar e integrar essas funções." },
        { nome: "Sensopercepção", descricao: "Necessidade de perceber e interpretar os estímulos sensoriais com o objetivo de integrar e interagir com o meio ambiente." },
        { nome: "Terapêutica", descricao: "Necessidade de buscar auxílio profissional para promover, manter e recuperar a saúde." },
        { nome: "Comunicação", descricao: "Necessidade de enviar e receber mensagens utilizando linguagem verbal (palavra falada ou escrita) e não-verbal (símbolos, sinais, gestos, expressões faciais) com o objetivo de interagir com os outros." },
        { nome: "Gregária", descricao: "Necessidade de viver em grupo com o objetivo de interagir com os outros e realizar trocas sociais." },
        { nome: "Recreação e Lazer", descricao: "Necessidade de utilizar a criatividade para produzir e reproduzir ideias e coisas com o objetivo de entreter-se, distrair-se e divertir-se." },
        { nome: "Segurança Emocional", descricao: "Necessidade de confiar nos sentimentos e emoções dos outros em relação a si com o objetivo de sentir-se seguro emocionalmente." },
        { nome: "Amor e Aceitação", descricao: "Necessidade de ter sentimentos e emoções em relação às pessoas em geral com o objetivo de ser aceito e integrado aos grupos, de ter amigos e família." },
        { nome: "Autoestima, Autoconfiança, Autorrespeito", descricao: "Necessidade de sentir-se adequado para enfrentar os desafios da vida, de ter confiança em suas próprias ideias, de ter respeito por si próprio, de se valorizar, de se reconhecer merecedor de amor e felicidade, de não ter medo de expor suas ideias, desejos e necessidades com o objetivo de obter controle sobre a própria vida, de sentir bem-estar psicológico e de perceber-se como o centro vital da própria existência." },
        { nome: "Liberdade e Participação", descricao: "Necessidade que cada um tem de agir conforme a sua própria determinação dentro de uma sociedade organizada, respeitando os limites impostos por normas definidas (sociais, culturais, legais)." },
        { nome: "Educação para a Saúde/Aprendizagem", descricao: "Necessidade de adquirir conhecimento e/ou habilidade para responder a uma situação nova ou já conhecida com o objetivo de adquirir comportamentos saudáveis e manter a saúde." },
        { nome: "Autorrealização", descricao: "Necessidade de realizar o máximo com suas capacidades físicas, mentais, emocionais e sociais com o objetivo de ser o tipo de pessoa que deseja ser." },
        { nome: "Espaço", descricao: "Necessidade de delimitar-se no ambiente físico, ou seja, expandir-se ou retrair-se com o objetivo de preservar a individualidade e a privacidade." },
        { nome: "Religiosidade/Espiritualidade", descricao: "Necessidade inerente aos seres humanos e está vinculada àqueles fatores necessários para o estabelecimento e/ou manutenção do relacionamento de uma pessoa com Deus (ou outro poder superior) (Wanda Horta)." },
      ];
      
      // Adicionar NHBs ao Firestore
      for (const nhb of nhbsIniciais) {
        await addDoc(collection(db, 'nhbs'), nhb);
      }
      
      return true; // NHBs inicializadas com sucesso
    }
    
    return false; // Não foi necessário inicializar, já existem dados
  } catch (error) {
    console.error("Erro ao inicializar NHBs:", error);
    return false;
  }
};

// Função para criar outras coleções necessárias
export const criarColecoesSeNecessario = async () => {
  const colecoes = [
    'sinaisVitais',
    'examesLaboratoriais',
    'sistemasRevisao',
    'parametrosSistemas',
    'subconjuntosDiagnosticos',
    'diagnosticosEnfermagem'
  ];
  
  try {
    for (const colecaoNome of colecoes) {
      // Verificar se já existe pelo menos um documento na coleção
      const colecaoRef = collection(db, colecaoNome);
      const snapshot = await getDocs(colecaoRef);
      
      if (snapshot.empty) {
        // Criar um documento vazio para garantir que a coleção exista
        const docRef = doc(collection(db, colecaoNome), 'estrutura');
        const docSnapshot = await getDoc(docRef);
        
        if (!docSnapshot.exists()) {
          await setDoc(docRef, {
            info: 'Documento de estrutura para inicialização da coleção',
            createdAt: new Date()
          });
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao criar coleções:", error);
    return false;
  }
};

// Função principal para inicializar todas as coleções
export const inicializarTodasColecoes = async () => {
  await inicializarNHBs();
  await criarColecoesSeNecessario();
};
