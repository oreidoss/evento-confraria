import React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Label } from "@/components/ui/label";

interface EventDatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
}

const EventDatePicker = ({ date, setDate }: EventDatePickerProps) => {
  return (
    <div className="space-y-2">
      <Label>Data do Evento</Label>
      <div className="grid gap-2">
        <Button
          variant="outline"
          type="button"
          className={`w-full justify-start text-left font-normal ${!date && "text-muted-foreground"}`}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP", { locale: ptBR }) : "Selecione uma data"}
        </Button>
        <div className="rounded-md border bg-white">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            locale={ptBR}
          />
        </div>
      </div>
    </div>
  );
};

export default EventDatePicker;