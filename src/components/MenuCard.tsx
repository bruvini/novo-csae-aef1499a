
import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface MenuCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
}

const MenuCard = ({ title, description, icon: Icon, href }: MenuCardProps) => {
  return (
    <Link 
      to={href}
      className="block p-6 bg-white rounded-lg border border-csae-green-100 shadow-sm hover:shadow-md transition-all hover:border-csae-green-300 hover:-translate-y-1"
    >
      <div className="flex flex-col h-full">
        <div className="mb-4 text-csae-green-600">
          <Icon className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-semibold text-csae-green-700 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm flex-grow">{description}</p>
      </div>
    </Link>
  );
};

export default MenuCard;
