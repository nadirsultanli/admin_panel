import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Package, TrendingUp, AlertCircle, Archive } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useDebounce } from '@/hooks/useDebounce';
import { ProductTable } from '@/components/products/ProductTable';
import { ProductFormModal } from '@/components/products/ProductFormModal';
import { ProductFiltersComponent } from '@/components/products/ProductFilters';
import { ProductPagination } from '@/components/products/ProductPagination';
import { BulkActions } from '@/components/products/BulkActions';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { Product, ProductFilters } from '@/types/product';
import { toast } from 'sonner';

const PAGE_SIZE = 10;

export function Products() {
  const navigate = useNavigate();
  const {
    products,
    loading,
    error,
    totalCount,
    fetchProducts,
    deleteProduct,
    bulkUpdateStatus,
    clearError
  } = useProducts();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    status: 'all'
  });
  const [isSearching, setIsSearching] = useState(false);

  // Debounce the search term to avoid excessive API calls
  const debouncedFilters = useDebounce(filters, 400);

  const loadProducts = useCallback(async (searchFilters: ProductFilters, page: number) => {
    setIsSearching(true);
    try {
      await fetchProducts(searchFilters, page, PAGE_SIZE);
    } finally {
      setIsSearching(false);
    }
  }, [fetchProducts]);

  // Load products when debounced filters or page changes
  useEffect(() => {
    loadProducts(debouncedFilters, currentPage);
  }, [loadProducts, debouncedFilters, currentPage]);

  // Reset to first page when search changes
  useEffect(() => {
    if (filters.search !== debouncedFilters.search && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [filters.search, debouncedFilters.search, currentPage]);

  const handleFiltersChange = (newFilters: ProductFilters) => {
    setFilters(newFilters);
    // Reset to first page when filters change
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleFormSuccess = () => {
    loadProducts(debouncedFilters, currentPage); // Refresh the list
    setSelectedProducts([]); // Clear selection
  };

  const handleDeleteProduct = async (id: string) => {
    const success = await deleteProduct(id);
    if (success) {
      loadProducts(debouncedFilters, currentPage); // Refresh the list
      setSelectedProducts(selectedProducts.filter(selectedId => selectedId !== id));
    }
  };

  const handleBulkStatusUpdate = async (status: Product['status']) => {
    const success = await bulkUpdateStatus(selectedProducts, status);
    if (success) {
      loadProducts(debouncedFilters, currentPage); // Refresh the list
      setSelectedProducts([]); // Clear selection
    }
  };

  const handleClearSelection = () => {
    setSelectedProducts([]);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Calculate stats from current data
  const activeProducts = products.filter(p => p.status === 'active').length;
  const endOfSaleProducts = products.filter(p => p.status === 'end_of_sale').length;
  const obsoleteProducts = products.filter(p => p.status === 'obsolete').length;

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="Product Catalog"
        description="Manage your LPG product inventory and specifications"
        actionLabel="Add Product"
        actionIcon={Plus}
        onAction={handleAddProduct}
      />

      {/* Stats Cards - Full width grid */}
      <div className="grid gap-4 md:grid-cols-4 w-full">
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground">
              Across all statuses
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeProducts}</div>
            <p className="text-xs text-muted-foreground">
              Available for sale
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">End of Sale</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{endOfSaleProducts}</div>
            <p className="text-xs text-muted-foreground">
              Being phased out
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Obsolete</CardTitle>
            <Archive className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{obsoleteProducts}</div>
            <p className="text-xs text-muted-foreground">
              No longer available
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <ErrorDisplay
          message={error}
          onDismiss={clearError}
          onRetry={() => loadProducts(filters, currentPage)}
        />
      )}

      {/* Main Content - Full width */}
      <Card className="w-full transition-all duration-200">
        <CardHeader>
          <CardTitle>Product Directory</CardTitle>
          <CardDescription>
            View and manage all LPG products, specifications, and availability status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <ProductFiltersComponent
            filters={filters}
            onFiltersChange={handleFiltersChange}
            isSearching={isSearching}
          />

          {/* Bulk Actions */}
          <BulkActions
            selectedCount={selectedProducts.length}
            onClearSelection={handleClearSelection}
            onBulkStatusUpdate={handleBulkStatusUpdate}
          />

          {/* Table - Full width */}
          <div className="w-full overflow-hidden">
            {loading || isSearching ? (
              <div className="py-12 flex justify-center">
                <LoadingSpinner text="Loading products..." />
              </div>
            ) : products.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No products found"
                description={filters.search || filters.status !== 'all' 
                  ? "Try adjusting your search criteria or filters"
                  : "Get started by adding your first product"}
                actionLabel="Add Product"
                actionIcon={Plus}
                onAction={handleAddProduct}
              />
            ) : (
              <ProductTable
                products={products}
                loading={false}
                selectedProducts={selectedProducts}
                onSelectionChange={setSelectedProducts}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
              />
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && !loading && !isSearching && (
            <div className="animate-in fade-in-50 duration-300">
              <ProductPagination
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

      {/* Product Form Modal */}
      <ProductFormModal
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editingProduct}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}