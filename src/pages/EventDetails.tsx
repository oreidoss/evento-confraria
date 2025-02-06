import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface Event {
  id: string
  title: string
  description: string
  date: string
  status: 'active' | 'finished'
  number: number | null
  Numero_evento: number
}

interface Participant {
  id: number
  name: string
}

interface EventParticipant {
  id: number
  event_id: string
  participant_id: number
  status: 'pending' | 'confirmed'
  participant: Participant
  valor_total?: number
  valor_a_pagar?: number
}

interface CostItem {
  valor: number;
  descricao: string;
}

interface CostDetail {
  event_id: string;
  participant_id: number;
  itens: CostItem[];
}

function EventDetails() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [eventParticipants, setEventParticipants] = useState<EventParticipant[]>([])
  const [allParticipants, setAllParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedParticipant, setSelectedParticipant] = useState<EventParticipant | null>(null)
  const [costDetail, setCostDetail] = useState<CostDetail>({
    event_id: '',
    participant_id: 0,
    itens: [{ valor: 0, descricao: '' }]
  })
  const [isNewParticipantModalOpen, setIsNewParticipantModalOpen] = useState(false)
  const [newParticipant, setNewParticipant] = useState({ name: '', phone: '' })

  useEffect(() => {
    if (!id) {
      setError('ID do evento não fornecido')
      setLoading(false)
      return
    }
    
    fetchEventDetails()
    fetchAllParticipants()
  }, [id])

  const fetchEventDetails = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      // Primeiro buscar o evento
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (eventError) throw eventError;
      if (!eventData) throw new Error('Evento não encontrado');
      
      setEvent(eventData);

      // Buscar participantes
      const { data: participantsData, error: participantsError } = await supabase
        .from('event_participants')
        .select(`
          id,
          event_id,
          participant_id,
          status,
          participant:participants (
            id,
            name
          )
        `)
        .eq('event_id', id);

      if (participantsError) throw participantsError;

      if (participantsData) {
        // Buscar os custos para cada participante individualmente
        const participantsWithCosts = await Promise.all(
          participantsData.map(async (p) => {
            // Buscar todos os custos deste participante específico
            const { data: costData } = await supabase
              .from('detalhe_de_custo')
              .select('valor_por_participante')
              .eq('event_id', id)
              .eq('participant_id', p.participant_id);

            // Calcular o total apenas dos valores deste participante
            const valorTotal = costData?.reduce((sum, item) => {
              console.log(`Valor para ${p.participant.name}:`, item.valor_por_participante);
              return sum + (Number(item.valor_por_participante) || 0);
            }, 0) || 0;

            console.log(`Total para ${p.participant.name}:`, valorTotal);

            return {
              id: p.id,
              event_id: p.event_id,
              participant_id: p.participant_id,
              status: p.status as 'pending' | 'confirmed',
              participant: p.participant,
              valor_total: valorTotal,
              valor_a_pagar: valorTotal
            };
          })
        );

        setEventParticipants(participantsWithCosts);
      }

    } catch (err) {
      console.error('Erro detalhado:', err);
      setError('Erro ao carregar os detalhes do evento.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .order('name')

      if (error) throw error

      setAllParticipants(data || [])
    } catch (err) {
      console.error('Erro ao buscar participantes:', err)
    }
  }

  const addParticipantToEvent = async (participantId: number) => {
    try {
      console.log('=== DEBUG ===');
      console.log('Iniciando adição de participante:', participantId);
      console.log('ID do evento:', id);

      if (!id) {
        const msg = 'ID do evento não encontrado';
        console.error(msg);
        alert(msg);
        return;
      }

      // Encontrar o participante na lista de todos os participantes para obter o nome
      const participant = allParticipants.find(p => p.id === participantId);
      
      if (!participant) {
        console.error('Participante não encontrado');
        return;
      }

      // Validar se o participante já não está no evento
      const participanteJaExiste = eventParticipants.some(
        ep => ep.participant_id === participantId
      );

      if (participanteJaExiste) {
        const msg = 'Este participante já está no evento';
        console.error(msg);
        alert(msg);
        return;
      }

      // Adiciona o participante como confirmado, incluindo o nome
      const { data, error: insertError } = await supabase
        .from('event_participants')
        .insert({
          event_id: id,
          participant_id: participantId,
          participant_name: participant.name, // Adicionando o nome do participante
          status: 'confirmed'
        })
        .select(`
          id,
          event_id,
          participant_id,
          participant_name,
          status,
          participant:participants (
            id,
            name
          )
        `);

      console.log('Resposta do insert:', { data, error: insertError });

      if (insertError) {
        console.error('Erro detalhado ao adicionar participante:', insertError);
        
        if (insertError.code === '23503') {
          alert('Erro: Participante ou evento não encontrado.');
        } else if (insertError.code === '23505') {
          alert('Este participante já está registrado no evento.');
        } else {
          alert('Erro ao adicionar participante ao evento. Por favor, tente novamente.');
        }
        return;
      }

      if (!data) {
        console.error('Nenhum dado retornado após inserção');
        alert('Erro ao adicionar participante. Nenhum dado retornado.');
        return;
      }

      // Atualiza o estado local imediatamente após sucesso
      const newParticipant = {
        id: data[0].id,
        event_id: data[0].event_id,
        participant_id: data[0].participant_id,
        status: data[0].status as 'confirmed',
        participant: data[0].participant
      };

      setEventParticipants(prev => [...prev, newParticipant]);
      console.log('Participante adicionado com sucesso:', newParticipant);

    } catch (err) {
      console.error('Erro ao adicionar participante:', err);
      alert('Erro ao adicionar participante ao evento. Por favor, tente novamente.');
    }
  };

  // Função para remover participante do evento
  const removeParticipantFromEvent = async (participantId: number) => {
    try {
      const eventParticipant = eventParticipants.find(ep => ep.participant_id === participantId)
      
      if (!eventParticipant) {
        console.error('Participante não encontrado no evento')
        return
      }

      const { error } = await supabase
        .from('event_participants')
        .delete()
        .match({ 
          event_id: id,
          participant_id: participantId 
        })

      if (error) throw error

      // Remove o participante da lista local
      setEventParticipants(currentParticipants => 
        currentParticipants.filter(ep => ep.participant_id !== participantId)
      )
    } catch (err) {
      console.error('Erro ao remover participante:', err)
    }
  }

  const toggleParticipantStatus = async (participantId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'confirmed' ? 'pending' : 'confirmed'
      
      const { data, error } = await supabase
        .from('event_participants')
        .update({ status: newStatus })
        .match({ 
          event_id: id,
          participant_id: participantId 
        })
        .select(`
          id,
          event_id,
          participant_id,
          status,
          participant:participants!inner (
            id,
            name
          )
        `)
        .single()

      if (error) {
        console.error('Erro ao atualizar status:', error)
        throw error
      }

      if (data) {
        // Corrigindo o tipo dos dados retornados
        const updatedParticipant: EventParticipant = {
          id: data.id,
          event_id: data.event_id,
          participant_id: data.participant_id,
          status: data.status as 'pending' | 'confirmed',
          participant: data.participant
        }

        setEventParticipants(prev => 
          prev.map(ep => ep.participant_id === participantId ? updatedParticipant : ep)
        )
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
      alert('Erro ao atualizar status do participante. Por favor, tente novamente.')
    }
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  // Função para filtrar participantes por status
  const getParticipantsByStatus = (status: 'confirmed' | 'pending') => {
    return eventParticipants.filter(ep => ep.status === status)
  }

  // Função para formatar a data e hora
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleConfirmParticipant = async (participantName: string) => {
    try {
      const { error } = await supabase
        .from('participants')
        .update({ status: 'confirmed' })
        .eq('name', participantName)
        .eq('event_id', id);

      if (error) throw error;
      
      // Atualiza o estado local para refletir a mudança
      setEventParticipants(prevParticipants => 
        prevParticipants.map(p => 
          p.participant.name === participantName 
            ? { ...p, status: 'confirmed' }
            : p
        )
      );
    } catch (error) {
      console.error('Erro ao confirmar participante:', error);
    }
  };

  const handleOpenCostModal = async (participant: EventParticipant) => {
    try {
      setSelectedParticipant(participant);

      // Buscar os valores existentes
      const { data: existingCosts, error } = await supabase
        .from('detalhe_de_custo')
        .select('*')
        .eq('event_id', id)
        .eq('participant_id', participant.participant_id);

      if (error) {
        console.error('Erro ao buscar custos existentes:', error);
        throw error;
      }

      // Se existem custos, carregar no estado
      if (existingCosts && existingCosts.length > 0) {
        setCostDetail({
          event_id: id || '',
          participant_id: participant.participant_id,
          itens: existingCosts.map(cost => ({
            valor: cost.valor_por_participante,
            descricao: cost.descricao
          }))
        });
      } else {
        // Se não existem custos, inicializar com um item vazio
        setCostDetail({
          event_id: id || '',
          participant_id: participant.participant_id,
          itens: [{ valor: 0, descricao: '' }]
        });
      }

      setIsModalOpen(true);
    } catch (err) {
      console.error('Erro ao abrir modal:', err);
      alert('Erro ao carregar os detalhes de custo. Por favor, tente novamente.');
    }
  };

  const fetchCostDetails = async (eventParticipantId: string) => {
    try {
      const { data, error } = await supabase
        .from('detalhe_de_custo')
        .select('*')
        .eq('event_participant_id', eventParticipantId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 é o código para nenhum registro encontrado
        console.error('Erro ao buscar detalhes de custo:', error);
        return;
      }

      if (data) {
        setCostDetail(data);
      } else {
        // Reset para valores padrão se não houver dados
        setCostDetail({
          event_id: '',
          participant_id: 0,
          itens: [{ valor: 0, descricao: '' }]
        });
      }
    } catch (err) {
      console.error('Erro ao buscar detalhes de custo:', err);
    }
  };

  const handleSaveCostDetails = async () => {
    try {
      if (!selectedParticipant || !id) {
        console.error('Participante ou ID do evento não encontrado');
        return;
      }

      // Validar se há valores válidos
      if (costDetail.itens.some(item => isNaN(item.valor) || item.valor <= 0)) {
        alert('Por favor, insira valores válidos para todos os itens');
        return;
      }

      // Primeiro, deletar todos os registros existentes deste participante neste evento
      const { error: deleteError } = await supabase
        .from('detalhe_de_custo')
        .delete()
        .match({
          event_id: id,
          participant_id: selectedParticipant.participant_id
        });

      if (deleteError) {
        console.error('Erro ao limpar registros antigos:', deleteError);
        throw deleteError;
      }

      // Depois, inserir os novos registros
      const { error: insertError } = await supabase
        .from('detalhe_de_custo')
        .insert(
          costDetail.itens.map(item => ({
            event_id: id,
            participant_id: selectedParticipant.participant_id,
            valor_por_participante: Number(item.valor),
            descricao: item.descricao
          }))
        );

      if (insertError) {
        console.error('Erro ao salvar:', insertError);
        throw insertError;
      }

      setIsModalOpen(false);
      await fetchEventDetails();
      
    } catch (err) {
      console.error('Erro ao salvar detalhes de custo:', err);
      alert('Erro ao salvar os detalhes de custo. Por favor, tente novamente.');
    }
  };

  const addNewCostItem = () => {
    setCostDetail(prev => ({
      ...prev,
      itens: [...prev.itens, { valor: 0, descricao: '' }]
    }));
  };

  const updateCostItem = (index: number, field: 'valor' | 'descricao', value: string | number) => {
    setCostDetail(prev => ({
      ...prev,
      itens: prev.itens.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeCostItem = (index: number) => {
    setCostDetail(prev => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== index)
    }));
  };

  // Adicione estas funções para calcular os totais
  const calcularValorTotal = () => {
    return eventParticipants.reduce((total, participant) => {
      return total + (participant.valor_total || 0);
    }, 0);
  };

  const calcularValorPorParticipante = () => {
    const total = calcularValorTotal();
    const numeroParticipantes = getParticipantsByStatus('confirmed').length;
    return numeroParticipantes > 0 ? total / numeroParticipantes : 0;
  };

  // Primeiro, vamos adicionar uma função para calcular o saldo do participante
  const calcularSaldoParticipante = (valorContribuido: number) => {
    const valorRateio = calcularValorPorParticipante();
    const saldo = valorContribuido - valorRateio;
    return saldo;
  };

  const handleCreateParticipant = async () => {
    try {
      if (!newParticipant.name.trim()) {
        alert('O nome do participante é obrigatório');
        return;
      }

      // Insere apenas o nome na tabela participants
      const { error } = await supabase
        .from('participants')
        .insert([
          { name: newParticipant.name.trim() }
        ]);

      if (error) {
        console.error('Erro ao criar participante:', error);
        throw error;
      }

      // Fecha o modal e limpa o formulário
      setIsNewParticipantModalOpen(false);
      setNewParticipant({ name: '', phone: '' });

      // Recarrega a lista de participantes
      await fetchAllParticipants();

    } catch (err) {
      console.error('Erro ao criar participante:', err);
      alert('Erro ao criar participante. Tente novamente.');
    }
  };

  // Adicione esta função para excluir o participante
  const handleDeleteParticipant = async (participantId: number) => {
    try {
      // Primeiro verifica se o participante está em algum evento
      const { data: eventParticipantData } = await supabase
        .from('event_participants')
        .select('*')
        .eq('participant_id', participantId);

      if (eventParticipantData && eventParticipantData.length > 0) {
        alert('Não é possível excluir um participante que está em um evento.');
        return;
      }

      // Se não estiver em nenhum evento, pode excluir
      const { error } = await supabase
        .from('participants')
        .delete()
        .eq('id', participantId);

      if (error) {
        console.error('Erro ao excluir:', error);
        throw error;
      }

      // Atualiza a lista de participantes
      await fetchAllParticipants();

    } catch (err) {
      console.error('Erro ao excluir participante:', err);
      alert('Erro ao excluir participante. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1F0FB] p-8">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#10B981]"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F1F0FB] p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/historico-eventos')}
          className="text-gray-600 hover:text-gray-800 flex items-center gap-2 mb-8"
        >
          ← Voltar
        </button>

        {loading ? (
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#10B981]"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg">
            {error}
          </div>
        ) : event ? (
          <>
            <div className="text-center mb-8">
              {/* Número e Nome do Evento */}
              <h1 className="text-4xl font-bold text-[#0EA5E9] mb-4">
                {event.title} - Nº {event.Numero_evento}
              </h1>
              
              {/* Descrição (se necessário) */}
              {event.description && (
                <p className="text-lg text-gray-600 mb-4">{event.description}</p>
              )}
              
              {/* Data e Hora */}
              <p className="text-gray-500">
                <span className="inline-block">
                  <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDateTime(event.date)}
                </span>
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <span className={`px-3 py-1 rounded-full text-sm ${
                event.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                Em andamento
              </span>
            </div>

            {/* Cards de Valores */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="text-sm text-gray-600">Valor Total</h3>
                <p className="text-xl font-bold">{formatCurrency(calcularValorTotal())}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="text-sm text-gray-600">Valor por Participante</h3>
                <p className="text-xl font-bold">{formatCurrency(calcularValorPorParticipante())}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="text-sm text-gray-600">Total de Participantes</h3>
                <p className="text-xl font-bold">{getParticipantsByStatus('confirmed').length}</p>
              </div>
            </div>

            {/* Grid principal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Lista de Participantes */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-medium text-gray-700">Participantes</h3>
                  <button
                    onClick={() => setIsNewParticipantModalOpen(true)}
                    className="bg-[#4ADE80] text-white px-4 py-2 rounded-lg text-sm hover:bg-green-500 transition-colors"
                  >
                    + Novo
                  </button>
                </div>

                <div className="space-y-2">
                  {allParticipants
                    .filter(p => !eventParticipants.some(ep => ep.participant_id === p.id))
                    .map(participant => (
                      <div
                        key={participant.id}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded"
                      >
                        <span className="text-sm">{participant.name}</span>
                        <div className="flex gap-3">
                          <button
                            onClick={() => addParticipantToEvent(participant.id)}
                            className="text-green-600 text-sm hover:text-green-800"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => handleDeleteParticipant(participant.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Excluir participante"
                          >
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className="h-5 w-5" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Lista de Participantes Confirmados */}
              <div className="bg-white rounded-lg p-6">
                <h2 className="text-2xl mb-6">
                  Participantes Confirmados ({getParticipantsByStatus('confirmed').length})
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getParticipantsByStatus('confirmed').map((ep) => (
                    <div key={ep.id} className="bg-white rounded-lg border p-4">
                      {/* Nome do Participante */}
                      <div className="text-xl mb-1">
                        {ep.participant.name}
                      </div>

                      {/* Status e Valor */}
                      <div>
                        {/* Valor Total Contribuído */}
                        <div className="text-gray-600 text-sm mb-1">
                          R$ {(ep.valor_total || 0).toFixed(2)}
                        </div>

                        {/* Status Pagar/Receber */}
                        <div className={`text-sm ${
                          calcularSaldoParticipante(ep.valor_total || 0) >= 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {calcularSaldoParticipante(ep.valor_total || 0) >= 0 ? 'Receber' : 'Pagar'}
                        </div>
                        <div className="text-xl">
                          R$ {Math.abs(calcularSaldoParticipante(ep.valor_total || 0)).toFixed(2)}
                        </div>
                      </div>

                      {/* Links de ação */}
                      <div className="flex justify-end gap-4 mt-2 text-sm">
                        <button
                          onClick={() => handleOpenCostModal(ep)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          adicionar valor
                        </button>
                        <button
                          onClick={() => removeParticipantFromEvent(ep.participant_id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-600">
            Evento não encontrado
          </div>
        )}
      </div>

      {/* Adicione o Modal */}
      {isModalOpen && selectedParticipant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">
              Detalhes de Custo - {selectedParticipant.participant.name}
            </h3>
            
            <div className="space-y-4">
              {costDetail.itens.map((item, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Item {index + 1}</span>
                    {costDetail.itens.length > 1 && (
                      <button
                        onClick={() => removeCostItem(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor
                      </label>
                      <input
                        type="number"
                        value={item.valor || ''}
                        onChange={(e) => updateCostItem(index, 'valor', parseFloat(e.target.value) || 0)}
                        className="w-full p-2 border rounded-md"
                        placeholder="Digite o valor"
                        autoFocus={index === costDetail.itens.length - 1}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descrição
                      </label>
                      <textarea
                        value={item.descricao}
                        onChange={(e) => updateCostItem(index, 'descricao', e.target.value)}
                        className="w-full p-2 border rounded-md"
                        rows={2}
                        placeholder="Digite uma descrição..."
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={addNewCostItem}
                className="w-full py-2 px-4 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md border border-blue-200"
              >
                + Adicionar novo valor
              </button>
            </div>

            <div className="mt-6 flex justify-between items-center">
              <div className="text-sm">
                <span className="font-medium">Total: </span>
                <span>{formatCurrency(costDetail.itens.reduce((sum, item) => sum + (item.valor || 0), 0))}</span>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveCostDetails}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Novo Participante */}
      {isNewParticipantModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">
              Novo Participante
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  value={newParticipant.name}
                  onChange={(e) => setNewParticipant(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                  placeholder="Digite o nome..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={newParticipant.phone}
                  onChange={(e) => setNewParticipant(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                  placeholder="Digite o telefone (opcional)..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setIsNewParticipantModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateParticipant}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EventDetails