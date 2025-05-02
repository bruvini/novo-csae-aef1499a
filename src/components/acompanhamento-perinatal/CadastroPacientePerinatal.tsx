
import React, { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAutenticacao } from '@/services/autenticacao';
import { PacientePerinatal } from '@/services/bancodados/tipos';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { 
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage 
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  doc,
  collection,
  addDoc,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import {
  Baby,
  Save,
  ArrowLeft
} from 'lucide-react';

const formSchemaMulher = z.object({
  nome: z.string().min(3, "Nome completo é obrigatório"),
  dataNascimento: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Data de nascimento inválida"
  }),
  titulo: z.string().min(3, "Título é obrigatório"),
  descricao: z.string().min(3, "Descrição é obrigatória"),
  situacaoObstetrica: z.enum(["Gestante", "Puérpera"]),
  idadeGestacional: z.string().optional(),
  dataParto: z.string().optional(),
});

const formSchemaBebe = z.object({
  nome: z.string().min(3, "Nome completo é obrigatório"),
  dataNascimento: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Data de nascimento inválida"
  }),
  titulo: z.string().min(3, "Título é obrigatório"),
  descricao: z.string().min(3, "Descrição é obrigatória"),
  nomeMae: z.string().min(3, "Nome da mãe é obrigatório"),
  idadeGestacionalNascer: z.string().optional(),
});

interface CadastroPacientePerinatalProps {
  tipoPaciente: "mulher" | "bebê";
  pacienteExistente: PacientePerinatal | null;
  onSalvar: (paciente: Partial<PacientePerinatal>, resetForm: () => void) => void;
  onCancelar: () => void;
}

const CadastroPacientePerinatal: React.FC<CadastroPacientePerinatalProps> = ({
  tipoPaciente,
  pacienteExistente,
  onSalvar,
  onCancelar
}) => {
  const { toast } = useToast();
  const { usuario } = useAutenticacao();
  const [showPartoFields, setShowPartoFields] = useState(false);
  
  const formMulher = useForm<z.infer<typeof formSchemaMulher>>({
    resolver: zodResolver(formSchemaMulher),
    defaultValues: {
      nome: "",
      dataNascimento: "",
      titulo: "",
      descricao: "",
      situacaoObstetrica: "Gestante",
      idadeGestacional: "",
      dataParto: "",
    },
  });

  const formBebe = useForm<z.infer<typeof formSchemaBebe>>({
    resolver: zodResolver(formSchemaBebe),
    defaultValues: {
      nome: "",
      dataNascimento: "",
      titulo: "",
      descricao: "",
      nomeMae: "",
      idadeGestacionalNascer: "",
    },
  });

  useEffect(() => {
    if (pacienteExistente) {
      if (pacienteExistente.tipoPaciente === "mulher") {
        formMulher.reset({
          nome: pacienteExistente.nome,
          dataNascimento: format(pacienteExistente.dataNascimento.toDate(), "yyyy-MM-dd"),
          titulo: pacienteExistente.titulo,
          descricao: pacienteExistente.descricao,
          situacaoObstetrica: pacienteExistente.situacaoObstetrica || "Gestante",
          idadeGestacional: pacienteExistente.idadeGestacional?.toString() || "",
          dataParto: pacienteExistente.dataParto ? format(pacienteExistente.dataParto.toDate(), "yyyy-MM-dd") : "",
        });
        setShowPartoFields(pacienteExistente.situacaoObstetrica === "Puérpera");
      } else {
        formBebe.reset({
          nome: pacienteExistente.nome,
          dataNascimento: format(pacienteExistente.dataNascimento.toDate(), "yyyy-MM-dd"),
          titulo: pacienteExistente.titulo,
          descricao: pacienteExistente.descricao,
          nomeMae: pacienteExistente.nomeMae || "",
          idadeGestacionalNascer: pacienteExistente.idadeGestacionalNascer?.toString() || "",
        });
      }
    }
  }, [pacienteExistente]);

  const handleSituacaoObstetricaChange = (value: string) => {
    setShowPartoFields(value === "Puérpera");
  };

  const onSubmitMulher = async (data: z.infer<typeof formSchemaMulher>) => {
    try {
      if (!usuario) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar autenticado para cadastrar pacientes.",
          variant: "destructive",
        });
        return;
      }

      // Validações específicas
      if (data.situacaoObstetrica === "Gestante" && !data.idadeGestacional) {
        toast({
          title: "Erro de validação",
          description: "A idade gestacional é obrigatória para gestantes.",
          variant: "destructive",
        });
        return;
      }

      if (data.situacaoObstetrica === "Puérpera" && !data.dataParto) {
        toast({
          title: "Erro de validação",
          description: "A data do parto é obrigatória para puérperas.",
          variant: "destructive",
        });
        return;
      }

      const paciente: Partial<PacientePerinatal> = {
        nome: data.nome,
        dataNascimento: Timestamp.fromDate(new Date(data.dataNascimento)),
        titulo: data.titulo,
        descricao: data.descricao,
        tipoPaciente: "mulher" as const,
        situacaoObstetrica: data.situacaoObstetrica,
        idadeGestacional: data.idadeGestacional ? parseInt(data.idadeGestacional) : undefined,
        dataParto: data.dataParto ? Timestamp.fromDate(new Date(data.dataParto)) : undefined,
        profissionalUid: usuario.uid,
        profissionalNome: usuario.nome || usuario.email,
      };

      if (pacienteExistente?.id) {
        // Atualização
        await updateDoc(doc(db, "cuidadoPerinatal", pacienteExistente.id), {
          ...paciente,
          dataAtualizacao: serverTimestamp()
        });
        
        toast({
          title: "Paciente atualizado",
          description: "Os dados da paciente foram atualizados com sucesso.",
        });
      } else {
        // Criação
        await addDoc(collection(db, "cuidadoPerinatal"), {
          ...paciente,
          dataCadastro: serverTimestamp(),
          dataAtualizacao: serverTimestamp()
        });
        
        toast({
          title: "Paciente cadastrada",
          description: "A paciente foi cadastrada com sucesso.",
        });
      }

      onSalvar(paciente, () => formMulher.reset());
    } catch (error) {
      console.error("Erro ao salvar paciente:", error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar os dados da paciente.",
        variant: "destructive",
      });
    }
  };

  const onSubmitBebe = async (data: z.infer<typeof formSchemaBebe>) => {
    try {
      if (!usuario) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar autenticado para cadastrar pacientes.",
          variant: "destructive",
        });
        return;
      }

      const idadeGestacional = data.idadeGestacionalNascer ? parseInt(data.idadeGestacionalNascer) : undefined;
      
      const paciente: Partial<PacientePerinatal> = {
        nome: data.nome,
        dataNascimento: Timestamp.fromDate(new Date(data.dataNascimento)),
        titulo: data.titulo,
        descricao: data.descricao,
        tipoPaciente: "bebê" as const,
        nomeMae: data.nomeMae,
        idadeGestacionalNascer: idadeGestacional,
        prematuro: idadeGestacional ? idadeGestacional < 37 : false,
        profissionalUid: usuario.uid,
        profissionalNome: usuario.nome || usuario.email,
      };

      if (pacienteExistente?.id) {
        // Atualização
        await updateDoc(doc(db, "cuidadoPerinatal", pacienteExistente.id), {
          ...paciente,
          dataAtualizacao: serverTimestamp()
        });
        
        toast({
          title: "Paciente atualizado",
          description: "Os dados do bebê foram atualizados com sucesso.",
        });
      } else {
        // Criação
        await addDoc(collection(db, "cuidadoPerinatal"), {
          ...paciente,
          dataCadastro: serverTimestamp(),
          dataAtualizacao: serverTimestamp()
        });
        
        toast({
          title: "Paciente cadastrado",
          description: "O bebê foi cadastrado com sucesso.",
        });
      }

      onSalvar(paciente, () => formBebe.reset());
    } catch (error) {
      console.error("Erro ao salvar paciente:", error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar os dados do bebê.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {tipoPaciente === "mulher" ? (
        <Form {...formMulher}>
          <form onSubmit={formMulher.handleSubmit(onSubmitMulher)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={formMulher.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo*</FormLabel>
                    <FormControl>
                      <Input placeholder="Maria da Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={formMulher.control}
                name="dataNascimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Nascimento*</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={formMulher.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título do Acompanhamento*</FormLabel>
                    <FormControl>
                      <Input placeholder="Gestação 2023" {...field} />
                    </FormControl>
                    <FormDescription>
                      Um título para identificar este acompanhamento
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={formMulher.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição*</FormLabel>
                    <FormControl>
                      <Input placeholder="Primeira gestação" {...field} />
                    </FormControl>
                    <FormDescription>
                      Uma breve descrição sobre este acompanhamento
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={formMulher.control}
              name="situacaoObstetrica"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Situação Obstétrica*</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleSituacaoObstetricaChange(value);
                    }} 
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a situação" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Gestante">Gestante</SelectItem>
                      <SelectItem value="Puérpera">Puérpera</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {formMulher.watch("situacaoObstetrica") === "Gestante" && (
              <FormField
                control={formMulher.control}
                name="idadeGestacional"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Idade Gestacional (em semanas)*</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="42" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {showPartoFields && (
              <div className="space-y-4">
                <FormField
                  control={formMulher.control}
                  name="dataParto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data do Parto*</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Card className="border-l-4 border-l-blue-400">
                  <CardContent className="pt-4">
                    <h3 className="font-medium text-sm mb-2 flex items-center">
                      <Baby className="mr-2 h-4 w-4 text-blue-500" />
                      Cadastrar recém-nascido
                    </h3>
                    <p className="text-sm text-gray-600">
                      Após cadastrar a puérpera, você poderá adicionar o recém-nascido automaticamente.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onCancelar}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button type="submit" className="bg-csae-green-600 hover:bg-csae-green-700">
                <Save className="mr-2 h-4 w-4" />
                {pacienteExistente ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </Form>
      ) : (
        <Form {...formBebe}>
          <form onSubmit={formBebe.handleSubmit(onSubmitBebe)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={formBebe.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo do Bebê*</FormLabel>
                    <FormControl>
                      <Input placeholder="João da Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={formBebe.control}
                name="dataNascimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Nascimento*</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={formBebe.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título do Acompanhamento*</FormLabel>
                    <FormControl>
                      <Input placeholder="Puericultura 2023" {...field} />
                    </FormControl>
                    <FormDescription>
                      Um título para identificar este acompanhamento
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={formBebe.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição*</FormLabel>
                    <FormControl>
                      <Input placeholder="Acompanhamento de puericultura" {...field} />
                    </FormControl>
                    <FormDescription>
                      Uma breve descrição sobre este acompanhamento
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={formBebe.control}
              name="nomeMae"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Mãe*</FormLabel>
                  <FormControl>
                    <Input placeholder="Maria da Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={formBebe.control}
              name="idadeGestacionalNascer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Idade Gestacional ao Nascer (em semanas)</FormLabel>
                  <FormControl>
                    <Input type="number" min="24" max="42" {...field} />
                  </FormControl>
                  <FormDescription>
                    Se menor que 37 semanas, será sinalizado como prematuro.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onCancelar}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button type="submit" className="bg-csae-green-600 hover:bg-csae-green-700">
                <Save className="mr-2 h-4 w-4" />
                {pacienteExistente ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};

export default CadastroPacientePerinatal;
