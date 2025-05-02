
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThumbsUp, MessageSquare, Share2 } from 'lucide-react';

const TimelineEventCard = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">Administrador do Sistema</CardTitle>
              <CardDescription>Há 2 horas</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <h3 className="text-lg font-medium mb-2">Bem-vindo à Timeline!</h3>
          <p>
            Este é um espaço para compartilhar atualizações, notícias e eventos relacionados ao sistema.
            Todos os usuários podem participar e interagir.
          </p>
        </CardContent>
        <CardFooter className="border-t pt-4 flex justify-between">
          <Button variant="ghost" size="sm">
            <ThumbsUp className="mr-1 h-4 w-4" /> Curtir
          </Button>
          <Button variant="ghost" size="sm">
            <MessageSquare className="mr-1 h-4 w-4" /> Comentar
          </Button>
          <Button variant="ghost" size="sm">
            <Share2 className="mr-1 h-4 w-4" /> Compartilhar
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarFallback>SU</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">Sistema</CardTitle>
              <CardDescription>Ontem</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <h3 className="text-lg font-medium mb-2">Timeline Ativada</h3>
          <p>
            A funcionalidade de Timeline foi ativada com sucesso. Agora você pode acompanhar
            as atualizações e compartilhar informações com a equipe.
          </p>
        </CardContent>
        <CardFooter className="border-t pt-4 flex justify-between">
          <Button variant="ghost" size="sm">
            <ThumbsUp className="mr-1 h-4 w-4" /> Curtir
          </Button>
          <Button variant="ghost" size="sm">
            <MessageSquare className="mr-1 h-4 w-4" /> Comentar
          </Button>
          <Button variant="ghost" size="sm">
            <Share2 className="mr-1 h-4 w-4" /> Compartilhar
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TimelineEventCard;
