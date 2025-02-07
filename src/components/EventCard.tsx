import React from 'react';
import { useNavigate } from 'react-router-dom';

interface EventCardProps {
  id: string;
  title: string;
  participantes: number;
  valorTotal: number;
  valorPorParticipante: number;
  status: string;
  onFinalizar?: () => void;
  onReabrir?: () => void;
}

export function EventCard({
  id,
  title,
  participantes,
  valorTotal,
  valorPorParticipante,
  status,
  onFinalizar,
  onReabrir
}: EventCardProps) {
  const navigate = useNavigate();

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <div className="bg-white hover:bg-gray-50 transition-colors p-4 border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <h3 className="text-lg font-medium text-gray-800">{title}</h3>
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              status === 'Ativo' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}
          >
            {status}
          </span>
        </div>

        <div className="flex items-center space-x-8 flex-1">
          <div className="text-sm">
            <span className="text-gray-500">Participantes:</span>
            <span className="ml-2 font-medium">{participantes}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">Total:</span>
            <span className="ml-2 font-medium">{formatCurrency(valorTotal)}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">Por pessoa:</span>
            <span className="ml-2 font-medium">{formatCurrency(valorPorParticipante)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/evento/${id}`)}
            className="text-blue-600 hover:underline text-sm"
          >
            Ver Detalhes
          </button>
          {status === 'Ativo' && onFinalizar && (
            <button
              onClick={onFinalizar}
              className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
            >
              Finalizar
            </button>
          )}
          {status === 'Finalizado' && onReabrir && (
            <button
              onClick={onReabrir}
              className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded transition-colors"
            >
              Reabrir
            </button>
          )}
        </div>
      </div>
    </div>
  );
}