
import { Button } from "@/components/ui/button";
import { Trash2, UserMinus } from "lucide-react";

interface ParticipantCardProps {
  id: string;
  name: string;
  email?: string;
  totalCosts: number;
  balance: number;
  onDelete: (id: string) => void;
  onSelect: () => void;
  onUnconfirm: (id: string) => void;
}

export const ParticipantCard = ({
  id,
  name,
  email,
  totalCosts,
  balance,
  onDelete,
  onSelect,
  onUnconfirm,
}: ParticipantCardProps) => {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-gray-700 shadow-sm hover:shadow-md transition-all">
      <div
        className="flex-1 cursor-pointer"
        onClick={onSelect}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <p className="text-sm font-medium">{name}</p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                Total: R$ {totalCosts?.toFixed(2) || "0.00"}
              </p>
              <p className="text-xs font-semibold">
                {balance > 0 ? 'Receber' : 'Pagar'}
              </p>
              <p className={`text-xs ${balance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {balance > 0 ? 'Receber' : 'Pagar'}: R$ {Math.abs(balance).toFixed(2)} ({balance > 0 ? '+R$' : '-R$'} {Math.abs(balance).toFixed(2)})
              </p>
            </div>
          </div>
        </div>
        {email && (
          <p className="text-xs text-muted-foreground">{email}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button {...{ variant: "outline", size: "sm", className: "flex items-center gap-1 text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 h-8 px-2 py-1 text-xs", onClick: () => onUnconfirm(id) }}>
          <UserMinus className="h-3 w-3" />
          <span>Remover Confirmação</span>
        </Button>
        <Button {...{ variant: "ghost", size: "sm", className: "text-destructive hover:text-destructive/90 h-8 w-8 p-0", onClick: () => onDelete(id) }}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};
