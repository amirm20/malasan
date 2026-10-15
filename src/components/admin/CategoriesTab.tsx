import React, { useState } from 'react';
import { Category, Product } from '../../types';
import { useToast } from '../../context/ToastContext';
import { toPersianDigits } from '../../lib/formatters';
import { ImageUploadField } from '../common/ImageUploadField';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Package,
  ArrowUpDown,
  X,
  Sparkles,
  AlertTriangle,
  FolderTree,
} from 'lucide-react';

interface CategoriesTabProps {
  categories: Category[];
  products: Product[];
  onRefresh: () => void;
  token: string | null;
}

const PRESET_CATEGORY_IMAGES = [
  {
    label: 'لواشک انار سرخ',
    url: 'https://images.unsplash.com/photo-1541344999736-83eca872f242?w=800&q=80',
  },
  {
    label: 'لواشک آلبالو و زرشک ترش',
    url: 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=800&q=80',
  },
  {
    label: 'لواشک آلو و زردآلو ملس',
    url: 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=800&q=80',
  },
  {
    label: 'لواشک کیوی و تمشک جنگلی',
    url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&q=80',
  },
  {
    label: 'لواشک لقمه‌ای و رولی مجلسی',
    url: 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=800&q=80',
  },
  {
    label: 'پخش عمده و کارتن کارگاهی',
    url: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800&q=80',
  },
];

export const CategoriesTab: React.FC<CategoriesTabProps> = ({
  categories,
  products,
  onRefresh,
  token,
}) => {
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirm State
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtered Categories
  const filteredCategories = categories.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  });

  const activeCount = categories.filter((c) => c.isActive).length;
  const inactiveCount = categories.length - activeCount;

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setImageUrl('');
    setDisplayOrder(categories.length + 1);
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setImageUrl(cat.imageUrl || '');
    setDisplayOrder(cat.displayOrder ?? 1);
    setIsActive(cat.isActive ?? true);
    setShowModal(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      // Auto-generate slug if new category
      const generatedSlug = val
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\u0600-\u06FF-]/g, '');
      setSlug(generatedSlug || `cat-${Date.now()}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('لطفاً عنوان دسته‌بندی را وارد نمایید.', 'error');
      return;
    }

    setIsSubmitting(true);
    const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    const payload = {
      name: name.trim(),
      slug: slug.trim() || `cat-${Date.now()}`,
      description: description.trim(),
      imageUrl: imageUrl.trim() || PRESET_CATEGORY_IMAGES[0].url,
      displayOrder: Number(displayOrder) || 1,
      isActive,
    };

    try {
      const url = editingCategory
        ? `/api/categories/${editingCategory.id}`
        : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast(
          editingCategory ? 'دسته‌بندی با موفقیت ویرایش شد.' : 'دسته‌بندی جدید با موفقیت اضافه شد.',
          'success'
        );
        setShowModal(false);
        onRefresh();
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.message || 'خطا در ذخیره دسته‌بندی.', 'error');
      }
    } catch {
      showToast('خطای شبکه در ارتباط با سرور.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (cat: Category) => {
    const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify({ ...cat, isActive: !cat.isActive }),
      });
      if (res.ok) {
        showToast(`دسته‌بندی «${cat.name}» ${!cat.isActive ? 'فعال' : 'غیرفعال'} شد.`, 'success');
        onRefresh();
      } else {
        showToast('خطا در تغییر وضعیت دسته‌بندی.', 'error');
      }
    } catch {
      showToast('خطای شبکه.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deletingCat) return;
    setIsDeleting(true);
    const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const res = await fetch(`/api/categories/${deletingCat.id}`, {
        method: 'DELETE',
        headers: authHeader,
      });

      if (res.ok) {
        showToast(`دسته‌بندی «${deletingCat.name}» حذف گردید.`, 'success');
        setDeletingCat(null);
        onRefresh();
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.message || 'خطا در حذف دسته‌بندی.', 'error');
      }
    } catch {
      showToast('خطای شبکه در حذف دسته‌بندی.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-700" />
            <span>مدیریت دسته‌بندی‌های محصولات و طعم‌ها</span>
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            دسته‌بندی‌های لواشک (انار، آلو، آلبالو، کیوی و...) را تعریف، ویرایش و مدیریت نمایید.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer self-stretch sm:self-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          <span>دسته‌بندی جدید</span>
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-bold text-stone-500 block">کل دسته‌بندی‌ها</span>
          <span className="text-xl font-black text-stone-900 mt-1 block">
            {toPersianDigits(categories.length)}
          </span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-600 block">دسته‌های فعال در سایت</span>
          <span className="text-xl font-black text-emerald-700 mt-1 block">
            {toPersianDigits(activeCount)}
          </span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-bold text-stone-400 block">دسته‌های غیرفعال</span>
          <span className="text-xl font-black text-stone-600 mt-1 block">
            {toPersianDigits(inactiveCount)}
          </span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-700 block">کل تنوع محصولات ثبت‌شده</span>
          <span className="text-xl font-black text-stone-900 mt-1 block">
            {toPersianDigits(products.length)} کالا
          </span>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در نام، شناسه یا توضیحات دسته‌بندی..."
            className="w-full bg-stone-50 border border-stone-200 rounded-xl pr-10 pl-4 py-2 text-xs text-stone-800 outline-hidden focus:border-indigo-600 focus:bg-white transition-colors"
          />
        </div>

        <div className="text-xs text-stone-500 font-medium">
          نمایش {toPersianDigits(filteredCategories.length)} از {toPersianDigits(categories.length)} دسته‌بندی
        </div>
      </div>

      {/* Category List Cards */}
      {filteredCategories.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-700 mx-auto flex items-center justify-center">
            <FolderTree className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-stone-800 text-sm">هیچ دسته‌بندی‌ای یافت نشد</h3>
            <p className="text-xs text-stone-500 mt-1">
              {searchQuery ? 'با عبارت جستجو شده موردی مطابقت ندارد.' : 'هنوز هیچ دسته‌بندی‌ای تعریف نشده است.'}
            </p>
          </div>
          <button
            type="button"
            onClick={openAddModal}
            className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            ایجاد اولین دسته‌بندی
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCategories.map((cat) => {
            const productCount = products.filter((p) => p.categoryId === cat.id).length;
            return (
              <div
                key={cat.id}
                className={`bg-white rounded-3xl border overflow-hidden shadow-2xs transition-all hover:shadow-md flex flex-col justify-between ${
                  cat.isActive ? 'border-stone-200' : 'border-stone-200/60 opacity-80 bg-stone-50/50'
                }`}
              >
                <div>
                  {/* Category Image Header */}
                  <div className="relative h-40 bg-stone-100 overflow-hidden group">
                    <img
                      src={cat.imageUrl || PRESET_CATEGORY_IMAGES[0].url}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = PRESET_CATEGORY_IMAGES[0].url;
                      }}
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-stone-950/70 via-transparent to-transparent flex items-end p-4">
                      <div className="text-white">
                        <span className="text-[10px] bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full font-mono">
                          #{toPersianDigits(cat.displayOrder ?? 1)}
                        </span>
                        <h3 className="font-black text-sm text-white drop-shadow-xs mt-1">
                          {cat.name}
                        </h3>
                      </div>
                    </div>

                    {/* Active/Inactive badge */}
                    <div className="absolute top-3 left-3">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(cat)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-xl shadow-xs transition-colors flex items-center gap-1 backdrop-blur-md cursor-pointer ${
                          cat.isActive
                            ? 'bg-emerald-600/90 text-white hover:bg-emerald-700'
                            : 'bg-stone-800/90 text-stone-300 hover:bg-stone-900'
                        }`}
                        title="برای تغییر وضعیت کلیک کنید"
                      >
                        {cat.isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>فعال</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            <span>غیرفعال</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-stone-400 dir-ltr text-[11px]">
                        /{cat.slug}
                      </span>
                      <span className="bg-stone-100 text-stone-700 text-[11px] font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                        <Package className="w-3 h-3 text-stone-500" />
                        <span>{toPersianDigits(productCount)} محصول</span>
                      </span>
                    </div>

                    <p className="text-xs text-stone-600 leading-relaxed line-clamp-2 min-h-8">
                      {cat.description || 'توضیحاتی برای این دسته‌بندی ثبت نشده است.'}
                    </p>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-stone-50/70 border-t border-stone-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-stone-400">
                    شناسه: <span className="font-mono">{cat.id}</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(cat)}
                      className="bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-indigo-700" />
                      <span>ویرایش</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingCat(cat)}
                      className="text-stone-400 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-xl transition-colors cursor-pointer"
                      title="حذف دسته‌بندی"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto border border-stone-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-stone-900">
                    {editingCategory ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی جدید'}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    مشخصات طعم یا خانواده محصولات را وارد نمایید.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category Name */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  نام دسته‌بندی <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="مثلاً: لواشک انار ساوه، لواشک آلو و زردآلو..."
                  className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 outline-hidden focus:border-indigo-600 font-bold"
                />
              </div>

              {/* Slug & Display Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    شناسه یکتا (Slug انگلیسی) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="pomegranate-sour"
                    className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono dir-ltr text-left text-stone-800 outline-hidden focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    ترتیب نمایش در منو و سایت
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Number(e.target.value))}
                    className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 outline-hidden focus:border-indigo-600 font-mono"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  توضیحات و ویژگی طعم
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="توضیح کوتاه درباره خواص، بافت و مزه این دسته محصولات..."
                  className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs text-stone-800 outline-hidden focus:border-indigo-600"
                />
              </div>

              {/* Image Upload with ImageUploadField */}
              <ImageUploadField
                label="تصویر شاخص دسته‌بندی"
                value={imageUrl}
                onChange={setImageUrl}
                presetImages={PRESET_CATEGORY_IMAGES}
                aspectRatioClass="h-44"
                helpText="می‌توانید عکس را مستقیماً از حافظه کامپیوتر یا موبایل انتخاب یا با تصویر جدید جایگزین نمایید."
              />

              {/* Active Toggle */}
              <div className="flex items-center gap-2 p-3 bg-stone-50 rounded-2xl border border-stone-200">
                <input
                  type="checkbox"
                  id="cat-is-active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded-md border-stone-300 text-indigo-700 focus:ring-indigo-600 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="cat-is-active" className="text-xs font-bold text-stone-800 cursor-pointer">
                  این دسته‌بندی در فروشگاه و منوی سایت به صورت فعال نمایش داده شود
                </label>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold text-xs cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'در حال ذخیره‌سازی...' : editingCategory ? 'ذخیره تغییرات' : 'افزودن دسته‌بندی'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-stone-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="font-bold text-sm text-stone-900">
                آیا از حذف دسته‌بندی «{deletingCat.name}» مطمئن هستید؟
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                {products.filter((p) => p.categoryId === deletingCat.id).length > 0 ? (
                  <span className="text-rose-700 font-bold block">
                    هشدار: تعداد {toPersianDigits(products.filter((p) => p.categoryId === deletingCat.id).length)} محصول در این دسته‌بندی قرار دارد. قبل از حذف، دسته‌بندی آن‌ها را تغییر دهید.
                  </span>
                ) : (
                  'این عملیات غیرقابل بازگشت است و دسته‌بندی از سایت حذف خواهد شد.'
                )}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCat(null)}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold text-xs cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                {isDeleting ? 'در حال حذف...' : 'تأیید و حذف قطعی'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
