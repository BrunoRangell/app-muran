
import { useState } from 'react';

interface ClientFilters {
  status: string;
  acquisition_channel: string;
  payment_type: string;
}

export const useClientFilters = () => {
  const [filters, setFilters] = useState<ClientFilters>({
    status: 'active',
    acquisition_channel: '',
    payment_type: ''
  });

  const hasActiveFilters = Object.values(filters).some(value => value !== "");

  const clearFilters = () => {
    setFilters({
      status: '',
      acquisition_channel: '',
      payment_type: ''
    });
  };

  const updateFilter = (key: keyof ClientFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return {
    filters,
    hasActiveFilters,
    clearFilters,
    updateFilter
  };
};
