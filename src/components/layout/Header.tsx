import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useSettings } from '../../context/SettingsContext';
import { Product, Category } from '../../types';
import { formatPrice, toPersianDigits } from '../../lib/formatters';
import {
  Search,
  ShoppingBag,
  Heart,
  User as UserIcon,
  Menu,
  X,
  PhoneCall,
  ShieldCheck,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Package,
  Sparkles,
  Headphones,
} from 'lucide-react';

interface HeaderProps {
  currentRoute: string;
  onNavigate: (route: string, param?: string) => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentRoute, onNavigate, onOpenAuth }) => {
  const { user, logout, isAdmin, isSuperAdmin, hasPermission } = useAuth();
  const { itemCount } = useCart();
  const { wishlist } = useWishlist();
  const { settings } = useSettings();

  const canAccessChatDesk = Boolean(
    user &&
    (user.role === 'Admin' || user.role === 'SuperAdmin') &&
    (isSuperAdmin || hasPermission('chat'))
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [unansweredChatCount, setUnansweredChatCount] = useState<number>(0);

  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Unanswered chat count polling for authorized staff only
  useEffect(() => {
    if (!canAccessChatDesk) {
      setUnansweredChatCount(0);
      return;
    }

    const fetchChatCount = () => {
      fetch('/api/chat/unanswered-count')
        .then((r) => r.json())
        .then((data) => {
          if (data && typeof data.unansweredCount === 'number') {
            setUnansweredChatCount(data.unansweredCount);
          }
        })
        .catch(() => {});
    };

    fetchChatCount();
    const interval = setInterval(fetchChatCount, 5000);
    return () => clearInterval(interval);
  }, [canAccessChatDesk]);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => setCategories(data))
      .catch(() => {});
  }, []);

  // Search autocomplete
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const delay = setTimeout(() => {
        fetch(`/api/products?search=${encodeURIComponent(searchQuery)}`)
          .then((r) => r.json())
          .then((data) => {
            setSearchResults(data.slice(0, 5));
            setIsSearchOpen(true);
          })
          .catch(() => {});
      }, 200);
      return () => clearTimeout(delay);
    } else {
      setSearchResults([]);
      setIsSearchOpen(false);
    }
  }, [searchQuery]);

  // Click outside listener for search & user menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      onNavigate('shop', `search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      {/* Top Banner */}
      {(settings.isAnnouncementActive ?? true) && (
        <div className="bg-rose-950 text-rose-100 text-xs py-2 px-4 transition-all">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-rose-800 text-white font-bold px-2 py-0.5 rounded-sm text-[11px]">
                پیشنهاد ویژه
              </span>
              <span>
                {settings.announcementBarText || 'ارسال رایگان برای خریدهای بالای ۴۰۰,۰۰۰ تومان به سراسر کشور'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-rose-200">
              <a
                href={`tel:${(settings.supportPhone || '02188992211').replace(/[^0-9]/g, '')}`}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span className="hidden md:inline">مشاوره و پشتیبانی:</span>
                <span className="font-mono dir-ltr text-xs">{settings.supportPhone || '۰۲۱-۸۸۹۹۲۲۱۱'}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Mobile menu toggle button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 text-stone-700 hover:text-rose-900 rounded-xl hover:bg-stone-100"
          title="منوی اصلی"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Brand Logo */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-rose-700 to-rose-950 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md group-hover:scale-105 transition-transform">
            {settings.brandName ? settings.brandName.trim().charAt(0) : 'م'}
          </div>
          <div>
            <span className="font-black text-xl text-stone-900 tracking-tight block">
              {settings.brandName || 'ملس‌بان'}
            </span>
            <span className="text-[10px] text-rose-800 font-bold block -mt-1 tracking-wider">
              {settings.tagline || 'طعم اصیل لواشک ارگانیک'}
            </span>
          </div>
        </div>

        {/* Search Bar with live autocomplete */}
        <div ref={searchRef} className="relative flex-1 max-w-lg hidden sm:block">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setIsSearchOpen(true)}
                placeholder="جستجوی نام محصول، طعم یا میوه (مثلاً: انار ساوه، ترش، آلو...)"
                className="w-full bg-stone-100/90 hover:bg-stone-100 focus:bg-white border border-stone-200 focus:border-rose-700 rounded-2xl pr-11 pl-4 py-2 text-sm text-stone-800 placeholder-stone-400 outline-hidden transition-all shadow-inner"
              />
              <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-3" />
            </div>
          </form>

          {/* Autocomplete Dropdown */}
          {isSearchOpen && searchResults.length > 0 && (
            <div className="absolute top-full right-0 left-0 mt-2 bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden z-[60] animate-in fade-in">
              <div className="p-2 border-b border-stone-100 bg-stone-50 text-xs font-bold text-stone-500">
                نتایج پیشنهادی:
              </div>
              <div className="divide-y divide-stone-100">
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                      onNavigate('product-detail', item.slug);
                    }}
                    className="p-3 flex items-center gap-3 hover:bg-rose-50/50 cursor-pointer transition-colors"
                  >
                    <img
                      src={item.mainImage}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-xl shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-stone-800 truncate">{item.name}</p>
                      <p className="text-xs text-rose-800 font-bold">
                        {formatPrice(item.discountPrice ?? item.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleSearchSubmit}
                className="w-full text-center py-2.5 text-xs text-rose-800 font-bold hover:bg-stone-50 border-t border-stone-100"
              >
                مشاهده تمام نتایج جستجو &larr;
              </button>
            </div>
          )}
        </div>

        {/* Header Actions: User, Wishlist, Cart */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Wishlist Button */}
          <button
            onClick={() => onNavigate('account', 'tab=wishlist')}
            className="relative p-2.5 rounded-xl text-stone-700 hover:text-rose-800 hover:bg-stone-100 transition-colors"
            title="علاقه‌مندی‌ها"
          >
            <Heart className="w-5 h-5" />
            {wishlist.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-rose-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                {toPersianDigits(wishlist.length)}
              </span>
            )}
          </button>

          {/* Cart Button */}
          <button
            onClick={() => onNavigate('cart')}
            className="relative flex items-center gap-2 bg-rose-50 hover:bg-rose-100/80 text-rose-900 border border-rose-200 px-3.5 py-2 rounded-2xl transition-all shadow-xs"
            title="سبد خرید"
          >
            <ShoppingBag className="w-5 h-5 text-rose-800" />
            <span className="hidden md:inline text-xs font-bold">سبد خرید</span>
            {itemCount > 0 && (
              <span className="bg-rose-800 text-white text-xs font-black px-2 py-0.5 rounded-full">
                {toPersianDigits(itemCount)}
              </span>
            )}
          </button>

          {/* User Account Button / Dropdown */}
          <div ref={userMenuRef} className="relative">
            {user ? (
              <div>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 border border-stone-200 hover:border-rose-700 bg-stone-50 px-3 py-2 rounded-2xl text-xs font-bold text-stone-800 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-rose-800 text-white flex items-center justify-center text-xs">
                    {user.name.charAt(0)}
                  </div>
                  <span className="max-w-[100px] truncate">{user.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute left-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-[60] animate-in fade-in">
                    <div className="px-4 py-2 border-b border-stone-100 text-xs">
                      <p className="font-bold text-stone-900">{user.name} {user.family}</p>
                      <p className="text-stone-400 truncate">{user.mobile || user.email}</p>
                    </div>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onNavigate('admin');
                        }}
                        className="w-full text-right px-4 py-2 text-xs font-bold text-amber-900 hover:bg-amber-50 flex items-center gap-2"
                      >
                        <LayoutDashboard className="w-4 h-4 text-amber-600" />
                        <span>پنل مدیریت فروشگاه</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onNavigate('account');
                      }}
                      className="w-full text-right px-4 py-2 text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                    >
                      <UserIcon className="w-4 h-4 text-stone-400" />
                      <span>حساب کاربری من</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onNavigate('account', 'tab=orders');
                      }}
                      className="w-full text-right px-4 py-2 text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                    >
                      <Package className="w-4 h-4 text-stone-400" />
                      <span>سفارش‌های من</span>
                    </button>

                    <div className="border-t border-stone-100 my-1"></div>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-right px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>خروج از حساب</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-xs"
              >
                <UserIcon className="w-4 h-4" />
                <span>ورود / ثبت‌نام</span>
              </button>
            )}
          </div>

          {/* Live Chat Desk Button - Exactly next to Profile button, only for authorized staff */}
          {canAccessChatDesk && (
            <button
              type="button"
              onClick={() => onNavigate('admin', 'chat')}
              className="relative flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-rose-900 to-stone-900 hover:from-rose-800 hover:to-stone-800 text-white px-2.5 sm:px-3 py-2 rounded-2xl text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer border border-rose-800/40 select-none group"
              title="مرکز گفتگوی زنده"
            >
              <div className="relative">
                <Headphones className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
              <span className="font-bold">مرکز گفتگوی زنده</span>
              {unansweredChatCount > 0 && (
                <span className="bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.5 min-w-4 text-center rounded-full shadow-xs animate-pulse ring-1 ring-white/50">
                  {toPersianDigits(unansweredChatCount)}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Desktop Navigation Links */}
      <nav className="hidden lg:block bg-stone-50/70 border-t border-stone-200/60">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          <ul className="flex items-center gap-8 text-sm font-bold text-stone-700 py-3">
            <li>
              <button
                onClick={() => onNavigate('home')}
                className={`transition-colors hover:text-rose-900 ${
                  currentRoute === 'home' ? 'text-rose-900 font-black' : ''
                }`}
              >
                صفحه اصلی
              </button>
            </li>

            {/* Categories dropdown */}
            <li
              className="relative"
              onMouseEnter={() => setIsCatDropdownOpen(true)}
              onMouseLeave={() => setIsCatDropdownOpen(false)}
            >
              <button
                onClick={() => onNavigate('shop')}
                className="flex items-center gap-1 hover:text-rose-900 transition-colors py-1"
              >
                <span>دسته‌بندی‌ها</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {isCatDropdownOpen && (
                <div className="absolute top-full right-0 w-64 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-[60] animate-in fade-in">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setIsCatDropdownOpen(false);
                        onNavigate('shop', `category=${cat.id}`);
                      }}
                      className="w-full text-right px-4 py-2.5 text-xs text-stone-700 hover:bg-rose-50 hover:text-rose-900 flex items-center justify-between transition-colors"
                    >
                      <span className="font-bold">{cat.name}</span>
                      <span className="text-[10px] text-stone-400">{cat.description?.slice(0, 24)}...</span>
                    </button>
                  ))}
                  <div className="border-t border-stone-100 my-1"></div>
                  <button
                    onClick={() => {
                      setIsCatDropdownOpen(false);
                      onNavigate('shop');
                    }}
                    className="w-full text-center py-2 text-xs font-black text-rose-800 hover:underline"
                  >
                    مشاهده تمام محصولات &larr;
                  </button>
                </div>
              )}
            </li>

            <li>
              <button
                onClick={() => onNavigate('shop')}
                className={`transition-colors hover:text-rose-900 ${
                  currentRoute === 'shop' ? 'text-rose-900 font-black' : ''
                }`}
              >
                فروشگاه لواشک
              </button>
            </li>

            <li>
              <button
                onClick={() => onNavigate('wholesale')}
                className="flex items-center gap-1.5 transition-colors hover:text-rose-900 text-amber-800"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span>فروش عمده و همکاران</span>
              </button>
            </li>

            <li>
              <button
                onClick={() => onNavigate('blog')}
                className={`transition-colors hover:text-rose-900 ${
                  currentRoute === 'blog' ? 'text-rose-900 font-black' : ''
                }`}
              >
                مقالات و دانستنی‌ها
              </button>
            </li>

            <li>
              <button
                onClick={() => onNavigate('about')}
                className={`transition-colors hover:text-rose-900 ${
                  currentRoute === 'about' ? 'text-rose-900 font-black' : ''
                }`}
              >
                درباره ما
              </button>
            </li>

            <li>
              <button
                onClick={() => onNavigate('contact')}
                className={`transition-colors hover:text-rose-900 ${
                  currentRoute === 'contact' ? 'text-rose-900 font-black' : ''
                }`}
              >
                تماس با ما
              </button>
            </li>

            <li>
              <button
                onClick={() => onNavigate('faq')}
                className={`transition-colors hover:text-rose-900 ${
                  currentRoute === 'faq' ? 'text-rose-900 font-black' : ''
                }`}
              >
                سؤالات متداول
              </button>
            </li>
          </ul>

          <div className="flex items-center gap-2 text-xs text-emerald-800 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/70">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>ضمانت ۱۰۰٪ تازگی و ارگانیک بودن</span>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-200 bg-white px-4 py-5 shadow-xl animate-in slide-in-from-top-4">
          <div className="mb-4">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجوی محصول یا طعم..."
                  className="w-full bg-stone-100 rounded-xl pr-10 pl-4 py-2.5 text-sm text-stone-800"
                />
                <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-3.5" />
              </div>
            </form>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('home');
              }}
              className="w-full text-right py-2.5 px-3 rounded-xl text-sm font-bold text-stone-800 hover:bg-stone-100"
            >
              صفحه اصلی
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('shop');
              }}
              className="w-full text-right py-2.5 px-3 rounded-xl text-sm font-bold text-stone-800 hover:bg-stone-100"
            >
              فروشگاه و محصولات
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('wholesale');
              }}
              className="w-full text-right py-2.5 px-3 rounded-xl text-sm font-bold text-amber-900 bg-amber-50"
            >
              فروش ویژه عمده و همکاری
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('blog');
              }}
              className="w-full text-right py-2.5 px-3 rounded-xl text-sm font-bold text-stone-800 hover:bg-stone-100"
            >
              وبلاگ و مقالات
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('about');
              }}
              className="w-full text-right py-2.5 px-3 rounded-xl text-sm font-bold text-stone-800 hover:bg-stone-100"
            >
              درباره ملس‌بان
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('contact');
              }}
              className="w-full text-right py-2.5 px-3 rounded-xl text-sm font-bold text-stone-800 hover:bg-stone-100"
            >
              تماس با ما
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('faq');
              }}
              className="w-full text-right py-2.5 px-3 rounded-xl text-sm font-bold text-stone-800 hover:bg-stone-100"
            >
              پرسش‌های متداول
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
