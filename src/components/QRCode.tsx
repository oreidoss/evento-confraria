import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const QRCode = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card 
      className="relative overflow-hidden p-6 transition-all duration-300 hover:shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col items-center space-y-4">
        <div className="text-sm font-medium text-muted-foreground">Escaneie para começar</div>
        <div className="relative w-48 h-48 bg-white p-4 rounded-lg shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" 
               style={{ transform: "translateX(-100%)" }}
          />
          <img 
            src="/placeholder.svg" 
            alt="QR Code" 
            className="w-full h-full object-contain"
          />
        </div>
        <Button 
          className="mt-4 transition-all duration-300"
          style={{
            transform: isHovered ? 'translateX(5px)' : 'translateX(0)',
          }}
        >
          Abrir WhatsApp
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};