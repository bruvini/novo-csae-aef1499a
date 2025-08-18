import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useForm, Controller } from 'react-hook-form';
import { format } from 'date-fns';
import { Paciente } from '@/types/paciente';
import { cadastrarPaciente, atualizarPaciente } from '@/services/bancodados/pacientesDB';

interface FormValues {
  nomeCompleto: string;
  dataNascimento: Date;
  sexo: 'Feminino' | 'Masculino' | undefined;
}

interface ModalCadastroPacienteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPacienteCadastrado: () => void;
  pacienteParaEditar?: Paciente | null;
}

const ModalCadastroPaciente: React.FC<ModalCadastroPacienteProps> = ({
  open,
  onOpenChange,
  onPacienteCadastrado,
  pacienteParaEditar = null
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const { control, handleSubmit, formState: { errors }, reset } = useForm<FormValues>();

  const isEditMode = !!pacienteParaEditar;

  // Pré-preencher o formulário quando estiver editando
  useEffect(() => {
    if (isEditMode && pacienteParaEditar) {
      reset({
        nomeCompleto: pacienteParaEditar.nomeCompleto,
        dataNascimento: pacienteParaEditar.dataNascimento.toDate(),
        sexo: pacienteParaEditar.sexo,
      });
    } else {
      reset({
        nomeCompleto: '',
        dataNascimento: undefined,
        sexo: undefined,
      });
    }
  }, [isEditMode, pacienteParaEditar, reset]);

  const onSubmit = async (values: FormValues) => {
    if (!user) return;

    setLoading(true);
    try {
      if (isEditMode && pacienteParaEditar) {
        // Atualizar paciente existente
        await atualizarPaciente(
          pacienteParaEditar.id,
          {
            nomeCompleto: values.nomeCompleto,
            dataNascimento: values.dataNascimento,
            sexo: values.sexo,
          },
          user.uid
        );

        toast({
          title: "Paciente atualizado",
          description: "Os dados do paciente foram atualizados com sucesso!",
        });
      } else {
        // Cadastrar novo paciente
        await cadastrarPaciente(
          values.nomeCompleto,
          values.dataNascimento,
          values.sexo,
          user.uid,
          user.displayName || user.email || undefined
        );

        toast({
          title: "Paciente cadastrado",
          description: "Paciente cadastrado com sucesso!",
        });
      }

      onPacienteCadastrado();
      onOpenChange(false);
      reset();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || `Erro ao ${isEditMode ? 'atualizar' : 'cadastrar'} paciente`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Editar Paciente' : 'Cadastrar Novo Paciente'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Atualize as informações do paciente abaixo.'
              : 'Preencha as informações básicas do paciente para iniciar o processo de enfermagem.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nomeCompleto" className="text-right">
              Nome Completo
            </Label>
            <Controller
              name="nomeCompleto"
              control={control}
              defaultValue=""
              rules={{ required: 'Nome completo é obrigatório' }}
              render={({ field }) => (
                <Input
                  id="nomeCompleto"
                  placeholder="Nome completo do paciente"
                  className="col-span-3"
                  {...field}
                />
              )}
            />
            {errors.nomeCompleto && (
              <p className="col-span-4 text-sm text-red-500 mt-1">
                {errors.nomeCompleto.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dataNascimento" className="text-right">
              Data de Nascimento
            </Label>
            <Controller
              name="dataNascimento"
              control={control}
              defaultValue={undefined}
              rules={{ required: 'Data de nascimento é obrigatória' }}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "col-span-3 pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PP")
                      ) : (
                        <span>Selecione a data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date('1900-01-01')
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.dataNascimento && (
              <p className="col-span-4 text-sm text-red-500 mt-1">
                {errors.dataNascimento.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sexo" className="text-right">
              Sexo
            </Label>
            <Controller
              name="sexo"
              control={control}
              defaultValue={undefined}
              rules={{ required: 'Sexo é obrigatório' }}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione o sexo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Feminino">Feminino</SelectItem>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.sexo && (
              <p className="col-span-4 text-sm text-red-500 mt-1">
                {errors.sexo.message}
              </p>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} onClick={handleSubmit(onSubmit)}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isEditMode ? 'Atualizando...' : 'Cadastrando...'}
              </>
            ) : (
              isEditMode ? 'Atualizar' : 'Cadastrar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModalCadastroPaciente;
