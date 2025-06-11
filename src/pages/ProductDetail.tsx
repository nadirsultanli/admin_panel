import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  AlertTriangle, 
  Loader2,
  Home,
  Package
} from 'lucide-react';
import { ProductDetailView } from '@/components/products/ProductDetailView';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Product } from '@/types/product';

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchProduct(id);
    } else {
      setError('Invalid product ID');
      setLoading(false);
    }
  }, [id]);

  const fetchProduct = async (productId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          setError('Product not found');
        } else {
          throw error;
        }
        return;
      }

      setProduct(data);
    } catch (err) {
      console.error('Error fetching product:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load product';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/products');
  };

  const handleProductUpdate = () => {
    if (id) {
      fetchProduct(id); // Refresh product data
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs 
          items={[
            { name: 'Products', href: '/products', icon: <Package className="h-4 w-4" /> },
            { name: 'Loading...', href: '#', icon: <Loader2 className="h-4 w-4 animate-spin" /> }
          ]}
        />

        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" text="Loading product details..." />
        </div>
      </div>
    );
  }

  // Error state (404 or other errors)
  if (error || !product) {
    return (
      <div className="space-y-6">
        <Breadcrumbs 
          items={[
            { name: 'Products', href: '/products', icon: <Package className="h-4 w-4" /> },
            { name: 'Error', href: '#', icon: <AlertTriangle className="h-4 w-4" /> }
          ]}
        />

        <ErrorDisplay
          title={error === 'Product not found' ? 'Product Not Found' : 'Error Loading Product'}
          message={error === 'Product not found' 
            ? 'The product you are looking for does not exist or may have been deleted.'
            : error || 'There was a problem loading the product details.'
          }
          onDismiss={() => navigate('/products')}
          onRetry={id ? () => fetchProduct(id) : undefined}
        />
      </div>
    );
  }

  // Success state - show product details
  return (
    <div className="space-y-6">
      <Breadcrumbs 
        items={[
          { name: 'Products', href: '/products', icon: <Package className="h-4 w-4" /> },
          { name: product.name, href: '#', icon: <Package className="h-4 w-4" /> }
        ]}
      />

      {/* Product Detail View */}
      <ProductDetailView
        product={product}
        onBack={handleBack}
        onProductUpdate={handleProductUpdate}
      />
    </div>
  );
}