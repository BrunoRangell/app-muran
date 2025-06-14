
import { useState, useMemo } from 'react';

interface FilterConfig {
  searchTerm: string;
  filters: Record<string, any>;
}

interface UseTableFiltersProps<T> {
  data: T[];
  searchFields?: (keyof T)[];
  customFilters?: Record<string, (item: T, value: any) => boolean>;
}

export function useTableFilters<T>({ 
  data, 
  searchFields = [], 
  customFilters = {} 
}: UseTableFiltersProps<T>) {
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    searchTerm: '',
    filters: {}
  });

  const setSearchTerm = (searchTerm: string) => {
    setFilterConfig(prev => ({ ...prev, searchTerm }));
  };

  const setFilter = (key: string, value: any) => {
    setFilterConfig(prev => ({
      ...prev,
      filters: { ...prev.filters, [key]: value }
    }));
  };

  const clearFilters = () => {
    setFilterConfig({ searchTerm: '', filters: {} });
  };

  const filteredData = useMemo(() => {
    if (!data) return [];

    return data.filter(item => {
      // Aplicar filtro de pesquisa
      if (filterConfig.searchTerm && searchFields.length > 0) {
        const searchMatch = searchFields.some(field => {
          const value = item[field];
          return String(value || '').toLowerCase().includes(filterConfig.searchTerm.toLowerCase());
        });
        if (!searchMatch) return false;
      }

      // Aplicar filtros customizados
      for (const [filterKey, filterValue] of Object.entries(filterConfig.filters)) {
        if (filterValue !== null && filterValue !== undefined && filterValue !== '') {
          const customFilter = customFilters[filterKey];
          if (customFilter && !customFilter(item, filterValue)) {
            return false;
          }
        }
      }

      return true;
    });
  }, [data, filterConfig, searchFields, customFilters]);

  const hasActiveFilters = filterConfig.searchTerm !== '' || 
    Object.values(filterConfig.filters).some(value => 
      value !== null && value !== undefined && value !== ''
    );

  return {
    searchTerm: filterConfig.searchTerm,
    filters: filterConfig.filters,
    filteredData,
    hasActiveFilters,
    setSearchTerm,
    setFilter,
    clearFilters
  };
}
