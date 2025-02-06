import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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

export const CostsDialog = ({
  isOpen,
  onClose,
  participantName,
  costs,
  onAddCost,
  onDeleteCost,
  totalParticipants,
}: CostsDialogProps) => {
  const [newCost, setNewCost] = useState({ amount: "", description: "" });

  const handleAddCost = () => {
    const amount = parseFloat(newCost.amount);
    if (isNaN(amount) || amount <= 0 || !newCost.description.trim()) {
      return;
    }
    onAddCost(amount, newCost.description.trim());
    setNewCost({ amount: "", description: "" });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCost();
    }
  };

  const totalCosts = costs.reduce((sum, cost) => sum + cost.amount, 0);
  const equalShare = totalParticipants > 0 ? totalCosts / totalParticipants : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Custos - {participantName}</DialogTitle>
          <DialogDescription>
            Total de custos: R$ {totalCosts.toFixed(2)}
            {totalParticipants > 0 && (
              <span className="block text-sm text-muted-foreground">
                Valor por pessoa: R$ {equalShare.toFixed(2)}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            {costs?.map((cost) => (
              <div
                key={cost.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div>
                  <p className="font-medium">R$ {cost.amount.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">{cost.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive/90"
                  onClick={() => onDeleteCost(cost.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleAddCost();
            }}
            className="space-y-2"
          >
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Valor"
                value={newCost.amount}
                onChange={(e) => setNewCost(prev => ({ ...prev, amount: e.target.value }))}
                onKeyPress={handleKeyPress}
                className="w-1/3"
                min="0"
                step="0.01"
                required
              />
              <Input
                placeholder="Descrição"
                value={newCost.description}
                onChange={(e) => setNewCost(prev => ({ ...prev, description: e.target.value }))}
                onKeyPress={handleKeyPress}
                className="flex-1"
                required
              />
              <Button type="submit" variant="default">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};