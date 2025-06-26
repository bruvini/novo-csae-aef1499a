import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HeartPulse, Users } from 'lucide-react';
const Index = () => {
  return <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex flex-col items-center justify-center flex-1 w-full px-4 py-12">
        <div className="text-center">
          <img src="/logo_csae.png" alt="Logo CSAE Floripa" className="mx-auto h-20 md:h-24 w-auto mb-8" />
          <Card className="max-w-2xl mx-auto shadow-lg animate-fade-in">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <HeartPulse className="w-12 h-12 text-csae-green-600" />
              </div>
              <CardTitle className="text-xl md:text-2xl text-csae-green-700">
                Estamos finalizando o Portal CSAE Floripa 2.0!
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-600 leading-relaxed space-y-4 px-4 md:px-6">
              <p>
                Sabemos que você está ansioso para conhecer tudo o que estamos preparando. Por isso, decidimos dar uma pausa estratégica para reconstruir o Portal com mais organização, velocidade e funcionalidades incríveis.
              </p>
              <p className="font-medium">
                Enquanto isso, você já pode garantir seu acesso futuro fazendo o cadastro!
              </p>
              <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-csae-green-600 hover:bg-csae-green-700">
                  <Link to="/registrar">Fazer meu cadastro</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>;
};
export default Index;