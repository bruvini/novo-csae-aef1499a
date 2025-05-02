import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useToast } from "@/hooks/use-toast";
import { useAutenticacao } from "@/services/autenticacao";
import Header from '@/components/Header';
import SimpleFooter from '@/components/SimpleFooter';
import { NavigationMenu } from '@/components/NavigationMenu';
import TimelineEventForm from '@/components/timeline/TimelineEventForm';
import TimelineEventCard from '@/components/timeline/TimelineEventCard';
import TimelineAdmin from '@/components/timeline/TimelineAdmin';

const Timeline = () => {
  const { toast } = useToast();
  const { usuario, verificarAdmin } = useAutenticacao();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (verificarAdmin) {
      setIsAdmin(verificarAdmin());
    }
  }, [verificarAdmin]);

  return (
    <>
      <Helmet>
        <title>Timeline | CSAE</title>
      </Helmet>

      <div className="flex flex-col min-h-screen">
        <Header />
        <NavigationMenu />

        <main className="container mx-auto px-4 py-8 flex-grow">
          <h1 className="text-3xl font-semibold mb-6 text-csae-green-700">
            Linha do Tempo
          </h1>

          {isAdmin && (
            <div className="mb-6">
              <TimelineAdmin />
            </div>
          )}

          <div className="mb-6">
            <TimelineEventForm />
          </div>

          <div>
            <TimelineEventCard />
          </div>
        </main>

        <SimpleFooter />
      </div>
    </>
  );
};

export default Timeline;
