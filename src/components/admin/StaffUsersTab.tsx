import React, { useState } from 'react';
import { User, AdminPermission, UserRole } from '../../types';
import { toPersianDigits, formatDateFa } from '../../lib/formatters';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  UserCheck,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Key,
  Shield,
  Layers,
  Lock,
  Unlock,
  X,
  Check,
  UserPlus,
  Store,
  Package,
  ShoppingBag,
  Briefcase,
  MessageSquare,
  Tag,
  Users,
  BookOpen,
  Settings,
} from 'lucide-react';

interface StaffUsersTabProps {
  users: User[];
  onRefresh: () => void;
  token: string | null;
}

export const PERMISSION_DEFINITIONS: {
  key: AdminPermission;
  label: string;
  desc: string;
  icon: any;
}[] = [
  {
    key: 'overview',
    label: 'داشبورد و آمار تحلیلی',
    desc: 'مشاهده آمار فروش، درآمد، سفارش‌های جدید و گزارش‌های کلی',
    icon: Store,
  },
  {
    key: 'products',
    label: 'محصولات و انبار',
    desc: 'ایجاد، ویرایش، حذف و کنترل موجودی انبار محصولات لواشک',
    icon: Package,
  },
  {
    key: 'orders',
    label: 'سفارش‌های آنلاین',
    desc: 'مشاهده جزئیات سفارش‌ها، تغییر وضعیت ارسال و صدور فاکتور',
    icon: ShoppingBag,
  },
  {
    key: 'wholesale',
    label: 'سفارش‌های عمده و همکاری',
    desc: 'مدیریت درخواست‌های خرید عمده و استعلام قیمت همکاران',
    icon: Briefcase,
  },
  {
    key: 'reviews',
    label: 'نظرات و دیدگاه‌ها',
    desc: 'تایید، عدم نمایش، پاسخ‌دهی و حذف نظرات کاربران سایت',
    icon: MessageSquare,
  },
  {
    key: 'categories',
    label: 'دسته‌بندی‌ها',
    desc: 'مدیریت دسته‌بندی‌های طعم و محصولات فروشگاه',
    icon: Layers,
  },
  {
    key: 'coupons',
    label: 'کدهای تخفیف و جشنواره',
    desc: 'تعریف و مدیریت کدهای تخفیف، سقف استفاده و فعال/غیرفعال‌سازی',
    icon: Tag,
  },
  {
    key: 'customers',
    label: 'مدیریت مشتریان',
    desc: 'مشاهده سوابق خرید خریداران، آدرس‌ها و مدیریت حساب مشتریان',
    icon: Users,
  },
  {
    key: 'staff',
    label: 'مدیریت مدیران و دسترسی‌ها (RBAC)',
    desc: 'تعریف کاربران جدید سیستم، تغییر رمز عبور و اعطای مجوزها (مختص مدیر ارشد)',
    icon: ShieldCheck,
  },
  {
    key: 'blog',
    label: 'وبلاگ و مقالات آموزشی',
    desc: 'انتشار، ویرایش و مدیریت مقالات خواص لواشک و اخبار',
    icon: BookOpen,
  },
  {
    key: 'settings',
    label: 'تنظیمات و بنرهای سایت',
    desc: 'تغییر اطلاعات تماس، بنرها، هزینه ارسال و پله‌های تخفیف عمده',
    icon: Settings,
  },
];

export const StaffUsersTab: React.FC<StaffUsersTabProps> = ({ users, onRefresh, token }) => {
  const { user: currentUser, isSuperAdmin } = useAuth();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'SuperAdmin' | 'Admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formFamily, setFormFamily] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('Admin');
  const [formPermissions, setFormPermissions] = useState<AdminPermission[]>([
    'overview',
    'products',
    'orders',
  ]);
  const [formIsActive, setFormIsActive] = useState(true);

  // Staff members only
  const staffList = users.filter((u) => u.role === 'Admin' || u.role === 'SuperAdmin');

  const resetForm = () => {
    setFormName('');
    setFormFamily('');
    setFormMobile('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('Admin');
    setFormPermissions(['overview', 'products', 'orders', 'wholesale', 'reviews']);
    setFormIsActive(true);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setFormName(u.name);
    setFormFamily(u.family || '');
    setFormMobile(u.mobile);
    setFormEmail(u.email || '');
    setFormPassword('');
    setFormRole(u.role);
    setFormPermissions(
      u.permissions && u.permissions.length > 0
        ? u.permissions
        : u.role === 'SuperAdmin'
        ? PERMISSION_DEFINITIONS.map((p) => p.key)
        : ['overview', 'products', 'orders']
    );
    setFormIsActive(u.isActive);
  };

  const togglePermission = (key: AdminPermission) => {
    if (formPermissions.includes(key)) {
      setFormPermissions(formPermissions.filter((p) => p !== key));
    } else {
      setFormPermissions([...formPermissions, key]);
    }
  };

  const handleToggleSelectAll = () => {
    if (formPermissions.length === PERMISSION_DEFINITIONS.length) {
      setFormPermissions(['overview']);
    } else {
      setFormPermissions(PERMISSION_DEFINITIONS.map((p) => p.key));
    }
  };

  const handleToggleActive = async (u: User) => {
    if (u.id === 'usr-admin-01') {
      showToast('حساب کاربری مدیر کل سامانه همیشه باید فعال بماند.', 'error');
      return;
    }
    if (u.id === currentUser?.id) {
      showToast('نمی‌توانید حساب کاربری فعلی خود را غیرفعال کنید.', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${u.id}/toggle`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        showToast(
          `حساب کاربری ${u.name} ${u.family} با موفقیت ${u.isActive ? 'غیرفعال' : 'فعال'} شد.`,
          'success'
        );
        onRefresh();
      } else {
        showToast('خطا در تغییر وضعیت حساب کاربری', 'error');
      }
    } catch {
      showToast('خطای شبکه در ارتباط با سرور', 'error');
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formMobile.trim()) {
      showToast('نام و شماره موبایل الزامی هستند.', 'error');
      return;
    }

    if (!editingUser && (!formPassword || formPassword.length < 6)) {
      showToast('لطفاً یک رمز عبور حداقل ۶ رقمی برای کاربر تعیین کنید.', 'error');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      name: formName.trim(),
      family: formFamily.trim(),
      mobile: formMobile.trim(),
      email: formEmail.trim(),
      role: formRole,
      permissions:
        formRole === 'SuperAdmin'
          ? PERMISSION_DEFINITIONS.map((p) => p.key)
          : formPermissions,
      isActive: formIsActive,
      ...(formPassword && formPassword.trim().length >= 6
        ? { password: formPassword.trim() }
        : {}),
    };

    try {
      if (editingUser) {
        // Edit existing user
        const res = await fetch(`/api/admin/users/${editingUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          showToast(`مشخصات و مجوزهای ${payload.name} بروزرسانی شد.`, 'success');
          setEditingUser(null);
          onRefresh();
        } else {
          const err = await res.json();
          showToast(err.message || 'خطا در ویرایش کاربر', 'error');
        }
      } else {
        // Create new user
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          showToast(`کاربر مدیریتی جدید ${payload.name} با موفقیت افزوده شد.`, 'success');
          setIsAddModalOpen(false);
          resetForm();
          onRefresh();
        } else {
          const err = await res.json();
          showToast(err.message || 'خطا در افزودن کاربر', 'error');
        }
      }
    } catch {
      showToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDeleteUser = async () => {
    if (!userToDelete) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        showToast(`حساب کاربری ${userToDelete.name} با موفقیت حذف شد.`, 'success');
        setUserToDelete(null);
        onRefresh();
      } else {
        const err = await res.json();
        showToast(err.message || 'خطا در حذف کاربر', 'error');
      }
    } catch {
      showToast('خطای شبکه در حذف کاربر', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter & Search
  const filteredStaff = staffList.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(q) ||
      (u.family && u.family.toLowerCase().includes(q)) ||
      u.mobile.includes(q) ||
      (u.email && u.email.toLowerCase().includes(q));

    const matchesRole =
      roleFilter === 'all' ? true : u.role === roleFilter;

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? u.isActive
        : !u.isActive;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Info */}
      <div className="bg-linear-to-r from-stone-900 to-stone-800 text-white rounded-3xl p-6 shadow-xl border border-stone-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>کنترل دسترسی نقش‌محور پرسنل (RBAC)</span>
                <span className="text-[11px] bg-amber-400 text-stone-950 font-black px-2.5 py-0.5 rounded-full">
                  سطح دسترسی پیشرفته
                </span>
              </h2>
              <p className="text-xs text-stone-300">
                مدیر ارشد می‌تواند به هر کاربر، مجوزهای مجزا (محصولات، سفارش‌ها، کوپن‌ها و ...) اختصاص دهد.
              </p>
            </div>
          </div>
        </div>

        {isSuperAdmin && (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-black text-xs px-5 py-3 rounded-2xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>تعریف مدیر / پرسنل جدید</span>
          </button>
        )}
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-2xs space-y-6">
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو بر اساس نام، موبایل، ایمیل کارشناس..."
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl pr-10 pl-4 py-2 text-xs text-stone-800 outline-hidden focus:border-amber-500 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={(e: any) => setRoleFilter(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-2xl px-3 py-2 text-xs font-bold text-stone-700 outline-hidden cursor-pointer"
            >
              <option value="all">همه نقش‌ها</option>
              <option value="SuperAdmin">مدیر ارشد (SuperAdmin)</option>
              <option value="Admin">مدیر / کارشناس (Admin)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-2xl px-3 py-2 text-xs font-bold text-stone-700 outline-hidden cursor-pointer"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="active">فقط فعال</option>
              <option value="inactive">فقط غیرفعال</option>
            </select>
          </div>
        </div>

        {/* Staff Table */}
        <div className="overflow-x-auto rounded-2xl border border-stone-100">
          <table className="w-full text-right text-xs divide-y divide-stone-200">
            <thead>
              <tr className="bg-stone-50 text-stone-600 font-black">
                <th className="p-3.5">نام و مشخصات کارشناس</th>
                <th className="p-3.5">اطلاعات تماس</th>
                <th className="p-3.5">سطح نقش</th>
                <th className="p-3.5">مجوزهای فعال سیستم</th>
                <th className="p-3.5">تاریخ عضویت</th>
                <th className="p-3.5">وضعیت</th>
                <th className="p-3.5 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-400">
                    هیچ کاربری با مشخصات جستجو شده یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((u) => {
                  const isRoot = u.id === 'usr-admin-01';
                  const userPerms = u.permissions || (u.role === 'SuperAdmin' ? PERMISSION_DEFINITIONS.map((p) => p.key) : []);
                  return (
                    <tr key={u.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-stone-900 text-amber-400 flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-black text-stone-900 flex items-center gap-1.5">
                              <span>
                                {u.name} {u.family}
                              </span>
                              {isRoot && (
                                <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full">
                                  مالک اصلی
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-stone-400 mt-0.5">شناسه: {u.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <div className="font-mono text-stone-900 font-bold dir-ltr text-right">
                            {u.mobile}
                          </div>
                          <div className="font-mono text-[11px] text-stone-400 dir-ltr text-right">
                            {u.email || '-'}
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        {u.role === 'SuperAdmin' ? (
                          <span className="inline-flex items-center gap-1 bg-amber-100 border border-amber-300 text-amber-900 font-black px-2.5 py-1 rounded-xl text-[11px]">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                            <span>مدیر ارشد کل</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-stone-100 border border-stone-200 text-stone-800 font-bold px-2.5 py-1 rounded-xl text-[11px]">
                            <UserCheck className="w-3.5 h-3.5 text-stone-600" />
                            <span>کارشناس سیستم</span>
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {u.role === 'SuperAdmin' ? (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                              تمام مجوزها (دسترسی نامحدود)
                            </span>
                          ) : userPerms.length === 0 ? (
                            <span className="text-stone-400 text-[11px]">بدون مجوز دسترسی</span>
                          ) : (
                            userPerms.map((pk) => {
                              const def = PERMISSION_DEFINITIONS.find((p) => p.key === pk);
                              return (
                                <span
                                  key={pk}
                                  className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md text-[10px] font-medium"
                                >
                                  {def?.label.split(' ')[0] || pk}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </td>

                      <td className="p-3.5 font-mono text-stone-500">
                        {formatDateFa(u.createdAt)}
                      </td>

                      <td className="p-3.5">
                        <button
                          type="button"
                          disabled={isRoot || !isSuperAdmin}
                          onClick={() => handleToggleActive(u)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                            isRoot || !isSuperAdmin ? 'cursor-not-allowed opacity-90' : 'cursor-pointer hover:shadow-xs'
                          } ${
                            u.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-200 text-stone-700'
                          }`}
                          title={
                            isRoot
                              ? 'مدیر کل غیرفعال نمی‌شود'
                              : isSuperAdmin
                              ? 'تغییر وضعیت فعال/غیرفعال'
                              : 'فقط مدیر ارشد دسترسی دارد'
                          }
                        >
                          {u.isActive ? (
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
                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(u)}
                              className="p-1.5 rounded-lg text-stone-600 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                              title="ویرایش مشخصات و مجوزها"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {isSuperAdmin && !isRoot && u.id !== currentUser?.id && (
                            <button
                              type="button"
                              onClick={() => setUserToDelete(u)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                              title="حذف حساب"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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

      {/* Add / Edit Staff Modal */}
      {(isAddModalOpen || editingUser) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-black text-base text-stone-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                <span>
                  {editingUser
                    ? `ویرایش مدیر و مجوزها: ${editingUser.name} ${editingUser.family}`
                    : 'تعریف کارشناس یا مدیر جدید'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingUser(null);
                }}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-5">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">نام</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="مثلاً: علیرضا"
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
                    placeholder="مثلاً: احمدی"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-hidden focus:border-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    شماره موبایل (نام کاربری ورود)
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
                    placeholder="info@..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-mono font-bold text-stone-900 outline-hidden focus:border-amber-500 focus:bg-white dir-ltr text-right"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <Key className="w-4 h-4 text-amber-600" />
                  <span>
                    {editingUser
                      ? 'تغییر رمز عبور (در صورت نیاز به رمز جدید وارد کنید)'
                      : 'تعیین رمز عبور حساب کاربری (الزامی)'}
                  </span>
                </div>
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={
                    editingUser
                      ? 'اگر مایل به تغییر رمز نیستید این فیلد را خالی بگذارید'
                      : 'حداقل ۶ کاراکتر...'
                  }
                  className="w-full bg-white border border-amber-200 rounded-xl p-2.5 text-xs text-stone-900 outline-hidden focus:border-amber-500"
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-700">سطح نقش سازمانی</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormRole('Admin');
                    }}
                    className={`p-3.5 rounded-2xl border text-right transition-all flex items-start gap-3 ${
                      formRole === 'Admin'
                        ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                        : 'border-stone-200 bg-stone-50 hover:bg-stone-100'
                    }`}
                  >
                    <UserCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-black text-xs text-stone-900">
                        کارشناس سیستم (Admin با مجوزهای محدود)
                      </div>
                      <div className="text-[11px] text-stone-500 mt-1">
                        دسترسی به تب‌های انتخابی شما در زیر.
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormRole('SuperAdmin');
                    }}
                    className={`p-3.5 rounded-2xl border text-right transition-all flex items-start gap-3 ${
                      formRole === 'SuperAdmin'
                        ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                        : 'border-stone-200 bg-stone-50 hover:bg-stone-100'
                    }`}
                  >
                    <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-black text-xs text-stone-900">
                        مدیر ارشد (SuperAdmin)
                      </div>
                      <div className="text-[11px] text-stone-500 mt-1">
                        دسترسی کامل و بدون محدودیت به تمام بخش‌ها.
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Permissions Checkbox Grid (only when role is Admin) */}
              {formRole === 'Admin' && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        <span>تعیین مجوزهای مجاز این کاربر در پنل مدیریت:</span>
                      </h4>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        کاربر فقط منوهایی را که تیک خورده باشند در سایدبار پنل خواهد دید.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="text-[11px] font-bold text-amber-800 hover:text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200"
                    >
                      {formPermissions.length === PERMISSION_DEFINITIONS.length
                        ? 'عدم انتخاب همه'
                        : 'انتخاب همه مجوزها'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto p-1">
                    {PERMISSION_DEFINITIONS.map((perm) => {
                      const isChecked = formPermissions.includes(perm.key);
                      const Icon = perm.icon;
                      return (
                        <label
                          key={perm.key}
                          className={`flex items-start gap-2.5 p-3 rounded-2xl border transition-all cursor-pointer ${
                            isChecked
                              ? 'border-amber-400 bg-amber-50/40 text-stone-900 shadow-2xs'
                              : 'border-stone-200 bg-stone-50/50 text-stone-500 hover:bg-stone-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePermission(perm.key)}
                            className="w-4 h-4 accent-amber-500 rounded mt-0.5 cursor-pointer shrink-0"
                          />
                          <div className="space-y-0.5">
                            <div className="text-xs font-bold flex items-center gap-1.5">
                              <Icon className="w-3.5 h-3.5 text-stone-500" />
                              <span>{perm.label}</span>
                            </div>
                            <div className="text-[10px] text-stone-400 leading-tight">
                              {perm.desc}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activeUserCheck"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
                <label
                  htmlFor="activeUserCheck"
                  className="text-xs font-bold text-stone-700 cursor-pointer"
                >
                  حساب کاربری فعال و امکان ورود به پنل را داشته باشد
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingUser(null);
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
                  <span>{editingUser ? 'ذخیره مجوزها و مشخصات' : 'افزودن کاربر'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-stone-200 text-center">
            <div className="w-12 h-12 bg-red-100 text-red-700 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="font-black text-stone-900 text-sm">
              آیا از حذف حساب کاربری اطمینان دارید؟
            </h3>

            <p className="text-xs text-stone-600">
              حساب کاربری{' '}
              <span className="font-bold text-rose-900">
                {userToDelete.name} {userToDelete.family}
              </span>{' '}
              حذف خواهد شد و دسترسی وی به پنل مدیریت سلب می‌گردد.
            </p>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold px-4 py-2 rounded-xl"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={executeDeleteUser}
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
