
import React from 'react';
import { Search, Grid2x2, LayoutList, Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReviewsContext } from '@/contexts/ReviewsContext';

interface FilterBarProps {
  platform: 'meta' | 'google';
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function FilterBar({ platform, onRefresh, isRefreshing }: FilterBarProps) {
  const { state, setFilter } = useReviewsContext();
  const filters = state.filters[platform];
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(platform, { searchQuery: e.target.value });
  };
  
  const handleViewModeChange = (mode: 'cards' | 'table' | 'list') => {
    setFilter(platform, { viewMode: mode });
  };
  
  const handleFilterChange = () => {
    setFilter(platform, { showOnlyAdjustments: !filters.showOnlyAdjustments });
  };
  
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar cliente por nome..."
            value={filters.searchQuery}
            onChange={handleSearchChange}
            className="pl-9 w-full h-10 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ff6e00] focus:border-transparent"
          />
        </div>
        
        <div className="flex gap-2 items-center">
          <div className="flex border rounded overflow-hidden">
            <Button
              variant={filters.viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('cards')}
              className={filters.viewMode === 'cards' ? 'bg-[#ff6e00]' : ''}
            >
              <Grid2x2 size={18} />
            </Button>
            <Button
              variant={filters.viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('table')}
              className={filters.viewMode === 'table' ? 'bg-[#ff6e00]' : ''}
            >
              <LayoutList size={18} />
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleFilterChange}
            className={filters.showOnlyAdjustments ? 'bg-gray-100' : ''}
          >
            <Filter size={18} className="mr-1" />
            {filters.showOnlyAdjustments ? 'Todos' : 'Ajustes'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw 
              size={18} 
              className={isRefreshing ? 'animate-spin mr-1' : 'mr-1'} 
            />
            {isRefreshing ? 'Atualizando...' : 'Atualizar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
