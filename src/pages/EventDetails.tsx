import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { DatabaseTypes } from "@/types/database.types";
import { EventHeader } from "@/components/EventHeader";

type Event = DatabaseTypes["public"]["Tables"]["events"]["Row"] & {
  Número_evento: number;
};

interface Participant {
  id: string;
  name: string;
}

interface ParticipantResponse {
  id: string;
  event_id: string;
  participant_id: string;
  participant_name: string;
  status: "pending" | "confirmed";
  participant: {
    id: string;
    name: string;
  };
}

interface ParticipantWithCosts extends ParticipantResponse {
  valor_total: number;
  valor_a_pagar: number;
  detalhes_custo: {
    valor_por_participante: number;
    descricao: string;
  }[];
}

interface CostItem {
  valor: number;
  descricao: string;
}

interface CostDetail {
  event_id: string;
  participant_id: string;
  itens: CostItem[];
}

function EventDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [eventParticipants, setEventParticipants] = useState<
    ParticipantWithCosts[]
  >([]);
  const [allParticipants, setAllParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] =
    useState<ParticipantWithCosts | null>(null);
  const [costDetail, setCostDetail] = useState<CostDetail>({
    event_id: "",
    participant_id: "",
    itens: [{ valor: 0, descricao: "" }],
  });
  const [isNewParticipantModalOpen, setIsNewParticipantModalOpen] =
    useState(false);
  const [newParticipant, setNewParticipant] = useState({ name: "", phone: "" });
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');

  useEffect(() => {
    if (!id) {
      setError("ID do evento não fornecido");
      setLoading(false);
      return;
    }

    fetchEventDetails();
    fetchAllParticipants();
    fetchParticipants();
  }, [id]);

  const fetchEventDetails = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

      if (eventError) throw eventError;
      if (!eventData) throw new Error("Evento não encontrado");

      setEvent(eventData);

      const { data: allParticipantsData, error: allParticipantsError } = await supabase
        .from("participants")
        .select("*")
        .order("name");

      if (allParticipantsError) throw allParticipantsError;
      setAllParticipants(allParticipantsData || []);

      const { data: eventParticipantsData, error: eventParticipantsError } = await supabase
        .from("event_participants")
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
        `)
        .eq("event_id", id);

      if (eventParticipantsError) throw eventParticipantsError;

      if (eventParticipantsData) {
        const typedParticipantsData =
          eventParticipantsData as unknown as ParticipantResponse[];
        const participantsWithCosts = await Promise.all(
          typedParticipantsData.map(async (p) => {
            // Buscar detalhes de custo para cada participante
            const { data: custosData } = await supabase
              .from("detalhe_de_custo")
              .select("valor_por_participante, descricao")
              .eq("event_id", id)
              .eq("participant_id", p.participant_id);

            const valorTotal = custosData?.reduce((sum, item) => {
              return sum + (Number(item.valor_por_participante) || 0);
            }, 0) || 0;

            return {
              ...p,
              valor_total: valorTotal,
              valor_a_pagar: valorTotal,
              detalhes_custo: custosData || []
            };
          })
        );

        setEventParticipants(participantsWithCosts);
      }
    } catch (err) {
      console.error("Erro detalhado:", err);
      setError("Erro ao carregar os detalhes do evento.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from("participants")
        .select("*")
        .order("name");

      if (error) throw error;

      setAllParticipants(data || []);
    } catch (err) {
      console.error("Erro ao buscar participantes:", err);
    }
  };

  const fetchParticipants = async () => {
    try {
      const { data: participantsData, error } = await supabase
        .from('participants')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Erro ao buscar participantes:', error);
        throw error;
      }

      setParticipants(participantsData || []);
    } catch (err) {
      console.error('Erro ao carregar participantes:', err);
      alert('Erro ao carregar lista de participantes');
    }
  };

  // Função para mostrar apenas participantes válidos da tabela
  const getAvailableParticipants = () => {
    // Retorna apenas participantes que existem na tabela participants
    return participants
      .filter(participant => 
        // Filtra apenas os que não estão confirmados no evento atual
        !eventParticipants.some(ep => ep.participant_id === participant.id)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  // Função para obter participantes confirmados em ordem alfabética
  const getConfirmedParticipants = () => {
    return eventParticipants
      .sort((a, b) => a.participant.name.localeCompare(b.participant.name));
  };

  // Ajustar a função addParticipantToEvent
  const addParticipantToEvent = async (participantId: string) => {
    try {
      if (!id) {
        alert("ID do evento não encontrado");
        return;
      }

      const participant = participants.find((p) => p.id === participantId);
      if (!participant) {
        alert("Participante não encontrado");
        return;
      }

      // Adicionar participante ao evento
      const { data: responseData, error: insertError } = await supabase
        .from("event_participants")
        .insert({
          event_id: id,
          participant_id: participantId,
          participant_name: participant.name,
          status: "confirmed",
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
        `)
        .single();

      if (insertError || !responseData) {
        console.error("Erro ao adicionar participante:", insertError);
        alert("Erro ao adicionar participante ao evento");
        return;
      }

      // Criar o novo participante com a estrutura correta
      const newParticipant: ParticipantWithCosts = {
        id: responseData.id,
        event_id: responseData.event_id,
        participant_id: responseData.participant_id,
        participant_name: responseData.participant_name,
        status: responseData.status as "pending" | "confirmed",
        participant: {
          id: participant.id,
          name: participant.name
        },
        valor_total: 0,
        valor_a_pagar: 0,
        detalhes_custo: []
      };

      setEventParticipants(prev => [...prev, newParticipant]);
      await fetchEventDetails();

    } catch (err) {
      console.error("Erro:", err);
      alert("Erro ao adicionar participante ao evento");
    }
  };

  // Função para remover participante do evento
  const removeParticipantFromEvent = async (participantId: string) => {
    try {
      const eventParticipant = eventParticipants.find(
        (ep) => ep.participant_id === participantId
      );

      if (!eventParticipant) {
        console.error("Participante não encontrado no evento");
        return;
      }

      const { error } = await supabase
        .from("event_participants")
        .delete()
        .match({
          event_id: id,
          participant_id: participantId,
        });

      if (error) throw error;

      // Remove o participante da lista local
      setEventParticipants((currentParticipants) =>
        currentParticipants.filter((ep) => ep.participant_id !== participantId)
      );
    } catch (err) {
      console.error("Erro ao remover participante:", err);
    }
  };

  const toggleParticipantStatus = async (
    participantId: string,
    currentStatus: string
  ) => {
    try {
      const newStatus = currentStatus === "confirmed" ? "pending" : "confirmed";

      const { data, error } = await supabase
        .from("event_participants")
        .update({ status: newStatus })
        .match({
          event_id: id,
          participant_id: participantId,
        })
        .select(
          `
          id,
          event_id,
          participant_id,
          participant_name,
          status,
          participant:participants (
            id,
            name
          )
        `
        )
        .single();

      if (error) {
        console.error("Erro ao atualizar status:", error);
        throw error;
      }

      if (data) {
        const typedData = data as unknown as ParticipantResponse;
        const updatedParticipant: ParticipantWithCosts = {
          ...typedData,
          valor_total: 0,
          valor_a_pagar: 0,
          detalhes_custo: [],
        };

        setEventParticipants((prev) =>
          prev.map((ep) =>
            ep.participant_id === participantId ? updatedParticipant : ep
          )
        );
      }
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      alert(
        "Erro ao atualizar status do participante. Por favor, tente novamente."
      );
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  // Função para obter participantes por status
  const getParticipantsByStatus = (status: "confirmed" | "pending") => {
    return eventParticipants.filter((ep) => ep.status === status);
  };

  // Função para formatar a data e hora
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleConfirmParticipant = async (participantName: string) => {
    try {
      const { error } = await supabase
        .from("participants")
        .update({ status: "confirmed" })
        .eq("name", participantName)
        .eq("event_id", id);

      if (error) throw error;

      // Atualiza o estado local para refletir a mudança
      setEventParticipants((prevParticipants) =>
        prevParticipants.map((p) =>
          p.participant.name === participantName
            ? { ...p, status: "confirmed" }
            : p
        )
      );
    } catch (error) {
      console.error("Erro ao confirmar participante:", error);
    }
  };

  const handleOpenCostModal = async (participant: ParticipantWithCosts) => {
    try {
      setSelectedParticipant(participant);

      // Buscar os valores existentes
      const { data: existingCosts, error } = await supabase
        .from("detalhe_de_custo")
        .select("*")
        .eq("event_id", id)
        .eq("participant_id", participant.participant_id);

      if (error) {
        console.error("Erro ao buscar custos existentes:", error);
        throw error;
      }

      // Se existem custos, carregar no estado
      if (existingCosts && existingCosts.length > 0) {
        setCostDetail({
          event_id: id || "",
          participant_id: participant.participant_id,
          itens: existingCosts.map((cost) => ({
            valor: cost.valor_por_participante,
            descricao: cost.descricao,
          })),
        });
      } else {
        // Se não existem custos, inicializar com um item vazio
        setCostDetail({
          event_id: id || "",
          participant_id: participant.participant_id,
          itens: [{ valor: 0, descricao: "" }],
        });
      }

      setIsModalOpen(true);
    } catch (err) {
      console.error("Erro ao abrir modal:", err);
      alert(
        "Erro ao carregar os detalhes de custo. Por favor, tente novamente."
      );
    }
  };

  const fetchCostDetails = async (eventParticipantId: string) => {
    try {
      const { data, error } = await supabase
        .from("detalhe_de_custo")
        .select("*")
        .eq("event_participant_id", eventParticipantId)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 é o código para nenhum registro encontrado
        console.error("Erro ao buscar detalhes de custo:", error);
        return;
      }

      if (data) {
        setCostDetail(data);
      } else {
        // Reset para valores padrão se não houver dados
        setCostDetail({
          event_id: "",
          participant_id: "",
          itens: [{ valor: 0, descricao: "" }],
        });
      }
    } catch (err) {
      console.error("Erro ao buscar detalhes de custo:", err);
    }
  };

  const handleSaveCostDetails = async () => {
    try {
      if (!selectedParticipant || !id) {
        console.error("Participante ou ID do evento não encontrado");
        return;
      }

      // Validar se há valores válidos
      if (
        costDetail.itens.some((item) => isNaN(item.valor) || item.valor <= 0)
      ) {
        alert("Por favor, insira valores válidos para todos os itens");
        return;
      }

      // Primeiro, deletar todos os registros existentes deste participante neste evento
      const { error: deleteError } = await supabase
        .from("detalhe_de_custo")
        .delete()
        .match({
          event_id: id,
          participant_id: selectedParticipant.participant_id,
        });

      if (deleteError) {
        console.error("Erro ao limpar registros antigos:", deleteError);
        throw deleteError;
      }

      // Depois, inserir os novos registros
      const { error: insertError } = await supabase
        .from("detalhe_de_custo")
        .insert(
          costDetail.itens.map((item) => ({
            event_id: id,
            participant_id: selectedParticipant.participant_id,
            valor_por_participante: Number(item.valor),
            descricao: item.descricao,
          }))
        );

      if (insertError) {
        console.error("Erro ao salvar:", insertError);
        throw insertError;
      }

      setIsModalOpen(false);
      await fetchEventDetails();
    } catch (err) {
      console.error("Erro ao salvar detalhes de custo:", err);
      alert("Erro ao salvar os detalhes de custo. Por favor, tente novamente.");
    }
  };

  const addNewCostItem = () => {
    setCostDetail((prev) => ({
      ...prev,
      itens: [...prev.itens, { valor: 0, descricao: "" }],
    }));
  };

  const updateCostItem = (
    index: number,
    field: "valor" | "descricao",
    value: string | number
  ) => {
    setCostDetail((prev) => ({
      ...prev,
      itens: prev.itens.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeCostItem = (index: number) => {
    setCostDetail((prev) => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== index),
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
    const numeroParticipantes = getParticipantsByStatus("confirmed").length;
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
        alert("O nome do participante é obrigatório");
        return;
      }

      // Insere apenas o nome na tabela participants
      const { error } = await supabase
        .from("participants")
        .insert([{ name: newParticipant.name.trim() }]);

      if (error) {
        console.error("Erro ao criar participante:", error);
        throw error;
      }

      // Fecha o modal e limpa o formulário
      setIsNewParticipantModalOpen(false);
      setNewParticipant({ name: "", phone: "" });

      // Recarrega a lista de participantes
      await fetchAllParticipants();
    } catch (err) {
      console.error("Erro ao criar participante:", err);
      alert("Erro ao criar participante. Tente novamente.");
    }
  };

  // Atualizar a função handleDeleteParticipant
  const handleDeleteParticipant = async (participantId: string) => {
    try {
      if (!window.confirm('Tem certeza que deseja excluir este participante permanentemente?')) {
        return;
      }

      // 1. Verificar se o participante existe
      const { data: participantExists, error: checkError } = await supabase
        .from('participants')
        .select('id')
        .eq('id', participantId)
        .single();

      if (checkError || !participantExists) {
        throw new Error('Participante não encontrado');
      }

      // 2. Excluir custos primeiro
      await supabase
        .from('detalhe_de_custo')
        .delete()
        .eq('participant_id', participantId);

      // 3. Excluir relações com eventos
      await supabase
        .from('event_participants')
        .delete()
        .eq('participant_id', participantId);

      // 4. Finalmente excluir o participante
      const { error: deleteError } = await supabase
        .from('participants')
        .delete()
        .eq('id', participantId);

      if (deleteError) {
        throw deleteError;
      }

      // 5. Atualizar estados locais
      setParticipants(prev => prev.filter(p => p.id !== participantId));
      setEventParticipants(prev => prev.filter(p => p.participant_id !== participantId));
      setAllParticipants(prev => prev.filter(p => p.id !== participantId));

      // 6. Recarregar dados
      await fetchParticipants();
      await fetchEventDetails();

      alert('Participante excluído com sucesso!');

    } catch (error) {
      console.error('Erro ao excluir participante:', error);
      alert('Erro ao excluir participante. Por favor, tente novamente.');
    }
  };

  // Adicionar função para atualizar o título
  const handleUpdateEventTitle = async (newTitle: string) => {
    try {
      if (!id || !newTitle.trim()) return;

      const { error } = await supabase
        .from('events')
        .update({ title: newTitle.trim() })
        .eq('id', id);

      if (error) throw error;

      // Atualizar o estado local
      setEvent(prev => prev ? { ...prev, title: newTitle } : null);
      setIsEditingTitle(false);
      
      // Recarregar os dados
      await fetchEventDetails();

      alert('Nome do evento atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar nome do evento:', error);
      alert('Erro ao atualizar nome do evento. Por favor, tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1F0FB] p-3 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate("/historico-eventos")}
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-2 mb-3"
          >
            ← Voltar
          </button>

          <div className="flex justify-center items-center h-[60vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#10B981]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7FF] p-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              {event?.title}
            </h1>
            <button
              onClick={() => {
                setEditedTitle(event?.title || '');
                setIsEditingTitle(true);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="text-xl">✏️</span>
            </button>
          </div>
          <span className="inline-block px-4 py-1 rounded-full bg-[#E8FFF3] text-[#10B981] text-sm">
            Em andamento
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-gray-600 mb-2">Valor Total</h2>
            <p className="text-4xl font-bold">
              {formatCurrency(calcularValorTotal())}
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-gray-600 mb-2">Valor por Participante</h2>
            <p className="text-4xl font-bold">
              {formatCurrency(calcularValorPorParticipante())}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-gray-400">👥</span>
            <span className="text-xl font-semibold">
              {getParticipantsByStatus("confirmed").length} participantes
            </span>
          </div>
          <button
            onClick={() => setIsNewParticipantModalOpen(true)}
            className="bg-[#10B981] text-white px-6 py-3 rounded-lg hover:bg-[#0EA874] transition-colors flex items-center gap-2"
          >
            <span>👤</span>
            Adicionar Participante
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                Participantes confirmados
              </h2>
              <span className="text-gray-500">
                Total: {getParticipantsByStatus("confirmed").length} participantes
              </span>
            </div>
            <p className="text-gray-500 mt-1">
              Custo total: {formatCurrency(calcularValorTotal())}
            </p>
          </div>

          <div className="divide-y">
            {getConfirmedParticipants().map((ep) => (
              <div key={ep.id} className="p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">{ep.participant.name}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-gray-500">
                      Total: {formatCurrency(ep.valor_total || 0)}
                    </span>
                    <span className={ep.valor_total >= calcularValorPorParticipante() ? 'text-green-500' : 'text-red-500'}>
                      {ep.valor_total >= calcularValorPorParticipante() ? 'A receber: ' : 'A pagar: '}
                      {formatCurrency(Math.abs(ep.valor_total - calcularValorPorParticipante()))}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleOpenCostModal(ep)}
                    className="text-[#10B981] hover:underline"
                  >
                    Adicionar valor
                  </button>
                  <button className="text-red-500 hover:text-red-700">
                    <span>🗑️</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

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
                    <span className="text-sm font-medium text-gray-700">
                      Item {index + 1}
                    </span>
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
                        value={item.valor || ""}
                        onChange={(e) =>
                          updateCostItem(
                            index,
                            "valor",
                            parseFloat(e.target.value) || 0
                          )
                        }
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
                        onChange={(e) =>
                          updateCostItem(index, "descricao", e.target.value)
                        }
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
                <span>
                  {formatCurrency(
                    costDetail.itens.reduce(
                      (sum, item) => sum + (item.valor || 0),
                      0
                    )
                  )}
                </span>
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

      {isNewParticipantModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Novo Participante</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  value={newParticipant.name}
                  onChange={(e) =>
                    setNewParticipant((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
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
                  onChange={(e) =>
                    setNewParticipant((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
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
  );
}

export default EventDetails;
