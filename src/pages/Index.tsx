import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, LogIn, ArrowRight, KeyRound, Eye, EyeOff } from "lucide-react";
import { auth } from "@/services/firebase";
import { sendPasswordResetEmail } from "firebase/auth";

const Index = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const { user, login, loading: checkingAuth } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);

    try {
      await login(email, senha);
    } catch (err: unknown) {
      console.error("Erro no login:", err);
    } finally {
      setCarregando(false);
    }
  };

  const handleEsqueciSenha = async () => {
    if (!email) {
      toast({
        title: "E-mail necessário",
        description: "Por favor, insira seu e-mail funcional no campo acima para redefinir a senha.",
        variant: "destructive",
      });
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Instruções enviadas",
        description: "Um link de redefinição foi enviado para o seu e-mail.",
      });
    } catch (error: unknown) {
      console.error("Erro na redefinição:", error);
      toast({
        title: "Erro no envio",
        description: "Verifique o e-mail ou tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setMostrarSenha(!mostrarSenha);
  };

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-csae-green-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Hero-like Section with Login */}
      <main className="flex-1 container mx-auto px-4 flex flex-col items-center justify-center">
        <div className="max-w-6xl w-full grid md:grid-cols-2 gap-12 lg:gap-24 items-center">
          
          <div className="text-left space-y-8 animate-fade-in order-2 md:order-1">
            <div className="flex items-center gap-6 mb-8">
              <img 
                src="/logo_csae.png" 
                alt="Logo CSAE Floripa" 
                className="h-24 w-auto object-contain" 
              />
              <img 
                src="/logo_enfermagem_floripa.jpg" 
                alt="Logo Enfermagem Floripa" 
                className="h-24 w-auto object-contain mix-blend-multiply" 
                style={{ filter: "contrast(1.1) brightness(1.05)" }}
              />
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
              Gestão inteligente do <br />
              <span className="text-csae-green-600">Processo de Enfermagem.</span>
            </h1>
            
            <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
              Padronização, segurança de dados e agilidade na assistência à saúde da rede municipal. O Portal CSAE simplifica o registro e a consulta clínica.
            </p>
          </div>

          <div className="flex justify-center order-1 md:order-2">
            <Card className="w-full max-w-md shadow-2xl border-t-8 border-t-csae-green-600 transition-all duration-300">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                  <LogIn className="w-6 h-6 text-csae-green-600" />
                  Acesso Restrito
                </CardTitle>
                <CardDescription>
                  Identifique-se para acessar as ferramentas de gestão.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700 font-semibold">E-mail Corporativo</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="Insira seu e-mail funcional aqui" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 border-gray-200 focus-visible:ring-csae-green-500 transition-shadow"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" title="password" className="text-gray-700 font-semibold">Senha</Label>
                        <button 
                          type="button" 
                          onClick={handleEsqueciSenha}
                          disabled={resetLoading}
                          className="text-xs text-csae-green-600 hover:text-csae-green-700 hover:underline flex items-center gap-1 font-semibold transition-colors"
                        >
                          {resetLoading ? <Loader2 size={12} className="animate-spin" /> : <KeyRound size={12} />}
                          Esqueceu a senha?
                        </button>
                      </div>
                      <div className="relative">
                        <Input 
                          id="password" 
                          type={mostrarSenha ? "text" : "password"} 
                          placeholder="Insira sua senha aqui"
                          value={senha}
                          onChange={(e) => setSenha(e.target.value)}
                          className="h-12 border-gray-200 focus-visible:ring-csae-green-500 transition-shadow pr-12"
                          required
                        />
                        <button
                          type="button"
                          onClick={togglePasswordVisibility}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                        >
                          {mostrarSenha ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-csae-green-600 hover:bg-csae-green-700 h-12 text-lg font-semibold shadow-md active:scale-[0.98] transition-transform" disabled={carregando}>
                    {carregando ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Autenticando...
                      </>
                    ) : (
                      <>
                        Entrar na Plataforma
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex flex-col border-t bg-gray-50/20 rounded-b-lg p-6">
                <p className="text-sm text-center text-gray-600 leading-relaxed font-medium">
                  Ainda fazendo evoluções manuais? {" "}
                  <Link to="/registrar" className="text-csae-green-700 hover:underline font-bold inline-block md:block md:mt-1">
                    Clique aqui para criar sua conta e conhecer o futuro da enfermagem.
                  </Link>
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>

      <footer className="py-8 bg-white border-t text-gray-500 text-sm text-center mt-auto">
        <p>© {new Date().getFullYear()} Portal CSAE Floripa 2.0. Comissão Permanente de Sistematização da Assistência de Enfermagem (CSAE) e Enf. Bruno Vinícius - Todos os direitos reservados</p>
      </footer>
    </div>
  );
};

export default Index;
