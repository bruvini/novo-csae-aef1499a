
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/services/firebase";
import { TimelineEvent } from "@/types/timeline";
import Header from "@/components/Header";
import NavigationMenu from "@/components/NavigationMenu";
import MainFooter from "@/components/MainFooter";
import { useAutenticacao } from "@/services/autenticacao";
import TimelineEventCard from "@/components/timeline/TimelineEventCard";
import TimelineAdmin from "@/components/timeline/TimelineAdmin";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";

const Timeline = () => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { verificarAdmin } = useAutenticacao();
  const isAdmin = verificarAdmin();
  const { toast } = useToast();

  const loadTimelineEvents = async () => {
    try {
      setLoading(true);
      const eventsQuery = query(
        collection(db, "timelineEvents"),
        orderBy("dataEvento", "asc")
      );
      const querySnapshot = await getDocs(eventsQuery);
      
      const eventsList: TimelineEvent[] = [];
      querySnapshot.forEach((doc) => {
        eventsList.push({
          id: doc.id,
          ...doc.data() as Omit<TimelineEvent, "id">
        });
      });
      
      setEvents(eventsList);
    } catch (error) {
      console.error("Erro ao carregar eventos da timeline:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a linha do tempo.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimelineEvents();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <NavigationMenu />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-csae-green-700 mb-2">
            Nossa História
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Conheça a trajetória e evolução do Portal CSAE Floripa ao longo do tempo
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-16 h-16 border-t-4 border-csae-green-600 border-solid rounded-full animate-spin"></div>
          </div>
        ) : events.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center py-16"
          >
            <p className="text-xl text-gray-500">Ainda não há eventos na linha do tempo.</p>
            {isAdmin && (
              <p className="mt-4 text-csae-green-600">
                Como administrador, você pode começar a adicionar eventos agora.
              </p>
            )}
          </motion.div>
        ) : (
          <div className="relative">
            {/* Linha vertical central */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-csae-green-200 z-0 hidden md:block"></div>
            
            {/* Timeline Events */}
            <div className="relative z-10">
              {events.map((event, index) => (
                <TimelineEventCard 
                  key={event.id} 
                  event={event} 
                  index={index} 
                  onUpdate={loadTimelineEvents}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
            
            {/* Final da linha do tempo */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center py-20 mt-10"
            >
              <div className="relative h-24 mb-8">
                <div className="w-12 h-12 rounded-full bg-csae-green-100 absolute left-1/2 top-0 transform -translate-x-1/2 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-csae-green-500 animate-pulse"></div>
                </div>
                <svg className="absolute left-1/2 top-16 transform -translate-x-1/2" width="80" height="40" viewBox="0 0 80 40" fill="none">
                  <path d="M40 0C65 0 75 40 40 40C5 40 15 0 40 0Z" fill="none" stroke="#22c55e" strokeWidth="2" />
                </svg>
              </div>
              <p className="text-xl font-medium text-csae-green-700 italic">
                "A história do CSAE ainda está sendo escrita..."
              </p>
            </motion.div>
          </div>
        )}
      </main>

      {isAdmin && (
        <div className="fixed bottom-8 right-8 z-50">
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerTrigger asChild>
              <Button 
                className="rounded-full h-14 w-14 p-0 bg-csae-green-600 hover:bg-csae-green-700 shadow-lg flex items-center justify-center"
              >
                <PlusCircle className="h-8 w-8" />
                <span className="sr-only">Gerenciar linha do tempo</span>
              </Button>
            </DrawerTrigger>
            <TimelineAdmin 
              onClose={() => setDrawerOpen(false)}
              onEventAdded={loadTimelineEvents}
              events={events}
            />
          </Drawer>
        </div>
      )}

      <MainFooter />
    </div>
  );
};

export default Timeline;
