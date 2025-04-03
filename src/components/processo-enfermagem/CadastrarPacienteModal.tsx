import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Paciente, cadastrarPaciente } from "@/services/bancodados";
import { useAutenticacao } from "@/services/autenticacao";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Timestamp } from "firebase/firestore";

const formSchema = z.object({
  nomeCompleto: z.string().min(3, "O nome deve ter no mínimo 3 caracteres"),
  dataNascimento: z.date({
    required_error: "A data de nascimento é obrigatória",
  }),
  sexo: z.enum(["Masculino", "Feminino", "Outro"], {
    required_error: "Selecione o sexo do paciente",
  }),
});

interface CadastrarPacienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCadastrar: (paciente: Paciente) => void;
}

export function CadastrarPacienteModal({
  isOpen,
  onClose,
  onCadastrar,
}: CadastrarPacienteModalProps) {
  const { obterSessao } = useAutenticacao();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomeCompleto: "",
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
    setLoading(true);
    const sessao = obterSessao();

    if (!sessao) {
      toast({
        title: "Erro ao cadastrar",
        description: "Sessão não encontrada. Faça login novamente.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const idade = calcularIdade(values.dataNascimento);

      const novoPaciente: Omit<Paciente, "dataCadastro"> = {
        nomeCompleto: values.nomeCompleto.toUpperCase(),
        dataNascimento: Timestamp.fromDate(values.dataNascimento),
        idade,
        sexo: values.sexo,
        profissionalUid: sessao.uid,
        profissionalNome: sessao.nomeUsuario,
        evolucoes: [],
      };

      const id = await cadastrarPaciente(novoPaciente);

      onCadastrar({
        ...novoPaciente,
        id,
        dataCadastro: Timestamp.now(),
      });

      form.reset();
    } catch (error) {
      console.error("Erro ao cadastrar paciente:", error);
      toast({
        title: "Erro ao cadastrar",
        description: "Não foi possível cadastrar o paciente. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Paciente</DialogTitle>
          <DialogDescription>
            Preencha os dados do paciente para iniciar o processo de enfermagem.
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
              render={({ field }) => {
                const [dateInput, setDateInput] = useState(
                  field.value ? format(field.value, "dd/MM/aaaa") : ""
                );

                return (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Nascimento</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="dd/mm/aaaa"
                        value={dateInput}
                        onChange={(e) => {
                          setDateInput(e.target.value);
                        }}
                        onBlur={() => {
                          // Tenta converter a string digitada para Date
                          const dateParts = dateInput.split("/");
                          if (dateParts.length === 3) {
                            const day = Number(dateParts[0]);
                            const month = Number(dateParts[1]) - 1;
                            const year = Number(dateParts[2]);
                            const parsedDate = new Date(year, month, day);
                            if (!isNaN(parsedDate.getTime())) {
                              field.onChange(parsedDate);
                            } else {
                              field.onChange(null);
                            }
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
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
                {loading ? "Cadastrando..." : "Cadastrar Paciente"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
