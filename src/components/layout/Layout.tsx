import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { MobileNavBar } from '@/components/common/MobileNavBar';
import { PullToRefresh } from '@/components/common/PullToRefresh';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);
  
  // Close sidebar when route changes
  useEffect(() => {
    closeSidebar();
  }, [location.pathname]);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // '/' key focuses search
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setSearchOpen(true);
      }
      
      // '?' key shows keyboard shortcuts
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        // This would trigger the keyboard shortcuts modal
        document.querySelector<HTMLButtonElement>('button[aria-label="Keyboard shortcuts"]')?.click();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleRefresh = async () => {
    // This would refresh the current page data
    console.log('Pull to refresh triggered');
    // Simulate a refresh delay
    await new Promise(resolve => setTimeout(resolve, 1500));
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Fixed width */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      
      {/* Main content - Fill remaining space */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header bar */}
        <Header onToggleSidebar={toggleSidebar} />
        
        {/* Page content - FULL WIDTH */}
        <div className="flex-1 overflow-auto">
          <PullToRefresh onRefresh={handleRefresh}>
            <div className="p-6 w-full">
              <Breadcrumbs />
              {children}
            </div>
          </PullToRefresh>
        </div>
        
        {/* Mobile Navigation Bar */}
        <MobileNavBar 
          onOpenSidebar={toggleSidebar} 
          onOpenSearch={() => setSearchOpen(true)} 
        />
      </main>
    </div>
  );
}