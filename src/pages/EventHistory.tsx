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
      
      // Buscar eventos básicos
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .order('date', { ascending: false });

      if (eventsError) throw eventsError;

      // Para cada evento, buscar participantes e custos
      const eventsWithDetails = await Promise.all(
        (eventsData || []).map(async (event) => {
          // Buscar número de participantes confirmados
          const { count: participantsCount } = await supabase
            .from("event_participants")
            .select("*", { count: "exact", head: true })
            .eq("event_id", event.id)
            .eq("status", "confirmed");

          // Buscar valor total dos custos
          const { data: costDetails } = await supabase
            .from("detalhe_de_custo")
            .select("valor_por_participante")
            .eq("event_id", event.id);

          const totalValue = costDetails?.reduce(
            (sum, item) => sum + (Number(item.valor_por_participante) || 0),
            0
          ) || 0;

          return {
            ...event,
            participantsCount: participantsCount || 0,
            totalValue,
            valuePerParticipant: participantsCount ? totalValue / participantsCount : 0
          };
        })
      );

      setEvents(eventsWithDetails);
    } catch (err) {
      console.error("Erro ao carregar eventos:", err);
      setError("Erro ao carregar eventos");
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const diasDaSemana = [
      'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 
      'Quinta-feira', 'Sexta-feira', 'Sábado'
    ];
    const diaDaSemana = diasDaSemana[date.getDay()];
    const dia = date.getDate().toString().padStart(2, '0');
    const mes = (date.getMonth() + 1).toString().padStart(2, '0');
    const ano = date.getFullYear();
    const hora = date.getHours().toString().padStart(2, '0');
    const minutos = date.getMinutes().toString().padStart(2, '0');

    return `${diaDaSemana}, ${dia}/${mes}/${ano} às ${hora}:${minutos}`;
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
    <div className="min-h-screen bg-[#F8F7FF] p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Cabeçalho */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Histórico de Eventos
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Veja todos os eventos realizados e seus detalhes.
          </p>
        </div>

        {/* Botão de Criar Novo Evento */}
        <div className="flex justify-center sm:justify-end mb-6 sm:mb-8">
          <button
            onClick={() => navigate("/novo-evento")}
            className="w-full sm:w-auto bg-[#10B981] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-[#0EA874] transition-colors flex items-center justify-center gap-2"
          >
            <span>+</span>
            Criar Novo Evento
          </button>
        </div>

        {/* Tabela de Eventos - Versão Desktop */}
        <div className="hidden sm:block bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-6 gap-4 p-4 bg-gray-50 border-b font-medium text-gray-600">
            <div className="col-span-2">Nome do Evento</div>
            <div>Status</div>
            <div>Participantes</div>
            <div>Valor Total</div>
            <div>Ações</div>
          </div>

          <div className="divide-y">
            {events.map((event) => (
              <div key={event.id} className="grid grid-cols-6 gap-4 p-4 items-center hover:bg-gray-50">
                <div className="col-span-2">
                  <div className="font-medium text-gray-900 mb-1">{event.title}</div>
                  <div className="text-blue-500 bg-blue-50 px-3 py-1 rounded-md inline-block text-sm">
                    {event.date ? formatDateTime(event.date) : 'Data não definida'}
                  </div>
                </div>
                
                <div>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                    event.status === "active"
                      ? "bg-[#E8FFF3] text-[#10B981]"
                      : "bg-red-100 text-red-600"
                  }`}>
                    {event.status === "active" ? "Em andamento" : "Finalizado"}
                  </span>
                </div>
                
                <div className="text-gray-600">
                  {event.participantsCount || 0}
                </div>
                
                <div className="text-gray-900 font-medium">
                  {formatCurrency(event.totalValue || 0)}
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate(`/evento/${event.id}`)}
                    className="text-[#10B981] hover:text-[#0EA874]"
                    title="Visualizar"
                  >
                    👁️
                  </button>
                  
                  {event.status === "active" ? (
                    <button
                      onClick={() => handleFinalize(event.id)}
                      className="text-green-600 hover:text-green-700"
                      title="Finalizar"
                    >
                      ✓
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReopen(event.id)}
                      className="text-blue-600 hover:text-blue-700"
                      title="Reabrir"
                    >
                      ↺
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="text-red-500 hover:text-red-600"
                    title="Excluir"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cards de Eventos - Versão Mobile */}
        <div className="sm:hidden space-y-4">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold mb-2">{event.title}</h3>
                  <div className="text-blue-500 bg-blue-50 px-3 py-1 rounded-md inline-block">
                    {event.date ? formatDateTime(event.date) : 'Data não definida'}
                  </div>
                </div>
                <span className="inline-block px-4 py-1 rounded-full bg-[#E8FFF3] text-[#10B981] text-sm">
                  {event.status === "active" ? "Em andamento" : "Finalizado"}
                </span>
              </div>

              {/* Valores em linha */}
              <div className="flex gap-12 mb-4">
                <div className="flex flex-col">
                  <span className="text-gray-600 text-sm">Participantes</span>
                  <span className="font-medium text-xl">
                    {event.participantsCount || 0}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-gray-600 text-sm">Valor Total</span>
                  <span className="font-medium text-xl">
                    {formatCurrency(event.totalValue || 0)}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-gray-600 text-sm">Valor por pessoa</span>
                  <span className="font-medium text-xl">
                    {formatCurrency((event.totalValue || 0) / (event.participantsCount || 1))}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  onClick={() => navigate(`/evento/${event.id}`)}
                  className="text-[#10B981] hover:text-[#0EA874]"
                  title="Visualizar"
                >
                  👁️
                </button>
                
                {event.status === "active" ? (
                  <button
                    onClick={() => handleFinalize(event.id)}
                    className="text-green-600 hover:text-green-700"
                    title="Finalizar"
                  >
                    ✓
                  </button>
                ) : (
                  <button
                    onClick={() => handleReopen(event.id)}
                    className="text-blue-600 hover:text-blue-700"
                    title="Reabrir"
                  >
                    ↺
                  </button>
                )}
                
                <button
                  onClick={() => handleDeleteEvent(event.id)}
                  className="text-red-500 hover:text-red-600"
                  title="Excluir"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default EventHistory;
