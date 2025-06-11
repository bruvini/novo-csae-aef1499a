
import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight, MessageSquare } from 'lucide-react';

interface DashboardBannerProps {
  userName?: string;
}

export const DashboardBanner: React.FC<DashboardBannerProps> = ({ userName }) => {
  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }} 
      animate={{ y: 0, opacity: 1 }} 
      transition={{ duration: 0.6 }}
      className="mb-8"
    >
      <Card className="overflow-hidden">
        <div className="relative flex flex-col md:flex-row">
          <div className="p-6 md:p-8 md:w-[60%] bg-gradient-to-r from-csae-green-50 to-white">
            <motion.div 
              initial={{ x: -20, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              transition={{ delay: 0.3 }}
            >
              {userName && (
                <p className="text-csae-green-700 font-medium mb-2">
                  Olá, {userName}!
                </p>
              )}
              <h2 className="text-2xl md:text-3xl font-bold text-csae-green-700 mb-3">
                Bem-vindo(a) ao Portal CSAE Floripa 2.0
              </h2>
              <p className="text-gray-600 mb-4">
                Agradecemos sua participação! Esta ferramenta foi
                desenvolvida para apoiar as práticas de enfermagem e
                melhorar a qualidade do atendimento. Sua opinião é
                importante para nosso aprimoramento contínuo.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/timeline">
                  <Button 
                    variant="default" 
                    className="bg-csae-green-600 hover:bg-csae-green-700 transition-all duration-300 group"
                  >
                    Conhecer nossa história
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/sugestoes">
                  <Button 
                    variant="outline" 
                    className="border-csae-green-300 text-csae-green-700 hover:bg-csae-green-50 group"
                  >
                    Deixar uma sugestão
                    <MessageSquare className="ml-2 h-4 w-4 transition-transform group-hover:translate-y-[-2px]" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
          <div className="md:w-[40%] bg-csae-green-100 flex items-center justify-center p-0">
            {/* Banner image or content can be added here */}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
