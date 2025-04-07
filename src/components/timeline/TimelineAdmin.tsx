
import React, { useState } from "react";
import { 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription, 
  DrawerFooter 
} from "@/components/ui/drawer";
import { TimelineEvent } from "@/types/timeline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import TimelineEventForm from "./TimelineEventForm";
import { Button } from "@/components/ui/button";
import { Plus, List } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";

interface TimelineAdminProps {
  onClose: () => void;
  onEventAdded: () => Promise<void>;
  events: TimelineEvent[];
}

const TimelineAdmin: React.FC<TimelineAdminProps> = ({ 
  onClose, 
  onEventAdded,
  events 
}) => {
  const [activeTab, setActiveTab] = useState<string>("create");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const filteredEvents = events.filter(event => 
    event.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.subtitulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.textoRedacao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DrawerContent className="max-h-[85vh]">
      <DrawerHeader>
        <DrawerTitle>Gerenciar Linha do Tempo</DrawerTitle>
        <DrawerDescription>
          Crie, edite e gerencie os eventos da linha do tempo do Portal CSAE Floripa.
        </DrawerDescription>
      </DrawerHeader>

      <Tabs 
        defaultValue="create" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full px-4"
      >
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="create" className="flex items-center gap-1">
            <Plus className="h-4 w-4" /> Novo Evento
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-1">
            <List className="h-4 w-4" /> Lista de Eventos
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="create" className="mt-4">
          <ScrollArea className="h-[60vh]">
            <div className="px-1 py-2">
              <TimelineEventForm 
                onSuccess={() => {
                  onEventAdded();
                  setActiveTab("list");
                }}
              />
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="list" className="mt-4">
          <div className="mb-4">
            <Input
              placeholder="Buscar eventos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          
          <ScrollArea className="h-[55vh]">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm
                  ? "Nenhum evento encontrado para a sua busca."
                  : "Nenhum evento cadastrado ainda."}
              </div>
            ) : (
              <div className="space-y-3 px-1">
                {filteredEvents.map((event) => (
                  <EventListItem 
                    key={event.id} 
                    event={event} 
                    onUpdate={onEventAdded}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
      
      <DrawerFooter>
        <Button variant="outline" onClick={onClose}>
          Fechar
        </Button>
      </DrawerFooter>
    </DrawerContent>
  );
};

// Componente secundário para exibir cada evento na lista
const EventListItem: React.FC<{ 
  event: TimelineEvent; 
  onUpdate: () => Promise<void>;
}> = ({ event, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  const formattedDate = event.dataEvento
    ? format(event.dataEvento.toDate(), "dd/MM/yyyy", { locale: ptBR })
    : "";
  
  if (isEditing) {
    return (
      <Card>
        <CardContent className="pt-6">
          <TimelineEventForm
            initialData={event}
            onSuccess={() => {
              onUpdate();
              setIsEditing(false);
            }}
          />
          <div className="mt-4 flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(false)}
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="hover:border-csae-green-200 transition-colors">
      <CardHeader className="p-4">
        <div className="flex justify-between">
          <div>
            <CardTitle className="text-lg">{event.titulo}</CardTitle>
            <CardDescription>{formattedDate} - {event.subtitulo}</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsEditing(true)}
          >
            Editar
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
};

export default TimelineAdmin;
