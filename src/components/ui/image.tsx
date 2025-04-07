
import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
}

const Image = ({ 
  className, 
  src, 
  alt = "", 
  fallback = <div className="bg-gray-200 animate-pulse w-full h-full"></div>,
  ...props 
}: ImageProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {(isLoading || error) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          {fallback}
        </div>
      )}
      
      <img
        src={src}
        alt={alt}
        className={cn(
          "w-full h-full transition-opacity duration-300",
          isLoading || error ? "opacity-0" : "opacity-100"
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setError(true);
        }}
        {...props}
      />
    </div>
  );
};

export default Image;
