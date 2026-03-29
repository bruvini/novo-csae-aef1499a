import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { HeartPulse, Loader2, LogIn, UserPlus, ClipboardCheck, ArrowRight } from "lucide-react";
 
 const Index = () => {
   const [email, setEmail] = useState("");
   const [senha, setSenha] = useState("");
   const [carregando, setCarregando] = useState(false);
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
     } catch (err: any) {
       console.error("Erro no login:", err);
     } finally {
       setCarregando(false);
     }
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
      {/* Navbar Simple */}
      <nav className="py-6 px-4 md:px-8 bg-white border-b absolute top-0 w-full z-20">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-8 h-8 text-csae-green-600" />
            <span className="text-xl font-bold text-gray-800">Portal CSAE 2.0</span>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" className="hidden sm:inline-flex" asChild>
              <Link to="/registrar">
                <UserPlus size={18} className="mr-2" />
                Criar Conta
              </Link>
            </Button>
            <Link to="/registrar" className="sm:hidden text-csae-green-600 font-medium">Cadastrar</Link>
          </div>
        </div>
      </nav>

      {/* Hero-like Section with Login */}
      <main className="flex-1 container mx-auto px-4 pt-32 pb-12 flex flex-col items-center justify-center">
        <div className="max-w-6xl w-full grid md:grid-cols-2 gap-12 lg:gap-24 items-center">
          
          <div className="text-left space-y-8 animate-fade-in order-2 md:order-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-csae-green-100 text-csae-green-700 text-sm font-semibold mb-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-csae-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-csae-green-500"></span>
              </span>
              Plataforma Oficial SMS Florianópolis
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
              Gestão inteligente do <br />
              <span className="text-csae-green-600">Processo de Enfermagem.</span>
            </h1>
            
            <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
              Padronização, segurança de dados e agilidade na assistência à saúde da rede municipal. O Portal CSAE simplifica o registro e a consulta clínica.
            </p>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 group">
                <div className="bg-white p-3 rounded-2xl shadow-sm border group-hover:border-csae-green-500 transition-colors">
                  <ClipboardCheck className="text-csae-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Portal em Evolução</h3>
                  <p className="text-sm text-gray-500">Garantindo a melhor experiência para os enfermeiros.</p>
                </div>
              </div>
            </div>
            
            <div className="pt-4">
              <img 
                src="/logo_csae.png" 
                alt="Logo CSAE Floripa" 
                className="h-16 w-auto opacity-40 grayscale hover:grayscale-0 transition-all" 
              />
            </div>
          </div>

          <div className="flex justify-center order-1 md:order-2">
            <Card className="w-full max-w-md shadow-2xl border-t-8 border-t-csae-green-600 transform md:rotate-1 hover:rotate-0 transition-transform duration-500">
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
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail Corporativo</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="seu.nome@sms.floripa.sc.gov.br" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Senha</Label>
                      <Link to="#" className="text-xs text-csae-green-600 hover:underline">Esqueceu a senha?</Link>
                    </div>
                    <Input 
                      id="password" 
                      type="password" 
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className="h-12"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-csae-green-600 hover:bg-csae-green-700 h-12 text-lg font-semibold" disabled={carregando}>
                    {carregando ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Entrando...
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
              <CardFooter className="flex flex-col border-t bg-gray-50/80 rounded-b-lg">
                <p className="text-sm text-center text-gray-500 py-4">
                  Novo na rede? {" "}
                  <Link to="/registrar" className="text-csae-green-600 hover:underline font-bold">
                    Crie sua conta agora
                  </Link>
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>

      <footer className="py-8 bg-white border-t text-gray-500 text-sm text-center mt-auto">
        <p>© 2026 Secretaria Municipal de Saúde de Florianópolis. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default Index;
