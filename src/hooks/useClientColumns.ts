
import { useState } from 'react';
import { Column } from '@/components/clients/types';

interface UseClientColumnsProps {
  viewMode: 'default' | 'payments';
}

export const useClientColumns = ({ viewMode }: UseClientColumnsProps) => {
  const [columns, setColumns] = useState<Column[]>([
    { id: 'company_name', label: 'Empresa', show: true, fixed: true },
    { id: 'contract_value', label: 'Valor Mensal', show: viewMode === 'default' || viewMode === 'payments', fixed: viewMode === 'payments' },
    { id: 'status', label: 'Status', show: true, fixed: true },
    { id: 'acquisition_channel', label: 'Canal de Aquisição', show: viewMode === 'default', fixed: false },
    { id: 'first_payment_date', label: 'Início da Parceria', show: viewMode === 'default', fixed: false },
    { id: 'last_payment_date', label: 'Último Pagamento', show: viewMode === 'default', fixed: false },
    { id: 'retention', label: 'Retenção', show: viewMode === 'default', fixed: false },
    { id: 'days_until_anniversary', label: 'Próximo Aniversário', show: viewMode === 'default', fixed: false },
    { id: 'payment_type', label: 'Tipo de Pagamento', show: viewMode === 'default', fixed: false },
    { id: 'company_birthday', label: 'Aniversário da Empresa', show: viewMode === 'default', fixed: false },
    { id: 'contact_name', label: 'Responsável', show: viewMode === 'default', fixed: false },
    { id: 'contact_phone', label: 'Contato', show: viewMode === 'default', fixed: false }
  ]);

  const toggleColumn = (columnId: string) => {
    setColumns(columns.map(col => 
      col.fixed ? col : { ...col, show: col.id === columnId ? !col.show : col.show }
    ));
  };

  const getVisibleColumns = () => {
    return columns.filter(col => viewMode === 'payments' ? col.fixed : col.show);
  };

  return {
    columns,
    toggleColumn,
    getVisibleColumns
  };
};
