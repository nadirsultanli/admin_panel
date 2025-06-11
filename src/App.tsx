import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { Customers } from '@/pages/Customers';
import { CustomerDetail } from '@/pages/CustomerDetail';
import { Products } from '@/pages/Products';
import { ProductDetail } from '@/pages/ProductDetail';
import { Orders } from '@/pages/Orders';
import { OrderDetail } from '@/pages/OrderDetail';
import { Inventory } from '@/pages/Inventory';
import { Toaster } from '@/components/ui/sonner';
import { KeyboardShortcutsHelp } from '@/components/common/KeyboardShortcutsHelp';
import { ErrorBoundary } from '@/lib/errorBoundary';
import { useEffect } from 'react';
import { initAnalytics, trackPageView } from '@/lib/analytics';
import './App.css';

function App() {
  // Initialize analytics
  useEffect(() => {
    initAnalytics();
  }, []);

  // Track page views
  useEffect(() => {
    const handleRouteChange = () => {
      trackPageView(window.location.pathname);
    };

    // Track initial page view
    handleRouteChange();

    // Set up listener for route changes
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/inventory" element={<Inventory />} />
          </Routes>
        </Layout>
        <Toaster position="top-right" />
        <KeyboardShortcutsHelp />
      </Router>
    </ErrorBoundary>
  );
}

export default App;