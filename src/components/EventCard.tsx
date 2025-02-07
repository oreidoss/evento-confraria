import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface EventCardProps {
  id: string;
  title: string;
  participantes: number;
  valorTotal: number;
  valorPorParticipante: number;
  status: string;
  onFinalizar?: () => void;
  onReabrir?: () => void;
  onDelete: () => void;
}

export function EventCard({
  id,
  title,
  participantes,
  valorTotal = 0,
  valorPorParticipante = 0,
  status,
  onFinalizar,
  onReabrir,
  onDelete
}: EventCardProps) {
  const navigate = useNavigate();

  const formatCurrency = (value: number = 0) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      if (!window.confirm('Tem certeza que deseja excluir este evento permanentemente?')) {
        return;
      }

      console.log('Iniciando exclusão do evento:', eventId);

      // 1. Primeiro excluir os custos
      const { data: costData, error: costError } = await supabase
        .from('detalhe_de_custo')
        .delete()
        .eq('event_id', eventId);

      if (costError) {
        console.error('Erro ao excluir custos:', costError);
        throw costError;
      }
      console.log('Custos excluídos');

      // 2. Excluir participantes do evento
      const { data: participantsData, error: participantsError } = await supabase
        .from('event_participants')
        .delete()
        .eq('event_id', eventId);

      if (participantsError) {
        console.error('Erro ao excluir participantes:', participantsError);
        throw participantsError;
      }
      console.log('Participantes excluídos');

      // 3. Finalmente excluir o evento
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .select();

      if (eventError) {
        console.error('Erro ao excluir evento:', eventError);
        throw eventError;
      }
      console.log('Evento excluído');

      // Recarregar a página após sucesso
      alert('Evento excluído com sucesso!');
      window.location.reload();

    } catch (error) {
      console.error('Erro completo:', error);
      alert('Erro ao excluir evento. Verifique o console para mais detalhes.');
    }
  };

  return (
    <div className="bg-white hover:bg-gray-50 p-4 border-b">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        {/* Nome e Status */}
        <div className="flex items-center gap-2">
          <span className="text-base">{title}</span>
          <span className={`text-xs ${
            status === 'Ativo' 
              ? 'text-green-600' 
              : 'text-red-600'
          }`}>
            {status}
          </span>
        </div>

        {/* Informações */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Participantes: {participantes}</span>
          <span>Total: {formatCurrency(valorTotal)}</span>
          <span>Por pessoa: {formatCurrency(valorPorParticipante)}</span>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-4 ml-auto text-sm">
          <button
            onClick={() => navigate(`/evento/${id}`)}
            className="text-blue-600 hover:underline"
          >
            Ver Detalhes
          </button>
          {status === 'Ativo' && onFinalizar && (
            <button
              onClick={onFinalizar}
              className="text-red-600 hover:underline"
            >
              Finalizar
            </button>
          )}
          {status === 'Finalizado' && onReabrir && (
            <button
              onClick={onReabrir}
              className="text-green-600 hover:underline"
            >
              Reabrir
            </button>
          )}
          <button
            onClick={() => handleDeleteEvent(id)}
            className="text-red-600 hover:underline"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}