
import React, { useState } from "react";
import { Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TimelineEvent } from "@/types/timeline";
import TimelineEventForm from "./TimelineEventForm";
import { useToast } from "@/hooks/use-toast";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/services/firebase";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface TimelineEventActionsProps {
  event: TimelineEvent;
  onUpdate: () => Promise<void>;
}

const TimelineEventActions: React.FC<TimelineEventActionsProps> = ({ event, onUpdate }) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      if (!event.id) return;

      await deleteDoc(doc(db, "timelineEvents", event.id));
      
      toast({
        title: "Evento excluído",
        description: "O evento foi removido da linha do tempo.",
      });
      
      onUpdate();
    } catch (error) {
      console.error("Erro ao excluir evento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o evento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <div className="flex gap-2 mt-4 self-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setEditDialogOpen(true)}
          className="text-amber-600 border-amber-200 hover:bg-amber-50"
        >
          <Edit className="h-4 w-4 mr-1" /> Editar
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setDeleteDialogOpen(true)}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          <Trash className="h-4 w-4 mr-1" /> Excluir
        </Button>
      </div>

      {/* Dialog de edição */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Evento da Linha do Tempo</DialogTitle>
          </DialogHeader>
          <TimelineEventForm 
            initialData={event}
            onSuccess={() => {
              setEditDialogOpen(false);
              onUpdate();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja excluir este evento da linha do tempo? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TimelineEventActions;
