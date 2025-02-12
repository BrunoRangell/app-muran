export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      badges: {
        Row: {
          code: string
          created_at: string
          description: string | null
          icon: string
          id: string
          name: string
          team_member_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          icon: string
          id?: string
          name: string
          team_member_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name?: string
          team_member_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "badges_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          acquisition_channel: string | null
          company_birthday: string | null
          company_name: string
          contact_name: string
          contact_phone: string
          contract_value: number
          created_at: string
          first_payment_date: string
          id: string
          last_payment_date: string | null
          payment_type: string
          status: string
        }
        Insert: {
          acquisition_channel?: string | null
          company_birthday?: string | null
          company_name: string
          contact_name: string
          contact_phone: string
          contract_value: number
          created_at?: string
          first_payment_date: string
          id?: string
          last_payment_date?: string | null
          payment_type: string
          status: string
        }
        Update: {
          acquisition_channel?: string | null
          company_birthday?: string | null
          company_name?: string
          contact_name?: string
          contact_phone?: string
          contract_value?: number
          created_at?: string
          first_payment_date?: string
          id?: string
          last_payment_date?: string | null
          payment_type?: string
          status?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          completed_at: string | null
          created_at: string
          current_value: number | null
          end_date: string
          final_value: number | null
          goal_type: string
          id: number
          manager_id: string
          start_date: string
          status: string
          target_value: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_value?: number | null
          end_date: string
          final_value?: number | null
          goal_type: string
          id?: number
          manager_id: string
          start_date: string
          status?: string
          target_value: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_value?: number | null
          end_date?: string
          final_value?: number | null
          goal_type?: string
          id?: number
          manager_id?: string
          start_date?: string
          status?: string
          target_value?: number
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          client_id: string | null
          created_at: string
          due_date: string
          id: number
          notes: string | null
          payment_date: string | null
          status: string
        }
        Insert: {
          amount: number
          client_id?: string | null
          created_at?: string
          due_date: string
          id?: never
          notes?: string | null
          payment_date?: string | null
          status: string
        }
        Update: {
          amount?: number
          client_id?: string | null
          created_at?: string
          due_date?: string
          id?: never
          notes?: string | null
          payment_date?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      salaries: {
        Row: {
          amount: number
          created_at: string
          id: string
          manager_id: string
          month: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          manager_id: string
          month: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          manager_id?: string
          month?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "salaries_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["manager_id"]
          },
        ]
      }
      team_members: {
        Row: {
          bio: string | null
          birthday: string | null
          created_at: string
          email: string
          id: string
          instagram: string | null
          linkedin: string | null
          manager_id: string
          name: string
          permission: string | null
          photo_url: string | null
          role: string
          start_date: string | null
          tiktok: string | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          birthday?: string | null
          created_at?: string
          email: string
          id?: string
          instagram?: string | null
          linkedin?: string | null
          manager_id: string
          name: string
          permission?: string | null
          photo_url?: string | null
          role: string
          start_date?: string | null
          tiktok?: string | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          birthday?: string | null
          created_at?: string
          email?: string
          id?: string
          instagram?: string | null
          linkedin?: string | null
          manager_id?: string
          name?: string
          permission?: string | null
          photo_url?: string | null
          role?: string
          start_date?: string | null
          tiktok?: string | null
          updated_at?: string
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
