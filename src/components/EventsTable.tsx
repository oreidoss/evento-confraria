
import { EventActions } from "./EventActions";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card } from "@/components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface Event {
  id: string;
  title: string;
  status: string;
  participantsCount: number;
  totalContribution: number;
}

interface EventsTableProps {
  events: Event[];
  onFinishEvent: (eventId: string) => Promise<void>;
  onDeleteEvent: (eventId: string) => Promise<void>;
}

export const EventsTable = ({ events, onFinishEvent, onDeleteEvent }: EventsTableProps) => {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  useEffect(() => {
    const channel = supabase
      .channel('event-participants-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_participants',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["events"] });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [queryClient]);

  if (isMobile) {
    return (
      <div className="space-y-4">
        {events?.map((event) => {
          const valuePerParticipant = event.participantsCount > 0 
            ? event.totalContribution / event.participantsCount 
            : 0;

          return (
            <Card key={event.id} className="p-4">
              <div className="space-y-3">
                <div className="text-center">
                  <h3 className="text-2xl font-semibold">{event.title}</h3>
                  <span className={`inline-block mt-2 px-4 py-1 rounded-full text-sm ${
                    event.status === 'active' 
                      ? 'bg-primary/10 text-primary'
                      : 'bg-red-100 text-[#ea384c]'
                  }`}>
                    {event.status === 'active' ? 'Em andamento' : 'Finalizado'}
                  </span>
                </div>
                
                <div className="space-y-2 text-center text-gray-600 dark:text-gray-300">
                  <p className="text-lg">
                    Participantes: {event.participantsCount}
                  </p>
                  <p className="text-lg">
                    Valor Total: {formatCurrency(event.totalContribution)}
                  </p>
                  <p className="text-lg">
                    Valor por Participante: {formatCurrency(valuePerParticipant)}
                  </p>
                </div>

                <div className="pt-2">
                  <EventActions
                    eventId={event.id}
                    status={event.status}
                    onFinish={onFinishEvent}
                    onDelete={onDeleteEvent}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left border-b dark:border-gray-700">
            <th className="pb-4">Nome do Evento</th>
            <th className="pb-4">Status</th>
            <th className="pb-4">Participantes</th>
            <th className="pb-4">Valor Total</th>
            <th className="pb-4">Valor por Participante</th>
            <th className="pb-4">Ações</th>
          </tr>
        </thead>
        <tbody>
          {events?.map((event) => {
            const valuePerParticipant = event.participantsCount > 0 
              ? event.totalContribution / event.participantsCount 
              : 0;

            return (
              <tr key={event.id} className="border-b dark:border-gray-700">
                <td className="py-4">{event.title}</td>
                <td className="py-4">
                  <span className={`px-4 py-1 rounded-full text-sm ${
                    event.status === 'active' 
                      ? 'bg-primary/10 text-primary'
                      : 'bg-red-100 text-[#ea384c]'
                  }`}>
                    {event.status === 'active' ? 'Em andamento' : 'Finalizado'}
                  </span>
                </td>
                <td className="py-4">{event.participantsCount}</td>
                <td className="py-4 font-medium">{formatCurrency(event.totalContribution)}</td>
                <td className="py-4 font-medium">{formatCurrency(valuePerParticipant)}</td>
                <td className="py-4">
                  <EventActions
                    eventId={event.id}
                    status={event.status}
                    onFinish={onFinishEvent}
                    onDelete={onDeleteEvent}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
