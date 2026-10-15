import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem } from '../types';
import { useToast } from './ToastContext';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  total: number;
  couponCode: string | null;
  freeShippingThreshold: number;
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('malasban_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [couponCode, setCouponCode] = useState<string | null>(() => {
    return localStorage.getItem('malasban_coupon_code');
  });
  const [discountAmount, setDiscountAmount] = useState<number>(() => {
    const saved = localStorage.getItem('malasban_discount_amount');
    return saved ? Number(saved) : 0;
  });

  const { showToast } = useToast();
  const freeShippingThreshold = 400000; // 400,000 Tomans
  const standardShipping = 45000;

  useEffect(() => {
    localStorage.setItem('malasban_cart', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (couponCode) {
      localStorage.setItem('malasban_coupon_code', couponCode);
      localStorage.setItem('malasban_discount_amount', String(discountAmount));
    } else {
      localStorage.removeItem('malasban_coupon_code');
      localStorage.removeItem('malasban_discount_amount');
    }
  }, [couponCode, discountAmount]);

  const addToCart = (product: Product, quantity = 1) => {
    const existing = items.find((item) => item.product.id === product.id);
    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty > product.stockQuantity) {
        showToast(`متأسفانه فقط ${product.stockQuantity} عدد از این محصول در انبار موجود است.`, 'error');
        return;
      }
      setItems((prev) =>
        prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        )
      );
      showToast(`تعداد «${product.name}» به ${newQty} افزایش یافت.`, 'success');
    } else {
      if (quantity > product.stockQuantity) {
        showToast(`موجودی این محصول ناکافی است.`, 'error');
        return;
      }
      setItems((prev) => [...prev, { product, quantity }]);
      showToast(`«${product.name}» به سبد خرید اضافه شد.`, 'success');
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const target = items.find((item) => item.product.id === productId);
    if (target && quantity > target.product.stockQuantity) {
      showToast(`حداکثر موجودی قابل سفارش ${target.product.stockQuantity} عدد است.`, 'info');
      setItems((prev) =>
        prev.map((item) =>
          item.product.id === productId ? { ...item, quantity: target.product.stockQuantity } : item
        )
      );
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    const target = items.find((item) => item.product.id === productId);
    if (target) {
      showToast(`«${target.product.name}» از سبد خرید حذف شد.`, 'info');
    }
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
    setCouponCode(null);
    setDiscountAmount(0);
  };

  const subtotal = items.reduce((sum, item) => {
    const price = item.product.discountPrice ?? item.product.price;
    return sum + price * item.quantity;
  }, 0);

  const shippingFee = subtotal === 0 || subtotal >= freeShippingThreshold ? 0 : standardShipping;
  const total = Math.max(0, subtotal - discountAmount + shippingFee);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const applyCoupon = async (code: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('malasban_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ code, cartTotal: subtotal }),
      });
      const data = await res.json();
      if (data.valid) {
        setCouponCode(code);
        setDiscountAmount(data.discount);
        showToast(data.message, 'success');
        return true;
      } else {
        showToast(data.message || 'کد تخفیف نامعتبر است', 'error');
        return false;
      }
    } catch {
      showToast('خطا در اعتبارسنجی کد تخفیف', 'error');
      return false;
    }
  };

  const removeCoupon = () => {
    setCouponCode(null);
    setDiscountAmount(0);
    showToast('کد تخفیف حذف شد.', 'info');
  };

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        shippingFee,
        discountAmount,
        total,
        couponCode,
        freeShippingThreshold,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
