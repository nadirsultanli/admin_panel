import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Search, Calendar as CalendarIcon, X, Filter } from 'lucide-react';
import { format } from 'date-fns';
import type { OrderFilters } from '@/types/order';

interface OrderFiltersProps {
  filters: OrderFilters;
  onFiltersChange: (filters: OrderFilters) => void;
  onReset: () => void;
}

export function OrderFiltersComponent({ 
  filters, 
  onFiltersChange,
  onReset 
}: OrderFiltersProps) {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
    to: filters.dateTo ? new Date(filters.dateTo) : undefined,
  });

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      status: value as OrderFilters['status']
    });
  };

  const handleDateRangeChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    setDateRange(range);
    onFiltersChange({
      ...filters,
      dateFrom: range.from?.toISOString().split('T')[0] || '',
      dateTo: range.to?.toISOString().split('T')[0] || ''
    });
  };

  const handleQuickDateFilter = (days: number) => {
    const today = new Date();
    const from = new Date();
    from.setDate(today.getDate() - days);
    
    const range = { from, to: today };
    handleDateRangeChange(range);
  };

  const clearDateFilter = () => {
    setDateRange({ from: undefined, to: undefined });
    onFiltersChange({
      ...filters,
      dateFrom: '',
      dateTo: ''
    });
  };

  const hasActiveFilters = () => {
    return filters.search || 
           filters.status !== 'all' || 
           filters.dateFrom || 
           filters.dateTo;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order #, customer name, or phone..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 transition-all duration-200 ease-in-out focus:ring-2 focus:ring-primary/20"
          />
        </div>
        
        {/* Status Filter */}
        <Select value={filters.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-[180px] transition-all duration-200 ease-in-out">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="en_route">En Route</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Range Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`w-full sm:w-[280px] justify-start text-left font-normal transition-all duration-200 ${
                !dateRange.from && !dateRange.to ? "text-muted-foreground" : ""
              }`}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} -{" "}
                    {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 border-b">
              <div className="flex gap-2 mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDateFilter(0)}
                  className="text-xs"
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDateFilter(7)}
                  className="text-xs"
                >
                  Last 7 days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDateFilter(30)}
                  className="text-xs"
                >
                  Last 30 days
                </Button>
              </div>
              {(dateRange.from || dateRange.to) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearDateFilter}
                  className="w-full text-xs"
                >
                  <X className="mr-1 h-3 w-3" />
                  Clear dates
                </Button>
              )}
            </div>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={dateRange}
              onSelect={(range) => handleDateRangeChange(range || { from: undefined, to: undefined })}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        {/* Reset Filters */}
        {hasActiveFilters() && (
          <Button
            variant="outline"
            onClick={onReset}
            className="flex-shrink-0 transition-all duration-200 hover:bg-destructive hover:text-destructive-foreground"
          >
            <X className="mr-2 h-4 w-4" />
            Reset
          </Button>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters() && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>Active filters:</span>
          {filters.search && (
            <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
              Search: "{filters.search}"
            </span>
          )}
          {filters.status !== 'all' && (
            <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
              Status: {filters.status}
            </span>
          )}
          {(filters.dateFrom || filters.dateTo) && (
            <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
              Date range
            </span>
          )}
        </div>
      )}
    </div>
  );
}