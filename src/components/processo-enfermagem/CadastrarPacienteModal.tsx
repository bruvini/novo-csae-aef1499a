import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useAutenticacao } from '@/hooks/useAutenticacao';
import { cadastrarPaciente } from '@/services/bancodados/pacientesDB';
import { Paciente } from '@/types';

const formSchema = z.object({
  nome: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  dataNascimento: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data de nascimento inválida." }),
  sexo: z.enum(['Feminino', 'Masculino']),
});

interface CadastrarPacienteModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const CadastrarPacienteModal: React.FC<CadastrarPacienteModalProps> = ({ isOpen, onOpenChange }) => {
  const { toast } = useToast();
  const { usuario } = useAutenticacao();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      dataNascimento: '',
      sexo: 'Feminino',
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (novoPaciente: Omit<Paciente, 'id' | 'statusPaciente' | 'dataCadastro' | 'dataAtualizacao' | 'evolucoes'>) => cadastrarPaciente(novoPaciente),
    onSuccess: () => {
      toast({
        title: 'Sucesso!',
        description: 'Paciente cadastrado com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['pacientes', usuario?.uid] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: `Não foi possível cadastrar o paciente: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!usuario || !usuario.usuario) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar autenticado para cadastrar um paciente.',
        variant: 'destructive',
      });
      return;
    }

    const novoPaciente = {
      nome: values.nome,
      dataNascimento: format(new Date(values.dataNascimento), 'yyyy-MM-dd'),
      sexo: values.sexo,
      profissionalUid: usuario.uid,
      nomeProfissional: usuario.usuario.dadosPessoais.nomeCompleto,
    };
    
    mutate(novoPaciente);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Paciente</DialogTitle>
          <DialogDescription>
            Preencha as informações do paciente abaixo.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do paciente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dataNascimento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Nascimento</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sexo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sexo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o sexo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Feminino">Feminino</SelectItem>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Salvando...' : 'Salvar Paciente'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CadastrarPacienteModal;
