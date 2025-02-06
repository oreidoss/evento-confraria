import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ParticipantCostsManagerProps {
  eventId: string;
}

interface Cost {
  id: string;
  amount: number;
  description: string;
}

export const ParticipantCostsManager = ({ eventId }: ParticipantCostsManagerProps) => {
  const queryClient = useQueryClient();
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [newCost, setNewCost] = useState({ amount: "", description: "" });

  const { data: costs, isLoading } = useQuery({
    queryKey: ["participant-costs", selectedParticipantId, eventId],
    queryFn: async () => {
      if (!selectedParticipantId || !eventId) return [];
      
      const { data, error } = await supabase.rpc('get_participant_costs', {
        p_event_id: eventId,
        p_participant_id: selectedParticipantId
      });

      if (error) {
        console.error("Erro ao buscar custos:", error);
        throw error;
      }
      
      return data.map((cost: any) => ({
        id: cost.id,
        amount: cost.valor_por_participante,
        description: cost.descricao
      }));
    },
    enabled: !!selectedParticipantId && !!eventId
  });

  const addCostMutation = useMutation({
    mutationFn: async (data: { amount: number; description: string }) => {
      if (!selectedParticipantId || !eventId) {
        throw new Error("Participante não selecionado");
      }

      if (data.amount <= 0) {
        throw new Error("O valor deve ser maior que zero");
      }

      const { error } = await supabase.rpc('add_participant_cost', {
        p_event_id: eventId,
        p_participant_id: selectedParticipantId,
        p_valor: data.amount,
        p_descricao: data.description
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participant-costs"] });
      queryClient.invalidateQueries({ queryKey: ["event-participants"] });
      setNewCost({ amount: "", description: "" });
      toast.success("Custo adicionado com sucesso");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao adicionar custo: ${error.message}`);
    }
  });

  const deleteCostMutation = useMutation({
    mutationFn: async (costId: string) => {
      const { error } = await supabase
        .from("detalhe_de_custo")
        .delete()
        .eq("id", costId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participant-costs"] });
      queryClient.invalidateQueries({ queryKey: ["event-participants"] });
      toast.success("Custo removido com sucesso");
    },
    onError: () => {
      toast.error("Erro ao remover custo");
    }
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
      description: newCost.description
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleAddCost} className="space-y-4">
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Valor</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={newCost.amount}
              onChange={(e) => setNewCost(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0,00"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              value={newCost.description}
              onChange={(e) => setNewCost(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descrição do custo"
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={addCostMutation.isPending}
        >
          {addCostMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adicionando...
            </>
          ) : (
            "Adicionar Custo"
          )}
        </Button>
      </form>

      <div className="space-y-4">
        <h3 className="font-medium">Custos Registrados</h3>
        {costs?.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum custo registrado
          </p>
        ) : (
          <div className="space-y-2">
            {costs?.map((cost: Cost) => (
              <div
                key={cost.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
              >
                <div>
                  <p className="font-medium">{formatCurrency(cost.amount)}</p>
                  <p className="text-sm text-muted-foreground">
                    {cost.description}
                  </p>
                </div>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteCostMutation.mutate(cost.id)}
                  disabled={deleteCostMutation.isPending}
                >
                  {deleteCostMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Remover"
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};