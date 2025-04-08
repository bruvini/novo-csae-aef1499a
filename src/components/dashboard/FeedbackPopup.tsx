
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { 
  Star,
  StarHalf,
  Sparkles,
  ThumbsUp
} from "lucide-react";

interface FeedbackPopupProps {
  userName: string;
  accessCount: number;
  uid: string;
  onClose: () => void;
}

export const FeedbackPopup: React.FC<FeedbackPopupProps> = ({
  userName, 
  accessCount,
  uid,
  onClose
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [nps, setNps] = useState<number | null>(null);
  const [sugestao, setSugestao] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (nps === null) {
      toast({
        title: "Avaliação necessária",
        description: "Por favor, selecione uma nota de 0 a 10.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, "sugestoes"), {
        nps,
        sugestao: sugestao || "Usuário não deixou comentário",
        uid,
        nome: userName,
        createdAt: serverTimestamp(),
        tipo: "feedback-automatico"
      });

      toast({
        title: "Feedback enviado!",
        description: "Obrigado por compartilhar sua opinião conosco.",
      });
      
      handleClose();
    } catch (error) {
      console.error("Erro ao salvar feedback:", error);
      toast({
        title: "Erro ao enviar feedback",
        description: "Ocorreu um erro ao enviar seu feedback. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 0; i <= 10; i++) {
      const isSelected = nps === i;
      stars.push(
        <Button
          key={i}
          type="button"
          variant={isSelected ? "default" : "outline"}
          className={`w-8 h-8 p-0 ${isSelected ? 'bg-csae-green-600 text-white' : 'text-gray-500'}`}
          onClick={() => setNps(i)}
        >
          {i}
        </Button>
      );
    }
    return stars;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <span>Uau, {userName}!</span>
            <Sparkles className="h-5 w-5 text-amber-500" />
          </DialogTitle>
          <DialogDescription className="text-center text-lg font-semibold">
            Este é seu {accessCount}º acesso ao Portal CSAE Floripa! 🎉
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-3">
          <div className="space-y-2">
            <p className="text-center text-sm">
              Queremos saber o que você está achando da plataforma:
            </p>
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium">De 0 a 10, quanto você recomendaria o Portal CSAE?</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {renderStars()}
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Não recomendaria</span>
                <span>Recomendaria muito</span>
              </div>
            </div>

            <div className="mt-4 pt-2">
              <label className="text-sm font-medium">Comente o que está achando:</label>
              <Textarea 
                placeholder="Sua opinião é muito importante para nós..."
                className="mt-1"
                rows={3}
                value={sugestao}
                onChange={(e) => setSugestao(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="flex flex-col gap-2 sm:gap-0">
          <Button 
            type="submit" 
            className="w-full bg-csae-green-600 hover:bg-csae-green-700"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            <ThumbsUp className="h-4 w-4 mr-2" />
            {isSubmitting ? "Enviando..." : "Enviar opinião"}
          </Button>
          <div className="text-center mt-2">
            <Link 
              to="/sugestoes"
              className="text-xs text-csae-green-700 hover:text-csae-green-800 hover:underline"
              onClick={handleClose}
            >
              Quer deixar uma sugestão mais completa? Acesse a página de sugestões
            </Link>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
