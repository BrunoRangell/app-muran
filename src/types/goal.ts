
export interface Goal {
  id: number;
  goal_type: 'active_clients' | 'new_clients';
  start_date: string;
  end_date: string;
  target_value: number;
  current_value: number;
  final_value?: number;
  manager_id: string;
  created_at?: string;
  completed_at?: string;
  status: 'active' | 'completed';
}

export const GOAL_TYPES = {
  active_clients: 'Meta de Clientes Ativos',
  new_clients: 'Meta de Novos Clientes'
} as const;

