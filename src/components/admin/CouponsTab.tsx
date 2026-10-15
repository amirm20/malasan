import React, { useState } from 'react';
import { Coupon, CouponType } from '../../types';
import { formatPrice, toPersianDigits, formatDateFa } from '../../lib/formatters';
import { useToast } from '../../context/ToastContext';
import {
  Tag,
  Plus,
  Trash2,
  Edit3,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Percent,
  Calendar,
  Layers,
  Sparkles,
  X,
  Check,
} from 'lucide-react';

interface CouponsTabProps {
  coupons: Coupon[];
  onRefresh: () => void;
  token: string | null;
}

export const CouponsTab: React.FC<CouponsTabProps> = ({ coupons, onRefresh, token }) => {
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Percent' | 'FixedAmount'>('all');
  const [firstOrderFilter, setFirstOrderFilter] = useState<'all' | 'first_order' | 'regular'>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formCode, setFormCode] = useState('');
  const [formType, setFormType] = useState<CouponType>('Percent');
  const [formValue, setFormValue] = useState<number>(15);
  const [formMinOrder, setFormMinOrder] = useState<number>(100000);
  const [formMaxDiscount, setFormMaxDiscount] = useState<number | undefined>(undefined);
  const [formUsageLimit, setFormUsageLimit] = useState<number>(100);
  const [formStartDate, setFormStartDate] = useState<string>('');
  const [formEndDate, setFormEndDate] = useState<string>('');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formFirstOrderOnly, setFormFirstOrderOnly] = useState<boolean>(false);

  // Reset form
  const resetForm = () => {
    setFormCode('');
    setFormType('Percent');
    setFormValue(15);
    setFormMinOrder(100000);
    setFormMaxDiscount(undefined);
    setFormUsageLimit(100);
    setFormStartDate(new Date().toISOString().split('T')[0]);
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setFormEndDate(nextMonth.toISOString().split('T')[0]);
    setFormIsActive(true);
    setFormFirstOrderOnly(false);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (c: Coupon) => {
    setEditingCoupon(c);
    setFormCode(c.code);
    setFormType(c.type);
    setFormValue(c.value);
    setFormMinOrder(c.minOrderAmount || 0);
    setFormMaxDiscount(c.maxDiscountAmount);
    setFormUsageLimit(c.usageLimit || 100);
    setFormStartDate(c.startDate ? c.startDate.split('T')[0] : '');
    setFormEndDate(c.endDate ? c.endDate.split('T')[0] : '');
    setFormIsActive(c.isActive);
    setFormFirstOrderOnly(Boolean(c.firstOrderOnly));
  };

  const handleToggleActive = async (c: Coupon) => {
    try {
      const res = await fetch(`/api/coupons/${c.id}/toggle`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        showToast(
          `کد تخفیف ${c.code} با موفقیت ${c.isActive ? 'غیرفعال' : 'فعال'} شد`,
          'success'
        );
        onRefresh();
      } else {
        showToast('خطا در تغییر وضعیت کد تخفیف', 'error');
      }
    } catch {
      showToast('خطای شبکه در بروزرسانی وضعیت', 'error');
    }
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim()) {
      showToast('لطفاً عنوان یا کد تخفیف را وارد نمایید.', 'error');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      code: formCode.trim().toUpperCase(),
      type: formType,
      value: Number(formValue),
      minOrderAmount: Number(formMinOrder),
      maxDiscountAmount: formMaxDiscount ? Number(formMaxDiscount) : undefined,
      usageLimit: Number(formUsageLimit),
      startDate: formStartDate ? new Date(formStartDate).toISOString() : new Date().toISOString(),
      endDate: formEndDate
        ? new Date(formEndDate).toISOString()
        : new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      isActive: formIsActive,
      firstOrderOnly: Boolean(formFirstOrderOnly),
    };

    try {
      if (editingCoupon) {
        // Edit existing coupon
        const res = await fetch(`/api/coupons/${editingCoupon.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          showToast(`کد تخفیف ${payload.code} با موفقیت ویرایش شد.`, 'success');
          setEditingCoupon(null);
          onRefresh();
        } else {
          const err = await res.json();
          showToast(err.message || 'خطا در ویرایش کد تخفیف', 'error');
        }
      } else {
        // Create new coupon
        const res = await fetch('/api/coupons', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          showToast(`کد تخفیف ${payload.code} با موفقیت ایجاد شد.`, 'success');
          setIsAddModalOpen(false);
          resetForm();
          onRefresh();
        } else {
          const err = await res.json();
          showToast(err.message || 'خطا در ایجاد کد تخفیف', 'error');
        }
      }
    } catch {
      showToast('خطا در برقراری ارتباط با سرور', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDeleteCoupon = async () => {
    if (!couponToDelete) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/coupons/${couponToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        showToast(`کد تخفیف ${couponToDelete.code} حذف شد.`, 'success');
        setCouponToDelete(null);
        onRefresh();
      } else {
        showToast('خطا در حذف کد تخفیف', 'error');
      }
    } catch {
      showToast('خطای شبکه در حذف کد تخفیف', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter & Search
  const filteredCoupons = coupons.filter((c) => {
    const matchesSearch =
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? c.isActive
        : !c.isActive;
    const matchesType =
      typeFilter === 'all' ? true : c.type === typeFilter;
    const matchesFirstOrder =
      firstOrderFilter === 'all'
        ? true
        : firstOrderFilter === 'first_order'
        ? Boolean(c.firstOrderOnly)
        : !c.firstOrderOnly;
    return matchesSearch && matchesStatus && matchesType && matchesFirstOrder;
  });

  // Stats
  const activeCount = coupons.filter((c) => c.isActive).length;
  const inactiveCount = coupons.filter((c) => !c.isActive).length;
  const totalUses = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-black text-stone-900">
              {toPersianDigits(coupons.length)}
            </div>
            <div className="text-xs text-stone-500 font-medium">کل کدهای تخفیف</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-black text-emerald-700">
              {toPersianDigits(activeCount)}
            </div>
            <div className="text-xs text-stone-500 font-medium">کدهای فعال و آماده استفاده</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-700 flex items-center justify-center font-bold">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-black text-stone-700">
              {toPersianDigits(inactiveCount)}
            </div>
            <div className="text-xs text-stone-500 font-medium">غیرفعال یا منقضی</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-black text-rose-900">
              {toPersianDigits(totalUses)}
            </div>
            <div className="text-xs text-stone-500 font-medium">مجموع دفعات استفاده شده</div>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-2xs space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <h2 className="text-base font-black text-stone-900 flex items-center gap-2">
              <Tag className="w-5 h-5 text-amber-500" />
              <span>مدیریت کدهای تخفیف و جشنواره‌ها</span>
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              امکان ویرایش مشخصات، حذف کامل و فعال/غیرفعال‌سازی لحظه‌ای هر کد تخفیف
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-amber-400 text-xs font-black px-4 py-2.5 rounded-2xl transition-all shadow-md hover:shadow-lg active:scale-95 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>ایجاد کد تخفیف جدید</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در کد تخفیف..."
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl pr-10 pl-4 py-2 text-xs text-stone-800 outline-hidden focus:border-amber-500 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-2xl px-3 py-2 text-xs font-bold text-stone-700 outline-hidden cursor-pointer"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="active">فقط کدهای فعال</option>
              <option value="inactive">فقط کدهای غیرفعال</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e: any) => setTypeFilter(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-2xl px-3 py-2 text-xs font-bold text-stone-700 outline-hidden cursor-pointer"
            >
              <option value="all">همه انواع تخفیف</option>
              <option value="Percent">درصدی (٪)</option>
              <option value="FixedAmount">مبلغ ثابت (تومان)</option>
            </select>

            <select
              value={firstOrderFilter}
              onChange={(e: any) => setFirstOrderFilter(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-2xl px-3 py-2 text-xs font-bold text-stone-700 outline-hidden cursor-pointer"
            >
              <option value="all">همه کدهای تخفیف</option>
              <option value="first_order">فقط مخصوص خرید اول</option>
              <option value="regular">کدهای عمومی و همگانی</option>
            </select>
          </div>
        </div>

        {/* Table of Coupons */}
        <div className="overflow-x-auto rounded-2xl border border-stone-100">
          <table className="w-full text-right text-xs divide-y divide-stone-200">
            <thead>
              <tr className="bg-stone-50 text-stone-600 font-black">
                <th className="p-3.5">کد تخفیف</th>
                <th className="p-3.5">نوع</th>
                <th className="p-3.5">میزان تخفیف</th>
                <th className="p-3.5">حداقل سفارش</th>
                <th className="p-3.5">حداکثر سقف</th>
                <th className="p-3.5">استفاده / سقف</th>
                <th className="p-3.5">وضعیت فعال</th>
                <th className="p-3.5 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-stone-400">
                    هیچ کد تخفیفی با معیارهای جستجو یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((c) => {
                  const isExhausted = c.usedCount >= c.usageLimit;
                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-amber-50/40 transition-colors ${
                        !c.isActive ? 'bg-stone-50/50 opacity-75' : ''
                      }`}
                    >
                      <td className="p-3.5 font-mono font-black text-rose-900 text-sm">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-xl">
                            {c.code}
                          </span>
                          {c.firstOrderOnly && (
                            <span className="bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
                              <Sparkles className="w-3 h-3 text-sky-600" />
                              <span>فقط خرید اول</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-stone-700">
                          {c.type === 'Percent' ? 'درصدی' : 'مبلغ ثابت'}
                        </span>
                      </td>
                      <td className="p-3.5 font-black text-stone-900">
                        {c.type === 'Percent' ? (
                          <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                            ٪{toPersianDigits(c.value)} تخفیف
                          </span>
                        ) : (
                          <span className="text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                            {formatPrice(c.value)}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-stone-600 font-medium">
                        {c.minOrderAmount ? formatPrice(c.minOrderAmount) : 'بدون حداقل'}
                      </td>
                      <td className="p-3.5 text-stone-600 font-medium">
                        {c.maxDiscountAmount ? formatPrice(c.maxDiscountAmount) : 'نامحدود'}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1 font-mono font-bold">
                          <span className={isExhausted ? 'text-red-600' : 'text-stone-900'}>
                            {toPersianDigits(c.usedCount)}
                          </span>
                          <span className="text-stone-400">/</span>
                          <span className="text-stone-600">{toPersianDigits(c.usageLimit)}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(c)}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                            c.isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                          }`}
                          title={c.isActive ? 'کلیک کنید تا غیرفعال شود' : 'کلیک کنید تا فعال شود'}
                        >
                          {c.isActive ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>فعال</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>غیرفعال</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 rounded-lg text-stone-600 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                            title="ویرایش کد تخفیف"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setCouponToDelete(c)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                            title="حذف کد تخفیف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Coupon Modal */}
      {(isAddModalOpen || editingCoupon) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-black text-base text-stone-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-500" />
                <span>{editingCoupon ? 'ویرایش کد تخفیف' : 'ایجاد کد تخفیف جدید'}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingCoupon(null);
                }}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-4">
              {/* Code & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    کد تخفیف (لاتین یا فارسی)
                  </label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="مثلاً: MELAS20 یا NOROOZ"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-mono font-bold text-stone-900 outline-hidden focus:border-amber-500 focus:bg-white uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    نوع تخفیف
                  </label>
                  <select
                    value={formType}
                    onChange={(e: any) => setFormType(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-hidden cursor-pointer"
                  >
                    <option value="Percent">درصدی (٪)</option>
                    <option value="FixedAmount">مبلغ ثابت (تومان)</option>
                  </select>
                </div>
              </div>

              {/* Value & Min Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {formType === 'Percent' ? 'درصد تخفیف (۱ تا ۱۰۰)' : 'مبلغ تخفیف'}
                  </label>
                  <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl overflow-hidden focus-within:bg-white focus-within:border-amber-500">
                    <input
                      type="number"
                      required
                      min={1}
                      max={formType === 'Percent' ? 100 : 10000000}
                      value={formValue}
                      onChange={(e) => setFormValue(Number(e.target.value))}
                      className="flex-1 bg-transparent p-2.5 text-xs font-bold text-stone-900 outline-hidden dir-ltr text-left"
                    />
                    <span className="px-3 py-2 bg-stone-100 text-stone-500 font-bold text-xs border-r border-stone-200 select-none">
                      {formType === 'Percent' ? 'درصد (٪)' : 'تومان'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    حداقل مبلغ سفارش
                  </label>
                  <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl overflow-hidden focus-within:bg-white focus-within:border-amber-500">
                    <input
                      type="number"
                      min={0}
                      step={10000}
                      value={formMinOrder}
                      onChange={(e) => setFormMinOrder(Number(e.target.value))}
                      className="flex-1 bg-transparent p-2.5 text-xs font-bold text-stone-900 outline-hidden dir-ltr text-left"
                    />
                    <span className="px-3 py-2 bg-stone-100 text-stone-500 font-bold text-xs border-r border-stone-200 select-none">
                      تومان
                    </span>
                  </div>
                </div>
              </div>

              {/* Max Discount & Usage Limit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formType === 'Percent' ? (
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      حداکثر سقف تخفیف
                    </label>
                    <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl overflow-hidden focus-within:bg-white focus-within:border-amber-500">
                      <input
                        type="number"
                        min={0}
                        step={10000}
                        value={formMaxDiscount || ''}
                        onChange={(e) =>
                          setFormMaxDiscount(e.target.value ? Number(e.target.value) : undefined)
                        }
                        placeholder="اختیاری (مثلاً ۱۰۰,۰۰۰)"
                        className="flex-1 bg-transparent p-2.5 text-xs font-bold text-stone-900 outline-hidden dir-ltr text-left placeholder:text-[10px]"
                      />
                      <span className="px-3 py-2 bg-stone-100 text-stone-500 font-bold text-xs border-r border-stone-200 select-none">
                        تومان
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      نحوه محاسبه تخفیف
                    </label>
                    <div className="bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-500 font-medium">
                      مبلغ تخفیف به صورت ثابت از فاکتور کسر می‌شود.
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    سقف دفعات مجاز استفاده
                  </label>
                  <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl overflow-hidden focus-within:bg-white focus-within:border-amber-500">
                    <input
                      type="number"
                      required
                      min={1}
                      value={formUsageLimit}
                      onChange={(e) => setFormUsageLimit(Number(e.target.value))}
                      className="flex-1 bg-transparent p-2.5 text-xs font-bold text-stone-900 outline-hidden dir-ltr text-left"
                    />
                    <span className="px-3 py-2 bg-stone-100 text-stone-500 font-bold text-xs border-r border-stone-200 select-none">
                      مرتبه
                    </span>
                  </div>
                </div>
              </div>

              {/* Start & End Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    تاریخ شروع اعتبار
                  </label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-hidden focus:border-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    تاریخ انقضای کد
                  </label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-hidden focus:border-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* First Order Only Option */}
              <div className="bg-sky-50/70 border border-sky-200/80 rounded-2xl p-3.5 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="firstOrderOnlyCheck"
                  checked={formFirstOrderOnly}
                  onChange={(e) => setFormFirstOrderOnly(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-sky-600 rounded cursor-pointer shrink-0"
                />
                <label htmlFor="firstOrderOnlyCheck" className="text-xs cursor-pointer select-none">
                  <span className="font-black text-sky-950 flex items-center gap-2">
                    <span>اعمال فقط برای خرید اول</span>
                    <span className="text-[10px] font-bold bg-sky-200/70 text-sky-900 px-2 py-0.5 rounded-full">
                      مخصوص مشتریان جدید
                    </span>
                  </span>
                  <span className="text-[11px] text-sky-800/80 block mt-1 leading-relaxed">
                    با فعال‌سازی این گزینه، این کد تخفیف فقط برای کاربرانی که تا به حال هیچ سفارشی در سیستم ثبت نکرده‌اند معتبر خواهد بود و برای خریدهای بعدی غیرقابل استفاده است.
                  </span>
                </label>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 p-1">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
                <label htmlFor="activeCheck" className="text-xs font-bold text-stone-700 cursor-pointer">
                  کد فعال و آماده اعمال توسط مشتریان باشد
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingCoupon(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-stone-900 hover:bg-stone-800 text-amber-400 font-bold px-6 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingCoupon ? 'ذخیره تغییرات' : 'ایجاد کد تخفیف'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {couponToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-stone-200 text-center">
            <div className="w-12 h-12 bg-red-100 text-red-700 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="font-black text-stone-900 text-sm">
              آیا از حذف کد تخفیف مطمئن هستید؟
            </h3>

            <p className="text-xs text-stone-600">
              کد تخفیف <span className="font-mono font-bold text-rose-900">{couponToDelete.code}</span> به طور دائم حذف خواهد شد و دیگر در سبد خرید اعمال نخواهد شد.
            </p>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCouponToDelete(null)}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold px-4 py-2 rounded-xl"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={executeDeleteCoupon}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-5 py-2 rounded-xl"
              >
                بله، حذف شود
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
