import React, { useState, useEffect } from 'react';
import { Product, Review } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { ProductCard } from '../components/common/ProductCard';
import {
  formatPrice,
  formatWeight,
  getSournessBadge,
  toPersianDigits,
  formatDateFa,
} from '../lib/formatters';
import {
  ShoppingBag,
  Heart,
  Share2,
  CheckCircle2,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Star,
  Send,
  ArrowRight,
  Info,
  Scale,
  Trash2,
  Eye,
  EyeOff,
  MessageSquare,
  MessageCircle,
  AlertTriangle,
  X,
  Check,
  ShieldAlert,
} from 'lucide-react';

interface ProductDetailViewProps {
  slug: string;
  onNavigate: (route: string, param?: string) => void;
  onQuickView: (product: Product) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  slug,
  onNavigate,
  onQuickView,
}) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'nutrition' | 'reviews'>('desc');
  const [loading, setLoading] = useState(true);

  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { showToast } = useToast();
  const { user, isAdmin, token } = useAuth();

  // Review Form
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isOfficialReview, setIsOfficialReview] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Review Moderation State (for Admins)
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
  const [isDeletingReview, setIsDeletingReview] = useState(false);
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Autofill name from logged-in user
  useEffect(() => {
    if (user && !reviewName) {
      setReviewName(`${user.name} ${user.family || ''}`.trim());
    }
    if (isAdmin) {
      setIsOfficialReview(true);
    }
  }, [user, isAdmin]);

  const fetchReviews = () => {
    const query = isAdmin ? `?productSlug=${slug}&all=true` : `?productSlug=${slug}`;
    fetch(`/api/reviews${query}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setReviews(data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then((data) => {
        setProduct(data.product);
        setSelectedImage(data.product.mainImage);
        setRelated(data.related || []);
      })
      .catch(() => {
        setProduct(null);
      })
      .finally(() => setLoading(false));

    fetchReviews();
  }, [slug, isAdmin]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('لینک محصول در کلیپ‌بورد کپی شد', 'success');
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setIsSubmittingReview(true);
    const isStaff = Boolean(isAdmin && isOfficialReview);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          productId: product.id,
          userName: isStaff
            ? `${reviewName || user?.name || 'مدیریت ملس‌بان'} (کارشناس رسمی)`
            : reviewName || user?.name || 'کاربر مهمان',
          rating: reviewRating,
          comment: reviewComment,
          userId: user?.id,
          isOfficialStaff: isStaff,
          isApproved: isStaff, // Staff reviews are pre-approved instantly
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(
          isStaff
            ? 'دیدگاه شما به عنوان کارشناس ملس‌بان بلافاصله با نشان ویژه منتشر گردید.'
            : 'نظر شما با موفقیت ثبت شد و به زودی نمایش می‌یابد',
          'success'
        );
        const newReview = data.review || data;
        if (newReview && newReview.id) {
          setReviews((prev) => [newReview, ...prev]);
        }
        setReviewComment('');
      } else {
        showToast(data.message || 'خطا در ثبت نظر', 'error');
      }
    } catch {
      showToast('خطا در ارسال نظر', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Toggle approval / visibility (عدم نمایش / انتشار مجدد)
  const handleToggleApproval = async (rev: Review) => {
    try {
      const res = await fetch(`/api/reviews/${rev.id}/toggle`, {
        method: 'PATCH',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) => (r.id === rev.id ? { ...r, isApproved: !r.isApproved } : r))
        );
        showToast(
          `وضعیت نظر تغییر کرد: ${rev.isApproved ? 'عدم نمایش (پنهان)' : 'تأیید و در سایت منتشر شد'}`,
          'success'
        );
      } else {
        showToast('خطا در تغییر وضعیت نظر', 'error');
      }
    } catch {
      showToast('خطای شبکه در تغییر وضعیت نظر', 'error');
    }
  };

  // Execute delete review (حذف نظر)
  const executeDeleteReview = async () => {
    if (!reviewToDelete) return;
    setIsDeletingReview(true);
    try {
      const res = await fetch(`/api/reviews/${reviewToDelete.id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== reviewToDelete.id));
        showToast('نظر با موفقیت حذف گردید.', 'success');
        setReviewToDelete(null);
      } else {
        showToast('خطا در حذف نظر', 'error');
      }
    } catch {
      showToast('خطای شبکه در حذف نظر', 'error');
    } finally {
      setIsDeletingReview(false);
    }
  };

  // Save admin reply directly on product page
  const handleSaveReply = async (revId: string) => {
    if (!replyText.trim()) return;
    setIsSubmittingReply(true);
    try {
      const res = await fetch(`/api/reviews/${revId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reply: replyText.trim() }),
      });
      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === revId
              ? { ...r, adminReply: replyText.trim(), isApproved: true }
              : r
          )
        );
        showToast('پاسخ رسمی فروشگاه ثبت و نمایش داده شد.', 'success');
        setReplyingReviewId(null);
        setReplyText('');
      } else {
        showToast('خطا در ثبت پاسخ مدیر', 'error');
      }
    } catch {
      showToast('خطای شبکه در ارسال پاسخ', 'error');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center animate-pulse">
        <div className="h-96 bg-stone-200 rounded-3xl max-w-4xl mx-auto"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="text-xl font-black text-stone-900">محصول مورد نظر یافت نشد!</h2>
        <p className="text-xs text-stone-500">ممکن است حذف شده باشد یا آدرس اشتباه باشد.</p>
        <button
          onClick={() => onNavigate('shop')}
          className="bg-rose-800 text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-rose-900"
        >
          بازگشت به فروشگاه
        </button>
      </div>
    );
  }

  const isFavorite = isInWishlist(product.id);
  const sourness = getSournessBadge(product.sournessLevel);
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-stone-500">
        <button onClick={() => onNavigate('home')} className="hover:text-stone-800">
          صفحه اصلی
        </button>
        <span>/</span>
        <button onClick={() => onNavigate('shop')} className="hover:text-stone-800">
          فروشگاه لواشک
        </button>
        <span>/</span>
        <span className="text-stone-800 font-bold truncate">{product.name}</span>
      </div>

      {/* Main Product Details Top Box */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 lg:p-10 shadow-2xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Gallery - 5 cols */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-stone-100 border border-stone-100 shadow-inner">
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <span className={`px-3 py-1 text-xs font-bold rounded-lg border shadow-xs ${sourness.bg}`}>
                  {sourness.label}
                </span>
                {hasDiscount && (
                  <span className="bg-rose-600 text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-xs">
                    تخفیف ویژه
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail switcher */}
            {product.images && product.images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`w-18 h-18 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      selectedImage === img
                        ? 'border-rose-700 shadow-md scale-105'
                        : 'border-stone-200 hover:border-stone-400 opacity-70'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details - 7 cols */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Category & Rating */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-800 bg-rose-50 px-3 py-1 rounded-lg">
                  {product.categoryName}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('reviews');
                    const el = document.getElementById('product-tabs-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex items-center gap-1.5 text-amber-500 font-bold text-sm hover:opacity-80 transition-opacity cursor-pointer"
                  title="مشاهده نظرات خریداران و پاسخ‌های رسمی مدیریت"
                >
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{toPersianDigits(product.rating)}</span>
                  <span className="text-stone-500 font-normal text-xs underline decoration-dotted">
                    ({toPersianDigits(reviews.length > 0 ? reviews.length : product.reviewCount)} نظر خریداران و پاسخ مدیر)
                  </span>
                </button>
              </div>

              {/* Title & SKU */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-stone-900 leading-snug">
                  {product.name}
                </h1>
                <div className="flex items-center gap-4 text-xs text-stone-400 mt-2 font-mono">
                  <span>کد کالا: {product.sku}</span>
                  <span>•</span>
                  <span>وزن خالص: {formatWeight(product.weightGrams)}</span>
                  <span>•</span>
                  <span className="text-emerald-700 font-sans font-bold">
                    {product.stockQuantity > 0 ? 'موجود در انبار ملس‌بان' : 'ناموجود'}
                  </span>
                </div>
              </div>

              <p className="text-sm text-stone-600 leading-relaxed pt-2">
                {product.shortDescription}
              </p>

              {/* Sourness meter visual indicator */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-700">درجه ترشی محصول:</span>
                  <span className="font-bold text-rose-800">{sourness.label}</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 h-2.5">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`rounded-full ${
                        step <= sourness.barCount
                          ? 'bg-gradient-to-r from-rose-600 to-red-600'
                          : 'bg-stone-200'
                      }`}
                    ></div>
                  ))}
                </div>
              </div>

              {/* Natural Ingredients Pills */}
              <div>
                <span className="text-xs font-bold text-stone-700 block mb-2">
                  مواد اولیه و ترکیبات ارگانیک:
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.ingredients.map((ing, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-rose-50/70 text-stone-800 border border-rose-200/60 px-3 py-1 rounded-xl font-medium"
                    >
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Price & Action Area */}
            <div className="pt-6 border-t border-stone-200 space-y-5">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-stone-500 font-bold">قیمت مصرف‌کننده:</span>
                <div className="flex items-baseline gap-3">
                  {hasDiscount && (
                    <span className="text-sm text-stone-400 line-through">
                      {formatPrice(product.price)}
                    </span>
                  )}
                  <span className="text-2xl sm:text-3xl font-black text-rose-900">
                    {formatPrice(product.discountPrice ?? product.price)}
                  </span>
                </div>
              </div>

              {/* Quantity selector & Add to cart */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center border border-stone-300 rounded-2xl bg-stone-50 p-1">
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
                    className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-black text-stone-800 hover:bg-stone-200 transition-colors shadow-2xs"
                  >
                    +
                  </button>
                  <span className="w-12 text-center font-black text-stone-900 text-base">
                    {toPersianDigits(quantity)}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-black text-stone-800 hover:bg-stone-200 transition-colors shadow-2xs"
                  >
                    -
                  </button>
                </div>

                <button
                  onClick={() => addToCart(product, quantity)}
                  disabled={product.stockQuantity === 0}
                  className="flex-1 bg-rose-800 hover:bg-rose-900 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg hover:shadow-rose-900/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:bg-stone-300"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>{product.stockQuantity === 0 ? 'ناموجود' : 'افزودن به سبد خرید'}</span>
                </button>

                <button
                  onClick={() => toggleWishlist(product)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
                    isFavorite
                      ? 'border-rose-600 bg-rose-50 text-rose-600'
                      : 'border-stone-300 text-stone-600 hover:text-rose-700 hover:bg-stone-50'
                  }`}
                  title="علاقه‌مندی"
                >
                  <Heart className="w-5 h-5 fill-current" />
                </button>

                <button
                  onClick={handleShare}
                  className="w-12 h-12 rounded-2xl border border-stone-300 text-stone-600 hover:text-stone-900 hover:bg-stone-50 flex items-center justify-center transition-colors"
                  title="اشتراک‌گذاری"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              {/* Wholesale prompt if eligible */}
              {product.isWholesaleAvailable && (
                <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-amber-900 font-bold">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>خرید عمده (کارتنی) این محصول با تخفیف ویژه همکاران</span>
                  </div>
                  <button
                    onClick={() => onNavigate('wholesale')}
                    className="font-black text-amber-800 hover:underline"
                  >
                    استعلام قیمت عمده &larr;
                  </button>
                </div>
              )}

              {/* Product Live Consultation Chat Prompt */}
              <div className="bg-rose-50/70 border border-rose-200/80 p-3.5 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 text-rose-950 font-bold min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-rose-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <MessageCircle className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block font-black text-rose-900 truncate">سوالی درباره طعم، ترشی یا بسته‌بندی این محصول دارید؟</span>
                    <span className="block text-[11px] text-stone-500 font-normal">مشاوره آنلاین مستقیم با کارشناسان ملس‌بان</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent('open-malasban-chat', {
                        detail: { product },
                      })
                    );
                  }}
                  className="bg-rose-800 hover:bg-rose-900 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm active:scale-95 shrink-0"
                >
                  مشاوره زنده &larr;
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Description, Nutritional facts, Reviews */}
      <div id="product-tabs-section" className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-2xs">
        {/* Tab Buttons */}
        <div className="flex border-b border-stone-200 bg-stone-50/70">
          <button
            onClick={() => setActiveTab('desc')}
            className={`flex-1 py-4 text-center font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'desc'
                ? 'bg-white text-rose-900 border-b-2 border-rose-800'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            توضیحات و ویژگی‌های محصول
          </button>
          <button
            onClick={() => setActiveTab('nutrition')}
            className={`flex-1 py-4 text-center font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'nutrition'
                ? 'bg-white text-rose-900 border-b-2 border-rose-800'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            جدول ارزش غذایی و ترکیبات
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 py-4 text-center font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'reviews'
                ? 'bg-white text-rose-900 border-b-2 border-rose-800'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <span>نظرات و پاسخ‌های مدیر</span>
            <span className="bg-rose-100 text-rose-800 text-[11px] px-2 py-0.5 rounded-full font-bold">
              {toPersianDigits(reviews.length)}
            </span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 sm:p-8">
          {activeTab === 'desc' && (
            <div className="space-y-4 max-w-4xl text-stone-700 leading-relaxed text-sm">
              <p>{product.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-stone-100 text-xs">
                <div className="p-4 rounded-2xl bg-stone-50 space-y-1">
                  <span className="font-bold text-stone-900 block">روش نگهداری:</span>
                  <span className="text-stone-500">در دمای خنک و دور از تابش آفتاب مستقیم (یخچال به ماندگاری کمک می‌کند).</span>
                </div>
                <div className="p-4 rounded-2xl bg-stone-50 space-y-1">
                  <span className="font-bold text-stone-900 block">تاریخ انقضاء:</span>
                  <span className="text-stone-500">۶ ماه پس از تولید بدون افت کیفیت و طعم.</span>
                </div>
                <div className="p-4 rounded-2xl bg-stone-50 space-y-1">
                  <span className="font-bold text-stone-900 block">گواهی سلامت:</span>
                  <span className="text-stone-500">دارای پروانه بهداشتی و نشان استاندارد غذا و دارو.</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'nutrition' && (
            <div className="max-w-2xl space-y-6">
              <p className="text-xs text-stone-500">
                جدول ارزش تغذیه‌ای بر اساس هر ۱۰۰ گرم ماده خالص:
              </p>
              {product.nutritionalFacts ? (
                <div className="border border-stone-200 rounded-2xl overflow-hidden text-xs">
                  <table className="w-full text-right divide-y divide-stone-200">
                    <tbody className="divide-y divide-stone-100">
                      <tr className="bg-stone-50 font-bold">
                        <td className="p-3">انرژی (کالری)</td>
                        <td className="p-3 text-left dir-ltr">
                          {toPersianDigits(product.nutritionalFacts.caloriesPer100g)} kcal
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3">قند طبیعی میوه</td>
                        <td className="p-3 text-left dir-ltr">
                          {toPersianDigits(product.nutritionalFacts.sugarGrams)} g
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3">فیبر رژیمی طبیعی</td>
                        <td className="p-3 text-left dir-ltr">
                          {toPersianDigits(product.nutritionalFacts.fiberGrams)} g
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3">ویتامین C</td>
                        <td className="p-3 text-left dir-ltr">
                          ٪{toPersianDigits(product.nutritionalFacts.vitaminCPercent)}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3">چربی اشباع</td>
                        <td className="p-3 text-left dir-ltr">
                          {toPersianDigits(product.nutritionalFacts.fatGrams)} g (فاقد چربی مضر)
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3">نمک تصفیه شده</td>
                        <td className="p-3 text-left dir-ltr">
                          {toPersianDigits(product.nutritionalFacts.saltGrams)} g
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-stone-400">اطلاعات ارزش غذایی در دسترس نیست.</p>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-8">
              {/* Admin Moderation Alert Banner */}
              {isAdmin && (
                <div className="bg-linear-to-r from-amber-500/10 via-amber-500/5 to-transparent border-r-4 border-r-amber-500 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-amber-950 font-bold">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      شما به عنوان مدیر وارد شده‌اید: امکان حذف نظرات، عدم نمایش (پنهان‌سازی)، پاسخ‌دهی مستقیم و ثبت دیدگاه کارشناسی فعال است.
                    </span>
                  </div>
                  <span className="text-[10px] bg-amber-200/80 text-amber-950 font-black px-2.5 py-0.5 rounded-full shrink-0">
                    کنترل پنل دیدگاه‌ها
                  </span>
                </div>
              )}

              {/* Add review form */}
              <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 max-w-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-stone-800">ثبت نظر و تجربه خرید:</h4>
                  {isAdmin && (
                    <span className="text-[11px] bg-amber-100 text-amber-900 border border-amber-300 font-black px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                      <span>پنل مدیریت</span>
                    </span>
                  )}
                </div>

                <form onSubmit={handleAddReview} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">نام شما</label>
                      <input
                        type="text"
                        required
                        value={reviewName}
                        onChange={(e) => setReviewName(e.target.value)}
                        placeholder="مثلاً مریم احمدی"
                        className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 outline-hidden focus:border-rose-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">امتیاز شما</label>
                      <select
                        value={reviewRating}
                        onChange={(e) => setReviewRating(Number(e.target.value))}
                        className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 outline-hidden font-bold"
                      >
                        <option value={5}>۵ ستاره - عالی و فوق‌العاده</option>
                        <option value={4}>۴ ستاره - خیلی خوب</option>
                        <option value={3}>۳ ستاره - معمولی</option>
                        <option value={2}>۲ ستاره - ضعیف</option>
                        <option value={1}>۱ ستاره - ناراضی</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">متن نظر</label>
                    <textarea
                      required
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="کیفیت طعم، بافت، میزان ترشی و بسته‌بندی را چطور دیدید؟"
                      className="w-full bg-white border border-stone-300 rounded-xl p-3 text-xs text-stone-800 outline-hidden focus:border-rose-800"
                    ></textarea>
                  </div>

                  {/* Admin toggle to mark as official staff review */}
                  {isAdmin && (
                    <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="officialStaffCheck"
                        checked={isOfficialReview}
                        onChange={(e) => setIsOfficialReview(e.target.checked)}
                        className="w-4 h-4 accent-amber-600 cursor-pointer"
                      />
                      <label
                        htmlFor="officialStaffCheck"
                        className="text-xs font-bold text-amber-950 cursor-pointer flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                        <span>ثبت به عنوان نظر رسمی کارشناس ملس‌بان (انتشار آنی با نشان رسمی)</span>
                      </label>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="bg-rose-800 hover:bg-rose-900 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 active:scale-95 shadow-md"
                  >
                    <Send className="w-3.5 h-3.5 rotate-180" />
                    <span>{isSubmittingReview ? 'در حال ثبت...' : 'ارسال نظر'}</span>
                  </button>
                </form>
              </div>

              {/* Reviews List */}
              <div className="space-y-4 max-w-3xl">
                {reviews.length === 0 ? (
                  <p className="text-xs text-stone-500">هنوز نظری برای این محصول ثبت نشده است. اولین نظر را شما ثبت کنید!</p>
                ) : (
                  reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className={`p-5 rounded-2xl border shadow-2xs space-y-3 transition-colors ${
                        !rev.isApproved
                          ? 'bg-stone-50/80 border-dashed border-amber-300'
                          : 'bg-white border-stone-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-stone-900">{rev.userName}</span>

                          {rev.isOfficialStaff ? (
                            <span className="text-[10px] text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full font-black flex items-center gap-1 shadow-2xs">
                              <ShieldCheck className="w-3 h-3 text-amber-600" />
                              <span>دیدگاه کارشناس رسمی ملس‌بان</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>خریدار تأیید شده</span>
                            </span>
                          )}

                          {/* Admin visibility indicator badge */}
                          {isAdmin && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                rev.isApproved
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-900 border border-amber-300'
                              }`}
                            >
                              {rev.isApproved ? (
                                <>
                                  <Eye className="w-3 h-3" />
                                  <span>منتشر شده در سایت</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3 h-3 text-amber-700" />
                                  <span>عدم نمایش (پنهان شده)</span>
                                </>
                              )}
                            </span>
                          )}
                        </div>

                        <div className="flex text-amber-400">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                      </div>

                      {/* Customer Review Comment */}
                      <p className="text-xs text-stone-700 leading-relaxed font-medium">
                        {rev.comment}
                      </p>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-stone-400">
                          {formatDateFa(rev.createdAt)}
                        </span>
                      </div>

                      {/* Official Admin / Store Reply - Always Visible and Prominent */}
                      {rev.adminReply && (
                        <div className="bg-amber-50/90 border-r-4 border-r-amber-500 border border-amber-200/80 rounded-2xl p-4 mr-2 sm:mr-6 mt-3 space-y-2 shadow-2xs">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-rose-900 text-amber-400 flex items-center justify-center font-black text-[10px] shadow-xs">
                                ملس
                              </div>
                              <span className="font-black text-rose-950">پاسخ رسمی پشتیبانی ملس‌بان</span>
                              <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold">
                                مدیریت فروشگاه
                              </span>
                            </div>
                            <span className="text-[10px] text-amber-800 font-bold flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                              <span>پاسخ مدیر</span>
                            </span>
                          </div>
                          <p className="text-xs text-stone-800 leading-relaxed pr-8 font-medium">
                            {rev.adminReply}
                          </p>
                        </div>
                      )}

                      {/* Admin Moderation Toolbar on every review card */}
                      {isAdmin && (
                        <div className="pt-3 mt-3 border-t border-stone-100 flex flex-wrap items-center gap-2">
                          {/* Toggle visibility / Hide / Unhide */}
                          <button
                            type="button"
                            onClick={() => handleToggleApproval(rev)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                              rev.isApproved
                                ? 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                                : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-black'
                            }`}
                            title={
                              rev.isApproved
                                ? 'پنهان‌سازی این نظر از دید بازدیدکنندگان'
                                : 'تأیید و نمایش این نظر در صفحه محصول'
                            }
                          >
                            {rev.isApproved ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5 text-stone-500" />
                                <span>عدم نمایش</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5 text-emerald-700" />
                                <span>انتشار نظر</span>
                              </>
                            )}
                          </button>

                          {/* Quick reply button */}
                          <button
                            type="button"
                            onClick={() => {
                              if (replyingReviewId === rev.id) {
                                setReplyingReviewId(null);
                                setReplyText('');
                              } else {
                                setReplyingReviewId(rev.id);
                                setReplyText(rev.adminReply || '');
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                            <span>{rev.adminReply ? 'ویرایش پاسخ مدیر' : 'پاسخ مدیر'}</span>
                          </button>

                          {/* Delete review button */}
                          <button
                            type="button"
                            onClick={() => setReviewToDelete(rev)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors cursor-pointer mr-auto"
                            title="حذف کامل این نظر"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف نظر</span>
                          </button>
                        </div>
                      )}

                      {/* Inline Reply Form for Admin */}
                      {isAdmin && replyingReviewId === rev.id && (
                        <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 space-y-3 mt-3 animate-in fade-in">
                          <div className="flex items-center justify-between text-xs font-bold text-amber-950">
                            <span className="flex items-center gap-1.5">
                              <MessageSquare className="w-4 h-4 text-amber-600" />
                              <span>متن پاسخ رسمی مدیریت فروشگاه:</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setReplyingReviewId(null);
                                setReplyText('');
                              }}
                              className="text-stone-400 hover:text-stone-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <textarea
                            rows={2}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="پاسخ خود را برای نمایش به عنوان نظر رسمی ملس‌بان وارد کنید..."
                            className="w-full bg-white border border-amber-300 rounded-xl p-2.5 text-xs text-stone-900 outline-hidden focus:border-amber-500"
                          />

                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setReplyingReviewId(null);
                                setReplyText('');
                              }}
                              className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-200/60 rounded-xl"
                            >
                              انصراف
                            </button>
                            <button
                              type="button"
                              disabled={isSubmittingReply}
                              onClick={() => handleSaveReply(rev.id)}
                              className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-black px-4 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-xs active:scale-95"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>ثبت و انتشار پاسخ</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="space-y-6 pt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-stone-900">محصولات مشابه و پیشنهادی</h3>
            <button
              onClick={() => onNavigate('shop')}
              className="text-xs font-bold text-rose-800 hover:underline"
            >
              مشاهده بیشتر &larr;
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {related.slice(0, 4).map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onQuickView={onQuickView}
                onNavigate={(slug) => onNavigate('product-detail', slug)}
              />
            ))}
          </div>
        </section>
      )}
      {/* Delete Review Confirmation Modal */}
      {reviewToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-stone-200 text-center">
            <div className="w-12 h-12 bg-red-100 text-red-700 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="font-black text-stone-900 text-sm">
              آیا از حذف این نظر اطمینان دارید؟
            </h3>

            <p className="text-xs text-stone-600 leading-relaxed">
              نظر ثبت شده توسط{' '}
              <span className="font-bold text-rose-950">{reviewToDelete.userName}</span> به همراه پاسخ مدیر به طور کامل حذف خواهد شد.
            </p>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReviewToDelete(null)}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold px-4 py-2 rounded-xl"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={isDeletingReview}
                onClick={executeDeleteReview}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-5 py-2 rounded-xl active:scale-95"
              >
                {isDeletingReview ? 'در حال حذف...' : 'بله، حذف شود'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
