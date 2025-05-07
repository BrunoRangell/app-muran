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
      client_current_reviews: {
        Row: {
          client_id: string
          created_at: string
          custom_budget_amount: number | null
          custom_budget_id: string | null
          google_account_id: string | null
          google_account_name: string | null
          google_daily_budget_current: number | null
          google_total_spent: number | null
          id: string
          meta_account_id: string | null
          meta_account_name: string | null
          meta_daily_budget_current: number | null
          meta_total_spent: number | null
          review_date: string
          updated_at: string
          using_custom_budget: boolean | null
        }
        Insert: {
          client_id: string
          created_at?: string
          custom_budget_amount?: number | null
          custom_budget_id?: string | null
          google_account_id?: string | null
          google_account_name?: string | null
          google_daily_budget_current?: number | null
          google_total_spent?: number | null
          id?: string
          meta_account_id?: string | null
          meta_account_name?: string | null
          meta_daily_budget_current?: number | null
          meta_total_spent?: number | null
          review_date?: string
          updated_at?: string
          using_custom_budget?: boolean | null
        }
        Update: {
          client_id?: string
          created_at?: string
          custom_budget_amount?: number | null
          custom_budget_id?: string | null
          google_account_id?: string | null
          google_account_name?: string | null
          google_daily_budget_current?: number | null
          google_total_spent?: number | null
          id?: string
          meta_account_id?: string | null
          meta_account_name?: string | null
          meta_daily_budget_current?: number | null
          meta_total_spent?: number | null
          review_date?: string
          updated_at?: string
          using_custom_budget?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "client_current_reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_google_accounts: {
        Row: {
          account_id: string
          account_name: string
          budget_amount: number
          client_id: string
          created_at: string
          id: string
          is_primary: boolean
          status: string
          updated_at: string
        }
        Insert: {
          account_id: string
          account_name: string
          budget_amount?: number
          client_id: string
          created_at?: string
          id?: string
          is_primary?: boolean
          status?: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          account_name?: string
          budget_amount?: number
          client_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_google_accounts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_meta_accounts: {
        Row: {
          account_id: string
          account_name: string
          budget_amount: number
          client_id: string
          created_at: string
          id: string
          is_primary: boolean
          status: string
          updated_at: string
        }
        Insert: {
          account_id: string
          account_name: string
          budget_amount?: number
          client_id: string
          created_at?: string
          id?: string
          is_primary?: boolean
          status?: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          account_name?: string
          budget_amount?: number
          client_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_meta_accounts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
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
      cron_execution_logs: {
        Row: {
          details: Json | null
          execution_time: string | null
          id: string
          job_name: string
          status: string
        }
        Insert: {
          details?: Json | null
          execution_time?: string | null
          id?: string
          job_name: string
          status: string
        }
        Update: {
          details?: Json | null
          execution_time?: string | null
          id?: string
          job_name?: string
          status?: string
        }
        Relationships: []
      }
      custom_budgets: {
        Row: {
          budget_amount: number
          client_id: string
          created_at: string
          description: string | null
          end_date: string
          id: string
          is_active: boolean
          is_recurring: boolean
          platform: string
          recurrence_pattern: string | null
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
          is_recurring?: boolean
          platform?: string
          recurrence_pattern?: string | null
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
          is_recurring?: boolean
          platform?: string
          recurrence_pattern?: string | null
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_budgets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_budget_reviews: {
        Row: {
          account_display_name: string | null
          client_account_id: string | null
          client_id: string | null
          created_at: string | null
          custom_budget_amount: number | null
          custom_budget_id: string | null
          id: number
          meta_account_id: string | null
          meta_account_name: string | null
          meta_daily_budget_current: number | null
          meta_total_spent: number | null
          review_date: string
          updated_at: string | null
          using_custom_budget: boolean | null
        }
        Insert: {
          account_display_name?: string | null
          client_account_id?: string | null
          client_id?: string | null
          created_at?: string | null
          custom_budget_amount?: number | null
          custom_budget_id?: string | null
          id?: number
          meta_account_id?: string | null
          meta_account_name?: string | null
          meta_daily_budget_current?: number | null
          meta_total_spent?: number | null
          review_date?: string
          updated_at?: string | null
          using_custom_budget?: boolean | null
        }
        Update: {
          account_display_name?: string | null
          client_account_id?: string | null
          client_id?: string | null
          created_at?: string | null
          custom_budget_amount?: number | null
          custom_budget_id?: string | null
          id?: number
          meta_account_id?: string | null
          meta_account_name?: string | null
          meta_daily_budget_current?: number | null
          meta_total_spent?: number | null
          review_date?: string
          updated_at?: string | null
          using_custom_budget?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_budget_reviews_client_account_id_fkey"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "client_meta_accounts"
            referencedColumns: ["id"]
          },
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
      google_ads_reviews: {
        Row: {
          account_display_name: string | null
          client_account_id: string | null
          client_id: string
          created_at: string
          custom_budget_amount: number | null
          custom_budget_id: string | null
          google_account_id: string | null
          google_account_name: string | null
          google_daily_budget_current: number | null
          google_last_five_days_spent: number | null
          google_total_spent: number | null
          id: string
          review_date: string
          updated_at: string
          using_custom_budget: boolean | null
        }
        Insert: {
          account_display_name?: string | null
          client_account_id?: string | null
          client_id: string
          created_at?: string
          custom_budget_amount?: number | null
          custom_budget_id?: string | null
          google_account_id?: string | null
          google_account_name?: string | null
          google_daily_budget_current?: number | null
          google_last_five_days_spent?: number | null
          google_total_spent?: number | null
          id?: string
          review_date?: string
          updated_at?: string
          using_custom_budget?: boolean | null
        }
        Update: {
          account_display_name?: string | null
          client_account_id?: string | null
          client_id?: string
          created_at?: string
          custom_budget_amount?: number | null
          custom_budget_id?: string | null
          google_account_id?: string | null
          google_account_name?: string | null
          google_daily_budget_current?: number | null
          google_last_five_days_spent?: number | null
          google_total_spent?: number | null
          id?: string
          review_date?: string
          updated_at?: string
          using_custom_budget?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "google_ads_reviews_client_account_id_fkey"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "client_google_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_ads_reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_ads_reviews_custom_budget_id_fkey"
            columns: ["custom_budget_id"]
            isOneToOne: false
            referencedRelation: "meta_custom_budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      google_ads_token_metadata: {
        Row: {
          created_at: string
          details: Json | null
          expires_at: string | null
          id: string
          last_checked: string | null
          last_refreshed: string | null
          status: string
          token_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          expires_at?: string | null
          id?: string
          last_checked?: string | null
          last_refreshed?: string | null
          status: string
          token_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          expires_at?: string | null
          id?: string
          last_checked?: string | null
          last_refreshed?: string | null
          status?: string
          token_type?: string
          updated_at?: string
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
      scheduled_tasks: {
        Row: {
          config: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          last_run: string | null
          schedule: string
          task_name: string
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_run?: string | null
          schedule: string
          task_name: string
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_run?: string | null
          schedule?: string
          task_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_configs: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          message: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          message: string
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          message?: string
        }
        Relationships: []
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
        Args: { budget_amount: number; start_date: string; end_date: string }
        Returns: number
      }
      extract_transaction_pattern: {
        Args: { description: string }
        Returns: string
      }
      get_cron_expression: {
        Args: { job_name: string }
        Returns: {
          cron_expression: string
        }[]
      }
      get_cron_jobs: {
        Args: { job_names: string[] }
        Returns: {
          jobid: number
          jobname: string
          schedule: string
          active: boolean
        }[]
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
      review_all_google_ads_clients: {
        Args: Record<PropertyKey, never>
        Returns: Json
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      cost_category: [
        "marketing",
        "salarios",
        "comissoes",
        "impostos",
        "alimentacao",
        "ferramentas_e_softwares",
        "viagem_e_hospedagem",
        "equipamentos_e_escritorio",
        "despesas_financeiras",
        "outros",
        "eventos_e_treinamentos",
        "doacoes",
        "marketing_aquisicao",
        "custos_vendas",
        "infraestrutura_operacional",
        "pessoal_administrativo",
        "estrutura_fisica_digital",
        "taxas_impostos",
        "expansao_negocio",
        "eventos_networking",
        "responsabilidade_social",
        "despesas_corriqueiras",
        "despesas_nao_planejadas",
      ],
      cost_category_new: [
        "marketing",
        "vendas",
        "plataformas_ferramentas",
        "despesas_pessoal",
        "taxas_impostos",
        "servicos_profissionais",
        "eventos_networking",
        "acoes_sociais",
      ],
      cost_macro_category: [
        "despesas_operacionais",
        "despesas_administrativas",
        "investimentos_e_outros",
      ],
      cost_main_category: [
        "custos_diretos_operacao",
        "custos_fixos_administrativos",
        "investimentos_desenvolvimento",
        "outros_excepcionais",
      ],
      cost_subcategory: [
        "marketing_aquisicao",
        "custos_vendas",
        "infraestrutura_operacional",
        "pessoal_administrativo",
        "estrutura_fisica_digital",
        "taxas_impostos",
        "despesas_financeiras",
        "expansao_negocio",
        "eventos_networking",
        "responsabilidade_social",
        "despesas_corriqueiras",
        "despesas_nao_planejadas",
      ],
      payment_status: [
        "RECEIVED",
        "CONFIRMED",
        "PENDING",
        "OVERDUE",
        "REFUNDED",
        "CANCELLED",
      ],
    },
  },
} as const
