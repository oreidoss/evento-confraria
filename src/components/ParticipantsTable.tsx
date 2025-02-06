import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { User, Calendar, DollarSign } from "lucide-react";

interface Participant {
  name: string;
  event: string;
  contribution: number;
  status: "paid" | "pending" | "receiving";
}

const participants: Participant[] = [
  {
    name: "Otero",
    event: "Churras de Peixe",
    contribution: 160,
    status: "pending",
  },
  {
    name: "Ricardo",
    event: "Churras de Peixe",
    contribution: 896,
    status: "receiving",
  },
  {
    name: "Levy",
    event: "Churras de Peixe",
    contribution: 250,
    status: "receiving",
  },
  {
    name: "Fabinho",
    event: "Churras de Peixe",
    contribution: 0,
    status: "pending",
  },
  {
    name: "Elza",
    event: "Churras de Peixe",
    contribution: 0,
    status: "pending",
  },
];

export const ParticipantsTable = () => {
  return (
    <div className="rounded-lg border bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-6 animate-fadeIn">
      <h3 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent mb-6">
        Participantes e Contribuições
      </h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-primary" />
                <span>Participante</span>
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>Evento</span>
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span>Contribuição</span>
              </div>
            </TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {participants.map((participant) => (
            <TableRow key={participant.name}>
              <TableCell className="font-medium">{participant.name}</TableCell>
              <TableCell>{participant.event}</TableCell>
              <TableCell>R$ {participant.contribution.toFixed(2)}</TableCell>
              <TableCell>
                <div
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${
                      participant.status === "paid"
                        ? "bg-success/10 text-success"
                        : participant.status === "receiving"
                        ? "bg-primary/10 text-primary"
                        : "bg-warning/10 text-warning"
                    }`}
                >
                  {participant.status === "paid"
                    ? "Pago"
                    : participant.status === "receiving"
                    ? "A Receber"
                    : "Pendente"}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};