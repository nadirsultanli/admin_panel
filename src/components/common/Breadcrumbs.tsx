import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import { Home, ChevronRight } from 'lucide-react';

interface BreadcrumbsProps {
  currentPageName?: string;
  items?: Array<{
    name: string;
    href: string;
    icon?: React.ReactNode;
  }>;
}

export function Breadcrumbs({ currentPageName, items }: BreadcrumbsProps) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // If we're on the dashboard, don't show breadcrumbs
  if (location.pathname === '/') {
    return null;
  }
  
  // If items are provided, use them directly
  if (items) {
    return (
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink 
              onClick={() => navigate('/')}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <Home className="h-4 w-4" />
              <span>Dashboard</span>
            </BreadcrumbLink>
          </BreadcrumbItem>
          
          {items.map((item, index) => (
            <React.Fragment key={item.href}>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              
              {index === items.length - 1 ? (
                <BreadcrumbItem>
                  <BreadcrumbPage className="flex items-center gap-1">
                    {item.icon}
                    <span>{item.name}</span>
                  </BreadcrumbPage>
                </BreadcrumbItem>
              ) : (
                <BreadcrumbItem>
                  <BreadcrumbLink 
                    onClick={() => navigate(item.href)}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              )}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    );
  }
  
  // Otherwise, generate breadcrumbs based on the current path
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  // Map path segments to readable names
  const segmentNames: Record<string, string> = {
    customers: 'Customers',
    products: 'Products',
    orders: 'Orders',
    inventory: 'Inventory'
  };
  
  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink 
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <Home className="h-4 w-4" />
            <span>Dashboard</span>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {pathSegments.map((segment, index) => {
          // Skip numeric IDs in the path for the link generation
          const isLastSegment = index === pathSegments.length - 1;
          const isNumeric = !isNaN(Number(segment));
          
          // If it's an ID and we have a current page name, use that
          if (isLastSegment && isNumeric && currentPageName) {
            return (
              <React.Fragment key={segment}>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage>{currentPageName}</BreadcrumbPage>
                </BreadcrumbItem>
              </React.Fragment>
            );
          }
          
          // Skip numeric segments in the breadcrumb
          if (isNumeric) return null;
          
          const segmentName = segmentNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
          const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
          
          return (
            <React.Fragment key={segment}>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              
              {isLastSegment ? (
                <BreadcrumbItem>
                  <BreadcrumbPage>{segmentName}</BreadcrumbPage>
                </BreadcrumbItem>
              ) : (
                <BreadcrumbItem>
                  <BreadcrumbLink 
                    onClick={() => navigate(href)}
                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {segmentName}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              )}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}