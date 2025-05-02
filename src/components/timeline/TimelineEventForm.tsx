
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

const TimelineEventForm = () => {
  const [titulo, setTitulo] = React.useState('');
  const [conteudo, setConteudo] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Evento criado:', { titulo, conteudo });
    setTitulo('');
    setConteudo('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adicionar Evento</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título do evento"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="conteudo">Conteúdo</Label>
            <Textarea
              id="conteudo"
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              placeholder="O que está acontecendo?"
              required
              className="min-h-[100px]"
            />
          </div>
          <Button type="submit" className="w-full">
            <Send className="mr-2 h-4 w-4" /> Publicar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TimelineEventForm;
