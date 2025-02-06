import { createClient } from '@supabase/supabase-js'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          date?: string
          created_at?: string
          updated_at?: string
        }
      }
      participants: {
        Row: {
          id: string
          name: string
          email: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          created_at?: string
        }
      }
      event_participants: {
        Row: {
          id: string
          event_id: string
          participant_id: string
          participant_name: string
          status: 'pending' | 'confirmed'
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          participant_id: string
          participant_name: string
          status?: 'pending' | 'confirmed'
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          participant_id?: string
          participant_name?: string
          status?: 'pending' | 'confirmed'
          created_at?: string
        }
      }
      detalhe_de_custo: {
        Row: {
          id: string
          event_id: string
          participant_id: string
          valor_por_participante: number
          descricao: string
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          participant_id: string
          valor_por_participante: number
          descricao: string
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          participant_id?: string
          valor_por_participante?: number
          descricao?: string
          created_at?: string
        }
      }
    }
    Functions: {
      get_participants_with_costs: {
        Args: {
          event_id: string
        }
        Returns: {
          id: string
          participant_id: string
          participant_name: string
          email: string | null
          total_costs: number
          balance: number
        }[]
      }
      add_participant_cost: {
        Args: {
          p_event_id: string
          p_participant_id: string
          p_valor: number
          p_descricao: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltam variáveis de ambiente do Supabase')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey) 