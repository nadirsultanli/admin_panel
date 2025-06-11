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
import { Loader2, Package, Hash, Scale, Wrench, Barcode } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/types/product';

// Product form validation schema
const productFormSchema = z.object({
  sku: z
    .string()
    .min(1, 'SKU is required')
    .max(40, 'SKU must not exceed 40 characters')
    .regex(/^[A-Z0-9\-]+$/, 'SKU must contain only uppercase letters, numbers, and hyphens')
    .transform(val => val.toUpperCase()),
  name: z
    .string()
    .min(1, 'Product name is required')
    .max(120, 'Product name must not exceed 120 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .optional()
    .or(z.literal('')),
  unit_of_measure: z.enum(['cylinder', 'kg'], {
    required_error: 'Please select a unit of measure',
  }),
  capacity_kg: z
    .number()
    .min(0.01, 'Capacity must be greater than 0')
    .max(999.99, 'Capacity cannot exceed 999.99 kg'),
  tare_weight_kg: z
    .number()
    .min(0.01, 'Tare weight must be greater than 0')
    .max(999.99, 'Tare weight cannot exceed 999.99 kg'),
  valve_type: z
    .string()
    .max(20, 'Valve type must not exceed 20 characters')
    .optional()
    .or(z.literal('')),
  status: z.enum(['active', 'end_of_sale', 'obsolete'], {
    required_error: 'Please select a status',
  }),
  barcode_uid: z
    .string()
    .max(64, 'Barcode UID must not exceed 64 characters')
    .optional()
    .or(z.literal('')),
}).refine((data) => {
  // Validate that capacity is greater than tare weight
  return data.capacity_kg > data.tare_weight_kg;
}, {
  message: 'Capacity must be greater than tare weight',
  path: ['capacity_kg'],
});

type ProductFormData = z.infer<typeof productFormSchema>;

interface ProductFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSuccess?: () => void;
}

export function ProductFormModal({
  open,
  onOpenChange,
  product,
  onSuccess
}: ProductFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!product;

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      sku: '',
      name: '',
      description: '',
      unit_of_measure: 'cylinder',
      capacity_kg: 0,
      tare_weight_kg: 0,
      valve_type: '',
      status: 'active',
      barcode_uid: '',
    },
  });

  // Reset form when dialog opens/closes or product changes
  useEffect(() => {
    if (open) {
      if (product) {
        // Edit mode - populate with existing data
        form.reset({
          sku: product.sku || '',
          name: product.name || '',
          description: product.description || '',
          unit_of_measure: (product.unit_of_measure as 'cylinder' | 'kg') || 'cylinder',
          capacity_kg: product.capacity_kg || 0,
          tare_weight_kg: product.tare_weight_kg || 0,
          valve_type: product.valve_type || '',
          status: product.status,
          barcode_uid: product.barcode_uid || '',
        });
      } else {
        // Create mode - reset to defaults
        form.reset({
          sku: '',
          name: '',
          description: '',
          unit_of_measure: 'cylinder',
          capacity_kg: 0,
          tare_weight_kg: 0,
          valve_type: '',
          status: 'active',
          barcode_uid: '',
        });
      }
    }
  }, [open, product, form]);

  const checkSkuUniqueness = async (sku: string, currentProductId?: string): Promise<boolean> => {
    if (!sku || sku.trim() === '') return true;

    try {
      let query = supabase
        .from('products')
        .select('id')
        .eq('sku', sku.trim().toUpperCase());

      // If editing, exclude current product from uniqueness check
      if (currentProductId) {
        query = query.neq('id', currentProductId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error checking SKU uniqueness:', error);
        return true; // Allow submission if check fails
      }

      return data.length === 0;
    } catch (error) {
      console.error('Error checking SKU uniqueness:', error);
      return true; // Allow submission if check fails
    }
  };

  const checkBarcodeUniqueness = async (barcode: string, currentProductId?: string): Promise<boolean> => {
    if (!barcode || barcode.trim() === '') return true;

    try {
      let query = supabase
        .from('products')
        .select('id')
        .eq('barcode_uid', barcode.trim());

      // If editing, exclude current product from uniqueness check
      if (currentProductId) {
        query = query.neq('id', currentProductId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error checking barcode uniqueness:', error);
        return true; // Allow submission if check fails
      }

      return data.length === 0;
    } catch (error) {
      console.error('Error checking barcode uniqueness:', error);
      return true; // Allow submission if check fails
    }
  };

  const handleSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);

    try {
      // Check SKU uniqueness
      const isSkuUnique = await checkSkuUniqueness(data.sku, product?.id);
      if (!isSkuUnique) {
        form.setError('sku', {
          type: 'manual',
          message: 'This SKU is already in use by another product',
        });
        setIsSubmitting(false);
        return;
      }

      // Check barcode uniqueness if provided
      if (data.barcode_uid && data.barcode_uid.trim() !== '') {
        const isBarcodeUnique = await checkBarcodeUniqueness(data.barcode_uid, product?.id);
        if (!isBarcodeUnique) {
          form.setError('barcode_uid', {
            type: 'manual',
            message: 'This barcode UID is already in use by another product',
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Prepare data for submission
      const submitData = {
        sku: data.sku.toUpperCase(),
        name: data.name.trim(),
        description: data.description?.trim() || null,
        unit_of_measure: data.unit_of_measure,
        capacity_kg: data.capacity_kg,
        tare_weight_kg: data.tare_weight_kg,
        valve_type: data.valve_type?.trim() || null,
        status: data.status,
        barcode_uid: data.barcode_uid?.trim() || null,
      };

      if (isEditMode && product) {
        // Update existing product
        const { data: updatedProduct, error } = await supabase
          .from('products')
          .update(submitData)
          .eq('id', product.id)
          .select()
          .single();

        if (error) throw error;

        toast.success('Product updated successfully');
      } else {
        // Create new product
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert({
            ...submitData,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;

        toast.success('Product created successfully');
      }

      // Close modal and trigger refresh
      onOpenChange(false);
      onSuccess?.();

    } catch (error: any) {
      console.error('Error saving product:', error);
      
      // Handle specific database errors
      if (error.code === '23505') {
        if (error.message.includes('sku')) {
          form.setError('sku', {
            type: 'manual',
            message: 'This SKU is already in use',
          });
        } else if (error.message.includes('barcode_uid')) {
          form.setError('barcode_uid', {
            type: 'manual',
            message: 'This barcode UID is already in use',
          });
        } else {
          toast.error('A product with this information already exists');
        }
      } else {
        toast.error(
          error.message || 
          `Failed to ${isEditMode ? 'update' : 'create'} product`
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (form.formState.isDirty) {
      // Show confirmation if form has changes
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        onOpenChange(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {isEditMode ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update the product information below. Required fields are marked with *.'
              : 'Enter the details for the new product. Required fields are marked with *.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* SKU */}
            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    SKU *
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., CYL-50KG-STD" 
                      {...field}
                      maxLength={40}
                      style={{ textTransform: 'uppercase' }}
                    />
                  </FormControl>
                  <FormDescription>
                    Stock Keeping Unit. Use uppercase letters, numbers, and hyphens only. {field.value?.length || 0}/40 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Product Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Product Name *
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., 50kg Standard Cylinder" 
                      {...field}
                      maxLength={120}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0}/120 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Optional product description..."
                      className="min-h-[80px]"
                      maxLength={500}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional. {field.value?.length || 0}/500 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Unit of Measure and Status Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unit_of_measure"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit of Measure *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cylinder">Cylinder</SelectItem>
                        <SelectItem value="kg">Kilogram</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            Active
                          </div>
                        </SelectItem>
                        <SelectItem value="end_of_sale">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full" />
                            End of Sale
                          </div>
                        </SelectItem>
                        <SelectItem value="obsolete">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                            Obsolete
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Capacity and Tare Weight Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="capacity_kg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Scale className="h-4 w-4" />
                      Capacity (kg) *
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0.01"
                        max="999.99"
                        placeholder="50.00" 
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === '' ? 0 : parseFloat(value));
                        }}
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum capacity in kilograms
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tare_weight_kg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Scale className="h-4 w-4" />
                      Tare Weight (kg) *
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0.01"
                        max="999.99"
                        placeholder="15.00" 
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === '' ? 0 : parseFloat(value));
                        }}
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </FormControl>
                    <FormDescription>
                      Empty cylinder weight in kilograms
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Valve Type and Barcode Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valve_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      Valve Type
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Standard, POL, ACME" 
                        {...field}
                        maxLength={20}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional. {field.value?.length || 0}/20 characters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="barcode_uid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Barcode className="h-4 w-4" />
                      Barcode/RFID UID
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Unique identifier" 
                        {...field}
                        maxLength={64}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional. Must be unique. {field.value?.length || 0}/64 characters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? 'Update Product' : 'Create Product'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}