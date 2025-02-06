import { Card } from "@/components/ui/card";
import { User } from "lucide-react";

interface Expense {
  id: string;
  user: string;
  description: string;
  amount: number;
  date: string;
}

interface ExpenseListProps {
  expenses: Expense[];
}

export const ExpenseList = ({ expenses }: ExpenseListProps) => {
  return (
    <div className="space-y-4">
      {expenses.map((expense, index) => (
        <Card 
          key={expense.id} 
          className="p-4 hover:shadow-sm transition-all duration-300 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 animate-fadeIn"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-100">{expense.description}</p>
                <p className="text-sm text-muted-foreground">{expense.user}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium text-primary">R$ {expense.amount.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">{expense.date}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};