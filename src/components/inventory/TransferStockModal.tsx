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
import { Loader2, ArrowUpDown, Package, Warehouse } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { WarehouseOverviewData } from '@/hooks/useInventoryDashboard';

const transferSchema = z.object({
  from_warehouse_id: z.string().min(1, 'Please select source warehouse'),
  to_warehouse_id: z.string().min(1, 'Please select destination warehouse'),
  product_id: z.string().min(1, 'Please select a product'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  notes: z.string().optional(),
}).refine((data) => data.from_warehouse_id !== data.to_warehouse_id, {
  message: 'Source and destination warehouses must be different',
  path: ['to_warehouse_id'],
});

type TransferFormData = z.infer<typeof transferSchema>;

interface Product {
  id: string;
  sku: string;
  name: string;
  available_quantity: number;
}

interface TransferStockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouses: WarehouseOverviewData[];
  onSuccess?: () => void;
}

export function TransferStockModal({
  open,
  onOpenChange,
  warehouses,
  onSuccess
}: TransferStockModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const form = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      from_warehouse_id: '',
      to_warehouse_id: '',
      product_id: '',
      quantity: 1,
      notes: '',
    },
  });

  const fromWarehouseId = form.watch('from_warehouse_id');
  const productId = form.watch('product_id');

  // Fetch products when source warehouse changes
  useEffect(() => {
    if (fromWarehouseId) {
      fetchAvailableProducts(fromWarehouseId);
    } else {
      setProducts([]);
      setSelectedProduct(null);
    }
  }, [fromWarehouseId]);

  // Update selected product when product changes
  useEffect(() => {
    if (productId) {
      const product = products.find(p => p.id === productId);
      setSelectedProduct(product || null);
    } else {
      setSelectedProduct(null);
    }
  }, [productId, products]);

  const fetchAvailableProducts = async (warehouseId: string) => {
    setLoadingProducts(true);
    try {
      const { data, error } = await supabase
        .from('inventory_balance')
        .select(`
          product_id,
          qty_full,
          qty_reserved,
          product:products(id, sku, name)
        `)
        .eq('warehouse_id', warehouseId)
        .gt('qty_full', 0);

      if (error) throw error;

      const availableProducts: Product[] = (data || [])
        .filter(item => item.product && (item.qty_full - item.qty_reserved) > 0)
        .map(item => ({
          id: item.product!.id,
          sku: item.product!.sku,
          name: item.product!.name,
          available_quantity: item.qty_full - item.qty_reserved
        }));

      setProducts(availableProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch available products');
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSubmit = async (data: TransferFormData) => {
    setIsSubmitting(true);

    try {
      // Validate available quantity
      if (selectedProduct && data.quantity > selectedProduct.available_quantity) {
        form.setError('quantity', {
          type: 'manual',
          message: `Only ${selectedProduct.available_quantity} units available for transfer`
        });
        setIsSubmitting(false);
        return;
      }

      // In a real implementation, this would be handled by a stored procedure
      // or edge function to ensure atomicity
      
      // Get current inventory for source warehouse
      const { data: sourceInventory, error: sourceError } = await supabase
        .from('inventory_balance')
        .select('*')
        .eq('warehouse_id', data.from_warehouse_id)
        .eq('product_id', data.product_id)
        .single();

      if (sourceError) throw sourceError;

      // Get current inventory for destination warehouse
      const { data: destInventory, error: destError } = await supabase
        .from('inventory_balance')
        .select('*')
        .eq('warehouse_id', data.to_warehouse_id)
        .eq('product_id', data.product_id)
        .maybeSingle();

      if (destError && destError.code !== 'PGRST116') throw destError;

      // Update source warehouse (decrease)
      const { error: updateSourceError } = await supabase
        .from('inventory_balance')
        .update({
          qty_full: sourceInventory.qty_full - data.quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', sourceInventory.id);

      if (updateSourceError) throw updateSourceError;

      // Update or create destination warehouse record (increase)
      if (destInventory) {
        const { error: updateDestError } = await supabase
          .from('inventory_balance')
          .update({
            qty_full: destInventory.qty_full + data.quantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', destInventory.id);

        if (updateDestError) throw updateDestError;
      } else {
        const { error: insertDestError } = await supabase
          .from('inventory_balance')
          .insert({
            warehouse_id: data.to_warehouse_id,
            product_id: data.product_id,
            qty_full: data.quantity,
            qty_empty: 0,
            qty_reserved: 0,
            updated_at: new Date().toISOString()
          });

        if (insertDestError) throw insertDestError;
      }

      toast.success(`Successfully transferred ${data.quantity} units`);
      onOpenChange(false);
      onSuccess?.();
      form.reset();

    } catch (error: any) {
      console.error('Error transferring stock:', error);
      toast.error(error.message || 'Failed to transfer stock');
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
            <ArrowUpDown className="h-5 w-5" />
            Transfer Stock
          </DialogTitle>
          <DialogDescription>
            Move inventory between warehouses. Ensure sufficient stock is available before transferring.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Source Warehouse */}
            <FormField
              control={form.control}
              name="from_warehouse_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Warehouse className="h-4 w-4" />
                    From Warehouse *
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-white text-gray-900 border-gray-300">
                        <SelectValue placeholder="Select source warehouse" />
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

            {/* Destination Warehouse */}
            <FormField
              control={form.control}
              name="to_warehouse_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Warehouse className="h-4 w-4" />
                    To Warehouse *
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-white text-gray-900 border-gray-300">
                        <SelectValue placeholder="Select destination warehouse" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {warehouses
                        .filter(w => w.id !== fromWarehouseId)
                        .map((warehouse) => (
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
                    disabled={!fromWarehouseId || loadingProducts}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white text-gray-900 border-gray-300">
                        <SelectValue placeholder={
                          !fromWarehouseId 
                            ? "Select source warehouse first"
                            : loadingProducts 
                              ? "Loading products..."
                              : "Select product to transfer"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          <div className="flex justify-between items-center w-full">
                            <span>{product.name} ({product.sku})</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              {product.available_quantity} available
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {fromWarehouseId && !loadingProducts && products.length === 0 && (
                      <span className="text-yellow-600">No products with available stock in selected warehouse</span>
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quantity */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity to Transfer *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1"
                      max={selectedProduct?.available_quantity || 999}
                      placeholder="Enter quantity" 
                      className="bg-white text-gray-900 border-gray-300"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormDescription>
                    {selectedProduct && (
                      <span>
                        Maximum available: {selectedProduct.available_quantity} units
                      </span>
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transfer Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Optional notes about this transfer..."
                      className="min-h-[80px] bg-white text-gray-900 border-gray-300"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional. Add any relevant information about this transfer.
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
                Transfer Stock
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}