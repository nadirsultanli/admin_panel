import { useState } from 'react';
import { Menu, Search, Bell, User, X, AlertTriangle, Package, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { useHotkeys } from '@/hooks/useHotkeys';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    customers: { id: string; name: string }[];
    orders: { id: string; number: string }[];
    products: { id: string; name: string }[];
  }>({
    customers: [],
    orders: [],
    products: []
  });

  // Register keyboard shortcut
  useHotkeys('ctrl+k', () => {
    setSearchOpen(true);
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults({ customers: [], orders: [], products: [] });
      return;
    }
    
    // Mock search results - in a real app, this would query the database
    setSearchResults({
      customers: [
        { id: 'cust1', name: 'Acme Corporation' },
        { id: 'cust2', name: 'Global Industries' }
      ].filter(c => c.name.toLowerCase().includes(query.toLowerCase())),
      orders: [
        { id: 'ord1', number: 'ORD-123456' },
        { id: 'ord2', number: 'ORD-789012' }
      ].filter(o => o.number.toLowerCase().includes(query.toLowerCase())),
      products: [
        { id: 'prod1', name: '20kg Standard Cylinder' },
        { id: 'prod2', name: '50kg Standard Cylinder' }
      ].filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
    });
  };

  const handleResultClick = (type: string, id: string) => {
    setSearchOpen(false);
    setSearchQuery('');
    
    switch (type) {
      case 'customer':
        navigate(`/customers/${id}`);
        break;
      case 'order':
        navigate(`/orders/${id}`);
        break;
      case 'product':
        navigate(`/products/${id}`);
        break;
    }
  };

  const hasResults = searchResults.customers.length > 0 || 
                     searchResults.orders.length > 0 || 
                     searchResults.products.length > 0;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 h-16">
      <div className="flex h-full items-center px-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden mr-2 text-foreground hover:bg-accent hover:text-accent-foreground"
          onClick={onToggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">LPG</span>
          </div>
          <h1 className="text-xl font-semibold">LPG Order Management</h1>
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-4">
          {/* Global Search */}
          <Popover open={searchOpen} onOpenChange={setSearchOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-[240px] justify-start text-muted-foreground bg-white text-gray-900 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="mr-2 h-4 w-4" />
                <span>Search...</span>
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[520px] p-0" align="end">
              <div className="flex items-center border-b px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <Input
                  placeholder="Search across customers, orders, products..."
                  className="flex h-10 w-full rounded-md border-0 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  autoFocus
                />
                {searchQuery && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults({ customers: [], orders: [], products: [] });
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {!searchQuery && (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Type to search across all records...
                  </div>
                )}
                
                {searchQuery && !hasResults && (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    No results found for "{searchQuery}"
                  </div>
                )}
                
                {/* Customers */}
                {searchResults.customers.length > 0 && (
                  <div className="px-2 py-1.5">
                    <div className="text-xs font-semibold text-muted-foreground px-2 py-1.5">
                      Customers
                    </div>
                    {searchResults.customers.map(customer => (
                      <button
                        key={customer.id}
                        className="w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-muted flex items-center"
                        onClick={() => handleResultClick('customer', customer.id)}
                      >
                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                        {customer.name}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Orders */}
                {searchResults.orders.length > 0 && (
                  <div className="px-2 py-1.5">
                    <div className="text-xs font-semibold text-muted-foreground px-2 py-1.5">
                      Orders
                    </div>
                    {searchResults.orders.map(order => (
                      <button
                        key={order.id}
                        className="w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-muted flex items-center"
                        onClick={() => handleResultClick('order', order.id)}
                      >
                        <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                        {order.number}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Products */}
                {searchResults.products.length > 0 && (
                  <div className="px-2 py-1.5">
                    <div className="text-xs font-semibold text-muted-foreground px-2 py-1.5">
                      Products
                    </div>
                    {searchResults.products.map(product => (
                      <button
                        key={product.id}
                        className="w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-muted flex items-center"
                        onClick={() => handleResultClick('product', product.id)}
                      >
                        <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                        {product.name}
                      </button>
                    ))}
                  </div>
                )}
                
                {hasResults && (
                  <div className="border-t px-2 py-2 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Press Enter to see all results</span>
                      <span>ESC to close</span>
                    </div>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="icon"
                className="relative bg-white text-gray-900 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                  3
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-medium">Notifications</h4>
                <Button variant="ghost" size="sm" className="text-xs text-gray-700 hover:text-gray-900 hover:bg-gray-100">
                  Mark all as read
                </Button>
              </div>
              <div className="max-h-[300px] overflow-y-auto py-2">
                <div className="space-y-2">
                  <div className="flex gap-2 p-2 hover:bg-muted rounded-md cursor-pointer">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bell className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">New order received</p>
                      <p className="text-xs text-muted-foreground">Order #ORD-123456 has been created</p>
                      <p className="text-xs text-muted-foreground mt-1">5 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex gap-2 p-2 hover:bg-muted rounded-md cursor-pointer">
                    <div className="h-9 w-9 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Low stock alert</p>
                      <p className="text-xs text-muted-foreground">20kg Standard Cylinder is running low</p>
                      <p className="text-xs text-muted-foreground mt-1">1 hour ago</p>
                    </div>
                  </div>
                  <div className="flex gap-2 p-2 hover:bg-muted rounded-md cursor-pointer">
                    <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Order delivered</p>
                      <p className="text-xs text-muted-foreground">Order #ORD-789012 was delivered successfully</p>
                      <p className="text-xs text-muted-foreground mt-1">3 hours ago</p>
                    </div>
                  </div>
                </div>
              </div>
              <Separator className="my-2" />
              <Button variant="outline" size="sm" className="w-full bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900">
                View all notifications
              </Button>
            </PopoverContent>
          </Popover>
          
          {/* User Profile */}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="bg-white text-gray-900 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
              >
                <User className="mr-2 h-4 w-4" />
                Admin User
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="end">
              <div className="flex flex-col space-y-1 p-2">
                <div className="text-sm font-medium">Admin User</div>
                <div className="text-xs text-muted-foreground">admin@example.com</div>
              </div>
              <Separator className="my-2" />
              <div className="flex flex-col space-y-1">
                <Button variant="ghost" size="sm" className="justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100">
                  Profile Settings
                </Button>
                <Button variant="ghost" size="sm" className="justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100">
                  Account Preferences
                </Button>
                <Button variant="ghost" size="sm" className="justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100">
                  Help & Support
                </Button>
              </div>
              <Separator className="my-2" />
              <Button variant="ghost" size="sm" className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                Sign Out
              </Button>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
}