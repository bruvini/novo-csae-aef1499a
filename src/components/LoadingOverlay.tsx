
import React from 'react';
import { Loader } from 'lucide-react';

interface LoadingOverlayProps {
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message = "Carregando recursos..." }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center gap-4">
        <Loader className="h-12 w-12 animate-spin text-csae-green-600" />
        <p className="text-lg font-medium text-csae-green-700">{message}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
