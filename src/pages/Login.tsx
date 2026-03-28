
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { HeartPulse, Loader2 } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      // Check user document for access status
      const userDoc = await getDoc(doc(db, "usuarios", user.uid));
      
      if (!userDoc.exists()) {
        toast({
          title: "Usuário não encontrado",
          description: "Não encontramos um perfil associado a esta conta no banco de dados.",
          variant: "destructive",
        });
        setCarregando(false);
        return;
      }

      const userData = userDoc.data();
      
      if (userData.statusAcesso === "Aguardando") {
        toast({
          title: "Acesso em análise",
          description: "Seu cadastro ainda está sendo analisado pela administração.",
          variant: "default",
        });
        // navigate("/"); // for now, keep on home or stay on login
      } else if (userData.statusAcesso === "Recusado") {
        toast({
          title: "Acesso negado",
          description: "Infelizmente seu acesso foi recusado pelo administrador.",
          variant: "destructive",
        });
      } else if (userData.statusAcesso === "Liberado") {
        toast({
          title: "Login realizado",
          description: `Bem-vindo de volta, ${userData.dadosPessoais?.nomeCompleto || "usuário"}.`,
        });
        
        // Redirect based on role if needed, or to a default dashboard
        if (userData.ehAdmin) {
          navigate("/gestao-usuarios");
        } else {
          navigate("/gestao-conteudos");
        }
      }

    } catch (error: any) {
      console.error("Erro no login:", error);
      let mensagem = "Erro ao realizar o login. Tente novamente.";
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        mensagem = "E-mail ou senha incorretos.";
      }
      toast({
        title: "Erro no login",
        description: mensagem,
        variant: "destructive",
      });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-csae-green-600">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <HeartPulse className="w-12 h-12 text-csae-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">Portal CSAE Floripa</CardTitle>
          <CardDescription>Acesse sua conta para gerenciar o processo de enfermagem</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="exemplo@sms.floripa.sc.gov.br" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
              </div>
              <Input 
                id="password" 
                type="password" 
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-csae-green-600 hover:bg-csae-green-700" disabled={carregando}>
              {carregando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-gray-600">
            Ainda não tem uma conta?{" "}
            <Link to="/registrar" className="text-csae-green-600 hover:underline font-semibold">
              Cadastre-se aqui
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
