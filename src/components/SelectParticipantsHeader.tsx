import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EventStatusBadge } from "./EventStatusBadge";
import { EventValueCards } from "./EventValueCards";

interface SelectParticipantsHeaderProps {
  eventId: string;
  eventTitle?: string;
}

export const SelectParticipantsHeader = ({
  eventId,
  eventTitle,
}: SelectParticipantsHeaderProps) => {
  const navigate = useNavigate();

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-3 w-3" />
          Voltar
        </Button>
      </div>

      <div className="flex flex-col items-center text-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">{eventTitle || "Evento"}</h1>
        <EventStatusBadge status="Em andamento" />
        <EventValueCards eventId={eventId} />
      </div>
    </>
  );
};