import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface EventFormActionsProps {
  onSubmit: (e: React.FormEvent) => void;
}

const EventFormActions = ({ onSubmit }: EventFormActionsProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex gap-4">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => navigate("/")}
      >
        Cancelar
      </Button>
      <Button type="submit" className="w-full" onClick={onSubmit}>
        Criar Evento
      </Button>
    </div>
  );
};

export default EventFormActions;