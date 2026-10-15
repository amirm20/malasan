import React, { useState } from 'react';
import { User, Address } from '../../types';
import { formatPrice, toPersianDigits, formatDateFa } from '../../lib/formatters';
import { useToast } from '../../context/ToastContext';
import {
  Users,
  UserPlus,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  MapPin,
  ShoppingBag,
  CreditCard,
  Calendar,
  X,
  Check,
  Phone,
  Mail,
  ArrowUpDown,
  Filter,
  Sparkles,
} from 'lucide-react';

interface CustomersTabProps {
  users: (User & { ordersCount?: number; totalSpent?: number; lastOrderDate?: string })[];
  onRefresh: () => void;
  token: string | null;
}

export const CustomersTab: React.FC<CustomersTabProps> = ({ users, onRefresh, token }) => {
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [orderFilter, setOrderFilter] = useState<'all' | 'withOrders' | 'noOrders'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'orders' | 'spent' | 'name'>('newest');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<User | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<
    (User & { ordersCount?: number; totalSpent?: number; lastOrderDate?: string }) | null
  >(null);
  const [customerToDelete, setCustomerToDelete] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formFamily, setFormFamily] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formProvince, setFormProvince] = useState('تهران');
  const [formCity, setFormCity] = useState('تهران');
  const [formAddress, setFormAddress] = useState('');
  const [formPostalCode, setFormPostalCode] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  // Filter only customers
  const customersList = users.filter((u) => u.role === 'Customer' || (!u.role && !u.isSuperAdmin));

  const resetForm = () => {
    setFormName('');
    setFormFamily('');
    setFormMobile('');
    setFormEmail('');
    setFormPassword('');
    setFormProvince('تهران');
    setFormCity('تهران');
    setFormAddress('');
    setFormPostalCode('');
    setFormIsActive(true);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (c: User) => {
    setEditingCustomer(c);
    setFormName(c.name);
    setFormFamily(c.family || '');
    setFormMobile(c.mobile);
    setFormEmail(c.email || '');
    setFormPassword('');
    setFormIsActive(c.isActive);

    const defAddr = c.addresses?.find((a) => a.isDefault) || c.addresses?.[0];
    if (defAddr) {
      setFormProvince(defAddr.province || 'تهران');
      setFormCity(defAddr.city || 'تهران');
      setFormAddress(defAddr.fullAddress || '');
      setFormPostalCode(defAddr.postalCode || '');
    } else {
      setFormProvince('تهران');
      setFormCity('تهران');
      setFormAddress('');
      setFormPostalCode('');
    }
  };

  const handleToggleActive = async (c: User) => {
    try {
      const res = await fetch(`/api/admin/users/${c.id}/toggle`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        showToast(
          `حساب مشتری ${c.name} ${c.family} با موفقیت ${c.isActive ? 'غیرفعال' : 'فعال'} شد.`,
          'success'
        );
        onRefresh();
      } else {
        showToast('خطا در تغییر وضعیت حساب مشتری', 'error');
      }
    } catch {
      showToast('خطای شبکه در ارتباط با سرور', 'error');
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formMobile.trim()) {
      showToast('نام و شماره موبایل الزامی هستند.', 'error');
      return;
    }

    if (!editingCustomer && (!formPassword || formPassword.length < 6)) {
      showToast('رمز عبور مشتری باید حداقل ۶ رقم باشد.', 'error');
      return;
    }

    setIsSubmitting(true);
    const addresses: Address[] = formAddress.trim()
      ? [
          {
            id: `addr-${Date.now()}`,
            title: 'آدرس اصلی',
            receiverName: `${formName.trim()} ${formFamily.trim()}`,
            receiverMobile: formMobile.trim(),
            province: formProvince.trim(),
            city: formCity.trim(),
            fullAddress: formAddress.trim(),
            postalCode: formPostalCode.trim() || '1111111111',
            isDefault: true,
          },
        ]
      : [];

    const payload = {
      name: formName.trim(),
      family: formFamily.trim(),
      mobile: formMobile.trim(),
      email: formEmail.trim(),
      role: 'Customer',
      permissions: [],
      isActive: formIsActive,
      addresses,
      ...(formPassword && formPassword.trim().length >= 6
        ? { password: formPassword.trim() }
        : {}),
    };

    try {
      if (editingCustomer) {
        const res = await fetch(`/api/admin/users/${editingCustomer.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          showToast(`اطلاعات مشتری ${payload.name} با موفقیت بروزرسانی شد.`, 'success');
          setEditingCustomer(null);
          onRefresh();
        } else {
          const err = await res.json();
          showToast(err.message || 'خطا در ویرایش مشتری', 'error');
        }
      } else {
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          showToast(`مشتری جدید ${payload.name} با موفقیت ثبت شد.`, 'success');
          setIsAddModalOpen(false);
          resetForm();
          onRefresh();
        } else {
          const err = await res.json();
          showToast(err.message || 'خطا در ایجاد مشتری', 'error');
        }
      }
    } catch {
      showToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDeleteCustomer = async () => {
    if (!customerToDelete) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${customerToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        showToast(`حساب مشتری ${customerToDelete.name} با موفقیت حذف گردید.`, 'success');
        setCustomerToDelete(null);
        onRefresh();
      } else {
        const err = await res.json();
        showToast(err.message || 'خطا در حذف مشتری', 'error');
      }
    } catch {
      showToast('خطای شبکه در حذف مشتری', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter & Search & Sort
  const filteredCustomers = customersList
    .filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        c.name.toLowerCase().includes(q) ||
        (c.family && c.family.toLowerCase().includes(q)) ||
        c.mobile.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        c.addresses?.some(
          (a) =>
            a.city?.toLowerCase().includes(q) ||
            a.province?.toLowerCase().includes(q) ||
            a.fullAddress?.toLowerCase().includes(q)
        );

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
          ? c.isActive
          : !c.isActive;

      const orderCount = c.ordersCount || 0;
      const matchesOrders =
        orderFilter === 'all'
          ? true
          : orderFilter === 'withOrders'
          ? orderCount > 0
          : orderCount === 0;

      return matchesSearch && matchesStatus && matchesOrders;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'orders') {
        return (b.ordersCount || 0) - (a.ordersCount || 0);
      }
      if (sortBy === 'spent') {
        return (b.totalSpent || 0) - (a.totalSpent || 0);
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, 'fa');
      }
      return 0;
    });

  // Metrics
  const activeCount = customersList.filter((c) => c.isActive).length;
  const withOrdersCount = customersList.filter((c) => (c.ordersCount || 0) > 0).length;
  const grandTotalSpent = customersList.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-black text-stone-900">
              {toPersianDigits(customersList.length)}
            </div>
            <div className="text-xs text-stone-500 font-medium">کل مشتریان ثبت‌نامی</div>
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
            <div className="text-xs text-stone-500 font-medium">مشتریان فعال</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-black text-blue-800">
              {toPersianDigits(withOrdersCount)}
            </div>
            <div className="text-xs text-stone-500 font-medium">خریداران با سابقه سفارش</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="text-lg font-black text-rose-900">
              {formatPrice(grandTotalSpent)}
            </div>
            <div className="text-xs text-stone-500 font-medium">مجموع خرید مشتریان</div>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-2xs space-y-6">
        {/* Header & New Customer Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <h2 className="text-base font-black text-stone-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" />
              <span>مدیریت کامل مشتریان و باشگاه مشتریان</span>
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              مشاهده سوابق خرید، مدیریت اطلاعات تماس و آدرس‌ها، فعال/غیرفعال‌سازی و جستجوی پیشرفته
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-amber-400 text-xs font-black px-4 py-2.5 rounded-2xl transition-all shadow-md active:scale-95 self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>ثبت مشتری جدید</span>
          </button>
        </div>

        {/* Search, Filter & Sort Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو بر اساس نام، موبایل، ایمیل، استان، شهر..."
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl pr-10 pl-4 py-2 text-xs text-stone-800 outline-hidden focus:border-amber-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Filter Status & Orders */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-3 py-2 text-xs font-bold text-stone-700 outline-hidden cursor-pointer"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="active">فقط فعال</option>
              <option value="inactive">فقط غیرفعال</option>
            </select>

            <select
              value={orderFilter}
              onChange={(e: any) => setOrderFilter(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-3 py-2 text-xs font-bold text-stone-700 outline-hidden cursor-pointer"
            >
              <option value="all">همه مشتریان</option>
              <option value="withOrders">دارای سفارش</option>
              <option value="noOrders">بدون سفارش</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-4 h-4 text-stone-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-3 py-2 text-xs font-bold text-stone-700 outline-hidden cursor-pointer"
            >
              <option value="newest">جدیدترین تاریخ عضویت</option>
              <option value="oldest">قدیمی‌ترین تاریخ عضویت</option>
              <option value="orders">بیشترین تعداد سفارش</option>
              <option value="spent">بیشترین مبلغ خرید (تومان)</option>
              <option value="name">نام به ترتیب الفبا</option>
            </select>
          </div>
        </div>

        {/* Customer Table */}
        <div className="overflow-x-auto rounded-2xl border border-stone-100">
          <table className="w-full text-right text-xs divide-y divide-stone-200">
            <thead>
              <tr className="bg-stone-50 text-stone-600 font-black">
                <th className="p-3.5">مشخصات مشتری</th>
                <th className="p-3.5">موبایل / ایمیل</th>
                <th className="p-3.5">شهر / آدرس پیش‌فرض</th>
                <th className="p-3.5">تعداد سفارش</th>
                <th className="p-3.5">مجموع خرید</th>
                <th className="p-3.5">تاریخ عضویت</th>
                <th className="p-3.5">وضعیت</th>
                <th className="p-3.5 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-stone-400">
                    هیچ مشتری با مشخصات فیلتر شده یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const defAddr = c.addresses?.find((a) => a.isDefault) || c.addresses?.[0];
                  return (
                    <tr key={c.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="p-3.5 font-bold text-stone-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center font-black text-xs">
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-black text-stone-900">
                              {c.name} {c.family}
                            </div>
                            <div className="text-[10px] text-stone-400">شناسه: {c.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <div className="font-mono text-stone-900 font-bold dir-ltr text-right">
                            {c.mobile}
                          </div>
                          <div className="font-mono text-[11px] text-stone-400 dir-ltr text-right truncate max-w-[130px]">
                            {c.email || '-'}
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 max-w-[160px] truncate text-stone-600">
                        {defAddr ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-stone-800">
                              {defAddr.province} - {defAddr.city}
                            </span>
                            <div className="text-[10px] text-stone-400 truncate">
                              {defAddr.fullAddress}
                            </div>
                          </div>
                        ) : (
                          <span className="text-stone-400">بدون آدرس ثبت‌شده</span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 font-bold bg-stone-100 px-2.5 py-1 rounded-xl text-stone-800">
                          <ShoppingBag className="w-3 h-3 text-stone-500" />
                          <span>{toPersianDigits(c.ordersCount || 0)} سفارش</span>
                        </span>
                      </td>

                      <td className="p-3.5 font-black text-rose-900">
                        {c.totalSpent && c.totalSpent > 0 ? (
                          formatPrice(c.totalSpent)
                        ) : (
                          <span className="text-stone-400 font-normal">بدون خرید</span>
                        )}
                      </td>

                      <td className="p-3.5 font-mono text-stone-500 text-[11px]">
                        {formatDateFa(c.createdAt)}
                      </td>

                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(c)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                            c.isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                          }`}
                          title={c.isActive ? 'کلیک کنید تا غیرفعال شود' : 'کلیک کنید تا فعال شود'}
                        >
                          {c.isActive ? (
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
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingCustomer(c)}
                            className="p-1.5 rounded-lg text-stone-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                            title="مشاهده جزئیات و آدرس‌ها"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 rounded-lg text-stone-600 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                            title="ویرایش اطلاعات مشتری"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setCustomerToDelete(c)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                            title="حذف حساب مشتری"
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

      {/* View Customer Details Modal */}
      {viewingCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 font-black flex items-center justify-center">
                  {viewingCustomer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-sm text-stone-900">
                    پروفایل مشتری: {viewingCustomer.name} {viewingCustomer.family}
                  </h3>
                  <p className="text-[11px] text-stone-400">شناسه کاربر: {viewingCustomer.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingCustomer(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 text-center">
                <div className="text-[11px] text-stone-500">تعداد کل سفارش‌ها</div>
                <div className="text-base font-black text-stone-900 mt-1">
                  {toPersianDigits(viewingCustomer.ordersCount || 0)} عدد
                </div>
              </div>

              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-center">
                <div className="text-[11px] text-rose-800">مجموع خرید موفق</div>
                <div className="text-base font-black text-rose-900 mt-1">
                  {formatPrice(viewingCustomer.totalSpent || 0)}
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="bg-stone-50 rounded-2xl p-4 space-y-2 border border-stone-200 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-500 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-stone-400" />
                  <span>شماره موبایل:</span>
                </span>
                <span className="font-mono font-bold text-stone-900 dir-ltr">
                  {viewingCustomer.mobile}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-stone-500 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-stone-400" />
                  <span>آدرس ایمیل:</span>
                </span>
                <span className="font-mono text-stone-800 dir-ltr">
                  {viewingCustomer.email || 'ثبت نشده'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-stone-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  <span>تاریخ ثبت‌نام:</span>
                </span>
                <span className="text-stone-800 font-mono">
                  {formatDateFa(viewingCustomer.createdAt)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-stone-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-stone-400" />
                  <span>وضعیت حساب:</span>
                </span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-md text-[10px] ${
                    viewingCustomer.isActive
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {viewingCustomer.isActive ? 'فعال و مجاز به خرید' : 'غیرفعال / مسدود'}
                </span>
              </div>
            </div>

            {/* Saved Addresses */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-500" />
                <span>دفترچه آدرس‌های ثبت‌شده:</span>
              </h4>

              {viewingCustomer.addresses && viewingCustomer.addresses.length > 0 ? (
                <div className="space-y-2">
                  {viewingCustomer.addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="bg-white border border-stone-200 rounded-2xl p-3.5 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-bold text-stone-800">
                        <span>{addr.title}</span>
                        {addr.isDefault && (
                          <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                            پیش‌فرض
                          </span>
                        )}
                      </div>
                      <p className="text-stone-600 text-[11px] leading-relaxed">
                        {addr.province} - {addr.city}، {addr.fullAddress}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1">
                        <span>گیرنده: {addr.receiverName}</span>
                        <span>کد پستی: {addr.postalCode}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-stone-50 p-4 rounded-2xl text-center text-xs text-stone-400">
                  این مشتری هنوز آدرسی در سیستم ذخیره نکرده است.
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setViewingCustomer(null)}
                className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-2.5 rounded-xl text-xs"
              >
                بستن پنجره
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {(isAddModalOpen || editingCustomer) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-black text-base text-stone-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" />
                <span>{editingCustomer ? 'ویرایش مشخصات مشتری' : 'ثبت مشتری جدید در سامانه'}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingCustomer(null);
                }}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">نام</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="مثلاً: سهراب"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-hidden focus:border-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    نام خانوادگی
                  </label>
                  <input
                    type="text"
                    value={formFamily}
                    onChange={(e) => setFormFamily(e.target.value)}
                    placeholder="مثلاً: سپهری"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-hidden focus:border-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    شماره موبایل (الزامی)
                  </label>
                  <input
                    type="text"
                    required
                    value={formMobile}
                    onChange={(e) => setFormMobile(e.target.value)}
                    placeholder="0912..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-mono font-bold text-stone-900 outline-hidden focus:border-amber-500 focus:bg-white dir-ltr text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    پست الکترونیکی (ایمیل)
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="customer@..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-mono font-bold text-stone-900 outline-hidden focus:border-amber-500 focus:bg-white dir-ltr text-right"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {editingCustomer
                    ? 'تغییر رمز عبور (اختیاری)'
                    : 'رمز عبور حساب مشتری (حداقل ۶ رقم)'}
                </label>
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={
                    editingCustomer
                      ? 'در صورت تمایل به تغییر رمز عبور مشتری وارد کنید'
                      : 'رمز عبور حساب...'
                  }
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-900 outline-hidden focus:border-amber-500 focus:bg-white"
                />
              </div>

              {/* Address details */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
                <h4 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>آدرس و موقعیت ارسال:</span>
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">استان</label>
                    <input
                      type="text"
                      value={formProvince}
                      onChange={(e) => setFormProvince(e.target.value)}
                      placeholder="تهران"
                      className="w-full bg-white border border-stone-200 rounded-xl p-2 text-xs text-stone-800 outline-hidden focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">شهر</label>
                    <input
                      type="text"
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      placeholder="تهران"
                      className="w-full bg-white border border-stone-200 rounded-xl p-2 text-xs text-stone-800 outline-hidden focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    نشانی پستی دقیق
                  </label>
                  <textarea
                    rows={2}
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="خیابان، پلاک، واحد..."
                    className="w-full bg-white border border-stone-200 rounded-xl p-2 text-xs text-stone-800 outline-hidden focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">کد پستی</label>
                  <input
                    type="text"
                    value={formPostalCode}
                    onChange={(e) => setFormPostalCode(e.target.value)}
                    placeholder="۱۰ رقمی"
                    className="w-full bg-white border border-stone-200 rounded-xl p-2 text-xs font-mono text-stone-800 outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="customerActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
                <label
                  htmlFor="customerActive"
                  className="text-xs font-bold text-stone-700 cursor-pointer"
                >
                  حساب مشتری فعال و مجاز به ورود و ثبت سفارش آنلاین باشد
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingCustomer(null);
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
                  <span>{editingCustomer ? 'ذخیره مشخصات' : 'ثبت مشتری'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-stone-200 text-center">
            <div className="w-12 h-12 bg-red-100 text-red-700 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="font-black text-stone-900 text-sm">
              آیا از حذف حساب مشتری اطمینان دارید؟
            </h3>

            <p className="text-xs text-stone-600">
              حساب کاربری{' '}
              <span className="font-bold text-rose-900">
                {customerToDelete.name} {customerToDelete.family}
              </span>{' '}
              به طور دائم حذف خواهد شد.
            </p>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold px-4 py-2 rounded-xl"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={executeDeleteCustomer}
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
