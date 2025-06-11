import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingCart, 
  Warehouse,
  Menu,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileNavBarProps {
  onOpenSidebar: () => void;
  onOpenSearch: () => void;
}

export function MobileNavBar({ onOpenSidebar, onOpenSearch }: MobileNavBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Orders', href: '/orders', icon: ShoppingCart },
    { name: 'Inventory', href: '/inventory', icon: Warehouse }
  ];
  
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-40 px-2 py-2">
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onOpenSidebar}
          className="text-muted-foreground"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        {navItems.slice(0, 3).map((item) => {
          const isActive = location.pathname === item.href || 
                          (item.href !== '/' && location.pathname.startsWith(item.href));
          
          return (
            <Button
              key={item.name}
              variant="ghost"
              size="icon"
              onClick={() => navigate(item.href)}
              className={cn(
                "text-muted-foreground",
                isActive && "text-primary bg-primary/10"
              )}
            >
              <item.icon className="h-5 w-5" />
            </Button>
          );
        })}
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onOpenSearch}
          className="text-muted-foreground"
        >
          <Search className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}