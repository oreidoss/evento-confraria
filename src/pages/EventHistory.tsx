import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { DatabaseTypes } from "@/types/database.types";
import { EventCard } from '@/components/EventCard';
import { EventListItem } from '@/components/EventListItem';

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
      setLoading(true);
      // Primeiro, buscar os eventos básicos
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false });

      if (eventsError) throw eventsError;

      if (!eventsData) {
        setEvents([]);
        return;
      }

      // Para cada evento, buscar participantes e custos
      const eventsWithDetails = await Promise.all(
        eventsData.map(async (event) => {
          // Buscar participantes confirmados
          const { count: participantsCount } = await supabase
            .from("event_participants")
            .select("*", { count: "exact", head: true })
            .eq("event_id", event.id)
            .eq("status", "confirmed");

          // Buscar todos os custos do evento
          const { data: costDetails } = await supabase
            .from("detalhe_de_custo")
            .select("valor_por_participante")
            .eq("event_id", event.id);

          // Calcular valor total
          const totalValue = costDetails?.reduce(
            (sum, item) => sum + (Number(item.valor_por_participante) || 0),
            0
          ) || 0;

          // Calcular valor por participante
          const valuePerParticipant = participantsCount && participantsCount > 0
            ? totalValue / participantsCount
            : 0;

          return {
            ...event,
            participantsCount: participantsCount || 0,
            totalValue,
            valuePerParticipant
          };
        })
      );

      setEvents(eventsWithDetails);
    } catch (err) {
      console.error("Erro ao buscar eventos:", err);
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

  const handleDeleteEvent = async (eventId: string) => {
    try {
      if (!window.confirm('Tem certeza que deseja excluir este evento permanentemente?')) {
        return;
      }

      // 1. Excluir registros de custos
      const { error: costError } = await supabase
        .from('detalhe_de_custo')
        .delete()
        .eq('event_id', eventId);

      if (costError) {
        console.error('Erro ao excluir custos:', costError);
        throw costError;
      }

      // 2. Excluir registros de participantes
      const { error: participantsError } = await supabase
        .from('event_participants')
        .delete()
        .eq('event_id', eventId);

      if (participantsError) {
        console.error('Erro ao excluir participantes:', participantsError);
        throw participantsError;
      }

      // 3. Excluir o evento
      const { error: eventError } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .single();

      if (eventError) {
        console.error('Erro ao excluir evento:', eventError);
        throw eventError;
      }

      // 4. Atualizar o estado local
      setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));

      alert('Evento excluído com sucesso!');

    } catch (error) {
      console.error('Erro completo:', error);
      alert('Erro ao excluir evento. Por favor, tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1F0FB] p-8">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#10B981]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F0FB] p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Histórico de Eventos</h1>
          <button
            onClick={() => navigate('/novo-evento')}
            className="px-4 py-2 bg-[#4ADE80] text-white rounded hover:bg-green-500 transition-colors"
          >
            Novo Evento
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          {/* Lista de eventos */}
          <div className="divide-y divide-gray-200">
            {events.map((event) => (
              <EventCard
                key={event.id}
                id={event.id}
                title={event.title}
                participantes={event.participantsCount}
                valorTotal={event.totalValue}
                valorPorParticipante={event.valuePerParticipant}
                status={event.status === 'active' ? 'Ativo' : 'Finalizado'}
                onFinalizar={() => handleFinalize(event.id)}
                onReabrir={() => handleReopen(event.id)}
                onDelete={() => handleDeleteEvent(event.id)}
              />
            ))}
          </div>

          {events.length === 0 && (
            <div className="text-center text-gray-500 p-8">
              Nenhum evento encontrado
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EventHistory;
