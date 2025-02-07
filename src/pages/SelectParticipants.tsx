import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SelectParticipantsHeader } from "@/components/SelectParticipantsHeader";
import { EventHeader } from "@/components/EventHeader";
import { ParticipantManager } from "@/components/ParticipantManager";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DatabaseTypes } from "@/types/database.types";

type Event = DatabaseTypes["public"]["Tables"]["events"]["Row"];

const SelectParticipants = () => {
  const { eventId } = useParams();
  const queryClient = useQueryClient();
  const [event, setEvent] = useState<Event>({
    id: "",
    title: "",
    description: "",
    date: "",
    numero: 0,
    status: "active",
    created_at: "",
    participantsCount: 0,
    totalValue: 0,
    valuePerParticipant: 0,
  });

  const { data: eventParticipants } = useQuery({
    queryKey: ["event-participants", eventId],
    queryFn: async () => {
      const { data: participantsData, error: participantsError } =
        await supabase
          .from("event_participants")
          .select(
            `
          id,
          participant_id,
          participant_name,
          status
        `
          )
          .eq("event_id", eventId);

      if (participantsError) throw participantsError;
      return participantsData;
    },
  });

  const { data: availableParticipants } = useQuery({
    queryKey: ["participants"],
    queryFn: async () => {
      const { data, error } = await supabase.from("participants").select("*");

      if (error) throw error;
      return data;
    },
  });

  const selectedParticipants =
    eventParticipants
      ?.filter((ep) => ep.status === "confirmed")
      .map((ep) => ep.participant_id) || [];

  const addParticipantMutation = useMutation({
    mutationFn: async (participant: { name: string; email?: string }) => {
      // First insert into participants table
      const { data: newParticipant, error: participantError } = await supabase
        .from("participants")
        .insert([participant])
        .select()
        .single();

      if (participantError) throw participantError;

      // Then insert into event_participants with both participant_id and participant_name
      const { error: eventParticipantError } = await supabase
        .from("event_participants")
        .insert([
          {
            event_id: eventId,
            participant_id: newParticipant.id,
            participant_name: newParticipant.name,
            status: "pending",
          },
        ]);

      if (eventParticipantError) throw eventParticipantError;

      return newParticipant;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participants"] });
      queryClient.invalidateQueries({
        queryKey: ["event-participants", eventId],
      });
      queryClient.invalidateQueries({
        queryKey: ["confirmed-participants", eventId],
      });
      queryClient.invalidateQueries({
        queryKey: ["participants-count", eventId],
      });
      toast.success("Participante adicionado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao adicionar participante.");
    },
  });

  const handleToggleParticipant = async (participantId: string) => {
    try {
      // Get participant name first
      const { data: participant } = await supabase
        .from("participants")
        .select("name")
        .eq("id", participantId)
        .single();

      if (!participant) {
        toast.error("Participante não encontrado");
        return;
      }

      const { data: existingParticipants, error: checkError } = await supabase
        .from("event_participants")
        .select("*")
        .match({
          event_id: eventId,
          participant_id: participantId,
        });

      if (checkError) {
        console.error("Error checking participant:", checkError);
        toast.error("Erro ao verificar participante");
        return;
      }

      const existingParticipant = existingParticipants?.[0];
      const newStatus =
        existingParticipant?.status === "confirmed" ? "pending" : "confirmed";

      if (existingParticipant) {
        const { error: updateError } = await supabase
          .from("event_participants")
          .update({ status: newStatus })
          .match({
            event_id: eventId,
            participant_id: participantId,
          });

        if (updateError) {
          console.error("Error updating participant:", updateError);
          toast.error("Erro ao atualizar status do participante");
          return;
        }
      } else {
        const { error: insertError } = await supabase
          .from("event_participants")
          .insert([
            {
              event_id: eventId,
              participant_id: participantId,
              participant_name: participant.name,
              status: "pending",
            },
          ]);

        if (insertError) {
          console.error("Error inserting participant:", insertError);
          toast.error("Erro ao adicionar participante ao evento");
          return;
        }
      }

      queryClient.invalidateQueries({
        queryKey: ["event-participants", eventId],
      });
      queryClient.invalidateQueries({
        queryKey: ["confirmed-participants", eventId],
      });
      queryClient.invalidateQueries({
        queryKey: ["participants-count", eventId],
      });
      toast.success("Status do participante atualizado com sucesso!");
    } catch (error) {
      console.error("Error toggling participant:", error);
      toast.error("Erro ao atualizar status do participante");
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (error) throw error;
      if (data) {
        setEvent(data);
      }
    } catch (error) {
      console.error("Error fetching event details:", error);
    }
  };

  if (!event) {
    return (
      <div className="h-screen bg-[#F1F0FB] dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Carregando dados do evento...
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="h-screen bg-[#F1F0FB] dark:bg-gray-900 flex flex-col">
        <div className="flex-1 flex flex-col">
          <div className="flex flex-col flex-1">
            <EventHeader
              title={event.title}
              description={event.description}
              date={event.date}
              numero={event.numero}
            />

            <SelectParticipantsHeader
              eventId={eventId || ""}
              eventTitle={event.title}
            />

            <div className="flex-1">
              <ParticipantManager
                eventId={eventId || ""}
                availableParticipants={availableParticipants || []}
                selectedParticipants={selectedParticipants}
                onToggleParticipant={handleToggleParticipant}
                onAddParticipant={(data) => addParticipantMutation.mutate(data)}
              />
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default SelectParticipants;
