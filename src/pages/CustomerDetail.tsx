import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  AlertTriangle, 
  Loader2,
  Home,
  Users,
  User
} from 'lucide-react';
import { CustomerDetailView } from '@/components/customers/CustomerDetailView';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { PageHeader } from '@/components/common/PageHeader';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Customer } from '@/types/customer';

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchCustomer(id);
    } else {
      setError('Invalid customer ID');
      setLoading(false);
    }
  }, [id]);

  const fetchCustomer = async (customerId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          setError('Customer not found');
        } else {
          throw error;
        }
        return;
      }

      setCustomer(data);
    } catch (err) {
      console.error('Error fetching customer:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load customer';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/customers');
  };

  const handleCustomerUpdate = () => {
    if (id) {
      fetchCustomer(id); // Refresh customer data
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs 
          items={[
            { name: 'Customers', href: '/customers', icon: <Users className="h-4 w-4" /> },
            { name: 'Loading...', href: '#', icon: <Loader2 className="h-4 w-4 animate-spin" /> }
          ]}
        />

        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" text="Loading customer details..." />
        </div>
      </div>
    );
  }

  // Error state (404 or other errors)
  if (error || !customer) {
    return (
      <div className="space-y-6">
        <Breadcrumbs 
          items={[
            { name: 'Customers', href: '/customers', icon: <Users className="h-4 w-4" /> },
            { name: 'Error', href: '#', icon: <AlertTriangle className="h-4 w-4" /> }
          ]}
        />

        <ErrorDisplay
          title={error === 'Customer not found' ? 'Customer Not Found' : 'Error Loading Customer'}
          message={error === 'Customer not found' 
            ? 'The customer you are looking for does not exist or may have been deleted.'
            : error || 'There was a problem loading the customer details.'
          }
          onDismiss={() => navigate('/customers')}
          onRetry={id ? () => fetchCustomer(id) : undefined}
        />
      </div>
    );
  }

  // Success state - show customer details
  return (
    <div className="space-y-6">
      <Breadcrumbs 
        items={[
          { name: 'Customers', href: '/customers', icon: <Users className="h-4 w-4" /> },
          { name: customer.name, href: '#', icon: <User className="h-4 w-4" /> }
        ]}
      />

      {/* Customer Detail View */}
      <CustomerDetailView
        customer={customer}
        onBack={handleBack}
        onCustomerUpdate={handleCustomerUpdate}
      />
    </div>
  );
}