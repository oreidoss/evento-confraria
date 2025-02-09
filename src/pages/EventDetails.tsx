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
  pix_key?: string | null;
  created_at?: string;
  status?: string;
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
    pix_key: string | null;
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

interface NewParticipant {
  name: string;
  phone: string;
  pix: string;
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
  const [newParticipant, setNewParticipant] = useState<NewParticipant>({ 
    name: "", 
    phone: "", 
    pix: "" 
  });
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [isEditParticipantModalOpen, setIsEditParticipantModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<{
    id: string;
    name: string;
    pix_key: string | null;
  } | null>(null);

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
        .order('date', { ascending: false })
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
            name,
            pix_key
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
    const available = participants.filter(participant => 
      !eventParticipants.some(ep => ep.participant_id === participant.id)
    );
    return available.sort((a, b) => a.name.localeCompare(b.name));
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
          name: participant.name,
          pix_key: participant.pix_key
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

  // Ajustar a função formatDateTime
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

  // Primeiro, vamos adicionar uma função para calcular o saldo do participante
  const calcularSaldoParticipante = (valorContribuido: number) => {
    const valorRateio = calcularValorPorParticipante();
    const saldo = valorContribuido - valorRateio;
    return saldo;
  };

  // Primeiro, vamos adicionar uma função para calcular o saldo do participante
  const calcularValorTotal = () => {
    return eventParticipants.reduce((total, participant) => {
      return total + (participant.valor_total || 0);
    }, 0);
  };

  const calcularValorPorParticipante = () => {
    const total = calcularValorTotal();
    const numParticipantes = getParticipantsByStatus("confirmed").length;
    return numParticipantes > 0 ? total / numParticipantes : 0;
  };

  const handleCreateParticipant = async () => {
    try {
      if (!newParticipant.name.trim()) {
        alert("O nome do participante é obrigatório");
        return;
      }

      // Primeiro, verificar se já existe um participante com o mesmo nome
      const { data: existingParticipant } = await supabase
        .from('participants')
        .select('name')
        .eq('name', newParticipant.name.trim())
        .single();

      if (existingParticipant) {
        alert('Já existe um participante com este nome');
        return;
      }

      // Criar novo participante com nome e PIX
      const { data, error } = await supabase
        .from('participants')
        .insert({
          name: newParticipant.name.trim(),
          pix_key: newParticipant.pix.trim() || null // Adiciona o PIX se existir
        })
        .select()
        .single();

      if (error) {
        console.error("Erro detalhado:", error);
        throw error;
      }

      // Fechar modal e limpar formulário
      setIsNewParticipantModalOpen(false);
      setNewParticipant({ name: "", phone: "", pix: "" });

      // Recarregar dados
      await Promise.all([
        fetchParticipants(),
        fetchAllParticipants(),
        fetchEventDetails()
      ]);

      alert("Participante adicionado com sucesso!");

    } catch (err) {
      console.error("Erro detalhado ao criar participante:", err);
      alert("Erro ao criar participante. Por favor, tente novamente.");
    }
  };

  // Atualizar a função handleDeleteParticipant
  const handleDeleteParticipant = async (participantId: string) => {
    try {
      if (!window.confirm('Tem certeza que deseja excluir este participante permanentemente?')) {
        return;
      }

      // 1. Remover da tabela event_participants primeiro
      const { error: eventParticipantsError } = await supabase
        .from('event_participants')
        .delete()
        .eq('participant_id', participantId);

      if (eventParticipantsError) {
        console.error('Erro ao remover participante do evento:', eventParticipantsError);
        throw eventParticipantsError;
      }

      // 2. Remover da tabela detalhe_de_custo
      const { error: costError } = await supabase
        .from('detalhe_de_custo')
        .delete()
        .eq('participant_id', participantId);

      if (costError) {
        console.error('Erro ao remover custos:', costError);
        throw costError;
      }

      // 3. Remover da tabela participants
      const { error: participantError } = await supabase
        .from('participants')
        .delete()
        .eq('id', participantId);

      if (participantError) {
        console.error('Erro ao remover participante:', participantError);
        throw participantError;
      }

      // 4. Atualizar estados locais
      setParticipants(prev => prev.filter(p => p.id !== participantId));
      setAllParticipants(prev => prev.filter(p => p.id !== participantId));
      setEventParticipants(prev => prev.filter(p => p.participant_id !== participantId));

      // 5. Recarregar dados
      await Promise.all([
        fetchParticipants(),
        fetchAllParticipants(),
        fetchEventDetails()
      ]);

      alert('Participante removido com sucesso!');

    } catch (error) {
      console.error('Erro ao remover participante:', error);
      alert('Erro ao remover participante. Por favor, tente novamente.');
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

  // No componente EventDetails, adicionar verificação de status
  const isEventFinished = event?.status === "finished";

  const handleEditParticipantName = async (participantId: string) => {
    const participant = participants.find(p => p.id === participantId);
    if (!participant) return;

    const newName = window.prompt('Digite o novo nome:', participant.name);
    if (!newName || newName.trim() === participant.name) return;

    try {
      const { error } = await supabase
        .from('participants')
        .update({ name: newName.trim() })
        .eq('id', participantId);

      if (error) throw error;

      // Recarregar dados
      await Promise.all([
        fetchParticipants(),
        fetchAllParticipants(),
        fetchEventDetails()
      ]);

      alert('Nome atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar nome:', error);
      alert('Erro ao atualizar nome. Por favor, tente novamente.');
    }
  };

  const handleOpenEditModal = async (participantId: string) => {
    try {
      // Buscar o participante do estado local primeiro
      const participantFromState = participants.find(p => p.id === participantId);
      
      if (!participantFromState) {
        // Se não encontrar no estado, buscar do banco
        const { data: participant, error: fetchError } = await supabase
          .from('participants')
          .select('id, name, pix_key')
          .eq('id', participantId)
          .single();

        if (fetchError) {
          console.error('Erro ao buscar participante:', fetchError);
          throw fetchError;
        }

        if (!participant) {
          alert('Participante não encontrado');
          return;
        }

        setEditingParticipant({
          id: participant.id,
          name: participant.name,
          pix_key: participant.pix_key
        });
      } else {
        // Usar os dados do estado local
        setEditingParticipant({
          id: participantFromState.id,
          name: participantFromState.name,
          pix_key: participantFromState.pix_key || null
        });
      }
      
      // Abrir o modal
      setIsEditParticipantModalOpen(true);
    } catch (error) {
      console.error('Erro ao abrir edição:', error);
      alert('Erro ao abrir edição. Por favor, tente novamente.');
    }
  };

  // Função para salvar as edições
  const handleSaveParticipantEdit = async () => {
    if (!editingParticipant) return;

    try {
      // Validar dados antes de atualizar
      if (!editingParticipant.name.trim()) {
        alert('O nome do participante é obrigatório');
        return;
      }

      // Verificar se já existe outro participante com o mesmo nome
      const { data: existingParticipant } = await supabase
        .from('participants')
        .select('id')
        .eq('name', editingParticipant.name.trim())
        .neq('id', editingParticipant.id) // Excluir o próprio participante da verificação
        .single();

      if (existingParticipant) {
        alert('Já existe outro participante com este nome');
        return;
      }

      // Atualizar o participante
      const { error } = await supabase
        .from('participants')
        .update({
          name: editingParticipant.name.trim(),
          pix_key: editingParticipant.pix_key?.trim() || null
        })
        .eq('id', editingParticipant.id);

      if (error) {
        console.error('Erro detalhado:', error);
        throw error;
      }

      // Recarregar dados
      await Promise.all([
        fetchParticipants(),
        fetchAllParticipants(),
        fetchEventDetails()
      ]);

      // Fechar modal e limpar estado
      setIsEditParticipantModalOpen(false);
      setEditingParticipant(null);
      
      alert('Participante atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar participante:', error);
      alert('Erro ao atualizar participante. Por favor, tente novamente.');
    }
  };

  // Adicionar função para calcular distribuição de pagamentos
  const calcularDistribuicaoPagamentos = () => {
    const valorPorPessoa = calcularValorPorParticipante();
    const participantes = getConfirmedParticipants();
    
    // Separar quem deve pagar e quem deve receber
    const devedores = participantes
      .filter(p => (p.valor_total || 0) < valorPorPessoa)
      .map(p => ({
        ...p,
        valorDevido: valorPorPessoa - (p.valor_total || 0)
      }))
      .sort((a, b) => b.valorDevido - a.valorDevido);

    const credores = participantes
      .filter(p => (p.valor_total || 0) > valorPorPessoa)
      .map(p => ({
        ...p,
        valorAReceber: (p.valor_total || 0) - valorPorPessoa,
        receberaDeQuem: [] as { nome: string; valor: number }[]
      }))
      .sort((a, b) => b.valorAReceber - a.valorAReceber);

    // Distribuir pagamentos
    devedores.forEach(devedor => {
      let valorRestante = devedor.valorDevido;

      for (const credor of credores) {
        if (valorRestante <= 0) break;
        
        const valorDisponivel = credor.valorAReceber - credor.receberaDeQuem.reduce((sum, p) => sum + p.valor, 0);
        const valorPagamento = Math.min(valorRestante, valorDisponivel);
        
        if (valorPagamento > 0) {
          credor.receberaDeQuem.push({
            nome: devedor.participant.name,
            valor: valorPagamento
          });
          valorRestante -= valorPagamento;
        }
      }
    });

    return {
      devedores: devedores.map(d => ({
        nome: d.participant.name,
        valorDevido: d.valorDevido,
        devePagarPara: credores
          .filter(c => c.receberaDeQuem.some(p => p.nome === d.participant.name))
          .map(c => ({
            nome: c.participant.name,
            valor: c.receberaDeQuem.find(p => p.nome === d.participant.name)!.valor,
            pix: c.participant.pix_key
          }))
      })),
      credores: credores.map(c => ({
        nome: c.participant.name,
        valorTotal: c.valorAReceber,
        receberaDeQuem: c.receberaDeQuem
      }))
    };
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
    <div className="min-h-screen bg-[#F8F7FF] p-4">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => navigate("/historico-eventos")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <span>←</span>
          <span>Voltar</span>
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {event?.title}
            </h1>
            {!isEventFinished && (
              <button
                onClick={() => {
                  setEditedTitle(event?.title || '');
                  setIsEditingTitle(true);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-xl">✏️</span>
              </button>
            )}
          </div>
          <div className="text-blue-500 bg-blue-50 px-3 py-1 rounded-md inline-block">
            {event?.date ? formatDateTime(event.date) : 'Data não definida'}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-gray-400">👥</span>
            <span className="text-xl font-semibold">
              {getParticipantsByStatus("confirmed").length} participantes
            </span>
          </div>
          {!isEventFinished && (
            <button
              onClick={() => setIsNewParticipantModalOpen(true)}
              className="bg-[#10B981] text-white px-6 py-3 rounded-lg hover:bg-[#0EA874] transition-colors flex items-center gap-2"
            >
              <span>👤</span>
              Adicionar Participante
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm mb-8">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                Participantes confirmados
              </h2>
              <span className="text-gray-500">
                Total: {getParticipantsByStatus("confirmed").length} participantes
              </span>
            </div>
            <div className="flex gap-6 mt-1">
              <p className="text-gray-500">
                Custo total: {formatCurrency(calcularValorTotal())}
              </p>
              <p className="text-gray-500">
                Valor por participante: {formatCurrency(calcularValorPorParticipante())}
              </p>
            </div>
          </div>

          <div className="divide-y">
            {getConfirmedParticipants().map((ep) => (
              <div key={ep.id} className="p-6 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-4 mb-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium">{ep.participant.name}</h3>
                      {!isEventFinished && (
                        <button
                          onClick={() => handleEditParticipantName(ep.participant_id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <span className="text-sm">✏️</span>
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {ep.participant.pix_key ? `PIX: ${ep.participant.pix_key}` : 'PIX não cadastrado'}
                      </span>
                      {!isEventFinished && (
                        <button
                          onClick={() => handleOpenEditModal(ep.participant_id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <span className="text-sm">✏️</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">
                        Total: {formatCurrency(ep.valor_total || 0)}
                      </span>
                      {!isEventFinished && (
                        <button
                          onClick={() => handleOpenCostModal(ep)}
                          className="text-[#10B981] text-xs hover:underline"
                        >
                          adicionar valor
                        </button>
                      )}
                    </div>
                    <span className={ep.valor_total >= calcularValorPorParticipante() ? 'text-green-500' : 'text-red-500'}>
                      {ep.valor_total >= calcularValorPorParticipante() ? 'A receber: ' : 'A pagar: '}
                      {formatCurrency(Math.abs(ep.valor_total - calcularValorPorParticipante()))}
                    </span>
                    
                    {/* Para quem deve pagar */}
                    {ep.valor_total < calcularValorPorParticipante() && (
                      <div className="text-sm text-gray-600 mt-1">
                        <p>Pagar para:</p>
                        {calcularDistribuicaoPagamentos()
                          .devedores
                          .find(d => d.nome === ep.participant.name)
                          ?.devePagarPara.map((pagamento, index) => (
                            <div key={index} className="ml-2 flex items-center gap-2">
                              <span>
                                → {pagamento.nome}: {formatCurrency(pagamento.valor)}
                              </span>
                              {pagamento.pix && (
                                <span className="text-gray-500">
                                  (PIX: {pagamento.pix})
                                </span>
                              )}
                            </div>
                          ))}
                      </div>
                    )}

                    {/* De quem vai receber */}
                    {ep.valor_total > calcularValorPorParticipante() && (
                      <div className="text-sm text-gray-600 mt-1">
                        <p>Receberá de:</p>
                        {calcularDistribuicaoPagamentos()
                          .credores
                          .find(c => c.nome === ep.participant.name)
                          ?.receberaDeQuem.map((pagamento, index) => (
                            <div key={index} className="ml-2">
                              ← {pagamento.nome}: {formatCurrency(pagamento.valor)}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
                {!isEventFinished && (
                  <button 
                    onClick={() => handleDeleteParticipant(ep.participant_id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <span>🗑️</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {!isEventFinished && (
          <div className="bg-white rounded-xl shadow-sm mb-8">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">
                  Participantes Disponíveis
                </h2>
                <button
                  onClick={() => setIsNewParticipantModalOpen(true)}
                  className="text-sm bg-[#10B981] text-white px-4 py-2 rounded-lg hover:bg-[#0EA874] transition-colors"
                >
                  + Novo
                </button>
              </div>
            </div>

            <div className="p-3">
              <div className="space-y-2">
                {getAvailableParticipants().map(participant => (
                  <div key={participant.id} 
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-sm">{participant.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {participant.pix_key ? `PIX: ${participant.pix_key}` : 'Update column Pix from participants'}
                        </span>
                        <button
                          onClick={() => handleOpenEditModal(participant.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <span className="text-sm">✏️</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={() => addParticipantToEvent(participant.id)}
                        className="text-green-600 hover:underline text-sm"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => handleDeleteParticipant(participant.id)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
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
                  Nome do Participante
                </label>
                <input
                  type="text"
                  value={newParticipant.name}
                  onChange={(e) => setNewParticipant(prev => ({ 
                    ...prev, 
                    name: e.target.value 
                  }))}
                  className="w-full p-2 border rounded-md"
                  placeholder="Digite o nome do participante"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chave Pix (opcional)
                </label>
                <input
                  type="text"
                  value={newParticipant.pix}
                  onChange={(e) => setNewParticipant(prev => ({ 
                    ...prev, 
                    pix: e.target.value 
                  }))}
                  className="w-full p-2 border rounded-md"
                  placeholder="Digite a chave Pix (opcional)"
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
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Participante */}
      {isEditParticipantModalOpen && editingParticipant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Editar Participante</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Participante
                </label>
                <input
                  type="text"
                  value={editingParticipant.name}
                  onChange={(e) => setEditingParticipant(prev => ({
                    ...prev!,
                    name: e.target.value
                  }))}
                  className="w-full p-2 border rounded-md"
                  placeholder="Digite o nome do participante"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chave Pix
                </label>
                <input
                  type="text"
                  value={editingParticipant.pix_key || ''}
                  onChange={(e) => setEditingParticipant(prev => ({
                    ...prev!,
                    pix_key: e.target.value
                  }))}
                  className="w-full p-2 border rounded-md"
                  placeholder="Digite a chave Pix"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setIsEditParticipantModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveParticipantEdit}
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
