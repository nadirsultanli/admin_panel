import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Settings, Package, Warehouse } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { WarehouseOverviewData } from '@/hooks/useInventoryDashboard';

const adjustmentSchema = z.object({
  warehouse_id: z.string().min(1, 'Please select a warehouse'),
  product_id: z.string().min(1, 'Please select a product'),
  adjustment_type: z.enum(['addition', 'subtraction']),
  inventory_type: z.enum(['full', 'empty', 'reserved']),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  reason: z.string().min(1, 'Please provide a reason for this adjustment'),
});

type AdjustmentFormData = z.infer<typeof adjustmentSchema>;

interface Product {
  id: string;
  sku: string;
  name: string;
  current_full: number;
  current_empty: number;
  current_reserved: number;
}

interface InventoryAdjustmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouses: WarehouseOverviewData[];
  onSuccess?: () => void;
}

export function InventoryAdjustmentModal({
  open,
  onOpenChange,
  warehouses,
  onSuccess
}: InventoryAdjustmentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const form = useForm<AdjustmentFormData>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      warehouse_id: '',
      product_id: '',
      adjustment_type: 'addition',
      inventory_type: 'full',
      quantity: 1,
      reason: '',
    },
  });

  const warehouseId = form.watch('warehouse_id');
  const productId = form.watch('product_id');
  const adjustmentType = form.watch('adjustment_type');
  const inventoryType = form.watch('inventory_type');

  // Fetch products when warehouse changes
  useEffect(() => {
    if (warehouseId) {
      fetchWarehouseProducts(warehouseId);
    } else {
      setProducts([]);
      setSelectedProduct(null);
    }
  }, [warehouseId]);

  // Update selected product when product changes
  useEffect(() => {
    if (productId) {
      const product = products.find(p => p.id === productId);
      setSelectedProduct(product || null);
    } else {
      setSelectedProduct(null);
    }
  }, [productId, products]);

  const fetchWarehouseProducts = async (warehouseId: string) => {
    setLoadingProducts(true);
    try {
      // Get all products and their current inventory in this warehouse
      const { data: allProducts, error: productsError } = await supabase
        .from('products')
        .select('id, sku, name')
        .eq('status', 'active');

      if (productsError) throw productsError;

      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory_balance')
        .select('product_id, qty_full, qty_empty, qty_reserved')
        .eq('warehouse_id', warehouseId);

      if (inventoryError) throw inventoryError;

      // Combine product info with inventory data
      const productsWithInventory: Product[] = (allProducts || []).map(product => {
        const inv = inventory?.find(i => i.product_id === product.id);
        return {
          id: product.id,
          sku: product.sku,
          name: product.name,
          current_full: inv?.qty_full || 0,
          current_empty: inv?.qty_empty || 0,
          current_reserved: inv?.qty_reserved || 0,
        };
      });

      setProducts(productsWithInventory);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const getCurrentQuantity = () => {
    if (!selectedProduct) return 0;
    switch (inventoryType) {
      case 'full':
        return selectedProduct.current_full;
      case 'empty':
        return selectedProduct.current_empty;
      case 'reserved':
        return selectedProduct.current_reserved;
      default:
        return 0;
    }
  };

  const getMaxSubtraction = () => {
    return getCurrentQuantity();
  };

  const handleSubmit = async (data: AdjustmentFormData) => {
    setIsSubmitting(true);

    try {
      // Validate subtraction doesn't go below zero
      if (data.adjustment_type === 'subtraction') {
        const currentQty = getCurrentQuantity();
        if (data.quantity > currentQty) {
          form.setError('quantity', {
            type: 'manual',
            message: `Cannot subtract ${data.quantity}. Only ${currentQty} units available.`
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Calculate the change amount
      const changeAmount = data.adjustment_type === 'addition' ? data.quantity : -data.quantity;

      // Get current inventory record
      const { data: currentInventory, error: fetchError } = await supabase
        .from('inventory_balance')
        .select('*')
        .eq('warehouse_id', data.warehouse_id)
        .eq('product_id', data.product_id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      // Prepare new quantities
      const current = currentInventory || {
        qty_full: 0,
        qty_empty: 0,
        qty_reserved: 0
      };

      const newQuantities = { ...current };
      switch (data.inventory_type) {
        case 'full':
          newQuantities.qty_full = Math.max(0, current.qty_full + changeAmount);
          break;
        case 'empty':
          newQuantities.qty_empty = Math.max(0, current.qty_empty + changeAmount);
          break;
        case 'reserved':
          newQuantities.qty_reserved = Math.max(0, current.qty_reserved + changeAmount);
          break;
      }

      // Update or create inventory record
      if (currentInventory) {
        const { error: updateError } = await supabase
          .from('inventory_balance')
          .update({
            ...newQuantities,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentInventory.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('inventory_balance')
          .insert({
            warehouse_id: data.warehouse_id,
            product_id: data.product_id,
            ...newQuantities,
            updated_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
      }

      const actionText = data.adjustment_type === 'addition' ? 'added' : 'removed';
      toast.success(`Successfully ${actionText} ${data.quantity} ${data.inventory_type} units`);
      
      onOpenChange(false);
      onSuccess?.();
      form.reset();

    } catch (error: any) {
      console.error('Error adjusting inventory:', error);
      toast.error(error.message || 'Failed to adjust inventory');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (form.formState.isDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        onOpenChange(false);
        form.reset();
      }
    } else {
      onOpenChange(false);
    }
  };

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset();
      setProducts([]);
      setSelectedProduct(null);
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Inventory Adjustment
          </DialogTitle>
          <DialogDescription>
            Add or remove inventory with a documented reason for audit purposes.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Warehouse Selection */}
            <FormField
              control={form.control}
              name="warehouse_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Warehouse className="h-4 w-4" />
                    Warehouse *
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-white text-gray-900 border-gray-300">
                        <SelectValue placeholder="Select warehouse" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Product Selection */}
            <FormField
              control={form.control}
              name="product_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Product *
                  </FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={!warehouseId || loadingProducts}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white text-gray-900 border-gray-300">
                        <SelectValue placeholder={
                          !warehouseId 
                            ? "Select warehouse first"
                            : loadingProducts 
                              ? "Loading products..."
                              : "Select product"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          <div className="flex justify-between items-center w-full">
                            <span>{product.name} ({product.sku})</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              {product.current_full}F | {product.current_empty}E | {product.current_reserved}R
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Current inventory shown as: Full | Empty | Reserved
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Adjustment Type and Inventory Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="adjustment_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adjustment Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white text-gray-900 border-gray-300">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="addition">
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">+</span>
                            Addition
                          </div>
                        </SelectItem>
                        <SelectItem value="subtraction">
                          <div className="flex items-center gap-2">
                            <span className="text-red-600">-</span>
                            Subtraction
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="inventory_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inventory Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white text-gray-900 border-gray-300">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="full">Full Cylinders</SelectItem>
                        <SelectItem value="empty">Empty Cylinders</SelectItem>
                        <SelectItem value="reserved">Reserved Cylinders</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Quantity */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1"
                      max={adjustmentType === 'subtraction' ? getMaxSubtraction() : 9999}
                      placeholder="Enter quantity" 
                      className="bg-white text-gray-900 border-gray-300"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormDescription>
                    {selectedProduct && (
                      <span>
                        Current {inventoryType} quantity: {getCurrentQuantity()} units
                        {adjustmentType === 'subtraction' && ` (max: ${getMaxSubtraction()})`}
                      </span>
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Adjustment *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Explain why this adjustment is needed (required for audit trail)..."
                      className="min-h-[80px] bg-white text-gray-900 border-gray-300"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Required. This will be recorded for audit purposes.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !selectedProduct}
                className="min-w-[120px] bg-blue-600 text-white hover:bg-blue-700"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Apply Adjustment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}