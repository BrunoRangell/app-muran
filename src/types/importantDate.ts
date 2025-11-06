export interface ImportantDate {
  id: string;
  entity_type: 'client' | 'team' | 'custom';
  entity_id?: string;
  date_type: 'birthday' | 'anniversary' | 'holiday' | 'meeting' | 'deadline' | 'other';
  title: string;
  description?: string;
  date: string;
  is_recurring: boolean;
  recurrence_pattern?: 'yearly' | 'monthly' | 'weekly' | 'none';
  icon?: string;
  color?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ImportantDateFormData {
  entity_type: 'client' | 'team' | 'custom';
  entity_id?: string;
  date_type: string;
  title: string;
  description?: string;
  date: string;
  is_recurring: boolean;
  recurrence_pattern?: string;
  icon?: string;
  color?: string;
}
