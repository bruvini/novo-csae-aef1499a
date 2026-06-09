
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
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useForm, Controller } from 'react-hook-form';
import { format, parse, isValid } from 'date-fns';
import InputMask from 'react-input-mask';
import { Paciente, IdentidadeGenero } from '@/types/paciente';
import { cadastrarPaciente, atualizarPaciente } from '@/services/bancodados/pacientesDB';

interface FormValues {
  nomeCompleto: string;
  dataNascimento: Date;
  sexo: IdentidadeGenero | undefined;
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
  const [dateInputValue, setDateInputValue] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  const { control, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<FormValues>();
  const watchedDate = watch('dataNascimento');

  const isEditMode = !!pacienteParaEditar;

  // Sync date input with form value
  useEffect(() => {
    if (watchedDate) {
      setDateInputValue(format(watchedDate, 'dd/MM/yyyy'));
    }
  }, [watchedDate]);

  // Pre-fill form when editing
  useEffect(() => {
    if (isEditMode && pacienteParaEditar) {
      const birthDate = pacienteParaEditar.dataNascimento.toDate();
      reset({
        nomeCompleto: pacienteParaEditar.nomeCompleto,
        dataNascimento: birthDate,
        sexo: pacienteParaEditar.sexo,
      });
      setDateInputValue(format(birthDate, 'dd/MM/yyyy'));
    } else {
      reset({
        nomeCompleto: '',
        dataNascimento: undefined,
        sexo: undefined,
      });
      setDateInputValue('');
    }
  }, [isEditMode, pacienteParaEditar, reset]);

  const handleDateInputChange = (value: string) => {
    setDateInputValue(value);
    
    // Try to parse the date if it's complete
    if (value.length === 10) {
      const parsedDate = parse(value, 'dd/MM/yyyy', new Date());
      if (isValid(parsedDate)) {
        setValue('dataNascimento', parsedDate);
      }
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!user) return;

    setLoading(true);
    try {
      if (isEditMode && pacienteParaEditar) {
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
      setDateInputValue('');
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
            <div className="col-span-3 flex gap-2">
              <Controller
                name="dataNascimento"
                control={control}
                defaultValue={undefined}
                rules={{ required: 'Data de nascimento é obrigatória' }}
                render={({ field }) => (
                  <>
                    <InputMask
                      mask="99/99/9999"
                      value={dateInputValue}
                      onChange={(e) => handleDateInputChange(e.target.value)}
                      placeholder="DD/MM/AAAA"
                    >
                      {(inputProps: any) => <Input {...inputProps} className="flex-1" />}
                    </InputMask>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          type="button"
                        >
                          <CalendarIcon className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            if (date) {
                              setDateInputValue(format(date, 'dd/MM/yyyy'));
                            }
                          }}
                          captionLayout="dropdown-buttons"
                          fromYear={1920}
                          toYear={new Date().getFullYear()}
                          disabled={(date) =>
                            date > new Date() || date < new Date('1900-01-01')
                          }
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </>
                )}
              />
            </div>
            {errors.dataNascimento && (
              <p className="col-span-4 text-sm text-red-500 mt-1">
                {errors.dataNascimento.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="sexo" className="text-right pt-2">
              Identidade de Gênero
            </Label>
            <div className="col-span-3">
              <Controller
                name="sexo"
                control={control}
                defaultValue={undefined}
                rules={{ required: 'Identidade de gênero é obrigatória' }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a identidade de gênero" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel className="text-[11px] uppercase tracking-wide text-gray-400">Cisgênero</SelectLabel>
                        <SelectItem value="Homem Cisgênero">Homem Cisgênero</SelectItem>
                        <SelectItem value="Mulher Cisgênero">Mulher Cisgênero</SelectItem>
                      </SelectGroup>
                      <SelectSeparator />
                      <SelectGroup>
                        <SelectLabel className="text-[11px] uppercase tracking-wide text-gray-400">Homem Trans</SelectLabel>
                        <SelectItem value="Homem Trans (sem cirurgia)">Homem Trans (sem cirurgia genital)</SelectItem>
                        <SelectItem value="Homem Trans (com cirurgia)">Homem Trans (com cirurgia genital)</SelectItem>
                      </SelectGroup>
                      <SelectSeparator />
                      <SelectGroup>
                        <SelectLabel className="text-[11px] uppercase tracking-wide text-gray-400">Mulher Trans</SelectLabel>
                        <SelectItem value="Mulher Trans (sem cirurgia)">Mulher Trans (sem cirurgia genital)</SelectItem>
                        <SelectItem value="Mulher Trans (com cirurgia)">Mulher Trans (com cirurgia genital)</SelectItem>
                      </SelectGroup>
                      <SelectSeparator />
                      <SelectGroup>
                        <SelectLabel className="text-[11px] uppercase tracking-wide text-gray-400">Outras</SelectLabel>
                        <SelectItem value="Não-binário">Não-binário</SelectItem>
                        <SelectItem value="Prefiro não informar">Prefiro não informar</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-[10px] text-gray-400 mt-1 leading-snug">
                A seleção determina quais exames físicos serão exibidos no processo de enfermagem.
              </p>
            </div>
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
