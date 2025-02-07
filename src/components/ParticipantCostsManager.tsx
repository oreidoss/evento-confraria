import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { DatabaseTypes } from "@/types/database.types";

interface ParticipantCostsManagerProps {
  eventId: string;
  participantId: string;
}

type GetParticipantCostsArgs =
  DatabaseTypes["public"]["Functions"]["get_participant_costs"]["Args"];
type GetParticipantCostsReturns =
  DatabaseTypes["public"]["Functions"]["get_participant_costs"]["Returns"];
type AddParticipantCostArgs =
  DatabaseTypes["public"]["Functions"]["add_participant_cost"]["Args"];

export const ParticipantCostsManager = ({
  eventId,
  participantId,
}: ParticipantCostsManagerProps) => {
  const queryClient = useQueryClient();
  const [selectedParticipantId, setSelectedParticipantId] = useState<
    string | null
  >(null);
  const [newCost, setNewCost] = useState({ amount: "", description: "" });

  const { data: costs = [], isLoading } = useQuery({
    queryKey: ["participant-costs", eventId, participantId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_participant_costs", {
        p_event_id: eventId,
        p_participant_id: participantId,
      } as GetParticipantCostsArgs);

      if (error) {
        console.error("Error fetching participant costs:", error);
        throw error;
      }

      return (data as GetParticipantCostsReturns).map((cost) => ({
        id: cost.id,
        amount: cost.valor_por_participante,
        description: cost.descricao,
      }));
    },
    enabled: !!eventId && !!participantId,
  });

  const addCostMutation = useMutation({
    mutationFn: async ({
      amount,
      description,
    }: {
      amount: number;
      description: string;
    }) => {
      const { error } = await supabase.rpc("add_participant_cost", {
        p_event_id: eventId,
        p_participant_id: participantId,
        p_valor: amount,
        p_descricao: description,
      } as AddParticipantCostArgs);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["participant-costs", eventId],
      });
      setNewCost({ amount: "", description: "" });
      toast.success("Custo adicionado com sucesso!");
    },
    onError: (error) => {
      console.error("Error adding cost:", error);
      toast.error("Erro ao adicionar custo");
    },
  });

  const handleAddCost = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newCost.amount);
    if (isNaN(amount)) {
      toast.error("Valor inválido");
      return;
    }
    addCostMutation.mutate({
      amount,
      description: newCost.description,
    });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleAddCost} className="space-y-4">
        <div>
          <Label htmlFor="amount">Valor</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            value={newCost.amount}
            onChange={(e) =>
              setNewCost((prev) => ({ ...prev, amount: e.target.value }))
            }
            placeholder="0.00"
          />
        </div>
        <div>
          <Label htmlFor="description">Descrição</Label>
          <Input
            id="description"
            value={newCost.description}
            onChange={(e) =>
              setNewCost((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Descrição do custo"
          />
        </div>
        <Button
          type="submit"
          disabled={addCostMutation.isPending || !selectedParticipantId}
        >
          {addCostMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Adicionar Custo
        </Button>
      </form>

      {isLoading ? (
        <div className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : costs && costs.length > 0 ? (
        <div className="space-y-2">
          {costs.map((cost) => (
            <div
              key={cost.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div>
                <p className="font-medium">{cost.description}</p>
                <p className="text-sm text-gray-500">
                  {formatCurrency(cost.amount)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500">Nenhum custo registrado</p>
      )}
    </div>
  );
};
