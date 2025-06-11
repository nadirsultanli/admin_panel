import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Product, ProductFilters } from '@/types/product';
import { toast } from 'sonner';

interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  fetchProducts: (filters?: ProductFilters, page?: number, limit?: number) => Promise<void>;
  createProduct: (product: Omit<Product, 'id' | 'created_at'>) => Promise<Product | null>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<Product | null>;
  deleteProduct: (id: string) => Promise<boolean>;
  bulkUpdateStatus: (ids: string[], status: Product['status']) => Promise<boolean>;
  clearError: () => void;
}

export function useProducts(): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchProducts = useCallback(async (
    filters: ProductFilters = { search: '', status: 'all' },
    page: number = 1,
    limit: number = 10
  ) => {
    setLoading(true);
    setError(null);

    try {
      // Generate mock product data
      const mockProducts: Product[] = [
        {
          id: '770e8400-e29b-41d4-a716-446655440001',
          sku: 'CYL-6KG-STD',
          name: '6kg Standard Cylinder',
          description: 'Standard 6kg propane cylinder for domestic use',
          unit_of_measure: 'cylinder',
          capacity_kg: 6.00,
          tare_weight_kg: 5.50,
          valve_type: 'POL',
          status: 'active',
          barcode_uid: '1234567890123',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '770e8400-e29b-41d4-a716-446655440002',
          sku: 'CYL-13KG-STD',
          name: '13kg Standard Cylinder',
          description: 'Standard 13kg propane cylinder for commercial use',
          unit_of_measure: 'cylinder',
          capacity_kg: 13.00,
          tare_weight_kg: 10.50,
          valve_type: 'POL',
          status: 'active',
          barcode_uid: '1234567890124',
          created_at: '2024-01-02T00:00:00Z'
        },
        {
          id: '770e8400-e29b-41d4-a716-446655440003',
          sku: 'CYL-6KG-COMP',
          name: '6kg Composite Cylinder',
          description: 'Lightweight composite 6kg propane cylinder',
          unit_of_measure: 'cylinder',
          capacity_kg: 6.00,
          tare_weight_kg: 3.50,
          valve_type: 'POL',
          status: 'active',
          barcode_uid: '1234567890125',
          created_at: '2024-01-03T00:00:00Z'
        },
        {
          id: '770e8400-e29b-41d4-a716-446655440004',
          sku: 'CYL-13KG-COMP',
          name: '13kg Composite Cylinder',
          description: 'Lightweight composite 13kg propane cylinder',
          unit_of_measure: 'cylinder',
          capacity_kg: 13.00,
          tare_weight_kg: 8.00,
          valve_type: 'POL',
          status: 'end_of_sale',
          barcode_uid: '1234567890126',
          created_at: '2024-01-04T00:00:00Z'
        },
        {
          id: '770e8400-e29b-41d4-a716-446655440005',
          sku: 'CYL-6KG-PREM',
          name: '6kg Premium Cylinder',
          description: 'Premium grade 6kg propane cylinder with enhanced safety features',
          unit_of_measure: 'cylinder',
          capacity_kg: 6.00,
          tare_weight_kg: 5.00,
          valve_type: 'POL',
          status: 'active',
          barcode_uid: '1234567890127',
          created_at: '2024-01-05T00:00:00Z'
        },
        {
          id: '770e8400-e29b-41d4-a716-446655440006',
          sku: 'CYL-13KG-PREM',
          name: '13kg Premium Cylinder',
          description: 'Premium grade 13kg propane cylinder with enhanced safety features',
          unit_of_measure: 'cylinder',
          capacity_kg: 13.00,
          tare_weight_kg: 9.50,
          valve_type: 'POL',
          status: 'active',
          barcode_uid: '1234567890128',
          created_at: '2024-01-06T00:00:00Z'
        },
        {
          id: '770e8400-e29b-41d4-a716-446655440007',
          sku: 'CYL-BULK-KG',
          name: 'Bulk LPG per Kg',
          description: 'Bulk propane sold by kilogram for large commercial customers',
          unit_of_measure: 'kg',
          status: 'obsolete',
          barcode_uid: '1234567890129',
          created_at: '2024-01-07T00:00:00Z'
        }
      ];
      
      // Apply search filter
      let filteredProducts = [...mockProducts];
      
      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.trim().toLowerCase();
        filteredProducts = filteredProducts.filter(product => 
          product.name.toLowerCase().includes(searchTerm) ||
          product.sku.toLowerCase().includes(searchTerm)
        );
      }
      
      // Apply status filter
      if (filters.status !== 'all') {
        filteredProducts = filteredProducts.filter(product => 
          product.status === filters.status
        );
      }
      
      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit;
      const paginatedProducts = filteredProducts.slice(from, to);
      
      setProducts(paginatedProducts);
      setTotalCount(filteredProducts.length);
      
    } catch (err) {
      console.error('Error fetching products:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProduct = useCallback(async (
    productData: Omit<Product, 'id' | 'created_at'>
  ): Promise<Product | null> => {
    setLoading(true);
    setError(null);

    try {
      // In a real implementation, this would create a product in the database
      // For now, we'll simulate a successful creation
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        ...productData,
        created_at: new Date().toISOString()
      };

      toast.success('Product created successfully');
      return newProduct;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create product';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProduct = useCallback(async (
    id: string,
    updates: Partial<Product>
  ): Promise<Product | null> => {
    setLoading(true);
    setError(null);

    try {
      // In a real implementation, this would update a product in the database
      // For now, we'll simulate a successful update
      const updatedProduct: Product = {
        id,
        sku: 'UPDATED-SKU',
        name: 'Updated Product',
        status: 'active',
        created_at: new Date().toISOString(),
        ...updates
      };

      toast.success('Product updated successfully');
      return updatedProduct;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update product';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteProduct = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // In a real implementation, this would delete a product from the database
      // For now, we'll simulate a successful deletion
      toast.success('Product deleted successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete product';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkUpdateStatus = useCallback(async (
    ids: string[], 
    status: Product['status']
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // In a real implementation, this would update multiple products in the database
      // For now, we'll simulate a successful update
      toast.success(`${ids.length} product(s) updated successfully`);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update products';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    products,
    loading,
    error,
    totalCount,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    bulkUpdateStatus,
    clearError
  };
}