import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Search, 
  Plus, 
  User, 
  Phone, 
  Mail, 
  Hash,
  AlertTriangle,
  CheckCircle,
  Users
} from 'lucide-react';
import { useCustomers } from '@/hooks/useCustomers';
import { useDebounce } from '@/hooks/useDebounce';
import type { Customer } from '@/types/customer';

interface CustomerSelectionStepProps {
  selectedCustomer: Customer | null;
  onCustomerSelect: (customer: Customer) => void;
  onQuickAdd: () => void;
}

export function CustomerSelectionStep({
  selectedCustomer,
  onCustomerSelect,
  onQuickAdd
}: CustomerSelectionStepProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  const { customers, loading, fetchCustomers } = useCustomers();

  // Fetch customers when search term changes
  useEffect(() => {
    if (debouncedSearch.trim()) {
      fetchCustomers({ search: debouncedSearch, status: 'all' }, 1, 20);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }, [debouncedSearch, fetchCustomers]);

  // Filter out closed customers
  const availableCustomers = customers.filter(customer => 
    customer.account_status !== 'closed'
  );

  const handleCustomerSelect = (customer: Customer) => {
    onCustomerSelect(customer);
    setSearchTerm(customer.name);
    setShowDropdown(false);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (selectedCustomer && value !== selectedCustomer.name) {
      // Clear selection if search doesn't match selected customer
      onCustomerSelect(null as any);
    }
  };

  const getCustomerInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="mr-1 h-3 w-3" />
            Active
          </Badge>
        );
      case 'credit_hold':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Credit Hold
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers by name or tax ID..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 text-base"
              onFocus={() => {
                if (debouncedSearch.trim()) {
                  setShowDropdown(true);
                }
              }}
            />
            
            {/* Dropdown Results */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-lg max-h-80 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                    Searching customers...
                  </div>
                ) : availableCustomers.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <div className="font-medium">No customers found</div>
                    <div className="text-sm">Try a different search term or add a new customer</div>
                  </div>
                ) : (
                  <div className="py-2">
                    {availableCustomers.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => handleCustomerSelect(customer)}
                        className="w-full px-4 py-3 text-left hover:bg-muted transition-colors duration-150 flex items-center gap-3"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {getCustomerInitials(customer.name)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium truncate">{customer.name}</span>
                            {getStatusBadge(customer.account_status)}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {customer.tax_id && (
                              <div className="flex items-center gap-1">
                                <Hash className="h-3 w-3" />
                                <span>{customer.tax_id}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span>{customer.phone}</span>
                            </div>
                          </div>
                        </div>
                        
                        {customer.account_status === 'credit_hold' && (
                          <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <Button onClick={onQuickAdd} variant="outline" className="flex-shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            Quick Add
          </Button>
        </div>
      </div>

      {/* Selected Customer Card */}
      {selectedCustomer ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                  {getCustomerInitials(selectedCustomer.name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold">{selectedCustomer.name}</h3>
                  {getStatusBadge(selectedCustomer.account_status)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {selectedCustomer.tax_id && (
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Tax ID:</span>
                      <code className="bg-muted px-2 py-1 rounded text-xs">
                        {selectedCustomer.tax_id}
                      </code>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Phone:</span>
                    <span>{selectedCustomer.phone}</span>
                  </div>
                  
                  {selectedCustomer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Email:</span>
                      <span>{selectedCustomer.email}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Credit Terms:</span>
                    <span>{selectedCustomer.credit_terms_days} days</span>
                  </div>
                </div>
                
                {selectedCustomer.account_status === 'credit_hold' && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                    <div className="text-sm">
                      <div className="font-medium text-yellow-800">Credit Hold Warning</div>
                      <div className="text-yellow-700">
                        This customer account is on credit hold. Please verify payment status before proceeding.
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onCustomerSelect(null as any);
                  setSearchTerm('');
                }}
              >
                Change
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-2">
          <CardContent className="pt-12 pb-12">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">No Customer Selected</h3>
                <p className="text-muted-foreground">
                  Search for an existing customer above or create a new one using Quick Add
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}