import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, Trash2, Phone, Mail, Eye, Users } from 'lucide-react';
import type { Customer } from '@/types/customer';

interface CustomerTableProps {
  customers: Customer[];
  loading: boolean;
  onEdit: (customer: Customer) => void;
  onView: (customer: Customer) => void;
  onDelete: (id: string) => void;
}

export function CustomerTable({ customers, loading, onEdit, onView, onDelete }: CustomerTableProps) {
  const [deleteCustomerId, setDeleteCustomerId] = useState<string | null>(null);

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

  const formatPhone = (phone: string) => {
    // Format Kenyan phone numbers nicely
    if (phone.startsWith('+254')) {
      return phone.replace('+254', '+254 ').replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
    }
    return phone;
  };

  const handleDeleteConfirm = () => {
    if (deleteCustomerId) {
      onDelete(deleteCustomerId);
      setDeleteCustomerId(null);
    }
  };

  const TableSkeleton = () => (
    <div className="rounded-md border w-full">
      <Table className="w-full table-auto">
        <TableHeader>
          <TableRow>
            <TableHead>Customer Name</TableHead>
            <TableHead>Tax ID</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Credit Terms</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i} className="animate-in fade-in-50 duration-200" style={{ animationDelay: `${i * 50}ms` }}>
              <TableCell>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-16 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-12" />
              </TableCell>
              <TableCell>
                <div className="flex justify-end space-x-2">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  if (loading) {
    return <TableSkeleton />;
  }

  if (customers.length === 0) {
    return (
      <div className="rounded-md border animate-in fade-in-50 duration-300 w-full">
        <Table className="w-full table-auto">
          <TableHeader>
            <TableRow>
              <TableHead>Customer Name</TableHead>
              <TableHead>Tax ID</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Credit Terms</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                <div className="flex flex-col items-center space-y-3">
                  <Users className="h-12 w-12 opacity-50" />
                  <div className="space-y-1">
                    <h3 className="text-lg font-medium">No customers found</h3>
                    <p className="text-sm">
                      Try adjusting your search criteria or add a new customer to get started.
                    </p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border animate-in fade-in-50 duration-300 w-full">
        <Table className="w-full table-auto">
          <TableHeader>
            <TableRow>
              <TableHead>Customer Name</TableHead>
              <TableHead>Tax ID</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Credit Terms</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer, index) => (
              <TableRow 
                key={customer.id} 
                className="hover:bg-muted/50 transition-colors duration-150 animate-in fade-in-50 slide-in-from-bottom-2"
                style={{ animationDelay: `${index * 25}ms` }}
              >
                <TableCell className="font-medium">
                  <div>
                    <div className="font-semibold">{customer.name}</div>
                    {customer.external_id && (
                      <div className="text-sm text-muted-foreground">
                        ID: {customer.external_id}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {customer.tax_id || 'N/A'}
                  </code>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm">
                      <Phone className="mr-2 h-3 w-3 text-muted-foreground" />
                      {formatPhone(customer.phone)}
                    </div>
                    {customer.email && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Mail className="mr-2 h-3 w-3" />
                        {customer.email}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(customer.account_status)}
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {customer.credit_terms_days} days
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onView(customer)}
                      className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(customer)}
                      className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                      title="Edit Customer"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setDeleteCustomerId(customer.id)}
                      className="bg-red-600 text-white hover:bg-red-700"
                      title="Delete Customer"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteCustomerId} onOpenChange={() => setDeleteCustomerId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the customer
              and all associated data including orders and addresses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white text-gray-900 border-gray-300 hover:bg-gray-50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete Customer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}