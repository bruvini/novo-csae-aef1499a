
import React from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TimelineEvent } from "@/types/timeline";
import { Card, CardContent } from "@/components/ui/card";
import Image from "@/components/ui/image";
import TimelineEventActions from "./TimelineEventActions";

interface TimelineEventCardProps {
  event: TimelineEvent;
  index: number;
  onUpdate: () => Promise<void>;
  isAdmin: boolean;
}

const TimelineEventCard: React.FC<TimelineEventCardProps> = ({ 
  event, 
  index, 
  onUpdate,
  isAdmin
}) => {
  const isEven = index % 2 === 0;
  const formattedDate = event.dataEvento
    ? format(event.dataEvento.toDate(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : "";
  
  return (
    <div className={`flex flex-col md:flex-row items-center mb-16 ${isEven ? 'md:flex-row-reverse' : ''}`}>
      {/* Data do evento - sempre visível em mobile, alterna lado em desktop */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        viewport={{ once: true }}
        className={`md:w-1/6 mb-4 md:mb-0 text-center ${isEven ? 'md:text-left md:pl-6' : 'md:text-right md:pr-6'}`}
      >
        <div className="bg-csae-green-50 text-csae-green-800 font-medium py-2 px-4 rounded-lg inline-block">
          {formattedDate}
        </div>
      </motion.div>
      
      {/* Ponto central - visível apenas em desktop */}
      <div className="hidden md:block md:w-1/6 relative">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-csae-green-500 rounded-full z-20"></div>
      </div>
      
      {/* Conteúdo do evento */}
      <motion.div 
        initial={{ opacity: 0, x: isEven ? -30 : 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="md:w-4/6"
      >
        <Card className="overflow-hidden border-csae-green-100 h-full">
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              {/* Parte da imagem */}
              <div className={`relative overflow-hidden h-60 md:h-full ${isEven ? 'md:order-last' : ''}`}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10"></div>
                <div className="group relative h-full w-full">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.4 }}
                    className="h-full w-full"
                  >
                    <Image 
                      src={event.foto} 
                      alt={event.legendaFoto} 
                      className="h-full w-full object-cover"
                    />
                  </motion.div>
                  <div className="absolute bottom-0 left-0 right-0 z-20 p-4 text-white bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-sm font-light">{event.legendaFoto}</p>
                    <p className="text-xs italic opacity-75">Foto: {event.autoriaFoto}</p>
                  </div>
                </div>
              </div>
              
              {/* Parte do texto */}
              <div className="p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-csae-green-700 mb-1">
                    {event.titulo}
                  </h3>
                  <h4 className="text-lg italic text-gray-600 mb-4">
                    {event.subtitulo}
                  </h4>
                  <div className="text-gray-600 prose">
                    {event.textoRedacao.split('\n').map((paragraph, i) => (
                      <p key={i} className="mb-3">{paragraph}</p>
                    ))}
                  </div>
                </div>
                
                {isAdmin && (
                  <TimelineEventActions 
                    event={event} 
                    onUpdate={onUpdate}
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default TimelineEventCard;
