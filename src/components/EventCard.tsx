import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, DollarSign, Split } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface EventCardProps {
  id: string;
  title: string;
  date: string;
  description?: string;
  status?: string;
}

export const EventCard = ({ id, title, date, description, status }: EventCardProps) => {
  const navigate = useNavigate();

  // Fetch participants and costs for this event
  const { data: eventData, refetch } = useQuery({
    queryKey: ["event-details", id],
    queryFn: async () => {
      // Get confirmed participants
      const { data: participants } = await supabase
        .from("event_participants")
        .select("*")
        .eq("event_id", id)
        .eq("status", "confirmed");

      // Get total costs
      const { data: costs } = await supabase
        .from("detalhe_de_custo")
        .select("valor_por_participante")
        .eq("event_id", id);

      const totalParticipants = participants?.length || 0;
      const totalCosts = costs?.reduce((sum, cost) => sum + Number(cost.valor_por_participante), 0) || 0;
      const splitAmount = totalParticipants > 0 ? totalCosts / totalParticipants : 0;

      return {
        totalParticipants,
        totalCosts,
        splitAmount
      };
    }
  });

  // Subscribe to real-time changes
  useEffect(() => {
    const participantsChannel = supabase
      .channel('event-participants-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_participants',
          filter: `event_id=eq.${id}`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    const costsChannel = supabase
      .channel('event-costs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'detalhe_de_custo',
          filter: `event_id=eq.${id}`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(participantsChannel);
      supabase.removeChannel(costsChannel);
    };
  }, [id, refetch]);

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-2xl font-semibold">{title}</h3>
          {status === 'finished' ? (
            <span className="inline-block px-4 py-1 text-sm rounded-full bg-red-100 text-[#ea384c] mt-2">
              Finalizado
            </span>
          ) : (
            <span className="inline-block px-4 py-1 text-sm rounded-full bg-primary/10 text-primary mt-2">
              Em andamento
            </span>
          )}
        </div>

        <div className="space-y-2 text-center text-gray-600 dark:text-gray-300">
          <p className="text-lg">
            Participantes: {eventData?.totalParticipants || 0}
          </p>
          <p className="text-lg">
            Valor Total: R$ {(eventData?.totalCosts || 0).toFixed(2)}
          </p>
          <p className="text-lg">
            Valor por Participante: R$ {(eventData?.splitAmount || 0).toFixed(2)}
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() => navigate(`/evento/${id}`)}
            className="bg-primary hover:bg-primary/90"
          >
            Ver Detalhes
          </Button>
        </div>
      </div>
    </Card>
  );
};