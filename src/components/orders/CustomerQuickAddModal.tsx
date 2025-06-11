import { useState } from 'react';
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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { Customer } from '@/types/customer';

const quickAddSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(120, 'Name too long'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
});

type QuickAddFormData = z.infer<typeof quickAddSchema>;

interface CustomerQuickAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (customer: Customer) => void;
}

export function CustomerQuickAddModal({
  open,
  onOpenChange,
  onSuccess
}: CustomerQuickAddModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<QuickAddFormData>({
    resolver: zodResolver(quickAddSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
    },
  });

  const handleSubmit = async (data: QuickAddFormData) => {
    setIsSubmitting(true);

    try {
      const { data: newCustomer, error } = await supabase
        .from('customers')
        .insert({
          name: data.name.trim(),
          phone: data.phone.trim(),
          email: data.email?.trim() || null,
          account_status: 'active',
          credit_terms_days: 30,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Customer created successfully');
      onSuccess(newCustomer);
      form.reset();
    } catch (error: any) {
      console.error('Error creating customer:', error);
      
      if (error.code === '23505') {
        if (error.message.includes('phone')) {
          form.setError('phone', {
            type: 'manual',
            message: 'This phone number is already in use',
          });
        } else {
          toast.error('A customer with this information already exists');
        }
      } else {
        toast.error(error.message || 'Failed to create customer');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (form.formState.isDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        form.reset();
        onOpenChange(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Quick Add Customer
          </DialogTitle>
          <DialogDescription>
            Create a new customer with basic information. You can add more details later.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Name *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter customer name" 
                      {...field}
                      maxLength={120}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., +254701234567" 
                      {...field}
                      type="tel"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="customer@example.com (optional)" 
                      {...field}
                      type="email"
                    />
                  </FormControl>
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
                Create Customer
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}