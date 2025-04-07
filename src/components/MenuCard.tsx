
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MenuCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
}

const MenuCard: React.FC<MenuCardProps> = ({ title, description, icon: Icon, href }) => {
  const navigate = useNavigate();
  
  const handleNavigate = () => {
    navigate(href);
  };
  
  return (
    <motion.div 
      whileHover={{ 
        scale: 1.03,
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
      }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        onClick={handleNavigate}
        className="h-full bg-white hover:bg-csae-green-50 transition-colors cursor-pointer border border-gray-200 hover:border-csae-green-200"
      >
        <CardHeader className="pb-2">
          <div className="bg-csae-green-50 text-csae-green-700 rounded-full w-10 h-10 flex items-center justify-center mb-3">
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="menu-card-title text-lg font-medium">{title}</h3>
        </CardHeader>
        
        <CardContent>
          <p className="text-gray-600 text-sm">{description}</p>
        </CardContent>
        
        <CardFooter className="pt-0">
          <div className="text-csae-green-600 text-sm font-medium flex items-center group">
            <span>Acessar</span>
            <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default MenuCard;
