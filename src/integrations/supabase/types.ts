export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
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
      batch_review_logs: {
        Row: {
          created_at: string
          error_count: number
          execution_time_ms: number
          global_updates_performed: boolean | null
          id: string
          platform: string
          review_date: string
          success_count: number
          total_clients: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_count: number
          execution_time_ms: number
          global_updates_performed?: boolean | null
          id?: string
          platform: string
          review_date?: string
          success_count: number
          total_clients: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_count?: number
          execution_time_ms?: number
          global_updates_performed?: boolean | null
          id?: string
          platform?: string
          review_date?: string
          success_count?: number
          total_clients?: number
          updated_at?: string
        }
        Relationships: []
      }
      bot_action_requests: {
        Row: {
          action: string
          candidates_snapshot: Json | null
          channel_id: string | null
          client_id: string | null
          comando: string | null
          created_at: string
          creative_draft: Json | null
          executed_at: string | null
          hierarchy_snapshot: Json | null
          id: string
          level: string | null
          new_value: number | null
          platform: string
          previous_value_snapshot: Json | null
          requested_by_discord_user: string | null
          result: Json | null
          status: string
          target_id: string | null
          target_name: string | null
        }
        Insert: {
          action: string
          candidates_snapshot?: Json | null
          channel_id?: string | null
          client_id?: string | null
          comando?: string | null
          created_at?: string
          creative_draft?: Json | null
          executed_at?: string | null
          hierarchy_snapshot?: Json | null
          id?: string
          level?: string | null
          new_value?: number | null
          platform: string
          previous_value_snapshot?: Json | null
          requested_by_discord_user?: string | null
          result?: Json | null
          status?: string
          target_id?: string | null
          target_name?: string | null
        }
        Update: {
          action?: string
          candidates_snapshot?: Json | null
          channel_id?: string | null
          client_id?: string | null
          comando?: string | null
          created_at?: string
          creative_draft?: Json | null
          executed_at?: string | null
          hierarchy_snapshot?: Json | null
          id?: string
          level?: string | null
          new_value?: number | null
          platform?: string
          previous_value_snapshot?: Json | null
          requested_by_discord_user?: string | null
          result?: Json | null
          status?: string
          target_id?: string | null
          target_name?: string | null
        }
        Relationships: []
      }
      budget_reviews: {
        Row: {
          account_id: string
          campaign_budgets: Json | null
          client_id: string
          created_at: string
          custom_budget_amount: number | null
          custom_budget_end_date: string | null
          custom_budget_id: string | null
          custom_budget_start_date: string | null
          daily_budget_current: number | null
          day_1_spent: number | null
          day_2_spent: number | null
          day_3_spent: number | null
          day_4_spent: number | null
          day_5_spent: number | null
          id: string
          last_five_days_spent: number | null
          platform: string
          review_date: string
          total_spent: number | null
          updated_at: string
          using_custom_budget: boolean | null
          warning_ignored_date: string | null
          warning_ignored_today: boolean | null
        }
        Insert: {
          account_id: string
          campaign_budgets?: Json | null
          client_id: string
          created_at?: string
          custom_budget_amount?: number | null
          custom_budget_end_date?: string | null
          custom_budget_id?: string | null
          custom_budget_start_date?: string | null
          daily_budget_current?: number | null
          day_1_spent?: number | null
          day_2_spent?: number | null
          day_3_spent?: number | null
          day_4_spent?: number | null
          day_5_spent?: number | null
          id?: string
          last_five_days_spent?: number | null
          platform: string
          review_date?: string
          total_spent?: number | null
          updated_at?: string
          using_custom_budget?: boolean | null
          warning_ignored_date?: string | null
          warning_ignored_today?: boolean | null
        }
        Update: {
          account_id?: string
          campaign_budgets?: Json | null
          client_id?: string
          created_at?: string
          custom_budget_amount?: number | null
          custom_budget_end_date?: string | null
          custom_budget_id?: string | null
          custom_budget_start_date?: string | null
          daily_budget_current?: number | null
          day_1_spent?: number | null
          day_2_spent?: number | null
          day_3_spent?: number | null
          day_4_spent?: number | null
          day_5_spent?: number | null
          id?: string
          last_five_days_spent?: number | null
          platform?: string
          review_date?: string
          total_spent?: number | null
          updated_at?: string
          using_custom_budget?: boolean | null
          warning_ignored_date?: string | null
          warning_ignored_today?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_reviews_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "client_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_reviews_custom_budget_id_fkey"
            columns: ["custom_budget_id"]
            isOneToOne: false
            referencedRelation: "custom_budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_health: {
        Row: {
          account_id: string
          active_campaigns_count: number
          campaigns_detailed: Json | null
          client_id: string
          cost_today: number
          created_at: string
          has_account: boolean
          id: string
          impressions_today: number
          platform: string
          snapshot_date: string
          unserved_campaigns_count: number
          updated_at: string
        }
        Insert: {
          account_id: string
          active_campaigns_count?: number
          campaigns_detailed?: Json | null
          client_id: string
          cost_today?: number
          created_at?: string
          has_account?: boolean
          id?: string
          impressions_today?: number
          platform: string
          snapshot_date?: string
          unserved_campaigns_count?: number
          updated_at?: string
        }
        Update: {
          account_id?: string
          active_campaigns_count?: number
          campaigns_detailed?: Json | null
          client_id?: string
          cost_today?: number
          created_at?: string
          has_account?: boolean
          id?: string
          impressions_today?: number
          platform?: string
          snapshot_date?: string
          unserved_campaigns_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_health_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "client_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_health_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_health_alerts: {
        Row: {
          account_id: string
          client_id: string
          discord_message_id: string | null
          id: string
          sent_at: string
          snapshot_date: string
          total_active: number
          unserved_count: number
        }
        Insert: {
          account_id: string
          client_id: string
          discord_message_id?: string | null
          id?: string
          sent_at?: string
          snapshot_date?: string
          total_active?: number
          unserved_count?: number
        }
        Update: {
          account_id?: string
          client_id?: string
          discord_message_id?: string | null
          id?: string
          sent_at?: string
          snapshot_date?: string
          total_active?: number
          unserved_count?: number
        }
        Relationships: []
      }
      client_accounts: {
        Row: {
          account_id: string
          account_name: string
          balance_set_at: string | null
          budget_amount: number
          client_id: string
          created_at: string
          id: string
          is_prepay_account: boolean | null
          is_primary: boolean
          last_funding_amount: number | null
          last_funding_detected_at: string | null
          platform: string
          saldo_restante: number | null
          status: string
          updated_at: string
        }
        Insert: {
          account_id: string
          account_name: string
          balance_set_at?: string | null
          budget_amount?: number
          client_id: string
          created_at?: string
          id?: string
          is_prepay_account?: boolean | null
          is_primary?: boolean
          last_funding_amount?: number | null
          last_funding_detected_at?: string | null
          platform: string
          saldo_restante?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          account_name?: string
          balance_set_at?: string | null
          budget_amount?: number
          client_id?: string
          created_at?: string
          id?: string
          is_prepay_account?: boolean | null
          is_primary?: boolean
          last_funding_amount?: number | null
          last_funding_detected_at?: string | null
          platform?: string
          saldo_restante?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_accounts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_portals: {
        Row: {
          access_count: number | null
          access_token: string
          allow_period_change: boolean | null
          allow_platform_change: boolean | null
          client_id: string
          created_at: string | null
          created_by: string
          default_period: number | null
          default_platform: string | null
          id: string
          is_active: boolean | null
          last_accessed_at: string | null
          updated_at: string | null
        }
        Insert: {
          access_count?: number | null
          access_token: string
          allow_period_change?: boolean | null
          allow_platform_change?: boolean | null
          client_id: string
          created_at?: string | null
          created_by: string
          default_period?: number | null
          default_platform?: string | null
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          updated_at?: string | null
        }
        Update: {
          access_count?: number | null
          access_token?: string
          allow_period_change?: boolean | null
          allow_platform_change?: boolean | null
          client_id?: string
          created_at?: string | null
          created_by?: string
          default_period?: number | null
          default_platform?: string | null
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_portals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_task_lists: {
        Row: {
          client_id: string
          created_at: string
          id: string
          name: string
          position: number
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          name: string
          position?: number
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          name?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "client_task_lists_client_id_fkey"
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
          id: string
          last_payment_date: string | null
          logo_url: string | null
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
          id?: string
          last_payment_date?: string | null
          logo_url?: string | null
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
          logo_url?: string | null
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
          account_id: string | null
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
          account_id?: string | null
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
          account_id?: string | null
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
            foreignKeyName: "custom_budgets_account_id_new_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "client_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_budgets_client_id_fkey"
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
      important_dates: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string | null
          date: string
          date_type: string
          description: string | null
          entity_id: string | null
          entity_type: string
          icon: string | null
          id: string
          is_recurring: boolean | null
          recurrence_pattern: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          date: string
          date_type: string
          description?: string | null
          entity_id?: string | null
          entity_type: string
          icon?: string | null
          id?: string
          is_recurring?: boolean | null
          recurrence_pattern?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          date_type?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string
          icon?: string | null
          id?: string
          is_recurring?: boolean | null
          recurrence_pattern?: string | null
          title?: string
          updated_at?: string | null
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
      leads: {
        Row: {
          assignee_id: string | null
          clickup_task_id: string | null
          company: string | null
          contact_info: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          notes: string | null
          position: number
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          clickup_task_id?: string | null
          company?: string | null
          contact_info?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          notes?: string | null
          position?: number
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          clickup_task_id?: string | null
          company?: string | null
          contact_info?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          notes?: string | null
          position?: number
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "task_members"
            referencedColumns: ["id"]
          },
        ]
      }
      low_balance_alerts: {
        Row: {
          account_id: string
          client_id: string
          daily_budget: number
          dias_restantes: number
          discord_message_id: string | null
          id: string
          saldo: number
          sent_at: string
        }
        Insert: {
          account_id: string
          client_id: string
          daily_budget: number
          dias_restantes: number
          discord_message_id?: string | null
          id?: string
          saldo: number
          sent_at?: string
        }
        Update: {
          account_id?: string
          client_id?: string
          daily_budget?: number
          dias_restantes?: number
          discord_message_id?: string | null
          id?: string
          saldo?: number
          sent_at?: string
        }
        Relationships: []
      }
      meta_token_metadata: {
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
          status?: string
          token_type?: string
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
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      role_audit_log: {
        Row: {
          action: string
          details: Json | null
          id: string
          performed_at: string
          performed_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          action: string
          details?: Json | null
          id?: string
          performed_at?: string
          performed_by?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          action?: string
          details?: Json | null
          id?: string
          performed_at?: string
          performed_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
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
      task_assignees: {
        Row: {
          created_at: string
          id: string
          member_id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          task_id: string
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignees_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "task_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_clickup_sync_state: {
        Row: {
          backfill_active: boolean
          backfill_page: number
          backfill_since: string | null
          backfill_started_at: string | null
          id: string
          incremental_page: number
          last_error: string | null
          last_run_at: string | null
          last_run_status: string | null
          last_run_summary: Json | null
          last_synced_at: string
        }
        Insert: {
          backfill_active?: boolean
          backfill_page?: number
          backfill_since?: string | null
          backfill_started_at?: string | null
          id?: string
          incremental_page?: number
          last_error?: string | null
          last_run_at?: string | null
          last_run_status?: string | null
          last_run_summary?: Json | null
          last_synced_at?: string
        }
        Update: {
          backfill_active?: boolean
          backfill_page?: number
          backfill_since?: string | null
          backfill_started_at?: string | null
          id?: string
          incremental_page?: number
          last_error?: string | null
          last_run_at?: string | null
          last_run_status?: string | null
          last_run_summary?: Json | null
          last_synced_at?: string
        }
        Relationships: []
      }
      task_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          task_id: string
        }
        Insert: {
          author_id?: string
          content: string
          created_at?: string
          id?: string
          task_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_folders: {
        Row: {
          clickup_folder_id: string | null
          color: string
          created_at: string
          icon: string | null
          id: string
          name: string
          position: number
          space_id: string
          updated_at: string
        }
        Insert: {
          clickup_folder_id?: string | null
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          position?: number
          space_id: string
          updated_at?: string
        }
        Update: {
          clickup_folder_id?: string | null
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          position?: number
          space_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_folders_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "task_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      task_lists: {
        Row: {
          clickup_list_id: string | null
          created_at: string
          folder_id: string
          id: string
          kind: string
          name: string
          position: number
        }
        Insert: {
          clickup_list_id?: string | null
          created_at?: string
          folder_id: string
          id?: string
          kind?: string
          name: string
          position?: number
        }
        Update: {
          clickup_list_id?: string | null
          created_at?: string
          folder_id?: string
          id?: string
          kind?: string
          name?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "task_lists_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "task_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      task_members: {
        Row: {
          auth_user_id: string | null
          avatar_url: string | null
          clickup_user_id: number | null
          color: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          role: Database["public"]["Enums"]["task_member_role"] | null
        }
        Insert: {
          auth_user_id?: string | null
          avatar_url?: string | null
          clickup_user_id?: number | null
          color?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          role?: Database["public"]["Enums"]["task_member_role"] | null
        }
        Update: {
          auth_user_id?: string | null
          avatar_url?: string | null
          clickup_user_id?: number | null
          color?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["task_member_role"] | null
        }
        Relationships: []
      }
      task_space_access: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          permission_level: Database["public"]["Enums"]["task_permission_level"]
          space_id: string
          task_member_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          permission_level?: Database["public"]["Enums"]["task_permission_level"]
          space_id: string
          task_member_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          permission_level?: Database["public"]["Enums"]["task_permission_level"]
          space_id?: string
          task_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_space_access_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "task_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_space_access_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "task_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_space_access_task_member_id_fkey"
            columns: ["task_member_id"]
            isOneToOne: false
            referencedRelation: "task_members"
            referencedColumns: ["id"]
          },
        ]
      }
      task_spaces: {
        Row: {
          clickup_space_id: string | null
          color: string
          created_at: string
          icon: string | null
          id: string
          name: string
          position: number
        }
        Insert: {
          clickup_space_id?: string | null
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          position?: number
        }
        Update: {
          clickup_space_id?: string | null
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          position?: number
        }
        Relationships: []
      }
      task_views: {
        Row: {
          created_at: string
          filters: Json
          group_by: string
          id: string
          is_private: boolean
          list_id: string | null
          name: string
          owner_id: string | null
          position: number
          slot: string | null
          sort_by: string | null
          view_type: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          group_by?: string
          id?: string
          is_private?: boolean
          list_id?: string | null
          name: string
          owner_id?: string | null
          position?: number
          slot?: string | null
          sort_by?: string | null
          view_type?: string
        }
        Update: {
          created_at?: string
          filters?: Json
          group_by?: string
          id?: string
          is_private?: boolean
          list_id?: string | null
          name?: string
          owner_id?: string | null
          position?: number
          slot?: string | null
          sort_by?: string | null
          view_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_views_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "task_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_views_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "task_members"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          clickup_task_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          internal_area:
            | Database["public"]["Enums"]["task_internal_area"]
            | null
          is_internal: boolean
          list_id: string | null
          position: number
          priority: Database["public"]["Enums"]["task_priority"] | null
          recurrence: Json | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          clickup_task_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          internal_area?:
            | Database["public"]["Enums"]["task_internal_area"]
            | null
          is_internal?: boolean
          list_id?: string | null
          position?: number
          priority?: Database["public"]["Enums"]["task_priority"] | null
          recurrence?: Json | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          clickup_task_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          internal_area?:
            | Database["public"]["Enums"]["task_internal_area"]
            | null
          is_internal?: boolean
          list_id?: string | null
          position?: number
          priority?: Database["public"]["Enums"]["task_priority"] | null
          recurrence?: Json | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "task_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_new_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "task_lists"
            referencedColumns: ["id"]
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
          photo_url?: string | null
          role?: string
          start_date?: string | null
          tiktok?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          granted_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_daily_budget: {
        Args: { budget_amount: number; end_date: string; start_date: string }
        Returns: number
      }
      cleanup_old_logs: { Args: never; Returns: undefined }
      extract_transaction_pattern: {
        Args: { description: string }
        Returns: string
      }
      get_campaign_health_status: { Args: never; Returns: Json }
      get_cron_expression: {
        Args: { job_name: string }
        Returns: {
          cron_expression: string
        }[]
      }
      get_cron_jobs: {
        Args: { job_names: string[] }
        Returns: {
          active: boolean
          jobid: number
          jobname: string
          schedule: string
        }[]
      }
      get_current_user_role: { Args: never; Returns: string }
      get_portal_client_data: { Args: { _token: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_task_space_access: {
        Args: {
          p_min_level: Database["public"]["Enums"]["task_permission_level"]
          p_space_id: string
        }
        Returns: boolean
      }
      insert_daily_budget_review: {
        Args: {
          p_client_id: string
          p_meta_account_id: string
          p_meta_account_name: string
          p_meta_daily_budget_current: number
          p_meta_total_spent: number
          p_review_date: string
        }
        Returns: number
      }
      is_admin: { Args: never; Returns: boolean }
      is_service_role_execution: { Args: never; Returns: boolean }
      is_task_admin: { Args: never; Returns: boolean }
      is_task_member: { Args: never; Returns: boolean }
      is_task_participant: { Args: never; Returns: boolean }
      is_team_member: { Args: never; Returns: boolean }
      manual_cleanup_campaign_health: { Args: never; Returns: Json }
      review_all_google_ads_clients: { Args: never; Returns: Json }
      task_space_of_folder: { Args: { p_folder_id: string }; Returns: string }
      task_space_of_list: { Args: { p_list_id: string }; Returns: string }
      task_space_of_task: { Args: { p_task_id: string }; Returns: string }
      unaccent: { Args: { "": string }; Returns: string }
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
      app_role: "admin" | "member"
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
      lead_status:
        | "novo_lead"
        | "contato_iniciado"
        | "qualificacao"
        | "reuniao_agendada"
        | "proposta_enviada"
        | "negociacao"
        | "follow_up"
        | "aguardando_documentos"
        | "fechamento"
        | "ganho"
        | "perdido"
      payment_status:
        | "RECEIVED"
        | "CONFIRMED"
        | "PENDING"
        | "OVERDUE"
        | "REFUNDED"
        | "CANCELLED"
      task_internal_area: "Operacional" | "Financeiro" | "Administrativo"
      task_member_role: "admin" | "member" | "guest"
      task_permission_level: "view" | "comment" | "edit"
      task_priority: "baixa" | "normal" | "alta" | "urgente"
      task_status:
        | "pendente"
        | "fazendo"
        | "em_aprovacao"
        | "ajuste"
        | "concluido"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "member"],
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
      lead_status: [
        "novo_lead",
        "contato_iniciado",
        "qualificacao",
        "reuniao_agendada",
        "proposta_enviada",
        "negociacao",
        "follow_up",
        "aguardando_documentos",
        "fechamento",
        "ganho",
        "perdido",
      ],
      payment_status: [
        "RECEIVED",
        "CONFIRMED",
        "PENDING",
        "OVERDUE",
        "REFUNDED",
        "CANCELLED",
      ],
      task_internal_area: ["Operacional", "Financeiro", "Administrativo"],
      task_member_role: ["admin", "member", "guest"],
      task_permission_level: ["view", "comment", "edit"],
      task_priority: ["baixa", "normal", "alta", "urgente"],
      task_status: [
        "pendente",
        "fazendo",
        "em_aprovacao",
        "ajuste",
        "concluido",
      ],
    },
  },
} as const
