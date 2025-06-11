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
import { Button } from '@/components/ui/button';
import { Loader2, User, Hash, Phone, Mail, CreditCard, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { Customer } from '@/types/customer';

// Validation schema with exact requirements
const customerFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Customer name is required')
    .max(120, 'Customer name must not exceed 120 characters')
    .trim(),
  tax_id: z
    .string()
    .max(32, 'Tax ID must not exceed 32 characters')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val === '') return true;
      // Basic phone validation - can be enhanced based on requirements
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      return phoneRegex.test(val.replace(/[\s\-\(\)]/g, ''));
    }, 'Please enter a valid phone number')
    .or(z.literal('')),
  email: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val === '') return true;
      return z.string().email().safeParse(val).success;
    }, 'Please enter a valid email address')
    .or(z.literal('')),
  account_status: z.enum(['active', 'credit_hold', 'closed'], {
    required_error: 'Please select an account status',
  }),
  credit_terms_days: z
    .number()
    .min(0, 'Credit terms must be 0 or greater')
    .max(365, 'Credit terms cannot exceed 365 days')
    .default(30),
});

type CustomerFormData = z.infer<typeof customerFormSchema>;

interface CustomerFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  onSuccess?: () => void;
}

export function CustomerFormModal({
  open,
  onOpenChange,
  customer,
  onSuccess
}: CustomerFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!customer;

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: '',
      tax_id: '',
      phone: '',
      email: '',
      account_status: 'active',
      credit_terms_days: 30,
    },
  });

  // Reset form when dialog opens/closes or customer changes
  useEffect(() => {
    if (open) {
      if (customer) {
        // Edit mode - populate with existing data
        form.reset({
          name: customer.name || '',
          tax_id: customer.tax_id || '',
          phone: customer.phone || '',
          email: customer.email || '',
          account_status: customer.account_status,
          credit_terms_days: customer.credit_terms_days || 30,
        });
      } else {
        // Create mode - reset to defaults
        form.reset({
          name: '',
          tax_id: '',
          phone: '',
          email: '',
          account_status: 'active',
          credit_terms_days: 30,
        });
      }
    }
  }, [open, customer, form]);

  const checkTaxIdUniqueness = async (taxId: string, currentCustomerId?: string): Promise<boolean> => {
    if (!taxId || taxId.trim() === '') return true;

    try {
      let query = supabase
        .from('customers')
        .select('id')
        .eq('tax_id', taxId.trim());

      // If editing, exclude current customer from uniqueness check
      if (currentCustomerId) {
        query = query.neq('id', currentCustomerId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error checking tax ID uniqueness:', error);
        return true; // Allow submission if check fails
      }

      return data.length === 0;
    } catch (error) {
      console.error('Error checking tax ID uniqueness:', error);
      return true; // Allow submission if check fails
    }
  };

  const handleSubmit = async (data: CustomerFormData) => {
    setIsSubmitting(true);

    try {
      // Check tax ID uniqueness if provided
      if (data.tax_id && data.tax_id.trim() !== '') {
        const isUnique = await checkTaxIdUniqueness(data.tax_id.trim(), customer?.id);
        if (!isUnique) {
          form.setError('tax_id', {
            type: 'manual',
            message: 'This Tax ID is already in use by another customer',
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Prepare data for submission
      const submitData = {
        name: data.name.trim(),
        tax_id: data.tax_id?.trim() || null,
        phone: data.phone?.trim() || '',
        email: data.email?.trim() || null,
        account_status: data.account_status,
        credit_terms_days: data.credit_terms_days,
      };

      if (isEditMode && customer) {
        // Update existing customer
        const { data: updatedCustomer, error } = await supabase
          .from('customers')
          .update({
            ...submitData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', customer.id)
          .select()
          .single();

        if (error) throw error;

        toast.success('Customer updated successfully');
      } else {
        // Create new customer
        const { data: newCustomer, error } = await supabase
          .from('customers')
          .insert({
            ...submitData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;

        toast.success('Customer created successfully');
      }

      // Close modal and trigger refresh
      onOpenChange(false);
      onSuccess?.();

    } catch (error: any) {
      console.error('Error saving customer:', error);
      
      // Handle specific database errors
      if (error.code === '23505') {
        if (error.message.includes('tax_id')) {
          form.setError('tax_id', {
            type: 'manual',
            message: 'This Tax ID is already in use',
          });
        } else if (error.message.includes('phone')) {
          form.setError('phone', {
            type: 'manual',
            message: 'This phone number is already in use',
          });
        } else {
          toast.error('A customer with this information already exists');
        }
      } else {
        toast.error(
          error.message || 
          `Failed to ${isEditMode ? 'update' : 'create'} customer`
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {isEditMode ? 'Edit Customer' : 'Add New Customer'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update the customer information below. All fields marked with * are required.'
              : 'Enter the details for the new customer. All fields marked with * are required.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Customer Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Customer Name *
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter customer name (max 120 characters)" 
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

            {/* Tax ID */}
            <FormField
              control={form.control}
              name="tax_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Tax ID
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter tax identification number (max 32 characters)" 
                      {...field}
                      maxLength={32}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional. Must be unique if provided. {field.value?.length || 0}/32 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., +254701234567 or 0701234567" 
                      {...field}
                      type="tel"
                    />
                  </FormControl>
                  <FormDescription>
                    Optional. Include country code for international numbers
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="customer@example.com" 
                      {...field}
                      type="email"
                    />
                  </FormControl>
                  <FormDescription>
                    Optional. Used for order confirmations and communications
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Account Status */}
            <FormField
              control={form.control}
              name="account_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Account Status *
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          Active
                        </div>
                      </SelectItem>
                      <SelectItem value="credit_hold">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                          Credit Hold
                        </div>
                      </SelectItem>
                      <SelectItem value="closed">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full" />
                          Closed
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Active: Can place orders • Credit Hold: Payment required • Closed: Account suspended
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Credit Terms Days */}
            <FormField
              control={form.control}
              name="credit_terms_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Credit Terms (Days) *
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="30" 
                      min="0"
                      max="365"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === '' ? 0 : parseInt(value, 10));
                      }}
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </FormControl>
                  <FormDescription>
                    Number of days for payment terms (0-365). Default is 30 days.
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
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? 'Update Customer' : 'Create Customer'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}