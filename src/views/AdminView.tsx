import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Product, Order, Category, WholesaleRequest, Coupon, User, BlogPost, Review } from '../types';
import {
  formatPrice,
  formatWeight,
  toPersianDigits,
  formatDateFa,
  getOrderStatusText,
  getOrderStatusBadge,
  getPaymentStatusText,
  getPaymentStatusBadge,
} from '../lib/formatters';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Briefcase,
  Layers,
  Tag,
  Users,
  BookOpen,
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  Check,
  X,
  AlertTriangle,
  TrendingUp,
  Settings,
  Star,
  DollarSign,
  ArrowUpRight,
  ChevronLeft,
  Store,
  Menu,
  Truck,
  ArrowUpDown,
  SlidersHorizontal,
  Archive,
  Inbox,
  RotateCcw,
  Headphones,
} from 'lucide-react';
import { WholesaleTab } from '../components/admin/WholesaleTab';
import { BlogTab } from '../components/admin/BlogTab';
import { SettingsTab } from '../components/admin/SettingsTab';
import { ReviewsTab } from '../components/admin/ReviewsTab';
import { CategoriesTab } from '../components/admin/CategoriesTab';
import { CouponsTab } from '../components/admin/CouponsTab';
import { StaffUsersTab } from '../components/admin/StaffUsersTab';
import { CustomersTab } from '../components/admin/CustomersTab';
import { ChatTab } from '../components/admin/ChatTab';
import { ImageUploadField } from '../components/common/ImageUploadField';
import { AnalyticsCharts } from '../components/admin/AnalyticsCharts';
import { ShieldCheck, UserCheck } from 'lucide-react';

interface AdminViewProps {
  onNavigate: (route: string, param?: string) => void;
  initialTab?: string;
}

export const AdminView: React.FC<AdminViewProps> = ({ onNavigate, initialTab }) => {
  const { user, token, isAdmin, isSuperAdmin, hasPermission } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'products'
    | 'orders'
    | 'wholesale'
    | 'reviews'
    | 'categories'
    | 'coupons'
    | 'customers'
    | 'staff'
    | 'blog'
    | 'settings'
    | 'chat'
  >(initialTab === 'chat' ? 'chat' : 'overview');

  const [unansweredChatCount, setUnansweredChatCount] = useState<number>(0);
  const [activeChatCount, setActiveChatCount] = useState<number>(3);

  // Sync initialTab when routeParam changes
  useEffect(() => {
    if (initialTab && [
      'overview', 'products', 'orders', 'wholesale', 'reviews',
      'categories', 'coupons', 'customers', 'staff', 'blog', 'settings', 'chat'
    ].includes(initialTab)) {
      setActiveTab(initialTab as any);
    }
  }, [initialTab]);

  // Polling for live unanswered chat count badge
  useEffect(() => {
    const fetchChatStats = () => {
      fetch('/api/chat/unanswered-count')
        .then((r) => r.json())
        .then((data) => {
          if (data && typeof data.unansweredCount === 'number') {
            setUnansweredChatCount(data.unansweredCount);
          }
          if (data && typeof data.activeCount === 'number') {
            setActiveChatCount(data.activeCount);
          }
        })
        .catch(() => {});
    };

    fetchChatStats();
    const interval = setInterval(fetchChatStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // Mobile sidebar toggle
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Stats
  const [stats, setStats] = useState<any>(null);

  // Entities
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wholesaleRequests, setWholesaleRequests] = useState<WholesaleRequest[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [reviewsList, setReviewsList] = useState<Review[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [recentlyChangedOrderId, setRecentlyChangedOrderId] = useState<string | null>(null);

  // Products Tab: Filter & Sort state
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('');
  const [productStockFilter, setProductStockFilter] = useState<
    'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'discounted' | 'wholesale'
  >('all');
  const [productSortBy, setProductSortBy] = useState<
    'newest' | 'price_asc' | 'price_desc' | 'stock_desc' | 'stock_asc' | 'name'
  >('newest');

  // Online Orders Tab: Main Tab (Open/Closed/All), Sub-filter & Sort state
  const [orderMainTab, setOrderMainTab] = useState<'open' | 'closed' | 'all'>('open');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderSubStatusFilter, setOrderSubStatusFilter] = useState('');
  const [orderSortBy, setOrderSortBy] = useState<
    'newest' | 'oldest' | 'amount_desc' | 'amount_asc' | 'items_desc' | 'customer_name'
  >('newest');

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Product Form state
  const [pName, setPName] = useState('');
  const [pSlug, setPSlug] = useState('');
  const [pCategory, setPCategory] = useState('');
  const [pPrice, setPPrice] = useState(0);
  const [pDiscountPrice, setPDiscountPrice] = useState<number | undefined>(undefined);
  const [pStock, setPStock] = useState(10);
  const [pWeight, setPWeight] = useState(300);
  const [pSourness, setPSourness] = useState<any>('SweetSour');
  const [pShortDesc, setPShortDesc] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pMainImage, setPMainImage] = useState('');
  const [pIsWholesale, setPIsWholesale] = useState(true);

  // Coupon Form state
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState<'Percent' | 'FixedAmount'>('Percent');
  const [couponValue, setCouponValue] = useState(10);
  const [couponMinOrder, setCouponMinOrder] = useState(100000);
  const [couponFirstOrderOnly, setCouponFirstOrderOnly] = useState(false);

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchAdminData = () => {
    if (!token) return;
    const authHeader = { Authorization: `Bearer ${token}` };

    // Stats
    fetch('/api/admin/stats', { headers: authHeader })
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => {});

    // Products
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => setProducts(data))
      .catch(() => {});

    // Categories
    fetch('/api/categories?all=true', { headers: authHeader })
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {
        fetch('/api/categories')
          .then((r) => r.json())
          .then((data) => setCategories(Array.isArray(data) ? data : []))
          .catch(() => {});
      });

    // Orders
    fetch('/api/admin/orders', { headers: authHeader })
      .then((r) => r.json())
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => {});

    // Wholesale
    fetch('/api/admin/wholesale', { headers: authHeader })
      .then((r) => r.json())
      .then((data) => setWholesaleRequests(Array.isArray(data) ? data : []))
      .catch(() => {});

    // Coupons
    fetch('/api/coupons', { headers: authHeader })
      .then((r) => r.json())
      .then((data) => setCoupons(Array.isArray(data) ? data : []))
      .catch(() => {});

    // Users
    fetch('/api/admin/users', { headers: authHeader })
      .then((r) => r.json())
      .then((data) => setUsersList(Array.isArray(data) ? data : []))
      .catch(() => {});

    // Reviews
    fetch('/api/reviews', { headers: authHeader })
      .then((r) => r.json())
      .then((data) => setReviewsList(Array.isArray(data) ? data : []))
      .catch(() => {});

    // Blog
    fetch('/api/admin/blog', { headers: authHeader })
      .then((r) => r.json())
      .then((data) => setBlogPosts(Array.isArray(data) ? data : []))
      .catch(() => {
        fetch('/api/blog')
          .then((r) => r.json())
          .then((data) => setBlogPosts(Array.isArray(data) ? data : []))
          .catch(() => {});
      });
  };

  useEffect(() => {
    fetchAdminData();
  }, [token]);

  // Handle Order Status change
  const handleOrderStatusChange = async (orderId: string, newStatus: string) => {
    // Immediate optimistic UI update so colored circle and icon flip instantly
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as any } : o))
    );
    setRecentlyChangedOrderId(orderId);
    setTimeout(() => {
      setRecentlyChangedOrderId((curr) => (curr === orderId ? null : curr));
    }, 3500);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showToast(`وضعیت سفارش به «${getOrderStatusText(newStatus)}» تغییر یافت`, 'success');
        fetchAdminData();
      } else {
        showToast('خطا در بروزرسانی سفارش در سرور', 'error');
        fetchAdminData();
      }
    } catch {
      showToast('خطا در بروزرسانی سفارش', 'error');
      fetchAdminData();
    }
  };

  // Render colored circle with icon for order status (pure circle without text by default)
  const renderOrderStatusCircle = (
    status: string,
    isRecentlyChanged = false,
    showText = false
  ) => {
    let circleBg = 'bg-amber-500';
    let ringColor = 'ring-amber-200';
    let containerStyle = 'bg-amber-50 text-amber-900 border-amber-200';
    let icon = <Clock className="w-3.5 h-3.5 stroke-[2.5]" />;

    switch (status) {
      case 'Delivered':
        circleBg = 'bg-emerald-600';
        ringColor = 'ring-emerald-200';
        containerStyle = 'bg-emerald-50 text-emerald-900 border-emerald-300';
        icon = <Check className="w-3.5 h-3.5 stroke-[3]" />;
        break;
      case 'Shipped':
        circleBg = 'bg-blue-600';
        ringColor = 'ring-blue-200';
        containerStyle = 'bg-blue-50 text-blue-900 border-blue-300';
        icon = <Truck className="w-3.5 h-3.5 stroke-[2.5]" />;
        break;
      case 'Processing':
        circleBg = 'bg-purple-600';
        ringColor = 'ring-purple-200';
        containerStyle = 'bg-purple-50 text-purple-900 border-purple-300';
        icon = <Package className="w-3.5 h-3.5 stroke-[2.5]" />;
        break;
      case 'Paid':
        circleBg = 'bg-teal-600';
        ringColor = 'ring-teal-200';
        containerStyle = 'bg-teal-50 text-teal-900 border-teal-300';
        icon = <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />;
        break;
      case 'Cancelled':
        circleBg = 'bg-rose-600';
        ringColor = 'ring-rose-200';
        containerStyle = 'bg-rose-50 text-rose-900 border-rose-300';
        icon = <X className="w-3.5 h-3.5 stroke-[3]" />;
        break;
      case 'Pending':
      default:
        circleBg = 'bg-amber-500';
        ringColor = 'ring-amber-200';
        containerStyle = 'bg-amber-50 text-amber-900 border-amber-300';
        icon = <Clock className="w-3.5 h-3.5 stroke-[2.5]" />;
        break;
    }

    if (!showText) {
      return (
        <span
          className={`w-7 h-7 rounded-full ${circleBg} text-white flex items-center justify-center shrink-0 shadow-xs ring-2 ${ringColor} transition-all duration-300 ${
            isRecentlyChanged ? 'ring-4 ring-amber-400 scale-110 shadow-md animate-bounce' : ''
          }`}
          title={`وضعیت: ${getOrderStatusText(status)}`}
        >
          {icon}
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black border transition-all duration-300 ${containerStyle} ${
          isRecentlyChanged
            ? 'ring-4 ring-amber-400/80 scale-105 shadow-md shadow-amber-500/20'
            : 'shadow-2xs'
        }`}
      >
        <span
          className={`w-5 h-5 rounded-full ${circleBg} text-white flex items-center justify-center shrink-0 shadow-xs ring-2 ${ringColor} ${
            isRecentlyChanged ? 'animate-pulse' : ''
          }`}
        >
          {icon}
        </span>
        <span className="whitespace-nowrap">{getOrderStatusText(status)}</span>
      </span>
    );
  };

  // Handle Wholesale Status change
  const handleWholesaleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/wholesale/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showToast('وضعیت درخواست عمده بروزرسانی شد', 'success');
        fetchAdminData();
      }
    } catch {
      showToast('خطا در تغییر وضعیت', 'error');
    }
  };

  // Handle Product Save (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: pName,
      slug: pSlug || `lavashak-${Date.now()}`,
      categoryId: pCategory || categories[0]?.id || 'cat-anar',
      price: Number(pPrice),
      discountPrice: pDiscountPrice ? Number(pDiscountPrice) : undefined,
      stockQuantity: Number(pStock),
      weightGrams: Number(pWeight),
      sournessLevel: pSourness,
      shortDescription: pShortDesc,
      description: pDesc,
      mainImage:
        pMainImage ||
        'https://images.unsplash.com/photo-1541344999736-83eca872f242?w=800&q=80',
      images: [
        pMainImage ||
          'https://images.unsplash.com/photo-1541344999736-83eca872f242?w=800&q=80',
      ],
      ingredients: ['پوره طبیعی میوه', 'عصاره ارگانیک', 'نمک کم'],
      isWholesaleAvailable: pIsWholesale,
    };

    try {
      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast(
          editingProduct ? 'محصول بروزرسانی شد' : 'محصول جدید با موفقیت ایجاد شد',
          'success'
        );
        setShowProductModal(false);
        setEditingProduct(null);
        fetchAdminData();
      }
    } catch {
      showToast('خطا در ذخیره محصول', 'error');
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('آیا از حذف این محصول اطمینان دارید؟')) return;
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast('محصول حذف شد', 'info');
        fetchAdminData();
      }
    } catch {
      showToast('خطا در حذف محصول', 'error');
    }
  };

  // Create coupon
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: couponCode.trim().toUpperCase(),
          type: couponType,
          value: Number(couponValue),
          minOrderAmount: Number(couponMinOrder),
          usageLimit: 500,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 90 * 86400000).toISOString(),
          firstOrderOnly: couponFirstOrderOnly,
        }),
      });
      if (res.ok) {
        showToast('کد تخفیف جدید ایجاد شد', 'success');
        setShowCouponModal(false);
        setCouponCode('');
        setCouponFirstOrderOnly(false);
        fetchAdminData();
      }
    } catch {
      showToast('خطا در ایجاد کد تخفیف', 'error');
    }
  };

  // Open edit product modal
  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setPName(p.name);
    setPSlug(p.slug);
    setPCategory(p.categoryId);
    setPPrice(p.price);
    setPDiscountPrice(p.discountPrice);
    setPStock(p.stockQuantity);
    setPWeight(p.weightGrams);
    setPSourness(p.sournessLevel);
    setPShortDesc(p.shortDescription);
    setPDesc(p.description);
    setPMainImage(p.mainImage);
    setPIsWholesale(p.isWholesaleAvailable);
    setShowProductModal(true);
  };

  const openNewProductModal = () => {
    setEditingProduct(null);
    setPName('');
    setPSlug('');
    setPCategory(categories[0]?.id || '');
    setPPrice(85000);
    setPDiscountPrice(undefined);
    setPStock(50);
    setPWeight(300);
    setPSourness('SweetSour');
    setPShortDesc('لواشک ۱۰۰٪ طبیعی با پوره تازه میوه و بسته‌بندی بهداشتی');
    setPDesc('تهیه شده از بهترین میوه‌های باغی بدون افزودنی و اسیدهای شیمیایی، دارای طعم نوستالژیک و ماندگار.');
    setPMainImage('https://images.unsplash.com/photo-1541344999736-83eca872f242?w=800&q=80');
    setPIsWholesale(true);
    setShowProductModal(true);
  };

  // Open vs Closed definition for Online Orders:
  // Open orders: status is NOT Delivered and NOT Cancelled
  // Closed orders: status is Delivered or Cancelled
  const isOpenOrder = (status: string) => status !== 'Delivered' && status !== 'Cancelled';
  const isClosedOrder = (status: string) => status === 'Delivered' || status === 'Cancelled';

  // Overall Statistics for Online Orders Top Summary Banner
  const safeOrders = orders || [];
  const safeProducts = products || [];
  const totalOrdersCount = safeOrders.length;
  const openOrdersCount = safeOrders.filter((o) => isOpenOrder(o.status)).length;
  const closedOrdersCount = safeOrders.filter((o) => isClosedOrder(o.status)).length;
  const deliveredOrdersCount = safeOrders.filter((o) => o.status === 'Delivered').length;
  const processingOrdersCount = safeOrders.filter((o) => o.status === 'Processing').length;
  const shippedOrdersCount = safeOrders.filter((o) => o.status === 'Shipped').length;
  const paidOrdersCount = safeOrders.filter((o) => o.status === 'Paid').length;
  const pendingOrdersCount = safeOrders.filter((o) => o.status === 'Pending').length;
  const cancelledOrdersCount = safeOrders.filter((o) => o.status === 'Cancelled').length;
  const totalOrdersRevenue = safeOrders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Filtered and Sorted Online Orders
  const filteredAndSortedOrders = useMemo(() => {
    const result = safeOrders.filter((o) => {
      // Main Tab Filter
      if (orderMainTab === 'open' && !isOpenOrder(o.status)) return false;
      if (orderMainTab === 'closed' && !isClosedOrder(o.status)) return false;

      // Sub-status filter
      if (orderSubStatusFilter && o.status !== orderSubStatusFilter) return false;

      // Search
      const q = orderSearchQuery.trim().toLowerCase();
      if (q) {
        const matchesNum = o.orderNumber?.toLowerCase().includes(q) || false;
        const matchesName = o.customerName?.toLowerCase().includes(q) || false;
        const matchesMobile = o.customerMobile?.includes(q) || false;
        const matchesCity = o.shippingAddress?.city?.toLowerCase().includes(q) || false;
        const matchesProvince = o.shippingAddress?.province?.toLowerCase().includes(q) || false;
        const matchesTracking = o.trackingNumber?.toLowerCase().includes(q) || false;
        if (!matchesNum && !matchesName && !matchesMobile && !matchesCity && !matchesProvince && !matchesTracking) {
          return false;
        }
      }

      return true;
    });

    // Sort
    result.sort((a, b) => {
      switch (orderSortBy) {
        case 'oldest':
          return (new Date(a.createdAt || 0).getTime() || 0) - (new Date(b.createdAt || 0).getTime() || 0);
        case 'amount_desc':
          return (b.totalAmount || 0) - (a.totalAmount || 0);
        case 'amount_asc':
          return (a.totalAmount || 0) - (b.totalAmount || 0);
        case 'items_desc':
          return (b.items?.length || 0) - (a.items?.length || 0);
        case 'customer_name':
          return (a.customerName || '').localeCompare(b.customerName || '', 'fa');
        case 'newest':
        default:
          return (new Date(b.createdAt || 0).getTime() || 0) - (new Date(a.createdAt || 0).getTime() || 0);
      }
    });

    return result;
  }, [orders, orderMainTab, orderSubStatusFilter, orderSearchQuery, orderSortBy]);

  // Filtered and Sorted Products
  const filteredAndSortedProducts = useMemo(() => {
    const result = safeProducts.filter((p) => {
      // Search
      const q = productSearchQuery.trim().toLowerCase();
      if (q) {
        const matchesName = p.name?.toLowerCase().includes(q) || false;
        const matchesCategory = p.categoryName?.toLowerCase().includes(q) || false;
        const matchesDesc = p.shortDescription?.toLowerCase().includes(q) || false;
        if (!matchesName && !matchesCategory && !matchesDesc) return false;
      }

      // Category
      if (productCategoryFilter && p.categoryId !== productCategoryFilter && p.categoryName !== productCategoryFilter) {
        return false;
      }

      // Stock status
      const stock = p.stockQuantity || 0;
      if (productStockFilter === 'in_stock' && stock <= 0) return false;
      if (productStockFilter === 'low_stock' && (stock <= 0 || stock > 5)) return false;
      if (productStockFilter === 'out_of_stock' && stock > 0) return false;
      if (productStockFilter === 'discounted' && (!p.discountPrice || p.discountPrice >= p.price)) return false;
      if (productStockFilter === 'wholesale' && !p.isWholesaleAvailable) return false;

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      switch (productSortBy) {
        case 'price_asc': {
          const priceA = a.discountPrice || a.price || 0;
          const priceB = b.discountPrice || b.price || 0;
          return priceA - priceB;
        }
        case 'price_desc': {
          const priceA = a.discountPrice || a.price || 0;
          const priceB = b.discountPrice || b.price || 0;
          return priceB - priceA;
        }
        case 'stock_desc':
          return (b.stockQuantity || 0) - (a.stockQuantity || 0);
        case 'stock_asc':
          return (a.stockQuantity || 0) - (b.stockQuantity || 0);
        case 'name':
          return (a.name || '').localeCompare(b.name || '', 'fa');
        case 'newest':
        default:
          return (b.id || '').localeCompare(a.id || '');
      }
    });

    return result;
  }, [products, productSearchQuery, productCategoryFilter, productStockFilter, productSortBy]);

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-stone-900">دسترسی محدود است</h2>
        <p className="text-xs text-stone-500">این بخش مختص مدیریت ارشد فروشگاه ملس‌بان است.</p>
        <button
          onClick={() => onNavigate('home')}
          className="bg-rose-800 text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-rose-900 cursor-pointer"
        >
          بازگشت به صفحه اصلی
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col">
      {/* Top Mobile Bar */}
      <div className="lg:hidden bg-stone-900 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="p-2 bg-stone-800 rounded-xl hover:bg-stone-700 text-amber-400"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-amber-500 text-stone-950 font-black text-sm flex items-center justify-center">
              ملس
            </span>
            <div>
              <span className="font-black text-sm block">پنل مدیریت ملس‌بان</span>
              <span className="text-[10px] text-stone-400 block">
                {activeTab === 'overview' && 'داشبورد جامع'}
                {activeTab === 'products' && 'مدیریت محصولات'}
                {activeTab === 'orders' && 'سفارش‌های آنلاین'}
                {activeTab === 'wholesale' && 'درخواست‌های عمده'}
                {activeTab === 'reviews' && 'نظرات مشتریان'}
                {activeTab === 'categories' && 'دسته‌بندی‌ها'}
                {activeTab === 'coupons' && 'کدهای تخفیف'}
                {activeTab === 'customers' && 'مشتریان و خریداران'}
                {activeTab === 'staff' && 'مدیریت پرسنل و دسترسی‌ها (RBAC)'}
                {activeTab === 'blog' && 'وبلاگ و مقالات'}
                {activeTab === 'settings' && 'تنظیمات سایت'}
                {activeTab === 'chat' && 'مرکز گفتگوی زنده و پشتیبانی'}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="text-xs text-stone-300 hover:text-white flex items-center gap-1 bg-stone-800 px-3 py-1.5 rounded-xl"
        >
          <Store className="w-3.5 h-3.5 text-amber-400" />
          <span>فروشگاه</span>
        </button>
      </div>

      {/* Main Admin Layout: Right Vertical Sidebar + Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1920px] mx-auto p-3 sm:p-5 lg:p-6 gap-6 items-start">
        {/* Right Vertical Sidebar */}
        <aside
          className={`fixed inset-y-0 right-0 z-40 w-72 bg-stone-900 text-white p-5 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-in-out overflow-y-auto lg:overflow-visible lg:h-auto lg:max-h-none lg:sticky lg:top-[144px] lg:z-20 lg:self-start lg:translate-x-0 lg:w-64 lg:shrink-0 lg:rounded-3xl lg:shadow-xl ${
            isMobileNavOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="space-y-6">
            {/* Brand / Admin Header */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-amber-400 to-amber-600 text-stone-950 font-black text-lg flex items-center justify-center shadow-lg shadow-amber-500/20">
                  {isSuperAdmin ? 'ارشد' : 'مدیر'}
                </div>
                <div>
                  <h2 className="font-black text-sm text-stone-100">سامانه مدیریت ملس‌بان</h2>
                  <p className="text-[11px] text-amber-400 mt-0.5 font-bold">
                    {isSuperAdmin ? 'مدیر ارشد (دسترسی کامل)' : 'کارشناس سیستم (RBAC)'}
                  </p>
                </div>
              </div>

              {/* Close button for mobile */}
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(false)}
                className="lg:hidden p-1.5 rounded-lg text-stone-400 hover:text-white bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Vertical Menu Navigation with RBAC */}
            <nav className="space-y-1.5">
              {hasPermission('overview') && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('overview');
                    setIsMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    activeTab === 'overview'
                      ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/10 font-black'
                      : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>داشبورد و آمار تحلیلی</span>
                  </div>
                </button>
              )}

              {hasPermission('products') && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('products');
                    setIsMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    activeTab === 'products'
                      ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/10 font-black'
                      : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Package className="w-4 h-4" />
                    <span>محصولات و موجودی</span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      activeTab === 'products'
                        ? 'bg-stone-950/20 text-stone-950'
                        : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    {toPersianDigits(products.length)}
                  </span>
                </button>
              )}

              {hasPermission('orders') && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('orders');
                    setIsMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    activeTab === 'orders'
                      ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/10 font-black'
                      : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="w-4 h-4" />
                    <span>سفارش‌های آنلاین</span>
                  </div>
                  {stats?.newOrdersCount > 0 ? (
                    <span className="text-[10px] bg-rose-600 text-white font-black px-2 py-0.5 rounded-full">
                      {toPersianDigits(stats.newOrdersCount)} جدید
                    </span>
                  ) : (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        activeTab === 'orders'
                          ? 'bg-stone-950/20 text-stone-950'
                          : 'bg-stone-800 text-stone-400'
                      }`}
                    >
                      {toPersianDigits(orders.length)}
                    </span>
                  )}
                </button>
              )}

              {hasPermission('wholesale') && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('wholesale');
                    setIsMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    activeTab === 'wholesale'
                      ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/10 font-black'
                      : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-4 h-4" />
                    <span>سفارش‌های عمده و فله</span>
                  </div>
                  {wholesaleRequests.filter((w) => w.status === 'New').length > 0 && (
                    <span className="text-[10px] bg-amber-400 text-stone-950 font-black px-2 py-0.5 rounded-full">
                      {toPersianDigits(wholesaleRequests.filter((w) => w.status === 'New').length)}
                    </span>
                  )}
                </button>
              )}

              {/* Reviews Management Tab */}
              {hasPermission('reviews') && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('reviews');
                    setIsMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    activeTab === 'reviews'
                      ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/10 font-black'
                      : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-4 h-4" />
                    <span>نظرات و دیدگاه‌ها</span>
                  </div>
                  {reviewsList.filter((r) => !r.isApproved).length > 0 ? (
                    <span className="text-[10px] bg-amber-400 text-stone-950 font-black px-2 py-0.5 rounded-full">
                      {toPersianDigits(reviewsList.filter((r) => !r.isApproved).length)} در انتظار
                    </span>
                  ) : (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        activeTab === 'reviews'
                          ? 'bg-stone-950/20 text-stone-950'
                          : 'bg-stone-800 text-stone-400'
                      }`}
                    >
                      {toPersianDigits(reviewsList.length)}
                    </span>
                  )}
                </button>
              )}

              {hasPermission('categories') && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('categories');
                    setIsMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    activeTab === 'categories'
                      ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/10 font-black'
                      : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Layers className="w-4 h-4" />
                    <span>دسته‌بندی محصولات</span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      activeTab === 'categories'
                        ? 'bg-stone-950/20 text-stone-950'
                        : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    {toPersianDigits(categories.length)}
                  </span>
                </button>
              )}

              {hasPermission('coupons') && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('coupons');
                    setIsMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    activeTab === 'coupons'
                      ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/10 font-black'
                      : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Tag className="w-4 h-4" />
                    <span>کدهای تخفیف و جشنواره</span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      activeTab === 'coupons'
                        ? 'bg-stone-950/20 text-stone-950'
                        : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    {toPersianDigits(coupons.length)}
                  </span>
                </button>
              )}

              {/* Customers Tab */}
              {hasPermission('customers') && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('customers');
                    setIsMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    activeTab === 'customers'
                      ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/10 font-black'
                      : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4" />
                    <span>مشتریان و خریداران</span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      activeTab === 'customers'
                        ? 'bg-stone-950/20 text-stone-950'
                        : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    {toPersianDigits(usersList.filter((u) => u.role === 'Customer').length)}
                  </span>
                </button>
              )}

              {/* Staff & Admin RBAC Tab */}
              {hasPermission('staff') && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('staff');
                    setIsMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    activeTab === 'staff'
                      ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/10 font-black'
                      : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4" />
                    <span>پرسنل و مدیران (RBAC)</span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      activeTab === 'staff'
                        ? 'bg-stone-950/20 text-stone-950'
                        : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    {toPersianDigits(
                      usersList.filter((u) => u.role === 'Admin' || u.role === 'SuperAdmin').length
                    )}
                  </span>
                </button>
              )}

              {hasPermission('blog') && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('blog');
                    setIsMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    activeTab === 'blog'
                      ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/10 font-black'
                      : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4" />
                    <span>وبلاگ و مقالات</span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      activeTab === 'blog'
                        ? 'bg-stone-950/20 text-stone-950'
                        : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    {toPersianDigits(blogPosts.length)}
                  </span>
                </button>
              )}

              {hasPermission('settings') && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('settings');
                    setIsMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    activeTab === 'settings'
                      ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/10 font-black'
                      : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4" />
                    <span>تنظیمات و بنرهای سایت</span>
                  </div>
                </button>
              )}

              {(isSuperAdmin || hasPermission('chat')) && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('chat');
                    setIsMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    activeTab === 'chat'
                      ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/10 font-black'
                      : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Headphones className="w-4 h-4" />
                    <span>میز گفتگو و پشتیبانی</span>
                  </div>
                  {unansweredChatCount > 0 ? (
                    <span className="bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
                      {toPersianDigits(unansweredChatCount)}
                    </span>
                  ) : (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        activeTab === 'chat'
                          ? 'bg-stone-950/20 text-stone-950'
                          : 'bg-stone-800 text-stone-400'
                      }`}
                    >
                      {toPersianDigits(activeChatCount || 0)}
                    </span>
                  )}
                </button>
              )}
            </nav>
          </div>

          {/* Sidebar Footer Link */}
          <div className="pt-6 border-t border-stone-800 space-y-2">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="w-full flex items-center justify-center gap-2 bg-stone-800/80 hover:bg-stone-800 text-stone-300 hover:text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
            >
              <Store className="w-4 h-4 text-amber-400" />
              <span>مشاهده و بازگشت به فروشگاه</span>
            </button>
            <div className="text-[10px] text-stone-500 text-center">
              نسخه ۴.۲ ملس‌بان • سرور پایدار
            </div>
          </div>
        </aside>

        {/* Mobile Backdrop overlay */}
        {isMobileNavOpen && (
          <div
            onClick={() => setIsMobileNavOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden"
          />
        )}

        {/* Left / Main Content Container */}
        <main className="flex-1 w-full min-w-0 space-y-6">
          {/* Top Info Bar on desktop */}
          <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-black text-stone-900 flex items-center gap-2">
                {activeTab === 'overview' && (
                  <>
                    <LayoutDashboard className="w-5 h-5 text-amber-600" />
                    <span>داشبورد جامع و آمار تحلیلی ملس‌بان</span>
                  </>
                )}
                {activeTab === 'products' && (
                  <>
                    <Package className="w-5 h-5 text-rose-700" />
                    <span>مدیریت محصولات، قیمت‌ها و انبارداری</span>
                  </>
                )}
                {activeTab === 'orders' && (
                  <>
                    <ShoppingBag className="w-5 h-5 text-emerald-600" />
                    <span>سفارش‌های آنلاین و پیگیری مرسولات</span>
                  </>
                )}
                {activeTab === 'wholesale' && (
                  <>
                    <Briefcase className="w-5 h-5 text-amber-600" />
                    <span>درخواست‌های همکاری و استعلام عمده</span>
                  </>
                )}
                {activeTab === 'reviews' && (
                  <>
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    <span>مدیریت نظرات و بازخورد مشتریان</span>
                  </>
                )}
                {activeTab === 'categories' && (
                  <>
                    <Layers className="w-5 h-5 text-indigo-600" />
                    <span>دسته‌بندی‌های طعم و میوه</span>
                  </>
                )}
                {activeTab === 'coupons' && (
                  <>
                    <Tag className="w-5 h-5 text-pink-600" />
                    <span>کدهای تخفیف و جشنواره‌ها</span>
                  </>
                )}
                {activeTab === 'customers' && (
                  <>
                    <Users className="w-5 h-5 text-teal-600" />
                    <span>مشتریان و خریداران فروشگاه</span>
                  </>
                )}
                {activeTab === 'staff' && (
                  <>
                    <ShieldCheck className="w-5 h-5 text-amber-600" />
                    <span>مدیریت پرسنل، مدیران و مجوزها (RBAC)</span>
                  </>
                )}
                {activeTab === 'blog' && (
                  <>
                    <BookOpen className="w-5 h-5 text-amber-700" />
                    <span>وبلاگ، دانستنی‌ها و مقالات</span>
                  </>
                )}
                {activeTab === 'settings' && (
                  <>
                    <Settings className="w-5 h-5 text-stone-700" />
                    <span>تنظیمات ظاهری، لوگو و بنرهای سایت</span>
                  </>
                )}
                {activeTab === 'chat' && (
                  <>
                    <Headphones className="w-5 h-5 text-rose-700" />
                    <span>مرکز گفتگوی زنده، پشتیبانی و دستیار هوشمند</span>
                  </>
                )}
              </h1>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
              {activeTab === 'coupons' && (
                <button
                  type="button"
                  onClick={() => setShowCouponModal(true)}
                  className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white px-3.5 py-2 rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  <Tag className="w-4 h-4" />
                  <span>کد تخفیف جدید</span>
                </button>
              )}
            </div>
          </div>

          {/* 1. Enhanced Comprehensive Dashboard Overview Tab */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-6">
              {/* Primary KPI Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* 1. Total Sales */}
                <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between text-stone-500">
                    <span className="text-xs font-bold text-stone-700">کل فروش شاپرک</span>
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-black text-stone-900">
                    {formatPrice(stats.totalSales || 0)}
                  </p>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-emerald-700 font-bold">
                      فروش امروز: {formatPrice(stats.todaySales || 0)}
                    </span>
                    <span className="text-stone-400">تراکنش مستقیم</span>
                  </div>
                </div>

                {/* 2. Total Orders & Status Breakdown */}
                <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-stone-500">
                    <span className="text-xs font-bold text-stone-700">کل سفارش‌های ثبت‌شده</span>
                    <ShoppingBag className="w-5 h-5 text-rose-800" />
                  </div>
                  <p className="text-2xl font-black text-stone-900">
                    {toPersianDigits(stats.totalOrders || 0)} سفارش
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-stone-500">
                    <span className="text-amber-800 font-bold">
                      {toPersianDigits(stats.newOrdersCount || stats.todayOrders || 0)} سفارش در انتظار
                    </span>
                    <span>میانگین سبد: {formatPrice(stats.avgOrderValue || 0)}</span>
                  </div>
                </div>

                {/* 3. Wholesale Requests */}
                <div className="bg-white p-5 rounded-3xl border border-amber-200 bg-amber-50/30 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-amber-700">
                    <span className="text-xs font-bold">استعلام‌های عمده</span>
                    <Briefcase className="w-5 h-5 text-amber-600" />
                  </div>
                  <p className="text-2xl font-black text-amber-950">
                    {toPersianDigits(stats.newWholesaleRequests || stats.newWholesaleCount || 0)} درخواست جدید
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('wholesale')}
                    className="text-[11px] text-amber-800 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>مشاهده کل {toPersianDigits(stats.totalWholesaleCount || wholesaleRequests.length)} استعلام</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 4. Customer Rating & Reviews */}
                <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-stone-500">
                    <span className="text-xs font-bold text-stone-700">رضایت و نظرات</span>
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-black text-stone-900">
                      {toPersianDigits(stats.avgRating || 4.9)}
                    </p>
                    <span className="text-xs text-stone-500 font-bold">از ۵ ستاره</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-blue-700 font-bold">
                      {toPersianDigits(stats.pendingReviews || reviewsList.filter((r) => !r.isApproved).length)} نظر در انتظار
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('reviews')}
                      className="text-stone-400 hover:text-stone-700 hover:underline"
                    >
                      بررسی نظرات
                    </button>
                  </div>
                </div>

                {/* 5. Live Chat & Support Stats Card - Only for authorized staff */}
                {(isSuperAdmin || hasPermission('chat')) && (
                  <div
                    onClick={() => setActiveTab('chat')}
                    className="bg-white p-5 rounded-3xl border border-rose-200/90 hover:border-rose-400 bg-rose-50/20 shadow-2xs space-y-2 cursor-pointer transition-all hover:shadow-xs group"
                  >
                    <div className="flex items-center justify-between text-stone-500">
                      <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                        <Headphones className="w-4 h-4 text-rose-700" />
                        <span>گفتگوی زنده و پشتیبانی</span>
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>آنلاین</span>
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <p className="text-2xl font-black text-stone-900">
                        {toPersianDigits(activeChatCount || 3)}
                        <span className="text-xs text-stone-500 font-bold mr-1">چت فعال</span>
                      </p>
                      {unansweredChatCount > 0 && (
                        <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-xs">
                          {toPersianDigits(unansweredChatCount)} در انتظار
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-rose-100">
                      <span className="text-stone-500 font-bold">
                        میانگین پاسخ: ۳۸ ثانیه
                      </span>
                      <span className="text-rose-700 group-hover:underline font-bold flex items-center gap-0.5">
                        <span>میز کار چت</span>
                        <ChevronLeft className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Secondary Stats Row: Orders Pipeline & Inventory Alert */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Pipeline Stats */}
                <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs space-y-3">
                  <h3 className="font-black text-xs text-stone-800 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-stone-500" />
                    <span>چرخه پردازش و ارسال سفارش‌ها</span>
                  </h3>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-2xl">
                      <span className="text-[10px] text-amber-800 font-bold block">در انتظار</span>
                      <span className="text-base font-black text-amber-950">
                        {toPersianDigits(stats.newOrdersCount || 0)}
                      </span>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-2xl">
                      <span className="text-[10px] text-blue-800 font-bold block">در حال آماده‌سازی</span>
                      <span className="text-base font-black text-blue-950">
                        {toPersianDigits(stats.processingOrdersCount || 0)}
                      </span>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-2xl">
                      <span className="text-[10px] text-emerald-800 font-bold block">ارسال شده</span>
                      <span className="text-base font-black text-emerald-950">
                        {toPersianDigits(stats.shippedOrdersCount || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Inventory Health Alert */}
                <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-xs text-stone-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>وضعیت انبار و موجودی کالاها</span>
                    </h3>
                    <span className="text-[10px] font-bold text-stone-500">
                      کل کالاها: {toPersianDigits(stats.productsCount || products.length)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-2xl">
                      <span className="text-[10px] text-rose-800 font-bold block">موجودی کم (&lt;۵۰)</span>
                      <span className="text-base font-black text-rose-950">
                        {toPersianDigits(stats.lowStockCount || stats.lowStockProducts?.length || 0)} کالا
                      </span>
                    </div>
                    <div className="bg-stone-50 border border-stone-200 p-2.5 rounded-2xl">
                      <span className="text-[10px] text-stone-600 font-bold block">اقلام ناموجود</span>
                      <span className="text-base font-black text-stone-900">
                        {toPersianDigits(stats.outOfStockCount || 0)} کالا
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customers & Units Sold */}
                <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs space-y-3">
                  <h3 className="font-black text-xs text-stone-800 flex items-center gap-2">
                    <Users className="w-4 h-4 text-stone-500" />
                    <span>آمار کاربران و حجم فروش فیزیکی</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-stone-50 border border-stone-200 p-2.5 rounded-2xl">
                      <span className="text-[10px] text-stone-600 font-bold block">تعداد مشتریان ثبت‌نامی</span>
                      <span className="text-base font-black text-stone-900">
                        {toPersianDigits(stats.usersCount || stats.totalUsers || usersList.length)} نفر
                      </span>
                    </div>
                    <div className="bg-stone-50 border border-stone-200 p-2.5 rounded-2xl">
                      <span className="text-[10px] text-stone-600 font-bold block">مجموع بسته‌های ارسالی</span>
                      <span className="text-base font-black text-stone-900">
                        {toPersianDigits(stats.totalItemsSold || 0)} بسته
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistical Charts Section via Recharts (Monthly Sales, Products & Live Chat Analytics) */}
              <AnalyticsCharts
                monthlySales={stats.monthlySales}
                topProducts={stats.topProducts}
                totalSales={stats.totalSales}
                monthSales={stats.monthSales}
                token={token}
                onNavigateToChat={() => setActiveTab('chat')}
              />

              {/* Low Stock Watchlist & Inventory Status */}
              <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <h3 className="font-black text-sm text-stone-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-700" />
                    <span>هشدار کسری موجودی انبار</span>
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-rose-800 font-bold">
                      {toPersianDigits(stats.lowStockProducts?.length || 0)} قلم کالا نیازمند شارژ
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('products')}
                      className="text-xs text-rose-800 font-bold hover:underline"
                    >
                      مدیریت انبار &larr;
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {stats.lowStockProducts && stats.lowStockProducts.length > 0 ? (
                    stats.lowStockProducts.slice(0, 6).map((p: any) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/50 border border-rose-200/80 gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={p.mainImage}
                            alt=""
                            className="w-10 h-10 object-cover rounded-xl bg-stone-200 shrink-0 border border-stone-200"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-stone-900 truncate" title={p.name}>
                              {p.name}
                            </p>
                            <span className="text-[10px] text-stone-500 block truncate">
                              دسته‌بندی: {p.categoryName || 'محصولات'}
                            </span>
                          </div>
                        </div>
                        <div className="text-left shrink-0">
                          <span className="bg-rose-600 text-white font-black text-xs px-2.5 py-1 rounded-xl whitespace-nowrap inline-flex items-center gap-1 shadow-2xs">
                            <span>{toPersianDigits(p.stockQuantity)}</span>
                            <span>بسته</span>
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-6 text-stone-400 text-xs font-bold">
                      تمامی اقلام دارای موجودی کافی هستند.
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Orders Overview Table */}
              <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <h3 className="font-black text-sm text-stone-900">تازه‌ترین سفارش‌های ثبت‌شده</h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    className="text-xs text-rose-800 font-bold hover:underline"
                  >
                    مشاهده کلیه سفارش‌ها &larr;
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs divide-y divide-stone-200">
                    <thead>
                      <tr className="bg-stone-50 text-stone-600 font-bold whitespace-nowrap">
                        <th className="p-3 whitespace-nowrap">شماره سفارش</th>
                        <th className="p-3 whitespace-nowrap">نام تحویل‌گیرنده</th>
                        <th className="p-3 whitespace-nowrap">تاریخ ثبت</th>
                        <th className="p-3 whitespace-nowrap">مبلغ پرداختی</th>
                        <th className="p-3 whitespace-nowrap">وضعیت پرداخت</th>
                        <th className="p-3 whitespace-nowrap">وضعیت ارسال</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {orders.slice(0, 5).map((o) => (
                        <tr key={o.id} className="hover:bg-stone-50 transition-colors">
                          <td className="p-3 font-mono font-bold text-stone-900 whitespace-nowrap">{o.orderNumber || o.id}</td>
                          <td className="p-3 font-bold whitespace-nowrap">{o.customerName}</td>
                          <td className="p-3 text-stone-500 whitespace-nowrap">{formatDateFa(o.createdAt)}</td>
                          <td className="p-3 font-bold text-stone-900 whitespace-nowrap">{formatPrice(o.totalAmount)}</td>
                          <td className="p-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-md font-bold text-[10px] whitespace-nowrap ${
                                getPaymentStatusBadge(o.paymentStatus).bg
                              }`}
                            >
                              {getPaymentStatusText(o.paymentStatus)}
                            </span>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-md font-bold text-[10px] whitespace-nowrap ${
                                getOrderStatusBadge(o.status).bg
                              }`}
                            >
                              {getOrderStatusText(o.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

      {/* 2. Products Tab */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-2xs space-y-6">
          {/* Header Title + Single Add Product Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            <div>
              <h2 className="text-base font-black text-stone-900">لیست کلیه محصولات فروشگاه</h2>
              <p className="text-xs text-stone-500 mt-0.5">افزودن، ویرایش قیمت و مدیریت هوشمند موجودی انبار ملس‌بان</p>
            </div>

            <button
              onClick={openNewProductModal}
              className="flex items-center gap-1.5 bg-rose-800 hover:bg-rose-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs self-start sm:self-auto cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن محصول جدید</span>
            </button>
          </div>

          {/* Quick Metrics / Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => {
                setProductStockFilter('all');
                setProductCategoryFilter('');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold border transition-colors cursor-pointer ${
                productStockFilter === 'all' && !productCategoryFilter
                  ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
              }`}
            >
              همه محصولات ({toPersianDigits(products.length)})
            </button>
            <button
              onClick={() => setProductStockFilter(productStockFilter === 'in_stock' ? 'all' : 'in_stock')}
              className={`px-3 py-1.5 rounded-xl font-bold border transition-colors cursor-pointer ${
                productStockFilter === 'in_stock'
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
              }`}
            >
              موجود در انبار ({toPersianDigits(products.filter((p) => p.stockQuantity > 0).length)})
            </button>
            <button
              onClick={() => setProductStockFilter(productStockFilter === 'low_stock' ? 'all' : 'low_stock')}
              className={`px-3 py-1.5 rounded-xl font-bold border transition-colors cursor-pointer ${
                productStockFilter === 'low_stock'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
              }`}
            >
              دارای کسری انبار ({toPersianDigits(products.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= 5).length)})
            </button>
            <button
              onClick={() => setProductStockFilter(productStockFilter === 'out_of_stock' ? 'all' : 'out_of_stock')}
              className={`px-3 py-1.5 rounded-xl font-bold border transition-colors cursor-pointer ${
                productStockFilter === 'out_of_stock'
                  ? 'bg-red-700 text-white border-red-700 shadow-xs'
                  : 'bg-red-50 hover:bg-red-100 text-red-800 border-red-200'
              }`}
            >
              اتمام موجودی ({toPersianDigits(products.filter((p) => p.stockQuantity === 0).length)})
            </button>
            <button
              onClick={() => setProductStockFilter(productStockFilter === 'wholesale' ? 'all' : 'wholesale')}
              className={`px-3 py-1.5 rounded-xl font-bold border transition-colors cursor-pointer ${
                productStockFilter === 'wholesale'
                  ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200'
              }`}
            >
              عرضه عمده ({toPersianDigits(products.filter((p) => p.isWholesaleAvailable).length)})
            </button>
          </div>

          {/* Search, Filter & Sort Controls Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-2">
            {/* Search Box */}
            <div className="relative lg:col-span-4">
              <input
                type="text"
                placeholder="جستجوی نام، توضیح یا دسته‌بندی..."
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-xl pr-9 pl-8 py-2 text-xs font-medium text-stone-900 placeholder:text-stone-400 outline-hidden transition-all shadow-2xs"
              />
              <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              {productSearchQuery && (
                <button
                  onClick={() => setProductSearchQuery('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="relative lg:col-span-3">
              <select
                value={productCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 outline-hidden cursor-pointer shadow-2xs transition-all"
              >
                <option value="">همه دسته‌بندی‌ها</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock Filter */}
            <div className="relative lg:col-span-3">
              <select
                value={productStockFilter}
                onChange={(e) => setProductStockFilter(e.target.value as any)}
                className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 outline-hidden cursor-pointer shadow-2xs transition-all"
              >
                <option value="all">وضعیت انبار: همه</option>
                <option value="in_stock">فقط موجود در انبار</option>
                <option value="low_stock">دارای کسری انبار (۵ یا کمتر)</option>
                <option value="out_of_stock">اتمام موجودی (ناموجود)</option>
                <option value="discounted">دارای تخفیف ویژه</option>
                <option value="wholesale">فروش عمده فعال</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="relative lg:col-span-2">
              <select
                value={productSortBy}
                onChange={(e) => setProductSortBy(e.target.value as any)}
                className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 outline-hidden cursor-pointer shadow-2xs transition-all"
              >
                <option value="newest">مرتب‌سازی: جدیدترین</option>
                <option value="price_asc">قیمت: کم به زیاد</option>
                <option value="price_desc">قیمت: زیاد به کم</option>
                <option value="stock_desc">موجودی: بیشترین</option>
                <option value="stock_asc">موجودی: کمترین (کسری)</option>
                <option value="name">نام محصول (الف-ی)</option>
              </select>
            </div>
          </div>

          {/* Active Filter Clear Helper */}
          {(productSearchQuery || productCategoryFilter || productStockFilter !== 'all' || productSortBy !== 'newest') && (
            <div className="flex items-center justify-between text-xs bg-amber-50/70 border border-amber-200 rounded-xl px-3.5 py-2 text-amber-900">
              <span className="font-bold">
                نمایش {toPersianDigits(filteredAndSortedProducts.length)} از {toPersianDigits(products.length)} محصول
              </span>
              <button
                onClick={() => {
                  setProductSearchQuery('');
                  setProductCategoryFilter('');
                  setProductStockFilter('all');
                  setProductSortBy('newest');
                }}
                className="text-amber-800 hover:text-amber-950 font-black underline flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>پاک کردن تمام فیلترها</span>
              </button>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs divide-y divide-stone-200">
              <thead>
                <tr className="bg-stone-50 text-stone-600 font-bold whitespace-nowrap">
                  <th className="p-3.5 whitespace-nowrap">تصویر</th>
                  <th className="p-3.5 whitespace-nowrap">نام محصول</th>
                  <th className="p-3.5 whitespace-nowrap">دسته‌بندی</th>
                  <th className="p-3.5 whitespace-nowrap">قیمت اصلی</th>
                  <th className="p-3.5 whitespace-nowrap">قیمت حراجی</th>
                  <th className="p-3.5 whitespace-nowrap">موجودی انبار</th>
                  <th className="p-3.5 whitespace-nowrap">وزن</th>
                  <th className="p-3.5 whitespace-nowrap">فروش عمده</th>
                  <th className="p-3.5 text-center whitespace-nowrap">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredAndSortedProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="p-3.5 whitespace-nowrap">
                      <img src={p.mainImage} alt="" className="w-11 h-11 object-cover rounded-xl bg-stone-100 shadow-2xs border border-stone-200" />
                    </td>
                    <td className="p-3.5 font-bold text-stone-900 whitespace-nowrap">{p.name}</td>
                    <td className="p-3.5 text-stone-500 whitespace-nowrap">{p.categoryName || 'دسته‌بندی'}</td>
                    <td className="p-3.5 whitespace-nowrap font-mono">{formatPrice(p.price)}</td>
                    <td className="p-3.5 text-rose-900 font-bold whitespace-nowrap font-mono">
                      {p.discountPrice ? formatPrice(p.discountPrice) : '-'}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap inline-flex items-center gap-1 ${
                          p.stockQuantity > 5
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.stockQuantity > 0
                            ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-300'
                            : 'bg-red-100 text-red-800 font-black'
                        }`}
                      >
                        {toPersianDigits(p.stockQuantity)} عدد
                        {p.stockQuantity <= 5 && p.stockQuantity > 0 && <span className="text-[10px]">(کسری)</span>}
                        {p.stockQuantity === 0 && <span className="text-[10px]">(ناموجود)</span>}
                      </span>
                    </td>
                    <td className="p-3.5 text-stone-500 whitespace-nowrap">{formatWeight(p.weightGrams)}</td>
                    <td className="p-3.5 whitespace-nowrap">
                      {p.isWholesaleAvailable ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold whitespace-nowrap text-[11px]">فعال</span>
                      ) : (
                        <span className="text-stone-400 whitespace-nowrap text-[11px]">فقط خرده</span>
                      )}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-stone-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg whitespace-nowrap cursor-pointer transition-colors"
                          title="ویرایش محصول"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1.5 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-lg whitespace-nowrap cursor-pointer transition-colors"
                          title="حذف محصول"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredAndSortedProducts.length === 0 && (
              <div className="text-center py-12 space-y-3">
                <Package className="w-12 h-12 text-stone-300 mx-auto" />
                <p className="text-stone-500 font-bold text-sm">هیچ محصولی با معیارهای انتخابی پیدا نشد.</p>
                <button
                  onClick={() => {
                    setProductSearchQuery('');
                    setProductCategoryFilter('');
                    setProductStockFilter('all');
                  }}
                  className="text-xs text-rose-800 hover:underline font-bold cursor-pointer"
                >
                  پاک‌سازی فیلترها و نمایش همه
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Top Overview KPI Summary Cards (Similar to WholesaleTab) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-xs font-bold">کل سفارشات آنلاین</span>
                <ShoppingBag className="w-5 h-5 text-stone-700" />
              </div>
              <p className="text-2xl font-black text-stone-900">{toPersianDigits(totalOrdersCount)} <span className="text-xs font-bold text-stone-500">سفارش</span></p>
              <span className="text-[11px] text-stone-500 block truncate">
                گردش مالی: {formatPrice(totalOrdersRevenue)}
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50/50 to-white shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-amber-700">
                <span className="text-xs font-bold">سفارش‌های باز و در جریان</span>
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-2xl font-black text-amber-900">{toPersianDigits(openOrdersCount)} <span className="text-xs font-bold text-amber-700">سفارش باز</span></p>
              <span className="text-[11px] text-amber-700 font-bold block truncate">
                {toPersianDigits(processingOrdersCount)} در پردازش • {toPersianDigits(shippedOrdersCount)} ارسال شده
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/50 to-white shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-emerald-700">
                <span className="text-xs font-bold">تحویل داده شده (موفق)</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-emerald-900">{toPersianDigits(deliveredOrdersCount)} <span className="text-xs font-bold text-emerald-700">سفارش</span></p>
              <span className="text-[11px] text-emerald-700 font-bold block truncate">
                تحویل موفق به مشتریان
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-xs font-bold">معلق و لغو شده</span>
                <AlertTriangle className="w-5 h-5 text-stone-600" />
              </div>
              <p className="text-2xl font-black text-stone-800">
                {toPersianDigits(pendingOrdersCount + cancelledOrdersCount)}{' '}
                <span className="text-xs font-bold text-stone-500">مورد</span>
              </p>
              <span className="text-[11px] text-stone-400 block truncate">
                {toPersianDigits(pendingOrdersCount)} در انتظار پرداخت • {toPersianDigits(cancelledOrdersCount)} لغو
              </span>
            </div>
          </div>

          {/* Main Card with Tabs, Filters, Sort and Table */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-2xs space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-100">
              <div>
                <h2 className="text-base font-black text-stone-900">مدیریت سفارش‌های آنلاین</h2>
                <p className="text-xs text-stone-500 mt-0.5">تفکیک هوشمند سفارش‌های باز و بسته‌شده، پیگیری مرسولات و صدور فاکتور</p>
              </div>

              {/* Tab Selector (حالت tab مانند برای سفارش های باز و بسته شده) */}
              <div className="flex items-center bg-stone-100 p-1.5 rounded-2xl gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setOrderMainTab('open');
                    setOrderSubStatusFilter('');
                  }}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    orderMainTab === 'open'
                      ? 'bg-white text-stone-950 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Inbox className="w-4 h-4 text-amber-600" />
                  <span>سفارش‌های باز</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                      orderMainTab === 'open'
                        ? 'bg-amber-500 text-stone-950 font-black'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {toPersianDigits(openOrdersCount)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOrderMainTab('closed');
                    setOrderSubStatusFilter('');
                  }}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    orderMainTab === 'closed'
                      ? 'bg-white text-stone-950 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Archive className="w-4 h-4 text-emerald-600" />
                  <span>سفارش‌های بسته‌شده</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                      orderMainTab === 'closed'
                        ? 'bg-emerald-600 text-white font-black'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {toPersianDigits(closedOrdersCount)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOrderMainTab('all');
                    setOrderSubStatusFilter('');
                  }}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    orderMainTab === 'all'
                      ? 'bg-white text-stone-950 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <span>همه سفارش‌ها</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                      orderMainTab === 'all'
                        ? 'bg-stone-900 text-white font-black'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {toPersianDigits(totalOrdersCount)}
                  </span>
                </button>
              </div>
            </div>

            {/* Filter, Search & Sort Toolbar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
              {/* Search Box */}
              <div className="relative lg:col-span-5">
                <input
                  type="text"
                  placeholder="جستجوی شماره سفارش، نام مشتری، موبایل، شهر، کد پستی..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-xl pr-9 pl-8 py-2 text-xs font-medium text-stone-900 placeholder:text-stone-400 outline-hidden transition-all shadow-2xs"
                />
                <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                {orderSearchQuery && (
                  <button
                    onClick={() => setOrderSearchQuery('')}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter inside the tab */}
              <div className="relative lg:col-span-3">
                <select
                  value={orderSubStatusFilter}
                  onChange={(e) => setOrderSubStatusFilter(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 outline-hidden cursor-pointer shadow-2xs transition-all"
                >
                  {orderMainTab === 'open' && (
                    <>
                      <option value="">همه وضعیت‌های باز</option>
                      <option value="Paid">پرداخت شده (آماده بسته‌بندی)</option>
                      <option value="Processing">در حال پردازش و آماده‌سازی</option>
                      <option value="Shipped">ارسال شده با پست</option>
                      <option value="Pending">در انتظار پرداخت</option>
                    </>
                  )}
                  {orderMainTab === 'closed' && (
                    <>
                      <option value="">همه وضعیت‌های بسته‌شده</option>
                      <option value="Delivered">تحویل داده شده</option>
                      <option value="Cancelled">لغو شده</option>
                      <option value="Returned">مرجوع شده</option>
                    </>
                  )}
                  {orderMainTab === 'all' && (
                    <>
                      <option value="">همه وضعیت‌ها</option>
                      <option value="Pending">در انتظار پرداخت</option>
                      <option value="Paid">پرداخت شده</option>
                      <option value="Processing">در حال پردازش</option>
                      <option value="Shipped">ارسال شده</option>
                      <option value="Delivered">تحویل داده شده</option>
                      <option value="Cancelled">لغو شده</option>
                      <option value="Returned">مرجوع شده</option>
                    </>
                  )}
                </select>
              </div>

              {/* Sort Dropdown */}
              <div className="relative lg:col-span-4">
                <select
                  value={orderSortBy}
                  onChange={(e) => setOrderSortBy(e.target.value as any)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 outline-hidden cursor-pointer shadow-2xs transition-all"
                >
                  <option value="newest">مرتب‌سازی: جدیدترین سفارشات</option>
                  <option value="oldest">قدیمی‌ترین سفارشات</option>
                  <option value="amount_desc">مبلغ سفارش: بیشترین</option>
                  <option value="amount_asc">مبلغ سفارش: کمترین</option>
                  <option value="items_desc">تعداد اقلام: بیشترین</option>
                  <option value="customer_name">نام مشتری (الف-ی)</option>
                </select>
              </div>
            </div>

            {/* Active Filters Clear Bar */}
            {(orderSearchQuery || orderSubStatusFilter || orderSortBy !== 'newest') && (
              <div className="flex items-center justify-between text-xs bg-amber-50/70 border border-amber-200 rounded-xl px-3.5 py-2 text-amber-900">
                <span className="font-bold">
                  نمایش {toPersianDigits(filteredAndSortedOrders.length)} سفارش فیلتر شده
                </span>
                <button
                  onClick={() => {
                    setOrderSearchQuery('');
                    setOrderSubStatusFilter('');
                    setOrderSortBy('newest');
                  }}
                  className="text-amber-800 hover:text-amber-950 font-black underline flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>پاک کردن فیلترها</span>
                </button>
              </div>
            )}

            {/* Orders Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs divide-y divide-stone-200">
                <thead>
                  <tr className="bg-stone-50 text-stone-600 font-bold whitespace-nowrap">
                    <th className="p-3.5 whitespace-nowrap">شماره سفارش</th>
                    <th className="p-3.5 whitespace-nowrap">تاریخ ثبت</th>
                    <th className="p-3.5 whitespace-nowrap">نام مشتری</th>
                    <th className="p-3.5 whitespace-nowrap">موبایل</th>
                    <th className="p-3.5 whitespace-nowrap">شهر / مقصد</th>
                    <th className="p-3.5 whitespace-nowrap">اقلام</th>
                    <th className="p-3.5 whitespace-nowrap">مبلغ کل</th>
                    <th className="p-3.5 whitespace-nowrap">وضعیت و تغییر</th>
                    <th className="p-3.5 text-center whitespace-nowrap">فاکتور</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredAndSortedOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-stone-900 whitespace-nowrap">{ord.orderNumber}</td>
                      <td className="p-3.5 text-stone-500 whitespace-nowrap text-[11px]">
                        {ord.createdAt ? formatDateFa(ord.createdAt) : 'امروز'}
                      </td>
                      <td className="p-3.5 font-bold whitespace-nowrap">{ord.customerName}</td>
                      <td className="p-3.5 font-mono dir-ltr whitespace-nowrap text-stone-600">{ord.customerMobile}</td>
                      <td className="p-3.5 max-w-[170px] truncate text-stone-600 whitespace-nowrap">
                        {ord.shippingAddress?.province ? `${ord.shippingAddress.province} - ` : ''}{ord.shippingAddress?.city || '—'}
                      </td>
                      <td className="p-3.5 font-bold whitespace-nowrap">{toPersianDigits(ord.items?.length || 0)} قلم</td>
                      <td className="p-3.5 font-black text-rose-900 whitespace-nowrap font-mono">{formatPrice(ord.totalAmount || 0)}</td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          {renderOrderStatusCircle(ord.status, recentlyChangedOrderId === ord.id, false)}
                          <select
                            value={ord.status}
                            onChange={(e) => handleOrderStatusChange(ord.id, e.target.value)}
                            className="bg-stone-50 hover:bg-white border border-stone-200 hover:border-stone-300 focus:border-amber-500 rounded-xl px-2.5 py-1.5 text-xs font-bold text-stone-800 outline-hidden cursor-pointer shadow-2xs transition-all whitespace-nowrap"
                          >
                            <option value="Pending">در انتظار پرداخت</option>
                            <option value="Paid">پرداخت شده (آماده بسته‌بندی)</option>
                            <option value="Processing">در حال پردازش و آماده‌سازی</option>
                            <option value="Shipped">تحویل به پست (ارسال شده)</option>
                            <option value="Delivered">تحویل داده شده (بسته‌شده)</option>
                            <option value="Cancelled">لغو شده (بسته‌شده)</option>
                            <option value="Returned">مرجوع شده (بسته‌شده)</option>
                          </select>
                        </div>
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="p-1.5 text-rose-800 hover:bg-rose-50 rounded-lg whitespace-nowrap cursor-pointer transition-colors"
                          title="مشاهده فاکتور"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredAndSortedOrders.length === 0 && (
                <div className="text-center py-12 space-y-3">
                  {orderMainTab === 'open' ? (
                    <>
                      <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                      <p className="text-stone-700 font-bold text-sm">هیچ سفارش بازی در صف انتظار وجود ندارد!</p>
                      <p className="text-stone-400 text-xs">تمامی سفارش‌ها تحویل داده شده یا به بخش بسته‌شده منتقل شده‌اند.</p>
                    </>
                  ) : orderMainTab === 'closed' ? (
                    <>
                      <Archive className="w-12 h-12 text-stone-300 mx-auto" />
                      <p className="text-stone-700 font-bold text-sm">سفارش بسته‌شده‌ای یافت نشد.</p>
                      <p className="text-stone-400 text-xs">سفارش‌هایی که تحویل داده یا لغو شوند در این بخش بایگانی می‌شوند.</p>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto" />
                      <p className="text-stone-700 font-bold text-sm">سفارشی با این مشخصات یافت نشد.</p>
                    </>
                  )}
                  {(orderSearchQuery || orderSubStatusFilter) && (
                    <button
                      onClick={() => {
                        setOrderSearchQuery('');
                        setOrderSubStatusFilter('');
                      }}
                      className="text-xs text-rose-800 hover:underline font-bold mt-2 cursor-pointer"
                    >
                      پاک کردن فیلترها و جستجو
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Wholesale Requests Tab */}
      {activeTab === 'wholesale' && (
        <WholesaleTab
          requests={wholesaleRequests}
          onRefresh={fetchAdminData}
          token={token}
        />
      )}

      {/* 5. Coupons Tab */}
      {activeTab === 'coupons' && (
        <CouponsTab
          coupons={coupons}
          onRefresh={fetchAdminData}
          token={token}
        />
      )}

      {/* 6. Customers Tab */}
      {activeTab === 'customers' && (
        <CustomersTab
          users={usersList}
          onRefresh={fetchAdminData}
          token={token}
        />
      )}

      {/* 6.5 Staff Users RBAC Tab */}
      {activeTab === 'staff' && (
        <StaffUsersTab
          users={usersList}
          onRefresh={fetchAdminData}
          token={token}
        />
      )}

      {/* 6. Categories Management Tab */}
      {activeTab === 'categories' && (
        <CategoriesTab
          categories={categories}
          products={products}
          onRefresh={fetchAdminData}
          token={token}
        />
      )}

      {/* 7. Blog Management Tab */}
      {activeTab === 'blog' && (
        <BlogTab
          posts={blogPosts}
          onRefresh={fetchAdminData}
          token={token}
          onNavigate={onNavigate}
        />
      )}

      {/* 7.5 Reviews Management Tab */}
      {activeTab === 'reviews' && (
        <ReviewsTab
          reviews={reviewsList}
          onRefresh={fetchAdminData}
          token={token}
        />
      )}

      {/* Admin Not Logged In Helper Banner */}
      {!isAdmin && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-900 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
            <p className="text-xs font-bold">
              برای اعمال تغییرات، با حساب مدیریتی مجاز وارد شوید.
            </p>
          </div>
        </div>
      )}

      {/* 8. Site Settings Tab */}
      {activeTab === 'settings' && <SettingsTab token={token} />}

      {/* 9. Live Chat Management Tab */}
      {activeTab === 'chat' && (isSuperAdmin || hasPermission('chat')) && (
        <ChatTab token={token} onNavigate={onNavigate} />
      )}
        </main>
      </div>

      {/* Product Add / Edit Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-stone-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-black text-stone-900 text-base">
                {editingProduct ? 'ویرایش محصول' : 'تعریف محصول جدید ملس‌بان'}
              </h3>
              <button onClick={() => setShowProductModal(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">نام کامل محصول *</label>
                  <input
                    type="text"
                    required
                    value={pName}
                    onChange={(e) => setPName(e.target.value)}
                    placeholder="مثلاً: لواشک انار ساوه اصل"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">اسلاگ یکتا (انگلیسی) *</label>
                  <input
                    type="text"
                    required
                    value={pSlug}
                    onChange={(e) => setPSlug(e.target.value)}
                    placeholder="pomegranate-lavashak"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 dir-ltr text-left font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">دسته‌بندی</label>
                  <select
                    value={pCategory}
                    onChange={(e) => setPCategory(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">میزان ترشی</label>
                  <select
                    value={pSourness}
                    onChange={(e) => setPSourness(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2"
                  >
                    <option value="Sweet">شیرین و ملایم</option>
                    <option value="SweetSour">ملس خوشمزه</option>
                    <option value="Sour">ترش جنگلی</option>
                    <option value="ExtraSour">فوق‌العاده ترش</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">وزن خالص (گرم)</label>
                  <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl overflow-hidden focus-within:bg-white focus-within:border-rose-800">
                    <input
                      type="number"
                      value={pWeight}
                      onChange={(e) => setPWeight(Number(e.target.value))}
                      className="flex-1 bg-transparent px-3 py-2 text-xs font-mono outline-hidden text-left dir-ltr"
                    />
                    <span className="px-3 py-2 bg-stone-100 text-stone-500 font-bold text-xs border-r border-stone-200 select-none">
                      گرم
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">قیمت مصرف‌کننده *</label>
                  <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl overflow-hidden focus-within:bg-white focus-within:border-rose-800">
                    <input
                      type="number"
                      required
                      value={pPrice}
                      onChange={(e) => setPPrice(Number(e.target.value))}
                      className="flex-1 bg-transparent px-3 py-2 text-xs font-mono outline-hidden text-left dir-ltr"
                    />
                    <span className="px-2.5 py-2 bg-stone-100 text-stone-500 font-bold text-xs border-r border-stone-200 select-none">
                      تومان
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">قیمت با تخفیف (اختیاری)</label>
                  <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl overflow-hidden focus-within:bg-white focus-within:border-rose-800">
                    <input
                      type="number"
                      value={pDiscountPrice ?? ''}
                      onChange={(e) => setPDiscountPrice(e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="خالی اگر تخفیف ندارد"
                      className="flex-1 bg-transparent px-3 py-2 text-xs font-mono outline-hidden text-left dir-ltr placeholder:text-[10px]"
                    />
                    <span className="px-2.5 py-2 bg-stone-100 text-stone-500 font-bold text-xs border-r border-stone-200 select-none">
                      تومان
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">تعداد موجودی انبار *</label>
                  <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl overflow-hidden focus-within:bg-white focus-within:border-rose-800">
                    <input
                      type="number"
                      required
                      value={pStock}
                      onChange={(e) => setPStock(Number(e.target.value))}
                      className="flex-1 bg-transparent px-3 py-2 text-xs font-mono outline-hidden text-left dir-ltr"
                    />
                    <span className="px-2.5 py-2 bg-stone-100 text-stone-500 font-bold text-xs border-r border-stone-200 select-none">
                      عدد
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <ImageUploadField
                  label="عکس اصلی محصول"
                  required
                  value={pMainImage}
                  onChange={(val) => setPMainImage(val)}
                  aspectRatioClass="h-44"
                  maxDim={1200}
                  quality={0.88}
                  helpText="عکس محصول را با کلیک انتخاب کرده یا بکشید و رها کنید (Browse)"
                  placeholderText="انتخاب تصویر محصول (Browse)"
                  presetImages={[
                    { label: 'لواشک انار ساوه', url: 'https://images.unsplash.com/photo-1541344999736-83eca872f242?w=800&q=80' },
                    { label: 'سینی لواشک و ترشک', url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&q=80' },
                    { label: 'لواشک آلبالو کوهی', url: 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=800&q=80' },
                    { label: 'لواشک ورقه‌ای زردآلو', url: 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=800&q=80' },
                  ]}
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">توضیح کوتاه</label>
                <input
                  type="text"
                  value={pShortDesc}
                  onChange={(e) => setPShortDesc(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">توضیحات کامل محصول</label>
                <textarea
                  rows={3}
                  value={pDesc}
                  onChange={(e) => setPDesc(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3"
                ></textarea>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chk-wholesale"
                  checked={pIsWholesale}
                  onChange={(e) => setPIsWholesale(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-800"
                />
                <label htmlFor="chk-wholesale" className="font-bold text-stone-800 cursor-pointer">
                  قابل سفارش به صورت عمده و کارتنی
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-stone-200">
                <button
                  type="submit"
                  className="flex-1 bg-rose-800 hover:bg-rose-900 text-white font-bold py-3 rounded-xl"
                >
                  ذخیره و انتشار محصول
                </button>
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="bg-stone-100 text-stone-700 font-bold px-6 py-3 rounded-xl"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coupon Modal */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-stone-200 shadow-2xl space-y-4">
            <h3 className="font-black text-stone-900 text-base">تعریف کد تخفیف جدید</h3>
            <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">کد تخفیف (لاتین) *</label>
                <input
                  type="text"
                  required
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="YALDA1404"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 uppercase font-mono dir-ltr text-left"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">نوع تخفیف</label>
                  <select
                    value={couponType}
                    onChange={(e) => setCouponType(e.target.value as any)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2"
                  >
                    <option value="Percent">درصدی (٪)</option>
                    <option value="FixedAmount">مبلغ ثابت (تومان)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    مقدار {couponType === 'Percent' ? '(درصد)' : '(مبلغ به تومان)'}
                  </label>
                  <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl overflow-hidden focus-within:bg-white focus-within:border-rose-800">
                    <input
                      type="number"
                      required
                      value={couponValue}
                      onChange={(e) => setCouponValue(Number(e.target.value))}
                      className="flex-1 bg-transparent px-3 py-2 text-xs font-mono outline-hidden text-left dir-ltr"
                    />
                    <span className="px-3 py-2 bg-stone-100 text-stone-500 font-bold text-xs border-r border-stone-200 select-none">
                      {couponType === 'Percent' ? 'درصد (٪)' : 'تومان'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">حداقل مبلغ سفارش</label>
                <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl overflow-hidden focus-within:bg-white focus-within:border-rose-800">
                  <input
                    type="number"
                    value={couponMinOrder}
                    onChange={(e) => setCouponMinOrder(Number(e.target.value))}
                    className="flex-1 bg-transparent px-3 py-2 text-xs font-mono outline-hidden text-left dir-ltr"
                  />
                  <span className="px-3 py-2 bg-stone-100 text-stone-500 font-bold text-xs border-r border-stone-200 select-none">
                    تومان
                  </span>
                </div>
              </div>

              <div className="bg-sky-50/70 border border-sky-200/80 rounded-xl p-3 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="adminCouponFirstOrderOnly"
                  checked={couponFirstOrderOnly}
                  onChange={(e) => setCouponFirstOrderOnly(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-sky-600 rounded cursor-pointer shrink-0"
                />
                <label htmlFor="adminCouponFirstOrderOnly" className="text-xs cursor-pointer select-none">
                  <span className="font-bold text-sky-950 block">اعمال فقط برای خرید اول</span>
                  <span className="text-[11px] text-sky-800/80 block mt-0.5">
                    فقط مشتریانی که اولین خرید خود را ثبت می‌کنند می‌توانند از این کد استفاده نمایند.
                  </span>
                </label>
              </div>

              <div className="flex gap-2 pt-3 border-t border-stone-200">
                <button
                  type="submit"
                  className="flex-1 bg-rose-800 text-white font-bold py-2.5 rounded-xl hover:bg-rose-900"
                >
                  ثبت کد تخفیف
                </button>
                <button
                  type="button"
                  onClick={() => setShowCouponModal(false)}
                  className="bg-stone-100 text-stone-700 font-bold px-4 py-2.5 rounded-xl"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Quick View Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full border border-stone-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-black text-stone-900 text-base">
                فاکتور سفارش {selectedOrder.orderNumber}
              </h3>
              <button onClick={() => setSelectedOrder(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl space-y-1">
                <p>
                  <strong>مشتری:</strong> {selectedOrder.customerName} ({selectedOrder.customerMobile})
                </p>
                <p>
                  <strong>آدرس:</strong> {selectedOrder.shippingAddress?.province} -{' '}
                  {selectedOrder.shippingAddress?.city} - {selectedOrder.shippingAddress?.fullAddress}
                </p>
                <p>
                  <strong>روش ارسال:</strong> {selectedOrder.shippingMethod}
                </p>
                {selectedOrder.customerNotes && (
                  <p className="text-amber-800">
                    <strong>توضیح مشتری:</strong> {selectedOrder.customerNotes}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-bold">اقلام:</h4>
                {selectedOrder.items.map((it) => (
                  <div key={it.id} className="flex justify-between border-b pb-1">
                    <span>{it.productName} ({toPersianDigits(it.quantity)} عدد)</span>
                    <span className="font-bold">{formatPrice(it.totalPrice)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-between font-black text-rose-900 text-sm border-t border-stone-200">
                <span>مبلغ نهایی پرداختی:</span>
                <span>{formatPrice(selectedOrder.totalAmount)}</span>
              </div>

              <div className="pt-2 space-y-2 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 font-bold">وضعیت سفارش:</span>
                  {renderOrderStatusCircle(selectedOrder.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 font-bold">وضعیت تراکنش شاپرک:</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-lg font-bold text-[11px] border ${
                      getPaymentStatusBadge(selectedOrder.paymentStatus).bg
                    } ${getPaymentStatusBadge(selectedOrder.paymentStatus).border}`}
                  >
                    {getPaymentStatusText(selectedOrder.paymentStatus)}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full bg-stone-900 text-white font-bold py-2.5 rounded-xl text-xs"
            >
              بستن
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
