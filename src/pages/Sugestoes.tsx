import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Send, ThumbsUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAutenticacao } from "@/services/autenticacao";
import Header from '@/components/Header';
import SimpleFooter from '@/components/SimpleFooter';
import { NavigationMenu } from '@/components/NavigationMenu';

const Sugestoes = () => {
  const [sugestao, setSugestao] = useState('');
  const [agradecimento, setAgradecimento] = useState('');
  const { usuario } = useAutenticacao();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!sugestao.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, insira sua sugestão antes de enviar.",
        variant: "destructive",
      });
      return;
    }

    // Aqui você pode adicionar a lógica para enviar a sugestão para o backend
    console.log("Sugestão enviada:", sugestao);

    // Limpar o campo de sugestão e exibir mensagem de agradecimento
    setSugestao('');
    setAgradecimento('Agradecemos sua sugestão! Sua opinião é muito importante para nós.');

    toast({
      title: "Sugestão enviada",
      description: "Agradecemos por sua contribuição!",
    });
  };

  const handleLike = () => {
    toast({
      title: "Obrigado!",
      description: "Agradecemos o seu feedback positivo!",
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>Sugestões | CSAE</title>
      </Helmet>

      <Header />
      <NavigationMenu activeItem="sugestoes" />

      <main className="container mx-auto px-4 py-8 flex-grow">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Compartilhe sua sugestão</CardTitle>
            <CardDescription>
              Sua opinião é muito importante para a melhoria contínua da plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {agradecimento ? (
              <div className="text-green-600 font-semibold">{agradecimento}</div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Textarea
                    placeholder="Digite sua sugestão aqui..."
                    value={sugestao}
                    onChange={(e) => setSugestao(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button className="ml-auto flex items-center gap-2 csae-btn-primary" type="submit">
                  Enviar <Send className="w-4 h-4" />
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            <Button variant="ghost" onClick={handleLike} className="csae-link">
              Gostou da plataforma? <ThumbsUp className="w-4 h-4 ml-2" />
            </Button>
            {usuario && (
              <div className="text-sm text-gray-500">
                Logado como: {usuario.displayName || usuario.email}
              </div>
            )}
          </CardFooter>
        </Card>
      </main>

      <SimpleFooter />
    </div>
  );
};

export default Sugestoes;
