import React, { useState, useEffect } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { SettingsProvider } from './context/SettingsContext';

import { useAuth } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { MobileNav } from './components/layout/MobileNav';
import { AuthModal } from './components/common/AuthModal';
import { QuickViewModal } from './components/common/QuickViewModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ChatWidget } from './components/chat/ChatWidget';
import { Product } from './types';

// Views
import { HomeView } from './views/HomeView';
import { ShopView } from './views/ShopView';
import { ProductDetailView } from './views/ProductDetailView';
import { CartView } from './views/CartView';
import { CheckoutView } from './views/CheckoutView';
import { PaymentSimulatorView } from './views/PaymentSimulatorView';
import { OrderConfirmationView } from './views/OrderConfirmationView';
import { WholesaleView } from './views/WholesaleView';
import { AccountView } from './views/AccountView';
import { AdminView } from './views/AdminView';
import { AboutView } from './views/AboutView';
import { ContactView } from './views/ContactView';
import { BlogView } from './views/BlogView';
import { FaqView } from './views/FaqView';

function MainApp() {
  const { user } = useAuth();
  const isLoggedIn = !!user;

  // Navigation State
  const [currentRoute, setCurrentRoute] = useState<string>('home');
  const [routeParam, setRouteParam] = useState<string | undefined>(undefined);

  // Modal States
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Parse hash on initial mount & back/forward navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash) {
        setCurrentRoute('home');
        setRouteParam(undefined);
        return;
      }
      const parts = hash.split('/');
      setCurrentRoute(parts[0] || 'home');
      setRouteParam(parts[1] || undefined);
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (route: string, param?: string) => {
    setCurrentRoute(route);
    setRouteParam(param);
    if (param) {
      window.location.hash = `${route}/${param}`;
    } else {
      window.location.hash = route === 'home' ? '' : route;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 font-sans selection:bg-rose-800 selection:text-white pb-16 lg:pb-0">
      {/* Global Header */}
      <Header
        currentRoute={currentRoute}
        onNavigate={navigate}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentRoute === 'home' && (
          <HomeView
            onNavigate={navigate}
            onQuickView={(product) => setQuickViewProduct(product)}
          />
        )}

        {currentRoute === 'shop' && (() => {
          let initCat: string | undefined = undefined;
          let initSearch: string | undefined = undefined;
          if (routeParam) {
            if (routeParam.startsWith('category=')) {
              initCat = routeParam.replace('category=', '');
            } else if (routeParam.startsWith('search=')) {
              initSearch = decodeURIComponent(routeParam.replace('search=', ''));
            } else {
              initCat = routeParam;
            }
          }
          return (
            <ShopView
              initialCategory={initCat}
              initialSearch={initSearch}
              onNavigate={navigate}
              onQuickView={(product) => setQuickViewProduct(product)}
            />
          );
        })()}

        {currentRoute === 'product-detail' && routeParam && (
          <ProductDetailView
            slug={routeParam}
            onNavigate={navigate}
            onQuickView={(product) => setQuickViewProduct(product)}
          />
        )}

        {currentRoute === 'cart' && <CartView onNavigate={navigate} />}

        {currentRoute === 'checkout' && <CheckoutView onNavigate={navigate} />}

        {currentRoute === 'payment-gateway' && (
          <PaymentSimulatorView
            authority={routeParam || 'AUT-123456'}
            onNavigate={navigate}
          />
        )}

        {currentRoute === 'order-confirmation' && (
          <OrderConfirmationView
            orderId={routeParam || ''}
            onNavigate={navigate}
          />
        )}

        {currentRoute === 'wholesale' && <WholesaleView onNavigate={navigate} />}

        {currentRoute === 'about' && <AboutView onNavigate={navigate} />}

        {currentRoute === 'contact' && <ContactView />}

        {currentRoute === 'faq' && <FaqView onNavigate={navigate} />}

        {currentRoute === 'blog' && (
          <BlogView onNavigate={navigate} initialSlug={routeParam} />
        )}

        {currentRoute === 'account' && (
          <AccountView
            initialTab={routeParam}
            onNavigate={navigate}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}

        {currentRoute === 'admin' && (
          <AdminView initialTab={routeParam} onNavigate={navigate} />
        )}
      </main>

      {/* Global Footer */}
      <Footer onNavigate={navigate} />

      {/* Mobile Sticky Bottom Navigation */}
      <MobileNav
        currentRoute={currentRoute}
        onNavigate={navigate}
        onOpenAuth={() => setIsAuthOpen(true)}
        isLoggedIn={isLoggedIn}
      />

      {/* Global Customer Live Chat Widget */}
      {currentRoute !== 'admin' && <ChatWidget onNavigate={navigate} />}

      {/* Common Modals */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onViewDetails={(slug) => {
            setQuickViewProduct(null);
            navigate('product-detail', slug);
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <SettingsProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <MainApp />
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </SettingsProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
