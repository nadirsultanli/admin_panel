import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  MapPin, 
  Star, 
  Edit, 
  Trash2, 
  Clock,
  Navigation,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { AddressFormModal } from './AddressFormModal';
import { useAddresses } from '@/hooks/useAddresses';
import type { Address } from '@/types/customer';

interface AddressManagementProps {
  customerId: string;
  customerName: string;
}

export function AddressManagement({ customerId, customerName }: AddressManagementProps) {
  const {
    addresses,
    loading,
    error,
    fetchAddresses,
    deleteAddress,
    clearError
  } = useAddresses();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deleteAddressId, setDeleteAddressId] = useState<string | null>(null);
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);

  useEffect(() => {
    if (customerId) {
      fetchAddresses(customerId);
    }
  }, [customerId, fetchAddresses]);

  const handleAddAddress = () => {
    setEditingAddress(null);
    setDialogOpen(true);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setDialogOpen(true);
  };

  const handleFormSuccess = () => {
    fetchAddresses(customerId); // Refresh the list
  };

  const checkAddressUsage = async (addressId: string): Promise<string | null> => {
    try {
      // Check if address is used in any orders
      const { supabase } = await import('@/lib/supabase');
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, status, order_date')
        .eq('delivery_address_id', addressId)
        .limit(5);

      if (error) throw error;

      if (orders && orders.length > 0) {
        const activeOrders = orders.filter(order => 
          !['delivered', 'cancelled'].includes(order.status)
        );
        
        if (activeOrders.length > 0) {
          return `This address is currently used in ${activeOrders.length} active order(s). Please complete or cancel these orders before deleting the address.`;
        } else {
          return `This address has been used in ${orders.length} completed order(s). Deleting it will remove the delivery history. Are you sure you want to continue?`;
        }
      }

      return null;
    } catch (error) {
      console.error('Error checking address usage:', error);
      return null;
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    const warning = await checkAddressUsage(addressId);
    setDeleteWarning(warning);
    setDeleteAddressId(addressId);
  };

  const confirmDeleteAddress = async () => {
    if (deleteAddressId) {
      const success = await deleteAddress(deleteAddressId);
      if (success) {
        fetchAddresses(customerId); // Refresh the list
      }
      setDeleteAddressId(null);
      setDeleteWarning(null);
    }
  };

  const formatAddress = (address: Address) => {
    const parts = [address.line1];
    if (address.line2) parts.push(address.line2);
    parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.postal_code) parts.push(address.postal_code);
    return parts.join(', ');
  };

  const formatDeliveryWindow = (start?: string, end?: string) => {
    if (!start && !end) return null;
    
    const formatTime = (time: string) => {
      try {
        const [hours, minutes] = time.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        return date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
      } catch {
        return time;
      }
    };

    if (start && end) {
      return `${formatTime(start)} - ${formatTime(end)}`;
    } else if (start) {
      return `After ${formatTime(start)}`;
    } else if (end) {
      return `Before ${formatTime(end)}`;
    }
    return null;
  };

  const primaryAddress = addresses.find(addr => addr.is_primary);
  const secondaryAddresses = addresses.filter(addr => !addr.is_primary);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Delivery Addresses
          </CardTitle>
          <CardDescription>Loading addresses...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Delivery Addresses
              </CardTitle>
              <CardDescription>
                Manage delivery locations for {customerName}
              </CardDescription>
            </div>
            <Button onClick={handleAddAddress} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Address
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
                <Button variant="ghost" size="sm" onClick={clearError}>
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          {addresses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No addresses added</h3>
              <p className="text-sm mb-4">
                Add delivery addresses to enable order placement for this customer.
              </p>
              <Button onClick={handleAddAddress} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add First Address
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Address Details</TableHead>
                    <TableHead>Delivery Info</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Primary Address First */}
                  {primaryAddress && (
                    <TableRow className="bg-primary/5">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="font-medium">
                              {primaryAddress.label || 'Primary Address'}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatAddress(primaryAddress)}
                          </div>
                          {primaryAddress.latitude && primaryAddress.longitude && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Navigation className="h-3 w-3" />
                              <span>
                                {primaryAddress.latitude.toFixed(6)}, {primaryAddress.longitude.toFixed(6)}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {formatDeliveryWindow(
                            primaryAddress.delivery_window_start,
                            primaryAddress.delivery_window_end
                          ) && (
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-3 w-3" />
                              <span>
                                {formatDeliveryWindow(
                                  primaryAddress.delivery_window_start,
                                  primaryAddress.delivery_window_end
                                )}
                              </span>
                            </div>
                          )}
                          {primaryAddress.instructions && (
                            <div className="text-xs text-muted-foreground">
                              {primaryAddress.instructions}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                          <Star className="mr-1 h-3 w-3" />
                          Primary
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditAddress(primaryAddress)}
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteAddress(primaryAddress.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Secondary Addresses */}
                  {secondaryAddresses.map((address) => (
                    <TableRow key={address.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {address.label || 'Delivery Address'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatAddress(address)}
                          </div>
                          {address.latitude && address.longitude && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Navigation className="h-3 w-3" />
                              <span>
                                {address.latitude.toFixed(6)}, {address.longitude.toFixed(6)}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {formatDeliveryWindow(
                            address.delivery_window_start,
                            address.delivery_window_end
                          ) && (
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-3 w-3" />
                              <span>
                                {formatDeliveryWindow(
                                  address.delivery_window_start,
                                  address.delivery_window_end
                                )}
                              </span>
                            </div>
                          )}
                          {address.instructions && (
                            <div className="text-xs text-muted-foreground">
                              {address.instructions}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          Secondary
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditAddress(address)}
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteAddress(address.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Address Form Modal */}
      <AddressFormModal
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customerId={customerId}
        address={editingAddress}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteAddressId} onOpenChange={() => {
        setDeleteAddressId(null);
        setDeleteWarning(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Address
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              {deleteWarning ? (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">{deleteWarning}</p>
                </div>
              ) : (
                <p>Are you sure you want to delete this address? This action cannot be undone.</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAddress}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Address
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}