
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
      clients: {
        Row: {
          id: number
          status: 'active' | 'inactive'
          first_payment_date: string | null
          last_payment_date: string | null
        }
        Insert: {
          id?: number
          status: 'active' | 'inactive'
          first_payment_date?: string | null
          last_payment_date?: string | null
        }
        Update: {
          id?: number
          status?: 'active' | 'inactive'
          first_payment_date?: string | null
          last_payment_date?: string | null
        }
      }
      goals: {
        Row: {
          id: number
          goal_type: 'active_clients' | 'new_clients' | 'churned_clients'
          start_date: string
          end_date: string
          target_value: number
          current_value: number
          manager_id: string
          created_at?: string
        }
        Insert: {
          id?: number
          goal_type: 'active_clients' | 'new_clients' | 'churned_clients'
          start_date: string
          end_date: string
          target_value: number
          current_value?: number
          manager_id: string
          created_at?: string
        }
        Update: {
          id?: number
          goal_type?: 'active_clients' | 'new_clients' | 'churned_clients'
          start_date?: string
          end_date?: string
          target_value?: number
          current_value?: number
          manager_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
