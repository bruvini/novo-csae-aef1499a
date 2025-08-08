
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { cadastrarPaciente } from '@/services/bancodados/pacientesDB';

interface ModalCadastroPacienteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPacienteCadastrado: () => void;
}

const ModalCadastroPaciente: React.FC<ModalCadastroPacienteProps> = ({
  open,
  onOpenChange,
  onPacienteCadastrado
}) => {
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [dataNascimento, setDataNascimento] = useState<Date>();
  const [sexo, setSexo] = useState<'Feminino' | 'Masculino' | ''>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user, sessionData } = useAuth();

  const isFormValid = nomeCompleto.trim() && dataNascimento && sexo;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid || !user || !dataNascimento) return;

    setLoading(true);
    
    try {
      await cadastrarPaciente(
        nomeCompleto.trim(),
        dataNascimento,
        sexo as 'Feminino' | 'Masculino',
        user.uid,
        sessionData?.uid
      );

      toast({
        title: "Paciente cadastrado com sucesso!",
        description: `${nomeCompleto} foi adicionado à sua lista de pacientes.`,
        variant: "default",
        className: "bg-green-50 border-green-200",
      });

      // Limpar formulário
      setNomeCompleto('');
      setDataNascimento(undefined);
      setSexo('');
      
      onOpenChange(false);
      onPacienteCadastrado();
    } catch (error: any) {
      console.error('Erro ao cadastrar paciente:', error);
      
      toast({
        title: "Erro ao cadastrar paciente",
        description: error.message || "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setNomeCompleto('');
    setDataNascimento(undefined);
    setSexo('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-csae-green-800">Cadastrar Novo Paciente</DialogTitle>
        </DialogHeader>

        {/* Disclaimer LGPD */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-2">Importante - Lei Geral de Proteção de Dados (LGPD)</p>
              <p className="leading-relaxed">
                Os dados do paciente são <strong>confidenciais</strong> e serão utilizados exclusivamente 
                para o acompanhamento de saúde. Estas informações <strong>não serão compartilhadas</strong> com 
                outros usuários do sistema. Como enfermeiro(a), você deve redobrar o cuidado no armazenamento 
                e manuseio dessas informações, respeitando o sigilo profissional.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome Completo */}
          <div className="space-y-2">
            <Label htmlFor="nomeCompleto" className="text-sm font-medium">
              Nome completo do paciente *
            </Label>
            <Input
              id="nomeCompleto"
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              placeholder="Digite o nome completo"
              className="w-full"
              disabled={loading}
            />
          </div>

          {/* Data de Nascimento */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Data de nascimento *
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dataNascimento && "text-muted-foreground"
                  )}
                  disabled={loading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataNascimento ? (
                    format(dataNascimento, "PPP", { locale: ptBR })
                  ) : (
                    <span>Selecione a data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataNascimento}
                  onSelect={setDataNascimento}
                  disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                  initialFocus
                  className="p-3 pointer-events-auto"
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Sexo */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Sexo *
            </Label>
            <Select value={sexo} onValueChange={(value) => setSexo(value as 'Feminino' | 'Masculino')}>
              <SelectTrigger className="w-full" disabled={loading}>
                <SelectValue placeholder="Selecione o sexo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Feminino">Feminino</SelectItem>
                <SelectItem value="Masculino">Masculino</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-600 leading-relaxed">
              <strong>Nota:</strong> Sabemos das questões de identidade de gênero; esta informação é 
              solicitada apenas para auxiliar na interpretação de achados de exame físico na etapa 
              "Avaliação" do Processo de Enfermagem.
            </p>
          </div>

          {/* Botões */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || loading}
              className="flex-1 csae-btn-primary"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ModalCadastroPaciente;
