
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, CheckCircle, UserPlus, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAutenticacao } from "@/services/autenticacao";
import { verificarUsuarioExistente, cadastrarUsuario } from "@/services/bancodados";

const estadosBrasileiros = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const lotacoesSMS = [
  'Abraão', 'Agronômica', 'Alto Ribeirão', 'Armação', 'Balneário', 'Barra da Lagoa', 
  'Cachoeira do Bom Jesus', 'Caieira da Barra do Sul', 'Campeche', 'Canasvieiras',
  'Canto da Lagoa', 'Capivari', 'CAPS - Pontal do Coral', 'CAPSAD - Continente',
  'CAPSAD - Ilha', 'CAPSI - Infantil', 'Capoeiras', 'Carianos', 'Centro', 'Coloninha',
  'Coqueiros', 'Córrego Grande', 'Costa da Lagoa', 'Costeira do Pirajubaé', 'Estreito',
  'Fazenda do Rio Tavares', 'Ingleses', 'Itacorubi', 'Jardim Atlântico', 'João Paulo',
  'Jurerê', 'Lagoa da Conceição', 'Monte Cristo', 'Monte Serrat', 'Morro das Pedras',
  'Novo Continente', 'Pantanal', 'Pântano do Sul', 'Policlínica Centro', 'Policlínica Continente',
  'Policlínica Norte', 'Policlínica Sul', 'Ponta das Canas', 'Prainha', 'Ratones',
  'Ribeirão da Ilha', 'Rio Tavares', 'Rio Vemelho', 'Saco dos Limões', 'Saco Grande',
  'Santinho', 'Santo Antônio de Lisboa', 'Sapé', 'Tapera', 'Trindade', 'Upa Continente',
  'Upa Norte', 'Upa Sul', 'Vargem Grande', 'Vargem Pequena', 'Vila Aparecida'
];

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { registrar } = useAutenticacao();
  
  // Estado para campos com erro
  const [camposComErro, setCamposComErro] = useState<Set<string>>(new Set());
  const [carregando, setCarregando] = useState(false);
  
  // Dados Pessoais
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [rg, setRg] = useState('');
  const [cpf, setCpf] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [cep, setCep] = useState('');
  
  // Dados Profissionais
  const [formacao, setFormacao] = useState('');
  const [numeroCoren, setNumeroCoren] = useState('');
  const [ufCoren, setUfCoren] = useState('');
  const [dataInicioResidencia, setDataInicioResidencia] = useState('');
  const [iesEnfermagem, setIesEnfermagem] = useState('');
  const [atuaSMS, setAtuaSMS] = useState(false);
  const [lotacao, setLotacao] = useState('');
  const [matricula, setMatricula] = useState('');
  const [cidadeTrabalho, setCidadeTrabalho] = useState('');
  const [localCargo, setLocalCargo] = useState('');
  
  // Dados de Acesso
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  
  // Reset campos condicionais ao mudar formação
  useEffect(() => {
    if (formacao !== 'Enfermeiro' && formacao !== 'Residente de Enfermagem' && formacao !== 'Técnico de Enfermagem') {
      setNumeroCoren('');
      setUfCoren('');
    }
    
    if (formacao !== 'Residente de Enfermagem') {
      setDataInicioResidencia('');
    }
    
    if (formacao !== 'Acadêmico de Enfermagem') {
      setIesEnfermagem('');
    }
  }, [formacao]);
  
  // Reset campos condicionais ao mudar se atua na SMS
  useEffect(() => {
    if (atuaSMS) {
      setCidadeTrabalho('');
      setLocalCargo('');
    } else {
      setLotacao('');
      setMatricula('');
    }
  }, [atuaSMS]);
  
  const validarFormulario = () => {
    const novosErros = new Set<string>();
    
    // Validar campos obrigatórios dos dados pessoais
    if (!nomeCompleto) novosErros.add('nomeCompleto');
    if (!rg) novosErros.add('rg');
    if (!cpf) novosErros.add('cpf');
    if (!rua) novosErros.add('rua');
    if (!numero) novosErros.add('numero');
    if (!bairro) novosErros.add('bairro');
    if (!cidade) novosErros.add('cidade');
    if (!uf) novosErros.add('uf');
    if (!cep) novosErros.add('cep');
    
    // Validar campos profissionais
    if (!formacao) novosErros.add('formacao');
    
    if (formacao === 'Enfermeiro' || formacao === 'Residente de Enfermagem' || formacao === 'Técnico de Enfermagem') {
      if (!numeroCoren) novosErros.add('numeroCoren');
      if (!ufCoren) novosErros.add('ufCoren');
    }
    
    if (formacao === 'Residente de Enfermagem' && !dataInicioResidencia) {
      novosErros.add('dataInicioResidencia');
    }
    
    if (formacao === 'Acadêmico de Enfermagem' && !iesEnfermagem) {
      novosErros.add('iesEnfermagem');
    }
    
    if (atuaSMS) {
      if (!lotacao) novosErros.add('lotacao');
      if (!matricula) novosErros.add('matricula');
    } else {
      if (!cidadeTrabalho) novosErros.add('cidadeTrabalho');
      if (!localCargo) novosErros.add('localCargo');
    }
    
    // Validar dados de acesso
    if (!email) novosErros.add('email');
    if (!senha) novosErros.add('senha');
    if (!confirmarSenha) novosErros.add('confirmarSenha');
    
    // Validação de senha
    if (senha !== confirmarSenha) {
      novosErros.add('senha');
      novosErros.add('confirmarSenha');
      toast({
        title: "Senhas não conferem",
        description: "A senha e a confirmação de senha devem ser idênticas",
        variant: "destructive"
      });
    }
    
    setCamposComErro(novosErros);
    return novosErros.size === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      toast({
        title: "Formulário incompleto",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }
    
    setCarregando(true);
    
    try {
      // Verificar se usuário já existe
      const usuarioExiste = await verificarUsuarioExistente(
        email,
        (formacao === 'Enfermeiro' || formacao === 'Residente de Enfermagem' || formacao === 'Técnico de Enfermagem') ? numeroCoren : undefined,
        (formacao === 'Enfermeiro' || formacao === 'Residente de Enfermagem' || formacao === 'Técnico de Enfermagem') ? ufCoren : undefined,
        atuaSMS ? matricula : undefined
      );
      
      if (usuarioExiste) {
        toast({
          title: "Usuário já cadastrado",
          description: "Já existe um cadastro com esses dados. Verifique seu e-mail, COREN ou matrícula.",
          variant: "destructive"
        });
        return;
      }
      
      // Criar usuário de autenticação
      const usuarioAuth = await registrar(email, senha);
      
      // Cadastrar no Firestore
      await cadastrarUsuario({
        uid: usuarioAuth.uid,
        email,
        dadosPessoais: {
          nomeCompleto,
          rg,
          cpf,
          rua,
          numero,
          bairro,
          cidade,
          uf,
          cep
        },
        dadosProfissionais: {
          formacao: formacao as any,
          numeroCoren: (formacao === 'Enfermeiro' || formacao === 'Residente de Enfermagem' || formacao === 'Técnico de Enfermagem') ? numeroCoren : undefined,
          ufCoren: (formacao === 'Enfermeiro' || formacao === 'Residente de Enfermagem' || formacao === 'Técnico de Enfermagem') ? ufCoren : undefined,
          dataInicioResidencia: formacao === 'Residente de Enfermagem' ? dataInicioResidencia : undefined,
          iesEnfermagem: formacao === 'Acadêmico de Enfermagem' ? iesEnfermagem : undefined,
          atuaSMS,
          lotacao: atuaSMS ? lotacao : undefined,
          matricula: atuaSMS ? matricula : undefined,
          cidadeTrabalho: !atuaSMS ? cidadeTrabalho : undefined,
          localCargo: !atuaSMS ? localCargo : undefined
        }
      });
      
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Seu cadastro foi enviado para análise. Você receberá um e-mail quando for aprovado.",
      });
      
      navigate('/');
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      toast({
        title: "Erro no cadastro",
        description: "Ocorreu um erro ao realizar o cadastro. Por favor, tente novamente.",
        variant: "destructive"
      });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex flex-col items-center justify-center flex-1 w-full px-4 py-12">
        <div className="container max-w-4xl">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-csae-green-800 mb-2">
              Junte-se à evolução da enfermagem em Florianópolis
            </h1>
            <p className="text-gray-600">
              Os dados abaixo serão utilizados para garantir segurança aos seus dados e dos pacientes sobre seus cuidados, 
              assim como para gerar o termo de responsabilidade sobre o uso da plataforma.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-lg shadow-lg">
            {/* Dados Pessoais */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-csae-green-700 pb-2 border-b border-csae-green-200">
                Informações Pessoais
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                  <Input
                    type="text"
                    value={nomeCompleto}
                    onChange={(e) => setNomeCompleto(e.target.value)}
                    className={camposComErro.has('nomeCompleto') ? 'border-red-500' : ''}
                    disabled={carregando}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RG (apenas números)</label>
                  <Input
                    type="text"
                    value={rg}
                    onChange={(e) => setRg(e.target.value.replace(/\D/g, ''))}
                    className={camposComErro.has('rg') ? 'border-red-500' : ''}
                    disabled={carregando}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPF (apenas números)</label>
                  <Input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value.replace(/\D/g, ''))}
                    maxLength={11}
                    className={camposComErro.has('cpf') ? 'border-red-500' : ''}
                    disabled={carregando}
                  />
                </div>
                
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rua</label>
                  <Input
                    type="text"
                    value={rua}
                    onChange={(e) => setRua(e.target.value)}
                    className={camposComErro.has('rua') ? 'border-red-500' : ''}
                    disabled={carregando}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                  <Input
                    type="text"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    className={camposComErro.has('numero') ? 'border-red-500' : ''}
                    disabled={carregando}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                  <Input
                    type="text"
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    className={camposComErro.has('bairro') ? 'border-red-500' : ''}
                    disabled={carregando}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                  <Input
                    type="text"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    className={camposComErro.has('cidade') ? 'border-red-500' : ''}
                    disabled={carregando}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
                  <select
                    value={uf}
                    onChange={(e) => setUf(e.target.value)}
                    className={`w-full h-10 px-3 py-2 rounded-md border ${
                      camposComErro.has('uf') ? 'border-red-500' : 'border-gray-300'
                    } bg-white focus:outline-none focus:ring-2 focus:ring-csae-green-400`}
                    disabled={carregando}
                  >
                    <option value="">Selecione</option>
                    {estadosBrasileiros.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CEP (apenas números)</label>
                  <Input
                    type="text"
                    value={cep}
                    onChange={(e) => setCep(e.target.value.replace(/\D/g, ''))}
                    maxLength={8}
                    className={camposComErro.has('cep') ? 'border-red-500' : ''}
                    disabled={carregando}
                  />
                </div>
              </div>
            </div>
            
            {/* Dados Profissionais */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-csae-green-700 pb-2 border-b border-csae-green-200">
                Informações Profissionais
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Formação</label>
                  <select
                    value={formacao}
                    onChange={(e) => setFormacao(e.target.value)}
                    className={`w-full h-10 px-3 py-2 rounded-md border ${
                      camposComErro.has('formacao') ? 'border-red-500' : 'border-gray-300'
                    } bg-white focus:outline-none focus:ring-2 focus:ring-csae-green-400`}
                    disabled={carregando}
                  >
                    <option value="">Selecione</option>
                    <option value="Enfermeiro">Enfermeiro</option>
                    <option value="Residente de Enfermagem">Residente de Enfermagem</option>
                    <option value="Técnico de Enfermagem">Técnico de Enfermagem</option>
                    <option value="Acadêmico de Enfermagem">Acadêmico de Enfermagem</option>
                  </select>
                </div>
                
                {/* Campos condicionais baseados na formação */}
                {(formacao === 'Enfermeiro' || formacao === 'Residente de Enfermagem' || formacao === 'Técnico de Enfermagem') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Número do COREN</label>
                      <Input
                        type="text"
                        value={numeroCoren}
                        onChange={(e) => setNumeroCoren(e.target.value)}
                        className={camposComErro.has('numeroCoren') ? 'border-red-500' : ''}
                        disabled={carregando}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">UF do COREN</label>
                      <select
                        value={ufCoren}
                        onChange={(e) => setUfCoren(e.target.value)}
                        className={`w-full h-10 px-3 py-2 rounded-md border ${
                          camposComErro.has('ufCoren') ? 'border-red-500' : 'border-gray-300'
                        } bg-white focus:outline-none focus:ring-2 focus:ring-csae-green-400`}
                        disabled={carregando}
                      >
                        <option value="">Selecione</option>
                        {estadosBrasileiros.map((estado) => (
                          <option key={estado} value={estado}>
                            {estado}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
                
                {formacao === 'Residente de Enfermagem' && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início da Residência</label>
                    <Input
                      type="date"
                      value={dataInicioResidencia}
                      onChange={(e) => setDataInicioResidencia(e.target.value)}
                      className={camposComErro.has('dataInicioResidencia') ? 'border-red-500' : ''}
                      disabled={carregando}
                    />
                  </div>
                )}
                
                {formacao === 'Acadêmico de Enfermagem' && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instituição de Ensino Superior</label>
                    <Input
                      type="text"
                      value={iesEnfermagem}
                      onChange={(e) => setIesEnfermagem(e.target.value)}
                      className={camposComErro.has('iesEnfermagem') ? 'border-red-500' : ''}
                      disabled={carregando}
                    />
                  </div>
                )}
                
                <div className="col-span-2 flex items-center space-x-2 pt-2">
                  <Checkbox 
                    id="atuaSMS"
                    checked={atuaSMS}
                    onCheckedChange={() => setAtuaSMS(!atuaSMS)}
                    disabled={carregando}
                  />
                  <label
                    htmlFor="atuaSMS"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Atuo na Secretaria Municipal de Saúde de Florianópolis
                  </label>
                </div>
                
                {/* Campos condicionais baseados se atua na SMS */}
                {atuaSMS ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lotação</label>
                      <select
                        value={lotacao}
                        onChange={(e) => setLotacao(e.target.value)}
                        className={`w-full h-10 px-3 py-2 rounded-md border ${
                          camposComErro.has('lotacao') ? 'border-red-500' : 'border-gray-300'
                        } bg-white focus:outline-none focus:ring-2 focus:ring-csae-green-400`}
                        disabled={carregando}
                      >
                        <option value="">Selecione</option>
                        {lotacoesSMS.map((unidade) => (
                          <option key={unidade} value={unidade}>
                            {unidade}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Número da Matrícula</label>
                      <Input
                        type="text"
                        value={matricula}
                        onChange={(e) => setMatricula(e.target.value)}
                        className={camposComErro.has('matricula') ? 'border-red-500' : ''}
                        disabled={carregando}
                      />
                    </div>
                  </>
                ) : formacao ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cidade que Trabalha</label>
                      <Input
                        type="text"
                        value={cidadeTrabalho}
                        onChange={(e) => setCidadeTrabalho(e.target.value)}
                        className={camposComErro.has('cidadeTrabalho') ? 'border-red-500' : ''}
                        disabled={carregando}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Local/Cargo</label>
                      <Input
                        type="text"
                        value={localCargo}
                        onChange={(e) => setLocalCargo(e.target.value)}
                        className={camposComErro.has('localCargo') ? 'border-red-500' : ''}
                        disabled={carregando}
                      />
                    </div>
                  </>
                ) : null}
              </div>
            </div>
            
            {/* Dados de Acesso */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-csae-green-700 pb-2 border-b border-csae-green-200">
                Informações de Acesso
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={camposComErro.has('email') ? 'border-red-500' : ''}
                    disabled={carregando}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                  <Input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className={camposComErro.has('senha') ? 'border-red-500' : ''}
                    disabled={carregando}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Senha</label>
                  <Input
                    type="password"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    className={camposComErro.has('confirmarSenha') ? 'border-red-500' : ''}
                    disabled={carregando}
                  />
                </div>
              </div>
            </div>
            
            {/* Botões */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
                className="csae-btn-secondary order-2 sm:order-1"
                disabled={carregando}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para o Login
              </Button>
              
              <Button 
                type="submit" 
                className="csae-btn-primary order-1 sm:order-2"
                disabled={carregando}
              >
                {carregando ? (
                  "Processando..."
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Criar Conta
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
      
      <footer className="py-6 text-center text-sm text-gray-500">
        <p className="flex items-center justify-center gap-1.5">
          Desenvolvido com 
          <Heart className="w-4 h-4 fill-csae-green-500 text-csae-green-500" /> 
          por Bruno Vinícius, em colaboração com a Comissão Permanente de Sistematização da Assistência de Enfermagem (CSAE) de Florianópolis
        </p>
      </footer>
    </div>
  );
};

export default Register;
