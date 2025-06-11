import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import type { ProductFilters } from '@/types/product';

interface ProductFiltersProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  isSearching?: boolean;
}

export function ProductFiltersComponent({ 
  filters, 
  onFiltersChange,
  isSearching = false 
}: ProductFiltersProps) {
  const [localSearch, setLocalSearch] = useState(filters.search);
  const debouncedSearch = useDebounce(localSearch, 400);

  // Update parent when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFiltersChange({ ...filters, search: debouncedSearch });
    }
  }, [debouncedSearch, filters, onFiltersChange]);

  // Sync local search with external changes
  useEffect(() => {
    if (filters.search !== localSearch && filters.search !== debouncedSearch) {
      setLocalSearch(filters.search);
    }
  }, [filters.search, localSearch, debouncedSearch]);

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      status: value as ProductFilters['status']
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by SKU or product name..."
          value={localSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 pr-10 transition-all duration-200 ease-in-out focus:ring-2 focus:ring-primary/20"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
      
      <Select value={filters.status} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-full sm:w-[180px] transition-all duration-200 ease-in-out">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Products</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="end_of_sale">End of Sale</SelectItem>
          <SelectItem value="obsolete">Obsolete</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}