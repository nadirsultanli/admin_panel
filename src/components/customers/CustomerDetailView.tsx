import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  Hash, 
  Calendar,
  CreditCard,
  Edit
} from 'lucide-react';
import { AddressManagement } from './AddressManagement';
import { CustomerFormModal } from './CustomerFormModal';
import type { Customer } from '@/types/customer';

interface CustomerDetailViewProps {
  customer: Customer;
  onBack: () => void;
  onCustomerUpdate: () => void;
}

export function CustomerDetailView({ customer, onBack, onCustomerUpdate }: CustomerDetailViewProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case 'credit_hold':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Credit Hold</Badge>;
      case 'closed':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPhone = (phone: string) => {
    // Format Kenyan phone numbers nicely
    if (phone.startsWith('+254')) {
      return phone.replace('+254', '+254 ').replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
    }
    return phone;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
            <p className="text-muted-foreground">Customer Details</p>
          </div>
        </div>
        <Button onClick={() => setEditDialogOpen(true)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Customer
        </Button>
      </div>

      {/* Customer Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Customer Information
          </CardTitle>
          <CardDescription>
            Basic customer details and account information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Customer Name</label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{customer.name}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Tax ID</label>
                <div className="flex items-center gap-2 mt-1">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {customer.tax_id || 'Not provided'}
                  </code>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{formatPhone(customer.phone)}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.email || 'Not provided'}</span>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Account Status</label>
                <div className="mt-1">
                  {getStatusBadge(customer.account_status)}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Credit Terms</label>
                <div className="flex items-center gap-2 mt-1">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.credit_terms_days} days</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Customer Since</label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(customer.created_at)}</span>
                </div>
              </div>

              {customer.external_id && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">External ID</label>
                  <div className="mt-1">
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {customer.external_id}
                    </code>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Address Management */}
      <AddressManagement 
        customerId={customer.id} 
        customerName={customer.name}
      />

      {/* Edit Customer Modal */}
      <CustomerFormModal
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        customer={customer}
        onSuccess={onCustomerUpdate}
      />
    </div>
  );
}