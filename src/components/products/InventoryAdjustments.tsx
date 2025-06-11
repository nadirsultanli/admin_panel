import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
} from '@/components/ui/form';
import { 
  Plus, 
  Minus, 
  Settings,
  History,
  Loader2
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useInventory } from '@/hooks/useInventory';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Warehouse } from '@/types/inventory';

interface InventoryAdjustmentsProps {
  productId: string;
}

const adjustmentSchema = z.object({
  warehouse_id: z.string().min(1, 'Please select a warehouse'),
  adjustment_type: z.enum(['full', 'empty', 'reserved']),
  quantity_change: z.number().int().min(-999).max(999),
  reason: z.string().min(1, 'Please provide a reason for the adjustment'),
});

type AdjustmentFormData = z.infer<typeof adjustmentSchema>;

export function InventoryAdjustments({ productId }: InventoryAdjustmentsProps) {
  const { adjustInventory, loading } = useInventory();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [selectedType, setSelectedType] = useState<'full' | 'empty' | 'reserved'>('full');

  const form = useForm<AdjustmentFormData>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      warehouse_id: '',
      adjustment_type: 'full',
      quantity_change: 0,
      reason: '',
    },
  });

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .order('name');

      if (error) throw error;
      setWarehouses(data || []);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const handleQuickAdjustment = (warehouseId: string, type: 'full' | 'empty' | 'reserved', amount: number) => {
    if (!warehouseId) {
      toast.error('Please select a warehouse first');
      return;
    }

    form.setValue('warehouse_id', warehouseId);
    form.setValue('adjustment_type', type);
    form.setValue('quantity_change', amount);
    form.setValue('reason', `Quick adjustment: ${amount > 0 ? '+' : ''}${amount} ${type} cylinders`);
    setDialogOpen(true);
  };

  const handleManualAdjustment = () => {
    form.reset({
      warehouse_id: selectedWarehouse,
      adjustment_type: selectedType,
      quantity_change: 0,
      reason: '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (data: AdjustmentFormData) => {
    const success = await adjustInventory({
      warehouse_id: data.warehouse_id,
      product_id: productId,
      adjustment_type: data.adjustment_type,
      quantity_change: data.quantity_change,
      reason: data.reason,
    });

    if (success) {
      setDialogOpen(false);
      form.reset();
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Inventory Adjustments
          </CardTitle>
          <CardDescription>
            Make quick adjustments or record manual inventory changes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Warehouse Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Warehouse</label>
            <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a warehouse to adjust inventory" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Adjustment Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Adjustment Type</label>
            <Select value={selectedType} onValueChange={(value: 'full' | 'empty' | 'reserved') => setSelectedType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Cylinders</SelectItem>
                <SelectItem value="empty">Empty Cylinders</SelectItem>
                <SelectItem value="reserved">Reserved Cylinders</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quick Adjustment Buttons */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Quick Adjustments</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualAdjustment}
                disabled={!selectedWarehouse}
              >
                <Settings className="mr-2 h-4 w-4" />
                Manual Adjustment
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Increase Buttons */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Increase Stock</p>
                <div className="flex gap-2">
                  {[1, 5, 10].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAdjustment(selectedWarehouse, selectedType, amount)}
                      disabled={!selectedWarehouse}
                      className="flex-1"
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      {amount}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Decrease Buttons */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Decrease Stock</p>
                <div className="flex gap-2">
                  {[1, 5, 10].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAdjustment(selectedWarehouse, selectedType, -amount)}
                      disabled={!selectedWarehouse}
                      className="flex-1"
                    >
                      <Minus className="mr-1 h-3 w-3" />
                      {amount}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Adjustment History */}
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 mb-4">
              <History className="h-4 w-4" />
              <h4 className="text-sm font-medium">Recent Adjustments</h4>
            </div>
            <div className="text-center py-4 text-muted-foreground text-sm">
              Adjustment history will be displayed here
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Adjustment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inventory Adjustment</DialogTitle>
            <DialogDescription>
              Record an inventory adjustment with a reason for tracking purposes.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="warehouse_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warehouse</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
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

              <FormField
                control={form.control}
                name="adjustment_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adjustment Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
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

              <FormField
                control={form.control}
                name="quantity_change"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity Change</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter positive or negative number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain the reason for this adjustment..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Apply Adjustment
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}