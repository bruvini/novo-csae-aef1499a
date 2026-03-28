
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { HeartPulse, UserPlus, LogIn, ClipboardCheck } from 'lucide-react';

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="py-6 px-4 md:px-8 border-b bg-white">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-8 h-8 text-csae-green-600" />
            <span className="text-xl font-bold text-gray-800">CSAE Floripa</span>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button className="bg-csae-green-600 hover:bg-csae-green-700" asChild>
              <Link to="/registrar">Cadastrar</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <div className="max-w-4xl w-full grid md:grid-cols-2 gap-12 items-center">
          <div className="text-left space-y-6">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
              A evolução do <span className="text-csae-green-600">Processo de Enfermagem</span> em Florianópolis.
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              O Portal CSAE Floripa 2.0 é a ferramenta oficial para gestão de diagnósticos, intervenções e resultados de enfermagem da rede municipal de saúde.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" className="bg-csae-green-600 hover:bg-csae-green-700 text-lg py-6" asChild>
                <Link to="/registrar">
                  <UserPlus className="mr-2 h-5 w-5" />
                  Criar minha conta
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg py-6 border-csae-green-600 text-csae-green-600 hover:bg-csae-green-50" asChild>
                <Link to="/login">
                  <LogIn className="mr-2 h-5 w-5" />
                  Acessar conta existente
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <Card className="shadow-md border-l-4 border-l-csae-green-600 animate-fade-in">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <ClipboardCheck className="w-6 h-6 text-csae-green-600" />
                  Portal em Transição
                </CardTitle>
                <CardDescription>
                  Estamos reconstruindo o portal para melhor atendê-los.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-gray-600">
                <p>
                  Você já pode realizar seu cadastro. Após a solicitação, cada perfil será validado manualmente pela coordenação municipal de enfermagem.
                </p>
              </CardContent>
            </Card>

            <img 
              src="/logo_csae.png" 
              alt="Logo CSAE Floripa" 
              className="mx-auto h-32 w-auto opacity-50 grayscale hover:grayscale-0 transition-all cursor-default" 
            />
          </div>
        </div>
      </main>

      <footer className="py-8 border-t bg-gray-100 text-gray-500 text-sm text-center">
        <p>© 2026 Secretaria Municipal de Saúde de Florianópolis. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default Index;
