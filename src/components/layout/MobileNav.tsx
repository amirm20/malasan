import React from 'react';
import { useCart } from '../../context/CartContext';
import { toPersianDigits } from '../../lib/formatters';
import { Home, Store, ShoppingBag, Briefcase, User as UserIcon } from 'lucide-react';

interface MobileNavProps {
  currentRoute: string;
  onNavigate: (route: string, param?: string) => void;
  onOpenAuth: () => void;
  isLoggedIn: boolean;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentRoute,
  onNavigate,
  onOpenAuth,
  isLoggedIn,
}) => {
  const { itemCount } = useCart();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-4 py-2 flex items-center justify-around shadow-lg">
      <button
        onClick={() => onNavigate('home')}
        className={`flex flex-col items-center gap-1 text-[11px] font-bold ${
          currentRoute === 'home' ? 'text-rose-900' : 'text-stone-500'
        }`}
      >
        <Home className="w-5 h-5" />
        <span>خانه</span>
      </button>

      <button
        onClick={() => onNavigate('shop')}
        className={`flex flex-col items-center gap-1 text-[11px] font-bold ${
          currentRoute === 'shop' ? 'text-rose-900' : 'text-stone-500'
        }`}
      >
        <Store className="w-5 h-5" />
        <span>فروشگاه</span>
      </button>

      <button
        onClick={() => onNavigate('cart')}
        className={`relative flex flex-col items-center gap-1 text-[11px] font-bold ${
          currentRoute === 'cart' ? 'text-rose-900' : 'text-stone-500'
        }`}
      >
        <div className="relative">
          <ShoppingBag className="w-5 h-5" />
          {itemCount > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-rose-700 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
              {toPersianDigits(itemCount)}
            </span>
          )}
        </div>
        <span>سبد خرید</span>
      </button>

      <button
        onClick={() => onNavigate('wholesale')}
        className={`flex flex-col items-center gap-1 text-[11px] font-bold ${
          currentRoute === 'wholesale' ? 'text-amber-700' : 'text-stone-500'
        }`}
      >
        <Briefcase className="w-5 h-5" />
        <span>فروش عمده</span>
      </button>

      <button
        onClick={() => (isLoggedIn ? onNavigate('account') : onOpenAuth())}
        className={`flex flex-col items-center gap-1 text-[11px] font-bold ${
          currentRoute === 'account' ? 'text-rose-900' : 'text-stone-500'
        }`}
      >
        <UserIcon className="w-5 h-5" />
        <span>حساب من</span>
      </button>
    </div>
  );
};
