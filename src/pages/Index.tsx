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
import Footer from "@/components/Footer";
import { normalizarEmailAutenticacao } from "@/utils/auth";

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
    const emailNormalizado = normalizarEmailAutenticacao(email);
    if (!emailNormalizado) {
      toast({
        title: "E-mail necessário",
        description: "Por favor, insira seu e-mail funcional no campo acima para redefinir a senha.",
        variant: "destructive",
      });
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, emailNormalizado);
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
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-gradient-to-br from-csae-green-50 via-white to-emerald-50/70">
      {/* Hero-like Section with Login */}
      <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8 lg:px-12 2xl:px-16">
        <div className="grid w-full max-w-[1480px] items-center gap-10 sm:gap-14 md:grid-cols-2 lg:gap-20 2xl:gap-28">
          
          <div className="order-2 space-y-7 text-left animate-fade-in md:order-1 lg:space-y-9">
            <div className="mb-8 flex flex-wrap items-center gap-x-8 gap-y-5 lg:gap-x-12">
              <img 
                src="/logo_csae.png" 
                alt="Logo CSAE Floripa" 
                className="h-20 w-auto object-contain sm:h-24 lg:h-28"
              />
              <img 
                src="/logo_enfermagem_floripa.jpg" 
                alt="Logo Enfermagem Floripa" 
                className="h-20 w-auto max-w-[min(100%,20rem)] object-contain mix-blend-multiply sm:h-24 lg:h-28"
              />
            </div>
            
            <h1 className="text-4xl font-extrabold leading-[1.08] text-gray-900 sm:text-5xl lg:text-6xl 2xl:text-7xl">
              Gestão inteligente do{" "}
              <span className="text-csae-green-600">Processo de Enfermagem.</span>
            </h1>
            
            <p className="max-w-2xl text-lg leading-relaxed text-gray-600 sm:text-xl 2xl:text-2xl">
              Padronização, segurança de dados e agilidade na assistência à saúde da rede municipal. O Portal CSAE simplifica o registro e a consulta clínica.
            </p>
          </div>

          <div className="order-1 flex justify-center md:order-2 md:justify-end">
            <Card className="w-full max-w-[540px] border-t-8 border-t-csae-green-600 shadow-2xl transition-all duration-300 2xl:max-w-[600px]">
              <CardHeader className="space-y-2 p-7 text-center sm:p-9">
                <CardTitle className="flex items-center justify-center gap-2 text-2xl font-bold sm:text-3xl">
                  <LogIn className="h-6 w-6 text-csae-green-600 sm:h-7 sm:w-7" />
                  Acesso Restrito
                </CardTitle>
                <CardDescription>
                  Identifique-se para acessar as ferramentas de gestão.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-7 sm:px-9">
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
                        className="h-12 border-gray-200 transition-shadow focus-visible:ring-csae-green-500 sm:h-14"
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
                          className="h-12 border-gray-200 pr-12 transition-shadow focus-visible:ring-csae-green-500 sm:h-14"
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
                  <Button type="submit" className="h-12 w-full bg-csae-green-600 text-lg font-semibold shadow-md transition-transform hover:bg-csae-green-700 active:scale-[0.98] sm:h-14" disabled={carregando}>
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
              <CardFooter className="flex flex-col rounded-b-lg border-t bg-gray-50/20 p-7 sm:p-8">
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

      <Footer />
    </div>
  );
};

export default Index;
