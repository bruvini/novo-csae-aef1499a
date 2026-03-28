
import React from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "@/services/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Clock, LogOut, HeartPulse } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const WaitingApproval = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
      navigate("/");
    } catch (error) {
      console.error("Erro no logout:", error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-yellow-500">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <HeartPulse className="w-12 h-12 text-csae-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">Cadastro em Análise</CardTitle>
          <CardDescription>Obrigado por se juntar à evolução da enfermagem!</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="flex justify-center flex-col items-center gap-2 py-4">
            <div className="p-4 bg-yellow-50 rounded-full">
              <Clock className="w-12 h-12 text-yellow-600 animate-pulse" />
            </div>
            <p className="text-gray-600 mt-2 font-medium">Seus dados estão sendo analisados.</p>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            Por razões de segurança e LGPD, cada novo cadastro é validado individualmente pela administração municipal. Você receberá um e-mail informando a liberação de seu acesso em breve.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center border-t py-6 bg-gray-50 rounded-b-lg">
          <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Sair da conta
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default WaitingApproval;
