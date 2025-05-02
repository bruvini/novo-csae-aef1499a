
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const TimelineAdmin = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Administração da Timeline</CardTitle>
        <CardDescription>
          Gerencie os eventos e configurações da timeline
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <p>Total de eventos: 0</p>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Novo Evento Global
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimelineAdmin;
