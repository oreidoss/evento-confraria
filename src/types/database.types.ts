export interface DatabaseTypes {
  public: {
    Tables: {
      events: {
        Row: {
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
        Insert: {
          id?: string;
          title: string;
          description: string;
          date: string;
          numero?: number;
          status?: "active" | "finished";
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          date?: string;
          numero?: number;
          status?: "active" | "finished";
          created_at?: string;
        };
      };
      participants: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
      };
      event_participants: {
        Row: {
          id: string;
          event_id: string;
          participant_id: string;
          status: "pending" | "confirmed";
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          participant_id: string;
          status?: "pending" | "confirmed";
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          participant_id?: string;
          status?: "pending" | "confirmed";
          created_at?: string;
        };
      };
      participant_costs: {
        Row: {
          id: string;
          event_id: string;
          participant_id: string;
          valor_por_participante: number;
          descricao: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          participant_id: string;
          valor_por_participante: number;
          descricao: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          participant_id?: string;
          valor_por_participante?: number;
          descricao?: string;
          created_at?: string;
        };
      };
    };
    Functions: {
      confirm_participants: {
        Args: {
          participants_data: Array<{
            event_id: string;
            participant_id: string;
            participant_name: string;
            status: "confirmed";
          }>;
        };
        Returns: void;
      };
      get_participant_costs: {
        Args: {
          p_event_id: string;
          p_participant_id: string;
        };
        Returns: Array<{
          id: string;
          valor_por_participante: number;
          descricao: string;
        }>;
      };
      add_participant_cost: {
        Args: {
          p_event_id: string;
          p_participant_id: string;
          p_valor: number;
          p_descricao: string;
        };
        Returns: void;
      };
      get_participants_with_costs: {
        Args: {
          event_id: string;
        };
        Returns: Array<{
          participant: {
            id: string;
            name: string;
          };
          costs: Array<{
            id: string;
            amount: number;
            description: string;
          }>;
        }>;
      };
    };
  };
}

export type ParticipantsWithCostsResponse = Array<{
  participant: {
    id: string;
    name: string;
  };
  costs: Array<{
    id: string;
    amount: number;
    description: string;
  }>;
}>;

export type GetParticipantsWithCosts =
  DatabaseTypes["public"]["Functions"]["get_participants_with_costs"];
