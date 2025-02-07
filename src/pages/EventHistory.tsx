import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { DatabaseTypes } from "@/types/database.types";

type Event = {
  id: string;
  title: string;
  description: string;
  date: string;
  numero: number;
  status: "active" | "finished";
  created_at: string;
  participantsCount: number;
  totalValue: number;
  valuePerParticipant: number;
};

function EventHistory() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setError(null);

      // First, get the basic event data
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false });

      if (eventsError) throw eventsError;

      if (!eventsData) {
        setEvents([]);
        return;
      }

      // Then, for each event, get the participant count and costs
      const eventsWithDetails = await Promise.all(
        eventsData.map(async (event) => {
          // Get participant count
          const { count: participantsCount } = await supabase
            .from("event_participants")
            .select("*", { count: "exact", head: true })
            .eq("event_id", event.id)
            .eq("status", "confirmed");

          // Get costs
          const { data: costs } = await supabase
            .from("participant_costs")
            .select("valor_por_participante")
            .eq("event_id", event.id);

          const totalValue =
            costs?.reduce(
              (sum, cost) => sum + (cost.valor_por_participante || 0),
              0
            ) || 0;

          const valuePerParticipant = participantsCount
            ? totalValue / participantsCount
            : 0;

          return {
            ...event,
            participantsCount: participantsCount || 0,
            totalValue,
            valuePerParticipant,
          };
        })
      );

      setEvents(eventsWithDetails);
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
      setError(
        "Não foi possível carregar os eventos. Tente novamente mais tarde."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleFinalize = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from("events")
        .update({ status: "finished" })
        .eq("id", eventId);

      if (error) throw error;

      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === eventId ? { ...event, status: "finished" } : event
        )
      );
    } catch (err) {
      console.error("Erro ao finalizar evento:", err);
    }
  };

  const handleReopen = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from("events")
        .update({ status: "active" })
        .eq("id", eventId);

      if (error) throw error;

      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === eventId ? { ...event, status: "active" } : event
        )
      );
    } catch (err) {
      console.error("Erro ao reabrir evento:", err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Histórico de Eventos</h1>

      {loading ? (
        <div className="text-center">Carregando eventos...</div>
      ) : error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : events.length === 0 ? (
        <div className="text-center">Nenhum evento encontrado</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-semibold mb-4">{event.title}</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Participantes:</span>
                  <span className="font-medium">{event.participantsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor Total:</span>
                  <span className="font-medium">
                    {formatCurrency(event.totalValue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor por Participante:</span>
                  <span className="font-medium">
                    {formatCurrency(event.valuePerParticipant)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span
                    className={`font-medium ${
                      event.status === "active"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {event.status === "active" ? "Ativo" : "Finalizado"}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={() => navigate(`/evento/${event.id}`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Ver Detalhes
                </button>
                {event.status === "active" ? (
                  <button
                    onClick={() => handleFinalize(event.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Finalizar
                  </button>
                ) : (
                  <button
                    onClick={() => handleReopen(event.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    Reabrir
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EventHistory;
