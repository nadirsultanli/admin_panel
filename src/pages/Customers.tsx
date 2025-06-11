import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { useCustomers } from '@/hooks/useCustomers';
import { useDebounce } from '@/hooks/useDebounce';
import { CustomerTable } from '@/components/customers/CustomerTable';
import { CustomerFormModal } from '@/components/customers/CustomerFormModal';
import { CustomerFiltersComponent } from '@/components/customers/CustomerFilters';
import { CustomerPagination } from '@/components/customers/CustomerPagination';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { Customer, CustomerFilters } from '@/types/customer';
import { toast } from 'sonner';

const PAGE_SIZE = 10;

export function Customers() {
  const navigate = useNavigate();
  const {
    customers,
    loading,
    error,
    totalCount,
    fetchCustomers,
    deleteCustomer,
    clearError
  } = useCustomers();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<CustomerFilters>({
    search: '',
    status: 'all'
  });
  const [isSearching, setIsSearching] = useState(false);

  // Debounce the search term to avoid excessive API calls
  const debouncedFilters = useDebounce(filters, 500); // Increased to 500ms for better stability

  const loadCustomers = useCallback(async (searchFilters: CustomerFilters, page: number) => {
    // Only show searching state if there's actually a search term
    if (searchFilters.search.trim()) {
      setIsSearching(true);
    }
    
    try {
      await fetchCustomers(searchFilters, page, PAGE_SIZE);
    } finally {
      setIsSearching(false);
    }
  }, [fetchCustomers]);

  // Load customers when debounced filters or page changes
  useEffect(() => {
    loadCustomers(debouncedFilters, currentPage);
  }, [loadCustomers, debouncedFilters, currentPage]);

  // Reset to first page when search changes (but not immediately)
  useEffect(() => {
    if (filters.search !== debouncedFilters.search && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [filters.search, debouncedFilters.search, currentPage]);

  const handleFiltersChange = (newFilters: CustomerFilters) => {
    setFilters(newFilters);
    // Reset to first page when filters change
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setDialogOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setDialogOpen(true);
  };

  const handleViewCustomer = (customer: Customer) => {
    navigate(`/customers/${customer.id}`);
  };

  const handleFormSuccess = () => {
    loadCustomers(debouncedFilters, currentPage); // Refresh the list
  };

  const handleDeleteCustomer = async (id: string) => {
    const success = await deleteCustomer(id);
    if (success) {
      loadCustomers(debouncedFilters, currentPage); // Refresh the list
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Calculate stats from current data
  const activeCustomers = customers.filter(c => c.account_status === 'active').length;
  const creditHoldCustomers = customers.filter(c => c.account_status === 'credit_hold').length;

  // Determine if we should show loading state
  const showLoading = loading && !isSearching;
  const showSearching = isSearching && filters.search.trim();

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="Customer Management"
        description="Manage your customer database and account information"
        actionLabel="Add Customer"
        actionIcon={Plus}
        onAction={handleAddCustomer}
      />

      {/* Stats Cards - Full width grid */}
      <div className="grid gap-4 md:grid-cols-3 w-full">
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground">
              Across all account statuses
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {totalCount > 0 ? Math.round((activeCustomers / totalCount) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit Hold</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{creditHoldCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <ErrorDisplay
          message={error}
          onDismiss={clearError}
          onRetry={() => loadCustomers(filters, currentPage)}
        />
      )}

      {/* Main Content - Full width */}
      <Card className="w-full transition-all duration-200">
        <CardHeader>
          <CardTitle>Customer Directory</CardTitle>
          <CardDescription>
            View and manage all customer accounts, contact information, and account status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <CustomerFiltersComponent
            filters={filters}
            onFiltersChange={handleFiltersChange}
            isSearching={showSearching}
          />

          {/* Table - Full width */}
          <div className="w-full overflow-hidden">
            {showLoading ? (
              <div className="py-12 flex justify-center">
                <LoadingSpinner text="Loading customers..." />
              </div>
            ) : customers.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No customers found"
                description={filters.search || filters.status !== 'all' 
                  ? "Try adjusting your search criteria or filters"
                  : "Get started by adding your first customer"}
                actionLabel="Add Customer"
                actionIcon={Plus}
                onAction={handleAddCustomer}
              />
            ) : (
              <CustomerTable
                customers={customers}
                loading={false}
                onEdit={handleEditCustomer}
                onView={handleViewCustomer}
                onDelete={handleDeleteCustomer}
              />
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && !showLoading && !showSearching && (
            <div className="animate-in fade-in-50 duration-300">
              <CustomerPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalCount={totalCount}
                pageSize={PAGE_SIZE}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Form Modal */}
      <CustomerFormModal
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customer={editingCustomer}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}