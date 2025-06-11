import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  ShoppingCart, 
  User, 
  Package, 
  FileText, 
  BarChart2 
} from 'lucide-react';

interface QuickActionsProps {
  onCreateOrder: () => void;
  onAddCustomer: () => void;
  onAddProduct: () => void;
  onViewInventory: () => void;
}

export function QuickActions({ 
  onCreateOrder, 
  onAddCustomer, 
  onAddProduct,
  onViewInventory
}: QuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Quick Actions
        </CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          className="w-full justify-center bg-blue-600 text-white hover:bg-blue-700"
          onClick={onCreateOrder}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Create New Order
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full justify-center bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
          onClick={onAddCustomer}
        >
          <User className="mr-2 h-4 w-4" />
          Add New Customer
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full justify-center bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
          onClick={onAddProduct}
        >
          <Package className="mr-2 h-4 w-4" />
          Add New Product
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full justify-center bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
          onClick={onViewInventory}
        >
          <BarChart2 className="mr-2 h-4 w-4" />
          View Inventory
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full justify-center bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
          onClick={() => console.log('Generate reports')}
        >
          <FileText className="mr-2 h-4 w-4" />
          Generate Reports
        </Button>
      </CardContent>
    </Card>
  );
}