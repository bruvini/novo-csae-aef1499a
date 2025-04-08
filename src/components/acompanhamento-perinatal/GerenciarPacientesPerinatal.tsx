import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Alert, AlertDescription } from '@/components/ui/alert';
import CadastroPacientePerinatal from './CadastroPacientePerinatal';
import { useAutenticacao } from '@/services/autenticacao';
import { PacientePerinatal } from '@/services/bancodados/tipos';
import {
  buscarPacientesPerinatalPorProfissional,
  excluirPacientePerinatal
} from '@/services/bancodados';

interface GerenciarPacientesPerinatalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIniciarVigilancia: (paciente: PacientePerinatal) => void;
}

const GerenciarPacientesPerinatal: React.FC<GerenciarPacientesPerinatalProps> = ({ 
  open, 
  onOpenChange,
  onIniciarVigilancia
}) => {
  const { toast } = useToast();
  const { usuario } = useAutenticacao();
  const [tipoCadastro, setTipoCadastro] = useState<"mulher" | "bebê">("mulher");
  const [modoEdicao, setModoEdicao] = useState<boolean>(false);
  const [pacienteEmEdicao, setPacienteEmEdicao] = useState<PacientePerinatal | null>(null);
  const [pacientes, setPacientes] = useState<PacientePerinatal[]>([]);
  const [filtro, setFiltro] = useState('');
  const [tab, setTab] = useState('listar');

  useEffect(() => {
    if (open) {
      carregarPacientes();
    }
  }, [open]);

  const carregarPacientes = async () => {
    try {
      if (!usuario) return;
      
      const pacientesData = await buscarPacientesPerinatalPorProfissional(usuario.uid);
      
      setPacientes(pacientesData);
    } catch (error) {
      console.error("Erro ao carregar pacientes:", error);
      toast({
        title: "Erro ao carregar pacientes",
        description: "Por favor, tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  const excluirPaciente = async (id: string) => {
    try {
      if (!window.confirm("Tem certeza que deseja excluir este paciente? Esta ação não pode ser desfeita.")) {
        return;
      }

      await excluirPacientePerinatal(id);
      
      setPacientes(pacientes.filter((p) => p.id !== id));
      
      toast({
        title: "Paciente excluído",
        description: "O paciente foi excluído com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao excluir paciente:", error);
      toast({
        title: "Erro ao excluir paciente",
        description: "Por favor, tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  const editarPaciente = (paciente: PacientePerinatal) => {
    setModoEdicao(true);
    setPacienteEmEdicao(paciente);
    setTipoCadastro(paciente.tipoPaciente);
    setTab('cadastrar');
  };

  const pacientesFiltrados = pacientes.filter(paciente => 
    paciente.nome.toLowerCase().includes(filtro.toLowerCase())
  );

  const verificarPuerpera = (paciente: PacientePerinatal): boolean => {
    if (paciente.tipoPaciente !== "mulher" || !paciente.situacaoObstetrica || paciente.situacaoObstetrica !== "Puérpera") {
      return false;
    }

    if (!paciente.dataParto) {
      return true;
    }

    // Verificar se passaram menos de 42 dias do parto
    const dataAtual = new Date();
    const dataParto = paciente.dataParto.toDate();
    const diffTime = Math.abs(dataAtual.getTime() - dataParto.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= 42;
  };

  const verificarPrematuro = (paciente: PacientePerinatal): boolean => {
    return paciente.tipoPaciente === "bebê" && (paciente.idadeGestacionalNascer || 0) < 37;
  };

  const calcularIdade = (dataNascimento: Timestamp): string => {
    const hoje = new Date();
    const dataNasc = dataNascimento.toDate();
    
    const diffAnos = hoje.getFullYear() - dataNasc.getFullYear();
    const diffMeses = hoje.getMonth() - dataNasc.getMonth();
    const diffDias = hoje.getDate() - dataNasc.getDate();
    
    if (diffAnos > 0) {
      return `${diffAnos} ${diffAnos === 1 ? 'ano' : 'anos'}`;
    } else if (diffMeses > 0) {
      return `${diffMeses} ${diffMeses === 1 ? 'mês' : 'meses'}`;
    } else {
      return `${diffDias} ${diffDias === 1 ? 'dia' : 'dias'}`;
    }
  };

  const handleSalvarPaciente = (novoPaciente: Partial<PacientePerinatal>, resetForm: () => void) => {
    carregarPacientes();
    resetForm();
    setModoEdicao(false);
    setPacienteEmEdicao(null);
    setTab('listar');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-4xl min-h-[50vh]">
        <DialogHeader>
          <DialogTitle className="text-xl text-csae-green-700 flex items-center gap-2">
            <UserRound className="h-5 w-5" />
            Gerenciar Pacientes do Acompanhamento Perinatal
          </DialogTitle>
          <DialogDescription>
            Cadastre, edite e gerencie os pacientes para acompanhamento perinatal.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="listar">
              <Eye className="mr-2 h-4 w-4" />
              Lista de Pacientes
            </TabsTrigger>
            <TabsTrigger value="cadastrar">
              <PlusCircle className="mr-2 h-4 w-4" />
              {modoEdicao ? 'Editar Paciente' : 'Cadastrar Novo'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listar" className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Search className="h-4 w-4 text-gray-400" />
              <Input 
                type="text" 
                placeholder="Buscar por nome do paciente..." 
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="flex-1"
              />
            </div>

            {pacientesFiltrados.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <p>Nenhum paciente encontrado.</p>
                <Button 
                  onClick={() => setTab('cadastrar')}
                  className="mt-4 bg-csae-green-600 hover:bg-csae-green-700"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Cadastrar Novo Paciente
                </Button>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {pacientesFiltrados.map((paciente) => (
                <Card key={paciente.id} className={`border-l-4 ${
                  paciente.tipoPaciente === "mulher" 
                    ? paciente.situacaoObstetrica === "Gestante" 
                      ? "border-l-purple-400" 
                      : "border-l-pink-400"
                    : "border-l-blue-400"
                }`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg flex items-center gap-1">
                        {paciente.tipoPaciente === "mulher" ? (
                          <UserRound className="h-4 w-4 text-purple-600" />
                        ) : (
                          <Baby className="h-4 w-4 text-blue-600" />
                        )}
                        {paciente.nome}
                      </CardTitle>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => editarPaciente(paciente)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => excluirPaciente(paciente.id!)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Excluir</span>
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(paciente.dataNascimento.toDate(), "dd/MM/yyyy")} 
                      <span className="mx-1">•</span>
                      {calcularIdade(paciente.dataNascimento)}
                    </p>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {paciente.tipoPaciente === "mulher" && paciente.situacaoObstetrica && (
                      <p className="text-sm font-medium">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs mr-2 
                          ${paciente.situacaoObstetrica === "Gestante" 
                            ? "bg-purple-100 text-purple-800" 
                            : "bg-pink-100 text-pink-800"}`}>
                          {paciente.situacaoObstetrica}
                        </span>
                        {paciente.situacaoObstetrica === "Gestante" && paciente.idadeGestacional && (
                          <span>{paciente.idadeGestacional} semanas</span>
                        )}
                        {paciente.situacaoObstetrica === "Puérpera" && paciente.dataParto && (
                          <span>{format(paciente.dataParto.toDate(), "'Parto em' dd/MM/yyyy")}</span>
                        )}
                      </p>
                    )}
                    
                    {paciente.tipoPaciente === "bebê" && (
                      <div>
                        <p className="text-sm"><span className="font-medium">Mãe:</span> {paciente.nomeMae}</p>
                        {verificarPrematuro(paciente) && (
                          <p className="text-xs mt-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded inline-block">
                            Prematuro ({paciente.idadeGestacionalNascer} semanas)
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                  
                  {!verificarPuerpera(paciente) && paciente.tipoPaciente === "mulher" && 
                   paciente.situacaoObstetrica === "Puérpera" && paciente.dataParto && (
                    <CardContent className="pt-0">
                      <Alert variant="destructive" className="p-2">
                        <AlertDescription className="text-xs flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Puerpério encerrado (mais de 42 dias do parto)
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  )}
                  
                  <CardFooter className="pt-0">
                    <Button 
                      size="sm" 
                      onClick={() => {
                        onIniciarVigilancia(paciente);
                        onOpenChange(false);
                      }}
                      className="bg-csae-green-600 hover:bg-csae-green-700 w-full"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Iniciar Vigilância
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="cadastrar">
            <Tabs value={tipoCadastro} onValueChange={(v: "mulher" | "bebê") => setTipoCadastro(v)} className="w-full mb-4">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="mulher" disabled={modoEdicao}>
                  <UserRound className="mr-2 h-4 w-4" />
                  Mulher (Gestante/Puérpera)
                </TabsTrigger>
                <TabsTrigger value="bebê" disabled={modoEdicao}>
                  <Baby className="mr-2 h-4 w-4" />
                  Bebê (Criança)
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <CadastroPacientePerinatal 
              tipoPaciente={tipoCadastro}
              pacienteExistente={pacienteEmEdicao}
              onSalvar={handleSalvarPaciente}
              onCancelar={() => {
                setModoEdicao(false);
                setPacienteEmEdicao(null);
                setTab('listar');
              }}
            />
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="mt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            <X className="mr-2 h-4 w-4" />
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GerenciarPacientesPerinatal;
