import { format } from "date-fns";

interface EventHeaderProps {
  title: string;
  description?: string;
  date: string;
  numero: number; // Adicionando o número do evento
}

export const EventHeader = ({ title, description, date, numero }: EventHeaderProps) => {
  return (
    <div className="space-y-2 pt-2">
      <h1 className="text-2xl sm:text-3xl font-bold text-center bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent animate-gradient">
        Nº {numero}: {title} {/* Exibindo o número do evento */}
      </h1>
      <div className="flex flex-col items-center gap-1 text-muted-foreground">
        <p className="text-sm">{description}</p>
        <p className="text-xs">Data: {format(new Date(date), 'dd/MM/yyyy')}</p>
      </div>
    </div>
  );
};
