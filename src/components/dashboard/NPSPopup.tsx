
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageSquare, Star, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NPSPopupProps {
  onClose: () => void;
  accessCount: number;
}

export const NPSPopup: React.FC<NPSPopupProps> = ({ onClose, accessCount }) => {
  const [rating, setRating] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = () => {
    if (rating === null) {
      toast({
        title: "Avaliação necessária",
        description: "Por favor, selecione uma nota para continuar.",
        variant: "destructive",
      });
      return;
    }

    // Here you could send the rating to your database
    console.log(`User submitted NPS rating: ${rating}`);
    
    toast({
      title: "Obrigado pela sua avaliação!",
      description: "Sua opinião é muito importante para nós.",
    });
    
    setSubmitted(true);
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-lg sm:text-xl font-bold text-csae-green-700">
            {!submitted ? "Sua opinião é importante!" : "Obrigado pela sua avaliação!"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {!submitted 
              ? `Após ${accessCount} acessos, gostaríamos de saber sua opinião sobre o Portal CSAE.` 
              : "Agradecemos por contribuir com o aprimoramento do Portal CSAE Floripa."}
          </DialogDescription>
        </DialogHeader>
        
        {!submitted ? (
          <>
            <div className="py-4">
              <p className="text-center mb-4 font-medium">
                De 1 a 10, o quanto você recomendaria o Portal CSAE para um colega?
              </p>
              
              <div className="flex justify-center items-center gap-2 flex-wrap">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    onClick={() => setRating(num)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center 
                      transition-all duration-200 
                      ${rating === num 
                        ? 'bg-csae-green-600 text-white shadow-md scale-110' 
                        : 'bg-gray-100 hover:bg-csae-green-50 text-gray-700 hover:text-csae-green-700'}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              
              {rating !== null && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-csae-green-600 font-medium">
                    {rating >= 9 
                      ? "Excelente! Você é um promotor do Portal CSAE!" 
                      : rating >= 7 
                        ? "Bom! Você está satisfeito com o Portal CSAE." 
                        : "Obrigado pela sua honestidade. Vamos trabalhar para melhorar!"}
                  </p>
                </div>
              )}
            </div>
            
            <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                <X className="mr-2 h-4 w-4" />
                Fechar
              </Button>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto order-1 sm:order-2">
                <Button 
                  onClick={handleSubmit} 
                  className="bg-csae-green-600 hover:bg-csae-green-700 w-full"
                >
                  <Star className="mr-2 h-4 w-4" />
                  Enviar avaliação
                </Button>
              </div>
            </DialogFooter>
          </>
        ) : (
          <div className="py-4 flex flex-col items-center">
            <p className="text-center mb-6">
              Sua opinião nos ajuda a melhorar continuamente. 
              Deseja compartilhar mais detalhes ou fazer sugestões específicas?
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button 
                variant="outline"
                onClick={onClose}
                className="w-full"
              >
                <X className="mr-2 h-4 w-4" />
                Talvez depois
              </Button>
              
              <Button 
                className="bg-csae-green-600 hover:bg-csae-green-700 w-full"
                asChild
              >
                <Link to="/sugestoes">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Ir para Sugestões
                </Link>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
