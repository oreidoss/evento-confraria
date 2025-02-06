import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface Event {
  id: string
  title: string
  status: 'active' | 'finished'
  created_at: string
}

function EventHistory() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setError(null)
      
      const { data, error: eventsError } = await supabase
        .from('events')
        .select('id, title, status, created_at')

      if (eventsError) {
        console.error('Erro ao buscar eventos:', eventsError)
        throw eventsError
      }

      if (data) {
        console.log('Eventos encontrados:', data)
        setEvents(data)
      } else {
        console.log('Nenhum evento encontrado')
        setEvents([])
      }
    } catch (err) {
      console.error('Erro ao buscar dados:', err)
      setError('Não foi possível carregar os eventos. Tente novamente mais tarde.')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) {
      return 'R$ 0,00'
    }
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    })
  }

  const handleFinalize = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: 'finished' })
        .eq('id', eventId);

      if (error) throw error;

      // Atualiza a lista de eventos
      setEvents(events.map(event => 
        event.id === eventId 
          ? { ...event, status: 'finished' }
          : event
      ));
    } catch (err) {
      console.error('Erro ao finalizar evento:', err);
      alert('Erro ao finalizar o evento. Tente novamente.');
    }
  };

  const handleReopen = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: 'active' })
        .eq('id', eventId);

      if (error) throw error;

      // Atualiza a lista de eventos
      setEvents(events.map(event => 
        event.id === eventId 
          ? { ...event, status: 'active' }
          : event
      ));
    } catch (err) {
      console.error('Erro ao reabrir evento:', err);
      alert('Erro ao reabrir o evento. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F0FB] p-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="text-gray-600 hover:text-gray-800 flex items-center gap-2 mb-4 text-sm"
        >
          ← Voltar
        </button>

        <h1 className="text-3xl font-bold text-[#0EA5E9] text-center mb-2">
          Histórico de Eventos
        </h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          Veja todos os eventos realizados e seus detalhes.
        </p>

        <div className="flex justify-center mb-6">
          <button
            onClick={() => navigate('/criar-evento')}
            className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 transition-colors"
          >
            + Criar Novo Evento
          </button>
        </div>

        {/* Versão Desktop */}
        <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500 text-xs">
                  <th className="py-2 px-3 font-medium">Nome do Evento</th>
                  <th className="py-2 px-3 font-medium">Status</th>
                  <th className="py-2 px-3 font-medium text-center">Participantes</th>
                  <th className="py-2 px-3 font-medium text-right">Valor Total</th>
                  <th className="py-2 px-3 font-medium text-right">Por Pessoa</th>
                  <th className="py-2 px-3 font-medium text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50 text-sm">
                    <td className="py-2 px-3">{event.title}</td>
                    <td className="py-2 px-3">
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${
                        event.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {event.status === 'active' ? 'ativo' : 'finalizado'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">{event.participantsCount || 0}</td>
                    <td className="py-2 px-3 text-right">{formatCurrency(event.totalValue || 0)}</td>
                    <td className="py-2 px-3 text-right">{formatCurrency(event.valuePerParticipant || 0)}</td>
                    <td className="py-2 px-3">
                      <div className="flex justify-center gap-3">
                        <button 
                          onClick={() => navigate(`/event-details/${event.id}`)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          visualizar
                        </button>
                        <button 
                          onClick={() => event.status === 'active' 
                            ? handleFinalize(event.id)
                            : handleReopen(event.id)
                          }
                          className="text-xs text-green-600 hover:text-green-800"
                        >
                          {event.status === 'active' ? 'finalizar' : 'reabrir'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Versão Mobile */}
        <div className="md:hidden space-y-4">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg">{event.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  event.status === 'active' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {event.status === 'active' ? 'ativo' : 'finalizado'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Participantes</span>
                  <p className="font-medium">{event.participantsCount || 0}</p>
                </div>
                <div>
                  <span className="text-gray-500">Valor Total</span>
                  <p className="font-medium">{formatCurrency(event.totalValue || 0)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Valor por Pessoa</span>
                  <p className="font-medium">{formatCurrency(event.valuePerParticipant || 0)}</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button 
                  onClick={() => navigate(`/event-details/${event.id}`)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  visualizar
                </button>
                <button 
                  onClick={() => event.status === 'active' 
                    ? handleFinalize(event.id)
                    : handleReopen(event.id)
                  }
                  className="text-sm text-green-600 hover:text-green-800"
                >
                  {event.status === 'active' ? 'finalizar' : 'reabrir'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {events.length === 0 && !loading && (
          <div className="text-center text-gray-500 mt-8">
            Nenhum evento encontrado
          </div>
        )}

        {loading && (
          <div className="flex justify-center mt-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EventHistory
