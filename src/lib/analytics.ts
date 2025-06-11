/**
 * Simple analytics tracking for the application
 * In production, you would replace this with a real analytics service
 */

import { logger } from './logger';

// Types of events we want to track
type EventType = 
  | 'page_view'
  | 'order_created'
  | 'order_updated'
  | 'order_delivered'
  | 'customer_created'
  | 'product_viewed'
  | 'search'
  | 'error'
  | 'login'
  | 'logout';

interface EventProperties {
  [key: string]: string | number | boolean | null | undefined;
}

// Only enable in production or when explicitly enabled
const isAnalyticsEnabled = 
  import.meta.env.PROD || 
  import.meta.env.VITE_ENABLE_ANALYTICS === 'true';

/**
 * Track an event
 */
export function trackEvent(
  eventType: EventType, 
  properties?: EventProperties
) {
  if (!isAnalyticsEnabled) return;
  
  try {
    // In a real app, you would send this to your analytics service
    // For now, we'll just log it
    logger.info(`ANALYTICS EVENT: ${eventType}`, { 
      context: 'Analytics',
      data: properties
    });
    
    // Example of how you might send to a real service:
    // if (window.gtag) {
    //   window.gtag('event', eventType, properties);
    // }
    
    // Or for a custom endpoint:
    // fetch('/api/analytics', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ eventType, properties, timestamp: new Date().toISOString() })
    // });
  } catch (error) {
    // Don't let analytics errors break the app
    logger.error('Failed to track analytics event', { 
      context: 'Analytics',
      data: { eventType, error }
    });
  }
}

/**
 * Track page view
 */
export function trackPageView(pageName: string, pageProps?: EventProperties) {
  trackEvent('page_view', {
    page_name: pageName,
    page_url: window.location.pathname,
    ...pageProps
  });
}

/**
 * Initialize analytics
 */
export function initAnalytics() {
  if (!isAnalyticsEnabled) return;
  
  // Set up page view tracking
  trackPageView('app_loaded');
  
  // Track performance metrics
  if (window.performance) {
    const perfData = window.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    
    trackEvent('performance', {
      page_load_time_ms: pageLoadTime,
      dns_time_ms: perfData.domainLookupEnd - perfData.domainLookupStart,
      tcp_connect_time_ms: perfData.connectEnd - perfData.connectStart,
      server_response_time_ms: perfData.responseEnd - perfData.requestStart,
      dom_load_time_ms: perfData.domComplete - perfData.domLoading
    });
  }
  
  logger.info('Analytics initialized', { context: 'Analytics' });
}