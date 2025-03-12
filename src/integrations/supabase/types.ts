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
      api_tokens: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          name: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          name: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          name?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
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
          google_account_id: string | null
          google_ads_budget: number | null
          id: string
          last_payment_date: string | null
          meta_account_id: string | null
          meta_ads_budget: number | null
          payment_type: string
          status: string
        }
        Insert: {
          acquisition_channel?: string | null
          company_birthday?: string | null
          company_name: string
          contact_name: string
          contact_phone: string
          contract_value?: number
          created_at?: string
          first_payment_date: string
          google_account_id?: string | null
          google_ads_budget?: number | null
          id?: string
          last_payment_date?: string | null
          meta_account_id?: string | null
          meta_ads_budget?: number | null
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
          google_account_id?: string | null
          google_ads_budget?: number | null
          id?: string
          last_payment_date?: string | null
          meta_account_id?: string | null
          meta_ads_budget?: number | null
          payment_type?: string
          status?: string
        }
        Relationships: []
      }
      costs: {
        Row: {
          amount: number
          created_at: string
          date: string
          description: string | null
          id: number
          name: string
          name_customized: boolean | null
          original_name: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          date: string
          description?: string | null
          id?: never
          name: string
          name_customized?: boolean | null
          original_name?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          description?: string | null
          id?: never
          name?: string
          name_customized?: boolean | null
          original_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      costs_categories: {
        Row: {
          category_id: string
          cost_id: number
        }
        Insert: {
          category_id: string
          cost_id: number
        }
        Update: {
          category_id?: string
          cost_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "costs_categories_cost_id_fkey"
            columns: ["cost_id"]
            isOneToOne: false
            referencedRelation: "costs"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_budget_reviews: {
        Row: {
          client_id: string | null
          created_at: string | null
          id: number
          meta_account_id: string | null
          meta_account_name: string | null
          meta_daily_budget_current: number | null
          meta_total_spent: number | null
          review_date: string
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          id?: number
          meta_account_id?: string | null
          meta_account_name?: string | null
          meta_daily_budget_current?: number | null
          meta_total_spent?: number | null
          review_date?: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          id?: number
          meta_account_id?: string | null
          meta_account_name?: string | null
          meta_daily_budget_current?: number | null
          meta_total_spent?: number | null
          review_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_budget_reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
      imported_transactions: {
        Row: {
          cost_id: number | null
          created_at: string
          fitid: string
        }
        Insert: {
          cost_id?: number | null
          created_at?: string
          fitid: string
        }
        Update: {
          cost_id?: number | null
          created_at?: string
          fitid?: string
        }
        Relationships: [
          {
            foreignKeyName: "imported_transactions_cost_id_fkey"
            columns: ["cost_id"]
            isOneToOne: false
            referencedRelation: "costs"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_custom_budgets: {
        Row: {
          budget_amount: number
          client_id: string
          created_at: string
          description: string | null
          end_date: string
          id: string
          is_active: boolean
          start_date: string
          updated_at: string
        }
        Insert: {
          budget_amount?: number
          client_id: string
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean
          start_date: string
          updated_at?: string
        }
        Update: {
          budget_amount?: number
          client_id?: string
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meta_custom_budgets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          client_id: string | null
          created_at: string
          id: number
          notes: string | null
          reference_month: string
          updated_at: string | null
        }
        Insert: {
          amount?: number
          client_id?: string | null
          created_at?: string
          id?: number
          notes?: string | null
          reference_month: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          client_id?: string | null
          created_at?: string
          id?: number
          notes?: string | null
          reference_month?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_exists"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
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
      calculate_daily_budget: {
        Args: {
          budget_amount: number
          start_date: string
          end_date: string
        }
        Returns: number
      }
      extract_transaction_pattern: {
        Args: {
          description: string
        }
        Returns: string
      }
      insert_daily_budget_review: {
        Args: {
          p_client_id: string
          p_review_date: string
          p_meta_daily_budget_current: number
          p_meta_total_spent: number
          p_meta_account_id: string
          p_meta_account_name: string
        }
        Returns: number
      }
      update_daily_budget_review: {
        Args: {
          p_id: number
          p_meta_daily_budget_current: number
          p_meta_total_spent: number
        }
        Returns: undefined
      }
    }
    Enums: {
      cost_category:
        | "marketing"
        | "salarios"
        | "comissoes"
        | "impostos"
        | "alimentacao"
        | "ferramentas_e_softwares"
        | "viagem_e_hospedagem"
        | "equipamentos_e_escritorio"
        | "despesas_financeiras"
        | "outros"
        | "eventos_e_treinamentos"
        | "doacoes"
        | "marketing_aquisicao"
        | "custos_vendas"
        | "infraestrutura_operacional"
        | "pessoal_administrativo"
        | "estrutura_fisica_digital"
        | "taxas_impostos"
        | "expansao_negocio"
        | "eventos_networking"
        | "responsabilidade_social"
        | "despesas_corriqueiras"
        | "despesas_nao_planejadas"
      cost_category_new:
        | "marketing"
        | "vendas"
        | "plataformas_ferramentas"
        | "despesas_pessoal"
        | "taxas_impostos"
        | "servicos_profissionais"
        | "eventos_networking"
        | "acoes_sociais"
      cost_macro_category:
        | "despesas_operacionais"
        | "despesas_administrativas"
        | "investimentos_e_outros"
      cost_main_category:
        | "custos_diretos_operacao"
        | "custos_fixos_administrativos"
        | "investimentos_desenvolvimento"
        | "outros_excepcionais"
      cost_subcategory:
        | "marketing_aquisicao"
        | "custos_vendas"
        | "infraestrutura_operacional"
        | "pessoal_administrativo"
        | "estrutura_fisica_digital"
        | "taxas_impostos"
        | "despesas_financeiras"
        | "expansao_negocio"
        | "eventos_networking"
        | "responsabilidade_social"
        | "despesas_corriqueiras"
        | "despesas_nao_planejadas"
      payment_status:
        | "RECEIVED"
        | "CONFIRMED"
        | "PENDING"
        | "OVERDUE"
        | "REFUNDED"
        | "CANCELLED"
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
