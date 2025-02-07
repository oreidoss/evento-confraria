import React from 'react';
import { useNavigate } from 'react-router-dom';

interface EventListItemProps {
  id: string;
  title: string;
  participantsCount: number;
  totalValue: number;
  valuePerParticipant: number;
  status: "active" | "finished";
  onFinalize?: () => void;
  onReopen?: () => void;
  onDelete?: () => void;
}

export function EventListItem({
  id,
  title,
  participantsCount,
  totalValue,
  valuePerParticipant,
  status,
  onFinalize,
  onReopen,
  onDelete
}: EventListItemProps) {
  const navigate = useNavigate();

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center p-4 border-b hover:bg-gray-50">
      {/* Nome e Status */}
      <div className="flex items-center gap-2 mb-2 md:mb-0 w-full md:w-1/4">
        <span className="text-base">{title}</span>
        <span className={`px-2 py-0.5 rounded-full text-xs ${
          status === 'active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {status === 'active' ? 'Ativo' : 'Finalizado'}
        </span>
      </div>

      {/* Informações */}
      <div className="grid grid-cols-2 md:flex md:flex-row gap-2 md:gap-8 text-gray-600 w-full md:w-2/4">
        <div className="text-sm">
          <span className="text-gray-500">Participantes:</span> {participantsCount}
        </div>

        <div className="text-sm">
          <span className="text-gray-500">Total:</span> {formatCurrency(totalValue)}
        </div>

        <div className="text-sm col-span-2 md:col-span-1">
          <span className="text-gray-500">Por pessoa:</span> {formatCurrency(valuePerParticipant)}
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-4 mt-2 md:mt-0 md:ml-auto text-sm">
        <button
          onClick={() => navigate(`/evento/${id}`)}
          className="text-blue-600 hover:underline"
        >
          Ver Detalhes
        </button>
        {status === 'active' && onFinalize && (
          <button
            onClick={onFinalize}
            className="text-red-600 hover:underline"
          >
            Finalizar
          </button>
        )}
        {status === 'finished' && onReopen && (
          <button
            onClick={onReopen}
            className="text-green-600 hover:underline"
          >
            Reabrir
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="text-red-600 hover:underline"
            title="Excluir evento"
          >
            Excluir
          </button>
        )}
      </div>
    </div>
  );
} 