export interface GetParticipantsWithCosts {
  Args: {
    event_id: string;
  };
}

export interface ParticipantsWithCostsResponse {
  id: string;
  event_id: string;
  participant_id: string;
  status: "pending" | "confirmed";
  participant: {
    id: string;
    name: string;
  };
  valor_total: number;
  valor_a_pagar: number;
}

export interface Participant {
  id: string;
  name: string;
}

export interface EventParticipant {
  id: string;
  event_id: string;
  participant_id: string;
  status: "pending" | "confirmed";
  participant: Participant;
  valor_total?: number;
  valor_a_pagar?: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  numero: string;
  participantsCount?: number;
  totalValue?: number;
  valuePerParticipant?: number;
}
