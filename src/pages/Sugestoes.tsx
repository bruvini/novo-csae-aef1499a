
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAutenticacao } from '@/services/autenticacao';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import MainFooter from '@/components/MainFooter';
import NavigationMenu from '@/components/NavigationMenu';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, ClipboardCheck, ArrowLeft, SendIcon } from 'lucide-react';

// Define the form data structure
interface FormValues {
  tipo_avaliacao: 'geral' | 'processo';
  tempo_carregamento: number;
  navegacao: number;
  clareza_informacoes: number;
  confiabilidade_dados: number;
  adaptacao_rotina: number;
  responsividade: number;
  experiencia_geral: number;
  impacto_na_pratica: number;
  nps: number;
  frequencia_uso: string;
  contexto_uso: string[];
  contexto_outros?: string;
  agrado: string;
  incomodo: string;
  erro?: string;
  sugestao?: string;
  acessibilidade_tamanho_fonte: 'sim' | 'nao';
  acessibilidade_tamanho_fonte_descricao?: string;
  acessibilidade_contraste: 'sim' | 'nao';
  acessibilidade_contraste_descricao?: string;
  acessibilidade_teclado: 'sim' | 'nao';
  acessibilidade_teclado_descricao?: string;
  acessibilidade_outros: 'sim' | 'nao';
  acessibilidade_outros_descricao?: string;
}

const Sugestoes = () => {
  const { usuario } = useAutenticacao();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const defaultValues: Partial<FormValues> = {
    tipo_avaliacao: 'geral',
    tempo_carregamento: 5,
    navegacao: 5,
    clareza_informacoes: 5,
    confiabilidade_dados: 5,
    adaptacao_rotina: 5,
    responsividade: 5,
    experiencia_geral: 5,
    impacto_na_pratica: 5,
    nps: 5,
    contexto_uso: [],
    acessibilidade_tamanho_fonte: 'nao',
    acessibilidade_contraste: 'nao',
    acessibilidade_teclado: 'nao',
    acessibilidade_outros: 'nao',
  };
  
  const form = useForm<FormValues>({
    defaultValues,
  });
  
  const watchTipoAvaliacao = form.watch('tipo_avaliacao');
  const watchContextoUso = form.watch('contexto_uso');
  const showOutrosField = watchContextoUso?.includes('outros');
  
  const watchAcessibilidadeTamanhoFonte = form.watch('acessibilidade_tamanho_fonte');
  const watchAcessibilidadeContraste = form.watch('acessibilidade_contraste');
  const watchAcessibilidadeTeclado = form.watch('acessibilidade_teclado');
  const watchAcessibilidadeOutros = form.watch('acessibilidade_outros');
  
  const contextosUso = [
    { id: 'aps', label: 'Atendimento em APS' },
    { id: 'upa', label: 'Atendimento em UPA' },
    { id: 'hospitalar', label: 'Atendimento hospitalar' },
    { id: 'caps', label: 'Atendimento CAPS' },
    { id: 'policlinica', label: 'Atendimento Policlínica' },
    { id: 'outros', label: 'Outros' },
  ];
  
  const onSubmit = async (data: FormValues) => {
    if (!usuario) {
      toast({
        variant: "destructive",
        title: "Erro de autenticação",
        description: "Você precisa estar autenticado para enviar sugestões.",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, "sugestoes"), {
        ...data,
        usuario_id: usuario.uid,
        usuario_email: usuario.email,
        data_criacao: serverTimestamp(),
      });
      
      toast({
        title: "Feedback enviado com sucesso!",
        description: "Agradecemos sua participação.",
      });
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error("Erro ao enviar feedback:", error);
      toast({
        variant: "destructive",
        title: "Erro ao enviar",
        description: "Ocorreu um erro ao enviar seu feedback. Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const ratingLabels = {
    1: 'Péssimo',
    3: 'Ruim',
    5: 'Regular',
    7: 'Bom',
    10: 'Excelente'
  };
  
  const npsLabels = {
    0: 'Não recomendaria',
    5: 'Talvez recomendaria',
    10: 'Recomendaria fortemente'
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-csae-light">
      <Header />
      <NavigationMenu activeItem="sugestoes" />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-csae-green-600" 
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
              <div>
                <CardTitle className="text-csae-green-700">Formulário de Sugestões</CardTitle>
                <CardDescription>
                  Compartilhe sua opinião para nos ajudar a melhorar o Portal CSAE Floripa 2.0
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Bloco 1 - Seletor de avaliação */}
                <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
                  <h2 className="text-lg font-medium text-csae-green-700 mb-4">Seletor de avaliação</h2>
                  <FormField
                    control={form.control}
                    name="tipo_avaliacao"
                    rules={{ required: "Selecione uma opção" }}
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>O que você deseja avaliar?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-2"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="geral" />
                              </FormControl>
                              <FormLabel className="font-normal flex items-center">
                                <BookOpen className="h-4 w-4 mr-2 text-csae-green-600" />
                                Avaliar a aplicação em geral
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="processo" />
                              </FormControl>
                              <FormLabel className="font-normal flex items-center">
                                <ClipboardCheck className="h-4 w-4 mr-2 text-csae-green-600" />
                                Avaliar a ferramenta "Processo de Enfermagem"
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Bloco 2 - Avaliação de aspectos */}
                <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
                  <h2 className="text-lg font-medium text-csae-green-700 mb-4">
                    Avaliação de aspectos da {watchTipoAvaliacao === 'geral' ? 'aplicação' : 'ferramenta "Processo de Enfermagem"'}
                  </h2>
                  
                  {/* Avaliações com sliders */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {[
                      { name: 'tempo_carregamento', label: 'Tempo de carregamento' },
                      { name: 'navegacao', label: 'Facilidade de navegação' },
                      { name: 'clareza_informacoes', label: 'Clareza das informações apresentadas' },
                      { name: 'confiabilidade_dados', label: 'Confiabilidade e segurança dos dados' },
                      { name: 'adaptacao_rotina', label: 'Adaptação à rotina de trabalho de enfermagem' },
                      { name: 'responsividade', label: 'Responsividade em diferentes dispositivos' },
                      { name: 'experiencia_geral', label: 'Experiência geral de uso' },
                      { name: 'impacto_na_pratica', label: 'Impacto positivo na prática profissional' },
                    ].map((item) => (
                      <FormField
                        key={item.name}
                        control={form.control}
                        name={item.name as keyof FormValues}
                        rules={{ required: "Este campo é obrigatório" }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{item.label}</FormLabel>
                            <div className="space-y-3">
                              <FormControl>
                                <Slider
                                  min={1}
                                  max={10}
                                  step={1}
                                  value={[field.value as number]}
                                  onValueChange={(vals) => field.onChange(vals[0])}
                                  className="py-4"
                                />
                              </FormControl>
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>1</span>
                                <span>{field.value}/10</span>
                                <span>10</span>
                              </div>
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>{ratingLabels[1]}</span>
                                <span>{ratingLabels[10]}</span>
                              </div>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Bloco 3 - Pergunta NPS */}
                <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
                  <h2 className="text-lg font-medium text-csae-green-700 mb-4">Recomendação</h2>
                  <FormField
                    control={form.control}
                    name="nps"
                    rules={{ required: "Este campo é obrigatório" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Em uma escala de 0 a 10, o quanto você recomendaria esta {watchTipoAvaliacao === 'geral' ? 'aplicação' : 'ferramenta "Processo de Enfermagem"'} para um colega enfermeiro?
                        </FormLabel>
                        <div className="space-y-3">
                          <FormControl>
                            <Slider
                              min={0}
                              max={10}
                              step={1}
                              value={[field.value as number]}
                              onValueChange={(vals) => field.onChange(vals[0])}
                              className="py-4"
                            />
                          </FormControl>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>0</span>
                            <span>{field.value}/10</span>
                            <span>10</span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>{npsLabels[0]}</span>
                            <span>{npsLabels[5]}</span>
                            <span>{npsLabels[10]}</span>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Bloco 4 - Frequência e contexto */}
                <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
                  <h2 className="text-lg font-medium text-csae-green-700 mb-4">Frequência e contexto de uso</h2>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="frequencia_uso"
                      rules={{ required: "Selecione uma opção" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Com que frequência você utiliza esta aplicação?</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma opção" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="diariamente">Diariamente</SelectItem>
                              <SelectItem value="algumas_vezes_semana">Algumas vezes por semana</SelectItem>
                              <SelectItem value="eventualmente">Eventualmente</SelectItem>
                              <SelectItem value="primeira_vez">Primeira vez</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div>
                      <FormField
                        control={form.control}
                        name="contexto_uso"
                        rules={{ required: "Selecione pelo menos uma opção" }}
                        render={() => (
                          <FormItem>
                            <FormLabel>Em qual contexto você utiliza esta aplicação?</FormLabel>
                            <div className="space-y-2">
                              {contextosUso.map((contexto) => (
                                <FormField
                                  key={contexto.id}
                                  control={form.control}
                                  name="contexto_uso"
                                  render={({ field }) => {
                                    return (
                                      <FormItem
                                        key={contexto.id}
                                        className="flex flex-row items-start space-x-3 space-y-0"
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(contexto.id)}
                                            onCheckedChange={(checked) => {
                                              const currentValue = [...(field.value || [])];
                                              return checked
                                                ? field.onChange([...currentValue, contexto.id])
                                                : field.onChange(currentValue.filter((value) => value !== contexto.id));
                                            }}
                                          />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                          {contexto.label}
                                        </FormLabel>
                                      </FormItem>
                                    );
                                  }}
                                />
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  {showOutrosField && (
                    <div className="mt-4">
                      <FormField
                        control={form.control}
                        name="contexto_outros"
                        rules={{ required: "Este campo é obrigatório quando 'Outros' é selecionado" }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descreva o outro contexto de uso:</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
                
                {/* Bloco 5 - Feedback Aberto */}
                <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
                  <h2 className="text-lg font-medium text-csae-green-700 mb-4">Feedback aberto</h2>
                  
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="agrado"
                      rules={{ 
                        required: "Este campo é obrigatório",
                        maxLength: {
                          value: 500,
                          message: "Máximo de 500 caracteres"
                        }
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>O que mais te agrada na aplicação ou ferramenta?</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Conte-nos o que você mais gosta..."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            {field.value?.length || 0}/500 caracteres
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="incomodo"
                      rules={{ 
                        required: "Este campo é obrigatório",
                        maxLength: {
                          value: 500,
                          message: "Máximo de 500 caracteres"
                        }
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>O que mais te incomoda ou dificulta o uso?</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Conte-nos o que poderia ser melhorado..."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            {field.value?.length || 0}/500 caracteres
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="erro"
                      rules={{ 
                        maxLength: {
                          value: 500,
                          message: "Máximo de 500 caracteres"
                        }
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Você encontrou algum erro ou problema técnico? (opcional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descreva qualquer erro ou problema técnico que tenha encontrado..."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            {field.value?.length || 0}/500 caracteres
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="sugestao"
                      rules={{ 
                        maxLength: {
                          value: 500,
                          message: "Máximo de 500 caracteres"
                        }
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tem alguma sugestão de melhoria ou recurso? (opcional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Compartilhe suas ideias para melhorar a aplicação..."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            {field.value?.length || 0}/500 caracteres
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* Bloco 6 - Acessibilidade */}
                <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
                  <h2 className="text-lg font-medium text-csae-green-700 mb-4">Acessibilidade</h2>
                  
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="acessibilidade_tamanho_fonte"
                      rules={{ required: "Este campo é obrigatório" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Você teve problemas com o tamanho da fonte?</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex space-x-4"
                            >
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="sim" />
                                </FormControl>
                                <FormLabel className="font-normal">Sim</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="nao" />
                                </FormControl>
                                <FormLabel className="font-normal">Não</FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {watchAcessibilidadeTamanhoFonte === 'sim' && (
                      <FormField
                        control={form.control}
                        name="acessibilidade_tamanho_fonte_descricao"
                        rules={{ required: "Este campo é obrigatório quando 'Sim' é selecionado" }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descreva o problema com o tamanho da fonte:</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Por exemplo: 'A fonte é muito pequena nos títulos...'"
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    <FormField
                      control={form.control}
                      name="acessibilidade_contraste"
                      rules={{ required: "Este campo é obrigatório" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Você teve problemas com o contraste ou legibilidade?</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex space-x-4"
                            >
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="sim" />
                                </FormControl>
                                <FormLabel className="font-normal">Sim</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="nao" />
                                </FormControl>
                                <FormLabel className="font-normal">Não</FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {watchAcessibilidadeContraste === 'sim' && (
                      <FormField
                        control={form.control}
                        name="acessibilidade_contraste_descricao"
                        rules={{ required: "Este campo é obrigatório quando 'Sim' é selecionado" }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descreva o problema com o contraste ou legibilidade:</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Por exemplo: 'O texto cinza claro sobre fundo branco é difícil de ler...'"
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    <FormField
                      control={form.control}
                      name="acessibilidade_teclado"
                      rules={{ required: "Este campo é obrigatório" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Você teve problemas na navegação sem mouse (apenas teclado ou leitor de tela)?</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex space-x-4"
                            >
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="sim" />
                                </FormControl>
                                <FormLabel className="font-normal">Sim</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="nao" />
                                </FormControl>
                                <FormLabel className="font-normal">Não</FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {watchAcessibilidadeTeclado === 'sim' && (
                      <FormField
                        control={form.control}
                        name="acessibilidade_teclado_descricao"
                        rules={{ required: "Este campo é obrigatório quando 'Sim' é selecionado" }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descreva o problema com a navegação sem mouse:</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Por exemplo: 'Não consigo navegar entre os campos do formulário usando Tab...'"
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    <FormField
                      control={form.control}
                      name="acessibilidade_outros"
                      rules={{ required: "Este campo é obrigatório" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Você teve outros problemas de acessibilidade?</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex space-x-4"
                            >
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="sim" />
                                </FormControl>
                                <FormLabel className="font-normal">Sim</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="nao" />
                                </FormControl>
                                <FormLabel className="font-normal">Não</FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {watchAcessibilidadeOutros === 'sim' && (
                      <FormField
                        control={form.control}
                        name="acessibilidade_outros_descricao"
                        rules={{ required: "Este campo é obrigatório quando 'Sim' é selecionado" }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descreva os outros problemas de acessibilidade:</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Por exemplo: 'As animações são muito rápidas e me causam desconforto...'"
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate('/dashboard')}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-csae-green-600 hover:bg-csae-green-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Enviando...' : 'Enviar feedback'}
                    <SendIcon className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
      
      <MainFooter />
    </div>
  );
};

export default Sugestoes;
