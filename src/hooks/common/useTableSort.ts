
import { useState, useMemo } from 'react';

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface UseTableSortProps<T> {
  data: T[];
  initialSort?: SortConfig;
}

export function useTableSort<T>({ data, initialSort }: UseTableSortProps<T>) {
  const [sortConfig, setSortConfig] = useState<SortConfig>(
    initialSort || { key: '', direction: 'asc' }
  );

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedData = useMemo(() => {
    if (!sortConfig.key || !data) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof T];
      const bValue = b[sortConfig.key as keyof T];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let result = 0;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        result = aValue.localeCompare(bValue, 'pt-BR');
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        result = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        result = aValue.getTime() - bValue.getTime();
      } else {
        result = String(aValue).localeCompare(String(bValue), 'pt-BR');
      }

      return sortConfig.direction === 'asc' ? result : -result;
    });
  }, [data, sortConfig]);

  return {
    sortConfig,
    sortedData,
    handleSort
  };
}
