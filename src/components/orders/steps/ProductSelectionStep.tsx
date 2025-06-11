import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Package, 
  Plus, 
  Minus, 
  Search,
  Trash2,
  AlertTriangle,
  Scale,
  ShoppingCart,
  Filter,
  Zap,
  CheckCircle,
  X
} from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';
import type { Product } from '@/types/product';

interface OrderLine {
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  availableStock: number;
}

interface ProductSelectionStepProps {
  orderLines: OrderLine[];
  onOrderLinesChange: (orderLines: OrderLine[]) => void;
}

// Fixed pricing for MVP
const PRODUCT_PRICING = {
  '20kg': 2500,  // KES 2,500
  '50kg': 5500,  // KES 5,500
  '100kg': 9500, // KES 9,500
};

// Mock stock data - in real app, this would come from inventory API
const MOCK_STOCK = {
  'CYL-20KG-STD': 45,
  'CYL-50KG-STD': 32,
  'CYL-100KG-IND': 18,
  'CYL-13KG-PRT': 28,
  'CYL-6KG-DOM': 55,
};

export function ProductSelectionStep({
  orderLines,
  onOrderLinesChange
}: ProductSelectionStepProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  const { products, loading, fetchProducts } = useProducts();

  // Fetch products when search term or filter changes
  useEffect(() => {
    fetchProducts({ search: debouncedSearch, status: 'active' }, 1, 50);
  }, [debouncedSearch, fetchProducts]);

  // Get available stock for a product
  const getAvailableStock = (product: Product): number => {
    return MOCK_STOCK[product.sku as keyof typeof MOCK_STOCK] || 0;
  };

  // Get product price based on capacity
  const getProductPrice = (product: Product): number => {
    if (product.capacity_kg) {
      if (product.capacity_kg <= 20) return PRODUCT_PRICING['20kg'];
      if (product.capacity_kg <= 50) return PRODUCT_PRICING['50kg'];
      return PRODUCT_PRICING['100kg'];
    }
    return PRODUCT_PRICING['20kg']; // Default
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSize = sizeFilter === 'all' || 
      (sizeFilter === 'small' && product.capacity_kg && product.capacity_kg <= 20) ||
      (sizeFilter === 'medium' && product.capacity_kg && product.capacity_kg > 20 && product.capacity_kg <= 50) ||
      (sizeFilter === 'large' && product.capacity_kg && product.capacity_kg > 50);
    
    return matchesSize;
  });

  // Check if product is already in order
  const isProductInOrder = (productId: string): boolean => {
    return orderLines.some(line => line.product.id === productId);
  };

  // Add product to order
  const addProductToOrder = (product: Product, quantity: number = 1) => {
    const availableStock = getAvailableStock(product);
    
    if (availableStock === 0) {
      toast.error('Product is out of stock');
      return;
    }

    if (quantity > availableStock) {
      toast.error(`Only ${availableStock} units available`);
      return;
    }

    if (isProductInOrder(product.id)) {
      toast.error('Product is already in the order');
      return;
    }

    const unitPrice = getProductPrice(product);
    const newOrderLine: OrderLine = {
      product,
      quantity,
      unitPrice,
      subtotal: unitPrice * quantity,
      availableStock
    };
    
    onOrderLinesChange([...orderLines, newOrderLine]);
    toast.success(`${product.name} added to order`);
  };

  // Update quantity in order line
  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeOrderLine(index);
      return;
    }

    const orderLine = orderLines[index];
    
    if (newQuantity > orderLine.availableStock) {
      toast.error(`Only ${orderLine.availableStock} units available`);
      return;
    }

    const updatedLines = orderLines.map((line, i) => {
      if (i === index) {
        return {
          ...line,
          quantity: newQuantity,
          subtotal: line.unitPrice * newQuantity
        };
      }
      return line;
    });
    
    onOrderLinesChange(updatedLines);
  };

  // Remove order line
  const removeOrderLine = (index: number) => {
    const updatedLines = orderLines.filter((_, i) => i !== index);
    onOrderLinesChange(updatedLines);
    toast.success('Product removed from order');
  };

  // Quick add common quantities
  const quickAddQuantity = (product: Product, quantity: number) => {
    const availableStock = getAvailableStock(product);
    const actualQuantity = Math.min(quantity, availableStock);
    addProductToOrder(product, actualQuantity);
  };

  // Clear all order lines
  const clearAllLines = () => {
    if (orderLines.length === 0) return;
    
    if (window.confirm('Are you sure you want to remove all products from the order?')) {
      onOrderLinesChange([]);
      toast.success('All products removed from order');
    }
  };

  // Calculate totals
  const orderSubtotal = orderLines.reduce((sum, line) => sum + line.subtotal, 0);
  const taxRate = 0.085; // 8.5% tax
  const taxAmount = orderSubtotal * taxRate;
  const orderTotal = orderSubtotal + taxAmount;
  const totalItems = orderLines.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Product Selection Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Available Products</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {filteredProducts.length} products
            </Badge>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={sizeFilter} onValueChange={setSizeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sizes</SelectItem>
              <SelectItem value="small">Small (≤20kg)</SelectItem>
              <SelectItem value="medium">Medium (21-50kg)</SelectItem>
              <SelectItem value="large">{"Large (>50kg)"}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Products Table */}
        <Card>
          <CardContent className="p-0">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-center">Capacity</TableHead>
                    <TableHead className="text-center">Available Stock</TableHead>
                    <TableHead className="text-center">Unit Price</TableHead>
                    <TableHead className="text-center">Quick Add</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    [...Array(3)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="h-4 bg-muted animate-pulse rounded w-32" />
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="h-4 bg-muted animate-pulse rounded w-16 mx-auto" />
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="h-4 bg-muted animate-pulse rounded w-12 mx-auto" />
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="h-4 bg-muted animate-pulse rounded w-20 mx-auto" />
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="h-8 bg-muted animate-pulse rounded w-24 mx-auto" />
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="h-8 bg-muted animate-pulse rounded w-16 mx-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <div>No products found</div>
                        <div className="text-sm">Try adjusting your search or filters</div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => {
                      const availableStock = getAvailableStock(product);
                      const unitPrice = getProductPrice(product);
                      const isInOrder = isProductInOrder(product.id);
                      const isOutOfStock = availableStock === 0;
                      
                      return (
                        <TableRow key={product.id} className={`
                          ${isInOrder ? 'bg-muted/30' : ''}
                          ${isOutOfStock ? 'opacity-50' : ''}
                        `}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{product.name}</span>
                                {isInOrder && (
                                  <Badge variant="secondary" className="text-xs">
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    In Order
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                SKU: {product.sku}
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Scale className="h-3 w-3 text-muted-foreground" />
                              <span>{product.capacity_kg || 'N/A'}kg</span>
                            </div>
                          </TableCell>
                          
                          <TableCell className="text-center">
                            <Badge variant={
                              availableStock === 0 ? 'destructive' :
                              availableStock < 10 ? 'secondary' : 'default'
                            } className={
                              availableStock === 0 ? 'bg-red-100 text-red-800' :
                              availableStock < 10 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }>
                              {availableStock} units
                            </Badge>
                          </TableCell>
                          
                          <TableCell className="text-center font-medium">
                            KES {unitPrice.toLocaleString()}
                          </TableCell>
                          
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              {[1, 5, 10].map((qty) => (
                                <Button
                                  key={qty}
                                  variant="outline"
                                  size="sm"
                                  className="h-7 w-8 p-0 text-xs"
                                  disabled={isOutOfStock || isInOrder || qty > availableStock}
                                  onClick={() => quickAddQuantity(product, qty)}
                                >
                                  {qty}
                                </Button>
                              ))}
                            </div>
                          </TableCell>
                          
                          <TableCell className="text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isOutOfStock || isInOrder}
                              onClick={() => addProductToOrder(product)}
                              className="h-8"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Lines Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">
            Order Items {orderLines.length > 0 && `(${totalItems} items)`}
          </h3>
          {orderLines.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllLines}
              className="text-destructive hover:text-destructive"
            >
              <X className="mr-2 h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>

        {orderLines.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead className="text-center">Unit Price</TableHead>
                      <TableHead className="text-center">Subtotal</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderLines.map((line, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{line.product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              SKU: {line.product.sku} • {line.product.capacity_kg}kg
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {line.availableStock} units available
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateQuantity(index, line.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            
                            <Input
                              type="number"
                              min="1"
                              max={line.availableStock}
                              value={line.quantity}
                              onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                              className="w-16 text-center h-7"
                            />
                            
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              disabled={line.quantity >= line.availableStock}
                              onClick={() => updateQuantity(index, line.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          {line.quantity > line.availableStock && (
                            <div className="text-xs text-red-600 mt-1">
                              Exceeds stock!
                            </div>
                          )}
                        </TableCell>
                        
                        <TableCell className="text-center font-medium">
                          KES {line.unitPrice.toLocaleString()}
                        </TableCell>
                        
                        <TableCell className="text-center font-medium">
                          KES {line.subtotal.toLocaleString()}
                        </TableCell>
                        
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => removeOrderLine(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed border-2">
            <CardContent className="pt-12 pb-12">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">No Products Added</h3>
                  <p className="text-muted-foreground">
                    Add products from the table above to build your order
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Total */}
        {orderLines.length > 0 && (
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({totalItems} items)</span>
                  <span>KES {orderSubtotal.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Tax (8.5%)</span>
                  <span>KES {taxAmount.toLocaleString()}</span>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">Order Total</span>
                    <span className="text-xl font-bold">
                      KES {orderTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Validation Messages */}
      {orderLines.length === 0 && (
        <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            Please add at least one product to continue with the order
          </div>
        </div>
      )}

      {/* Stock Warnings */}
      {orderLines.some(line => line.quantity > line.availableStock) && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <div className="text-sm text-red-800">
            Some items exceed available stock. Please adjust quantities before proceeding.
          </div>
        </div>
      )}
    </div>
  );
}