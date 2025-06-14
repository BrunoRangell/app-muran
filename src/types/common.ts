
// Tipos comuns utilizados em todo o projeto

export interface PaginationOptions {
  page: number;
  limit: number;
  total?: number;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterOptions {
  search?: string;
  status?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface ApiResponse<T = any> {
  data: T;
  error?: string;
  message?: string;
  success: boolean;
}

export interface FormValidationError {
  field: string;
  message: string;
}

export interface TableColumn {
  id: string;
  label: string;
  sortable?: boolean;
  className?: string;
}

export interface ActionButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

export interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'success';
}
