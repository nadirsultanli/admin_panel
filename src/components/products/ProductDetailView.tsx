import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Package, 
  Hash, 
  Scale,
  Wrench,
  Barcode,
  Calendar,
  Edit,
  TrendingUp,
  Warehouse
} from 'lucide-react';
import { InventoryLevels } from './InventoryLevels';
import { InventoryAdjustments } from './InventoryAdjustments';
import { ProductAnalytics } from './ProductAnalytics';
import { ProductFormModal } from './ProductFormModal';
import type { Product } from '@/types/product';

interface ProductDetailViewProps {
  product: Product;
  onBack: () => void;
  onProductUpdate: () => void;
}

export function ProductDetailView({ product, onBack, onProductUpdate }: ProductDetailViewProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case 'end_of_sale':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-100">End of Sale</Badge>;
      case 'obsolete':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">Obsolete</Badge>;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
            <p className="text-muted-foreground">Product Details & Inventory</p>
          </div>
        </div>
        <Button onClick={() => setEditDialogOpen(true)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Product
        </Button>
      </div>

      {/* Product Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Information
          </CardTitle>
          <CardDescription>
            Basic product details and specifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">SKU</label>
                <div className="flex items-center gap-2 mt-1">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                    {product.sku}
                  </code>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Product Name</label>
                <div className="flex items-center gap-2 mt-1">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{product.name}</span>
                </div>
              </div>

              {product.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <div className="mt-1">
                    <p className="text-sm">{product.description}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Unit of Measure</label>
                <div className="mt-1">
                  <span className="capitalize">{product.unit_of_measure || 'Not specified'}</span>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  {getStatusBadge(product.status)}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Capacity</label>
                <div className="flex items-center gap-2 mt-1">
                  <Scale className="h-4 w-4 text-muted-foreground" />
                  <span>{product.capacity_kg ? `${product.capacity_kg} kg` : 'Not specified'}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Tare Weight</label>
                <div className="flex items-center gap-2 mt-1">
                  <Scale className="h-4 w-4 text-muted-foreground" />
                  <span>{product.tare_weight_kg ? `${product.tare_weight_kg} kg` : 'Not specified'}</span>
                </div>
              </div>

              {product.valve_type && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valve Type</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    <span>{product.valve_type}</span>
                  </div>
                </div>
              )}

              {product.barcode_uid && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Barcode/RFID UID</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Barcode className="h-4 w-4 text-muted-foreground" />
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {product.barcode_uid}
                    </code>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(product.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Inventory Levels */}
      <InventoryLevels productId={product.id} productName={product.name} />

      <Separator />

      {/* Inventory Adjustments */}
      <InventoryAdjustments productId={product.id} />

      <Separator />

      {/* Product Analytics */}
      <ProductAnalytics productId={product.id} productName={product.name} />

      {/* Edit Product Modal */}
      <ProductFormModal
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        product={product}
        onSuccess={onProductUpdate}
      />
    </div>
  );
}