export interface Goal {
  id: number;
  goal_type: 'active_clients' | 'new_clients' | 'churned_clients';
  start_date: string;
  end_date: string;
  target_value: number;
  current_value: number;
  manager_id: string;
  created_at?: string;
}

export const GOAL_TYPES = {
  active_clients: 'Meta de Clientes Ativos',
  new_clients: 'Meta de Novos Clientes',
  churned_clients: 'Meta de Clientes Cancelados'
} as const;