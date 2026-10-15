import React, { useState, useEffect, useMemo } from 'react';
import { Product, Category, SournessLevel } from '../types';
import { ProductCard } from '../components/common/ProductCard';
import { formatPrice, toPersianDigits } from '../lib/formatters';
import {
  Filter,
  SlidersHorizontal,
  X,
  Sparkles,
  ArrowUpDown,
  Search,
} from 'lucide-react';

interface ShopViewProps {
  initialCategory?: string;
  initialSearch?: string;
  onNavigate: (route: string, param?: string) => void;
  onQuickView: (product: Product) => void;
}

const sournessMap: Record<string, string> = {
  Sweet: 'شیرین و ملایم',
  SweetSour: 'ملس خوشمزه',
  Sour: 'ترش جنگلی',
  ExtraSour: 'فوق‌العاده ترش',
};

export const ShopView: React.FC<ShopViewProps> = ({
  initialCategory,
  initialSearch,
  onNavigate,
  onQuickView,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Extract clean initial category or search if passed as query-like string
  const cleanInitCat = useMemo(() => {
    if (!initialCategory) return '';
    if (initialCategory.startsWith('category=')) {
      return initialCategory.replace('category=', '');
    }
    if (initialCategory.startsWith('search=')) {
      return '';
    }
    return initialCategory;
  }, [initialCategory]);

  const cleanInitSearch = useMemo(() => {
    if (initialSearch) return initialSearch;
    if (initialCategory && initialCategory.startsWith('search=')) {
      return decodeURIComponent(initialCategory.replace('search=', ''));
    }
    return '';
  }, [initialCategory, initialSearch]);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>(cleanInitCat);
  const [selectedSourness, setSelectedSourness] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>(cleanInitSearch);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => setCategories(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (cleanInitCat) setSelectedCategory(cleanInitCat);
    if (cleanInitSearch) setSearchQuery(cleanInitSearch);
  }, [cleanInitCat, cleanInitSearch]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedCategory) {
      params.append('categoryId', selectedCategory);
      params.append('category', selectedCategory);
    }
    if (selectedSourness) params.append('sourness', selectedSourness);
    if (searchQuery.trim()) params.append('search', searchQuery.trim());
    if (inStockOnly) {
      params.append('inStockOnly', 'true');
      params.append('inStock', 'true');
    }
    if (sortBy) {
      params.append('sort', sortBy);
      params.append('sortBy', sortBy);
    }

    fetch(`/api/products?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setProducts(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedCategory, selectedSourness, searchQuery, inStockOnly, sortBy]);

  // Client-side filtering & sorting fallback to guarantee 100% precision
  const displayedProducts = useMemo(() => {
    let list = [...products];

    // Filter Category
    if (selectedCategory) {
      list = list.filter(
        (p) =>
          p.categoryId === selectedCategory ||
          p.categoryName === selectedCategory ||
          categories.find((c) => (c.id === selectedCategory || c.slug === selectedCategory) && (p.categoryId === c.id || p.categoryName === c.name))
      );
    }

    // Filter Sourness
    if (selectedSourness) {
      list = list.filter((p) => p.sournessLevel === selectedSourness);
    }

    // Filter Search
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.shortDescription?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.categoryName?.toLowerCase().includes(q) ||
          p.ingredients?.some((ing) => ing.toLowerCase().includes(q))
      );
    }

    // Filter In-Stock
    if (inStockOnly) {
      list = list.filter((p) => p.stockQuantity > 0);
    }

    // Sort
    switch (sortBy) {
      case 'price-asc':
      case 'cheapest':
        list.sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price));
        break;
      case 'price-desc':
      case 'expensive':
        list.sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price));
        break;
      case 'rating':
        list.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
        break;
      case 'bestseller':
      case 'bestselling':
        list.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0) || b.reviewCount - a.reviewCount);
        break;
      case 'newest':
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'featured':
      default:
        list.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0) || (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
        break;
    }

    return list;
  }, [products, selectedCategory, selectedSourness, searchQuery, inStockOnly, sortBy, categories]);

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedSourness('');
    setSearchQuery('');
    setInStockOnly(false);
    setSortBy('featured');
  };

  const hasActiveFilters = Boolean(
    selectedCategory || selectedSourness || searchQuery || inStockOnly
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & Breadcrumb */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
          <button onClick={() => onNavigate('home')} className="hover:text-stone-800">
            صفحه اصلی
          </button>
          <span>/</span>
          <span className="text-stone-800 font-bold">فروشگاه لواشک</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900">
              فروشگاه و محصولات ملس‌بان
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              مجموعه کامل لواشک‌های ۱۰۰٪ طبیعی بدون افزودنی و اسیدهای مصنوعی
            </p>
          </div>

          {/* Sort selector & Mobile filter button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 bg-white border border-stone-200 px-4 py-2 rounded-xl text-xs font-bold text-stone-800 shadow-2xs"
            >
              <SlidersHorizontal className="w-4 h-4 text-rose-800" />
              <span>فیلترها {hasActiveFilters && '(فعال)'}</span>
            </button>

            <div className="flex items-center gap-2 bg-white border border-stone-200 px-3 py-1.5 rounded-xl shadow-2xs text-xs font-bold text-stone-700">
              <ArrowUpDown className="w-4 h-4 text-stone-400" />
              <span className="hidden sm:inline text-stone-500">مرتب‌سازی:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent outline-hidden font-bold text-stone-800 cursor-pointer text-xs"
              >
                <option value="featured">پیشنهاد ملس‌بان</option>
                <option value="newest">جدیدترین‌ها</option>
                <option value="bestseller">پرفروش‌ترین‌ها</option>
                <option value="price-asc">ارزان‌ترین</option>
                <option value="price-desc">گران‌ترین</option>
                <option value="rating">بالاترین امتیاز خریداران</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs space-y-6 sticky top-28">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <span className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <Filter className="w-4 h-4 text-rose-800" />
              فیلترهای جستجو
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-rose-700 hover:text-rose-900 font-bold"
              >
                حذف همه
              </button>
            )}
          </div>

          {/* Search within shop */}
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-2">جستجوی کلمه</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="مثلاً: انار، آلبالو، کیک..."
                className="w-full bg-stone-50 border border-stone-200 rounded-xl pr-9 pl-3 py-2 text-xs text-stone-800 focus:bg-white focus:border-rose-800 outline-hidden"
              />
              <Search className="w-4 h-4 text-stone-400 absolute right-3 top-2.5" />
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-bold text-stone-700 mb-2.5">دسته‌بندی‌ها</h4>
            <div className="space-y-1 text-xs">
              <button
                onClick={() => setSelectedCategory('')}
                className={`w-full text-right px-3 py-2 rounded-xl font-bold transition-colors ${
                  selectedCategory === ''
                    ? 'bg-rose-100 text-rose-900'
                    : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                همه محصولات ({toPersianDigits(products.length)})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full text-right px-3 py-2 rounded-xl font-medium transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-rose-100 text-rose-900 font-bold'
                      : 'text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Sourness Level Filter */}
          <div className="pt-4 border-t border-stone-100">
            <h4 className="text-xs font-bold text-stone-700 mb-2.5">میزان ترشی و طعم</h4>
            <div className="space-y-1.5 text-xs">
              {[
                { id: '', label: 'همه طعم‌ها' },
                { id: 'Sweet', label: 'شیرین و ملایم (زردآلو، سیب)' },
                { id: 'SweetSour', label: 'ملس خوشمزه (انار ساوه، آلو)' },
                { id: 'Sour', label: 'ترش جنگلی (آلبالو، کیوی)' },
                { id: 'ExtraSour', label: 'فوق‌العاده ترش (زرشک، قره‌قروت)' },
              ].map((s) => (
                <label
                  key={s.id}
                  className="flex items-center gap-2 cursor-pointer text-stone-700 hover:text-stone-900 py-1"
                >
                  <input
                    type="radio"
                    name="sourness"
                    checked={selectedSourness === s.id}
                    onChange={() => setSelectedSourness(s.id)}
                    className="text-rose-800 focus:ring-rose-800 rounded-full"
                  />
                  <span>{s.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* In stock toggle */}
          <div className="pt-4 border-t border-stone-100">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-bold text-stone-800">فقط کالاهای موجود</span>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded text-rose-800 focus:ring-rose-800"
              />
            </label>
          </div>
        </aside>

        {/* Product Grid Area */}
        <main className="lg:col-span-3">
          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-xs text-stone-400 font-bold">فیلترهای اعمال‌شده:</span>
              {selectedCategory && (
                <span className="inline-flex items-center gap-1 text-xs bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-lg">
                  دسته‌بندی: {categories.find((c) => c.id === selectedCategory || c.slug === selectedCategory)?.name || selectedCategory}
                  <button onClick={() => setSelectedCategory('')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedSourness && (
                <span className="inline-flex items-center gap-1 text-xs bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-lg">
                  طعم: {sournessMap[selectedSourness] || selectedSourness}
                  <button onClick={() => setSelectedSourness('')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1 text-xs bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-lg">
                  جستجو: «{searchQuery}»
                  <button onClick={() => setSearchQuery('')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {inStockOnly && (
                <span className="inline-flex items-center gap-1 text-xs bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-lg">
                  فقط کالاهای موجود
                  <button onClick={() => setInStockOnly(false)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-xs text-rose-700 hover:underline font-bold mr-2"
              >
                پاک کردن همه
              </button>
            </div>
          )}

          {/* Products Results */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-3xl p-4 border border-stone-200 animate-pulse h-80 flex flex-col justify-between"
                >
                  <div className="bg-stone-200 rounded-2xl h-48 w-full"></div>
                  <div className="space-y-2 mt-4">
                    <div className="h-4 bg-stone-200 rounded-md w-3/4"></div>
                    <div className="h-4 bg-stone-200 rounded-md w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-400">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-stone-800">
                متأسفانه محصولی با این مشخصات یافت نشد!
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                می‌توانید فیلترها را حذف کنید یا واژه دیگری برای جستجو بنویسید.
              </p>
              <button
                onClick={clearFilters}
                className="bg-rose-800 text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-rose-900 transition-colors"
              >
                مشاهده همه محصولات
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {displayedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={onQuickView}
                  onNavigate={(slug) => onNavigate('product-detail', slug)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filter Modal */}
      {isMobileFilterOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end">
          <div className="bg-white w-full max-h-[85vh] rounded-t-3xl p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <span className="font-bold text-sm text-stone-900">فیلترهای فروشگاه</span>
              <button onClick={() => setIsMobileFilterOpen(false)} className="text-stone-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-xs font-bold text-stone-700 mb-2">دسته‌بندی</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                    selectedCategory === ''
                      ? 'bg-rose-800 text-white border-rose-800'
                      : 'border-stone-200 text-stone-700'
                  }`}
                >
                  همه
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                      selectedCategory === cat.id
                        ? 'bg-rose-800 text-white border-rose-800'
                        : 'border-stone-200 text-stone-700'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Sourness */}
            <div>
              <h4 className="text-xs font-bold text-stone-700 mb-2">میزان ترشی</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: '', label: 'همه' },
                  { id: 'Sweet', label: 'شیرین' },
                  { id: 'SweetSour', label: 'ملس' },
                  { id: 'Sour', label: 'ترش' },
                  { id: 'ExtraSour', label: 'فوق‌العاده ترش' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSourness(s.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                      selectedSourness === s.id
                        ? 'bg-rose-800 text-white border-rose-800'
                        : 'border-stone-200 text-stone-700'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* In stock */}
            <div>
              <label className="flex items-center justify-between text-xs font-bold text-stone-800">
                <span>فقط کالاهای موجود</span>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="w-5 h-5 rounded text-rose-800"
                />
              </label>
            </div>

            <div className="flex gap-3 pt-4 border-t border-stone-200">
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 bg-rose-800 text-white py-3 rounded-xl font-bold text-xs"
              >
                مشاهده نتایج ({toPersianDigits(displayedProducts.length)})
              </button>
              <button
                onClick={clearFilters}
                className="bg-stone-100 text-stone-700 py-3 px-4 rounded-xl font-bold text-xs"
              >
                پاک کردن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
