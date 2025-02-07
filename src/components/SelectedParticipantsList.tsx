import { useState } from "react";
import {
  useQuery,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ParticipantListHeader } from "./ParticipantListHeader";
import { CostsDialog } from "./CostsDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  DatabaseTypes,
  GetParticipantsWithCosts,
  ParticipantsWithCostsResponse,
} from "@/types/database.types";

interface SelectedParticipantsListProps {
  eventId: string;
}

type Participant = {
  id: string;
  name: string;
};

interface Cost {
  id: string;
  amount: number;
  description: string;
  balance: number;
}

interface CostsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  participantName: string;
  costs: Cost[];
  onAddCost: (amount: number, description: string) => void;
  onDeleteCost: (costId: string) => void;
  totalParticipants: number;
}

export const SelectedParticipantsList = ({
  eventId,
}: SelectedParticipantsListProps) => {
  const queryClient = useQueryClient();
  const [selectedParticipant, setSelectedParticipant] =
    useState<Participant | null>(null);
  const [costs, setCosts] = useState<Cost[]>([]);

  const {
    data: participants = [],
    isLoading,
  }: UseQueryResult<ParticipantsWithCostsResponse, Error> = useQuery({
    queryKey: ["event-participants", eventId],
    queryFn: async () => {
      if (!eventId) return [] as ParticipantsWithCostsResponse;

      const { data: result, error } = await supabase.rpc(
        "get_participants_with_costs",
        { event_id: eventId }
      );

      if (error) {
        console.error("Erro ao buscar participantes:", error);
        throw error;
      }

      return (result || []) as ParticipantsWithCostsResponse;
    },
    enabled: !!eventId,
  });

  const calculateTotalCosts = (costs: Array<{ amount: number }>) => {
    return costs.reduce((total, cost) => total + cost.amount, 0);
  };

  const totalCosts = participants.reduce(
    (total, p) => total + calculateTotalCosts(p.costs),
    0
  );
  const participantCount = participants.length;

  const handleAddCost = (amount: number, description: string) => {
    // Implementation for adding cost
  };

  const handleDeleteCost = (costId: string) => {
    // Implementation for deleting cost
  };

  return (
    <div className="space-y-4">
      <ParticipantListHeader
        eventId={eventId}
        participantCount={participantCount}
        totalCosts={totalCosts}
      />

      {isLoading ? (
        <div className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : participants.length > 0 ? (
        <div className="space-y-2">
          {participants.map((p) => (
            <div
              key={p.participant.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarFallback>
                    {p.participant.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{p.participant.name}</p>
                  <p className="text-sm text-gray-500">
                    Total: {formatCurrency(calculateTotalCosts(p.costs))}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setSelectedParticipant(p.participant)}
              >
                Ver Custos
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500">
          Nenhum participante selecionado
        </p>
      )}

      {selectedParticipant && (
        <CostsDialog
          isOpen={!!selectedParticipant}
          onClose={() => setSelectedParticipant(null)}
          participantName={selectedParticipant.name}
          costs={costs}
          onAddCost={handleAddCost}
          onDeleteCost={handleDeleteCost}
          totalParticipants={participantCount}
        />
      )}
    </div>
  );
};
