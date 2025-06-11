import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, Trash2, Package, Scale, Eye } from 'lucide-react';
import type { Product } from '@/types/product';

interface ProductTableProps {
  products: Product[];
  loading: boolean;
  selectedProducts: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export function ProductTable({ 
  products, 
  loading, 
  selectedProducts,
  onSelectionChange,
  onEdit, 
  onDelete 
}: ProductTableProps) {
  const navigate = useNavigate();
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default\" className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case 'end_of_sale':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-100">End of Sale</Badge>;
      case 'obsolete':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">Obsolete</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteProductId) {
      onDelete(deleteProductId);
      setDeleteProductId(null);
    }
  };

  const handleViewProduct = (product: Product) => {
    navigate(`/products/${product.id}`);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(products.map(p => p.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedProducts, productId]);
    } else {
      onSelectionChange(selectedProducts.filter(id => id !== productId));
    }
  };

  const isAllSelected = products.length > 0 && selectedProducts.length === products.length;
  const isPartiallySelected = selectedProducts.length > 0 && selectedProducts.length < products.length;

  const TableSkeleton = () => (
    <div className="rounded-md border w-full">
      <Table className="w-full table-auto">
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox disabled />
            </TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Product Name</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i} className="animate-in fade-in-50 duration-200" style={{ animationDelay: `${i * 50}ms` }}>
              <TableCell>
                <Skeleton className="h-4 w-4 rounded" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-16 rounded-full" />
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

  if (products.length === 0) {
    return (
      <div className="rounded-md border animate-in fade-in-50 duration-300 w-full">
        <Table className="w-full table-auto">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox disabled />
              </TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                <div className="flex flex-col items-center space-y-2">
                  <Package className="h-8 w-8 opacity-50" />
                  <span>No products found matching your criteria.</span>
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
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  ref={(el) => {
                    if (el) el.indeterminate = isPartiallySelected;
                  }}
                />
              </TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product, index) => (
              <TableRow 
                key={product.id} 
                className="hover:bg-muted/50 transition-colors duration-150 animate-in fade-in-50 slide-in-from-bottom-2"
                style={{ animationDelay: `${index * 25}ms` }}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedProducts.includes(product.id)}
                    onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell className="font-mono">
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {product.sku}
                  </code>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{product.name}</div>
                    {product.description && (
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {product.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Scale className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">
                      {product.capacity_kg ? `${product.capacity_kg}kg` : 'N/A'}
                    </span>
                    {product.tare_weight_kg && (
                      <span className="text-xs text-muted-foreground">
                        (tare: {product.tare_weight_kg}kg)
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(product.status)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewProduct(product)}
                      className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(product)}
                      className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                      title="Edit Product"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setDeleteProductId(product.id)}
                      className="bg-red-600 text-white hover:bg-red-700"
                      title="Delete Product"
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

      <AlertDialog open={!!deleteProductId} onOpenChange={() => setDeleteProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product
              and may affect related inventory and order records.
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
              Delete Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}