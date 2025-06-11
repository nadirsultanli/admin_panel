// Generated types for Supabase (this would typically be auto-generated)
export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string;
          name: string;
          tax_id: string;
          phone: string;
          email: string;
          account_status: 'active' | 'inactive' | 'suspended';
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          tax_id: string;
          phone: string;
          email: string;
          account_status?: 'active' | 'inactive' | 'suspended';
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          tax_id?: string;
          phone?: string;
          email?: string;
          account_status?: 'active' | 'inactive' | 'suspended';
          updated_at?: string | null;
        };
      };
      addresses: {
        Row: {
          id: string;
          customer_id: string;
          label: string;
          line1: string;
          line2: string | null;
          city: string;
          state: string;
          postal_code: string;
          is_primary: boolean;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          customer_id: string;
          label: string;
          line1: string;
          line2?: string | null;
          city: string;
          state: string;
          postal_code: string;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          customer_id?: string;
          label?: string;
          line1?: string;
          line2?: string | null;
          city?: string;
          state?: string;
          postal_code?: string;
          is_primary?: boolean;
          updated_at?: string | null;
        };
      };
      products: {
        Row: {
          id: string;
          sku: string;
          name: string;
          description: string | null;
          capacity_kg: number;
          tare_weight_kg: number;
          status: 'active' | 'inactive' | 'discontinued';
          price: number;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          sku: string;
          name: string;
          description?: string | null;
          capacity_kg: number;
          tare_weight_kg: number;
          status?: 'active' | 'inactive' | 'discontinued';
          price: number;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          sku?: string;
          name?: string;
          description?: string | null;
          capacity_kg?: number;
          tare_weight_kg?: number;
          status?: 'active' | 'inactive' | 'discontinued';
          price?: number;
          updated_at?: string | null;
        };
      };
      orders: {
        Row: {
          id: string;
          customer_id: string;
          delivery_address_id: string;
          order_date: string;
          status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
          total_amount: number;
          notes: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          customer_id: string;
          delivery_address_id: string;
          order_date?: string;
          status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
          total_amount: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          customer_id?: string;
          delivery_address_id?: string;
          order_date?: string;
          status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
          total_amount?: number;
          notes?: string | null;
          updated_at?: string | null;
        };
      };
      order_lines: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          quantity?: number;
          unit_price?: number;
          subtotal?: number;
        };
      };
    };
  };
}