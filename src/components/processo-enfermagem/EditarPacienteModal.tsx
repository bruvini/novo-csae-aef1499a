
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Paciente, atualizarPaciente } from '@/services/bancodados';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';

const formSchema = z.object({
  nomeCompleto: z.string().min(3, "O nome deve ter no mínimo 3 caracteres"),
  dataNascimento: z.date({
    required_error: "A data de nascimento é obrigatória",
  }),
  sexo: z.enum(["Masculino", "Feminino", "Outro"], {
    required_error: "Selecione o sexo do paciente",
  }),
});

interface EditarPacienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  paciente: Paciente;
  onEditar: (paciente: Paciente) => void;
}

export function EditarPacienteModal({ isOpen, onClose, paciente, onEditar }: EditarPacienteModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Converter Timestamp para Date para o formulário
  const dataNascimentoDate = paciente.dataNascimento?.toDate 
    ? paciente.dataNascimento.toDate() 
    : new Date();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomeCompleto: paciente.nomeCompleto || "",
      dataNascimento: dataNascimentoDate,
      sexo: paciente.sexo || "Outro",
    },
  });

  const calcularIdade = (dataNascimento: Date): number => {
    const hoje = new Date();
    let idade = hoje.getFullYear() - dataNascimento.getFullYear();
    const m = hoje.getMonth() - dataNascimento.getMonth();
    
    if (m < 0 || (m === 0 && hoje.getDate() < dataNascimento.getDate())) {
      idade--;
    }
    
    return idade;
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!paciente.id) {
      toast({
        title: "Erro ao atualizar",
        description: "ID do paciente não encontrado.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const idade = calcularIdade(values.dataNascimento);
      
      const dadosAtualizados: Partial<Paciente> = {
        nomeCompleto: values.nomeCompleto.toUpperCase(),
        dataNascimento: Timestamp.fromDate(values.dataNascimento),
        idade,
        sexo: values.sexo,
      };
      
      const sucesso = await atualizarPaciente(paciente.id, dadosAtualizados);
      
      if (sucesso) {
        onEditar({
          ...paciente,
          ...dadosAtualizados,
        });
      } else {
        throw new Error("Falha ao atualizar paciente");
      }
    } catch (error) {
      console.error("Erro ao atualizar paciente:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar os dados do paciente. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Paciente</DialogTitle>
          <DialogDescription>
            Altere os dados do paciente conforme necessário.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nomeCompleto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo do paciente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="dataNascimento"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Nascimento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>Selecione a data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o sexo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Feminino">Feminino</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-csae-green-600 hover:bg-csae-green-700"
                disabled={loading}
              >
                {loading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
