import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/lib/supabase";
import { toast } from "sonner";
import { ParticipantListHeader } from "./ParticipantListHeader";
import { CostsDialog } from "./CostsDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface SelectedParticipantsListProps {
  eventId: string;
}

interface Participant {
  id: string;
  participant_id: string;
  participant: {
    id: string;
    name: string;
    email: string | null;
  };
  totalCosts: number;
  balance: number;
}

type GetParticipantsWithCosts = Database['public']['Functions']['get_participants_with_costs'];
type ParticipantsWithCostsResponse = GetParticipantsWithCosts['Returns'];

export const SelectedParticipantsList = ({ eventId }: SelectedParticipantsListProps) => {
  const queryClient = useQueryClient();
  const [selectedParticipant, setSelectedParticipant] = useState<{
    id: string;
    name: string;
    participant_id: string;
  } | null>(null);

  const { data: participants, isLoading } = useQuery<Participant[]>({
    queryKey: ["event-participants", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      
      const { data: result, error } = await supabase.rpc<GetParticipantsWithCosts['Args'], ParticipantsWithCostsResponse>('get_participants_with_costs', {
        event_id: eventId
      });

      if (error) {
        console.error("Erro ao buscar participantes:", error);
        throw error;
      }

      if (!result) return [];

      return result.map((item) => ({
        id: item.id,
        participant_id: item.participant_id,
        participant: {
          id: item.participant_id,
          name: item.participant_name,
          email: item.email
        },
        totalCosts: Number(item.total_costs) || 0,
        balance: Number(item.balance) || 0
      }));
    },
    gcTime: 1000 * 60 * 5, // 5 minutos
    staleTime: 1000 * 60 // 1 minuto
  });

  const handleDelete = useMutation({
    mutationFn: async (participantId: string) => {
      const { error } = await supabase
        .from("event_participants")
        .delete()
        .eq("id", participantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-participants", eventId] });
      toast.success("Participante removido com sucesso");
    },
    onError: () => {
      toast.error("Erro ao remover participante");
    }
  });

  const handleUnconfirm = useMutation({
    mutationFn: async (participantId: string) => {
      const { data: eventParticipant, error: findError } = await supabase
        .from("event_participants")
        .select("id")
        .eq("event_id", eventId)
        .eq("participant_id", participantId)
        .single();

      if (findError) throw findError;

      const { error: updateError } = await supabase
        .from("event_participants")
        .update({ status: "pending" })
        .eq("id", eventParticipant.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-participants", eventId] });
      toast.success("Participação cancelada com sucesso");
    },
    onError: (error) => {
      console.error("Erro ao cancelar participação:", error);
      toast.error("Erro ao cancelar participação");
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const totalCosts = participants?.reduce((sum: number, participant: Participant) => 
    sum + participant.totalCosts, 0) || 0;

  return (
    <div className="rounded-lg border bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-6 animate-fadeIn">
      <ParticipantListHeader 
        eventId={eventId}
        participantCount={participants?.length || 0}
        totalCosts={totalCosts}
      />

      <div className="space-y-4">
        {participants?.map((participant: Participant) => {
          const isReceiving = participant.balance > 0;
          
          return (
            <div
              key={participant.id}
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-4 mb-2 sm:mb-0">
                <Avatar>
                  <AvatarFallback>
                    {participant.participant.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="font-medium text-gray-900">
                    {participant.participant.name}
                  </p>
                  <div className="flex flex-col text-sm">
                    <span className={`font-medium ${isReceiving ? 'text-green-600' : 'text-red-600'}`}>
                      {isReceiving ? 'Receber' : 'Pagar'}: {formatCurrency(Math.abs(participant.balance))}
                    </span>
                    <span className="text-gray-600">
                      Total: {formatCurrency(participant.totalCosts)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedParticipant({
                    id: participant.id,
                    name: participant.participant.name,
                    participant_id: participant.participant_id
                  })}
                >
                  Adicionar Valor
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUnconfirm.mutate(participant.participant_id)}
                  disabled={handleUnconfirm.isPending}
                >
                  {handleUnconfirm.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Cancelar"
                  )}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete.mutate(participant.id)}
                  disabled={handleDelete.isPending}
                >
                  {handleDelete.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Remover"
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedParticipant && (
        <CostsDialog
          isOpen={!!selectedParticipant}
          onClose={() => setSelectedParticipant(null)}
          participantName={selectedParticipant.name}
          costs={[]}
          onAddCost={() => {}}
          onDeleteCost={() => {}}
          totalParticipants={participants?.length || 0}
        />
      )}
    </div>
  );
};
