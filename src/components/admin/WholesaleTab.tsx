import React, { useState } from 'react';
import { WholesaleRequest, WholesaleStatus } from '../../types';
import { useToast } from '../../context/ToastContext';
import { toPersianDigits, formatPrice, formatDateFa } from '../../lib/formatters';
import {
  Briefcase,
  Search,
  Filter,
  Phone,
  MessageCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  X,
  FileText,
  DollarSign,
  Package,
  TrendingUp,
  MapPin,
  Building,
  UserCheck,
  Check,
  RotateCcw,
} from 'lucide-react';

interface WholesaleTabProps {
  requests: WholesaleRequest[];
  onRefresh: () => void;
  token: string | null;
}

export const WholesaleTab: React.FC<WholesaleTabProps> = ({ requests, onRefresh, token }) => {
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<WholesaleRequest | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [recentlyChangedId, setRecentlyChangedId] = useState<string | null>(null);

  // Detail Modal Form State
  const [modalStatus, setModalStatus] = useState<WholesaleStatus>('New');
  const [modalNotes, setModalNotes] = useState('');
  const [modalPrice, setModalPrice] = useState<number | ''>('');
  const [modalQuotationSent, setModalQuotationSent] = useState(false);

  const openDetailModal = (req: WholesaleRequest) => {
    setSelectedRequest(req);
    setModalStatus(req.status);
    setModalNotes(req.adminNotes || '');
    setModalPrice(req.offeredPricePerKg ?? '');
    setModalQuotationSent(!!req.quotationSent);
  };

  const handleQuickStatusChange = async (id: string, newStatus: WholesaleStatus) => {
    setRecentlyChangedId(id);
    setTimeout(() => {
      setRecentlyChangedId((curr) => (curr === id ? null : curr));
    }, 3500);

    try {
      const res = await fetch(`/api/admin/wholesale/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        showToast('وضعیت درخواست عمده با موفقیت تغییر کرد.', 'success');
        onRefresh();
      } else {
        showToast('خطا در به‌روزرسانی وضعیت درخواست.', 'error');
      }
    } catch {
      showToast('خطا در برقراری ارتباط با سرور.', 'error');
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setIsUpdating(true);

    try {
      const res = await fetch(`/api/admin/wholesale/${selectedRequest.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          status: modalStatus,
          adminNotes: modalNotes,
          offeredPricePerKg: modalPrice === '' ? undefined : Number(modalPrice),
          quotationSent: modalQuotationSent,
        }),
      });

      if (res.ok) {
        showToast('اطلاعات پیش‌فاکتور و وضعیت با موفقیت ذخیره شد.', 'success');
        setSelectedRequest(null);
        onRefresh();
      } else {
        showToast('خطا در ثبت اطلاعات درخواست عمده.', 'error');
      }
    } catch {
      showToast('خطا در اتصال به سرور.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string, trackingCode: string) => {
    if (!window.confirm(`آیا از حذف دائمی درخواست عمده ${trackingCode} اطمینان دارید؟`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/wholesale/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        showToast('درخواست عمده با موفقیت حذف گردید.', 'success');
        if (selectedRequest?.id === id) {
          setSelectedRequest(null);
        }
        onRefresh();
      } else {
        showToast('خطا در حذف درخواست.', 'error');
      }
    } catch {
      showToast('خطا در ارتباط با سرور.', 'error');
    }
  };

  // Status mapping with circular color icon (pure circle with icon, no text)
  const getStatusBadge = (status: WholesaleStatus, isRecent = false, showText = false) => {
    let circleBg = 'bg-amber-500';
    let ringColor = 'ring-amber-200';
    let textTitle = 'جدید در صف';
    let icon = <Clock className="w-3.5 h-3.5 stroke-[2.5]" />;

    switch (status) {
      case 'Reviewing':
        circleBg = 'bg-blue-600';
        ringColor = 'ring-blue-200';
        textTitle = 'در حال بررسی';
        icon = <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />;
        break;
      case 'Contacted':
        circleBg = 'bg-indigo-600';
        ringColor = 'ring-indigo-200';
        textTitle = 'تماس گرفته شد';
        icon = <Phone className="w-3.5 h-3.5 stroke-[2.5]" />;
        break;
      case 'Approved':
        circleBg = 'bg-emerald-600';
        ringColor = 'ring-emerald-200';
        textTitle = 'تأیید و قرارداد';
        icon = <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />;
        break;
      case 'Rejected':
        circleBg = 'bg-rose-600';
        ringColor = 'ring-rose-200';
        textTitle = 'رد شده';
        icon = <XCircle className="w-3.5 h-3.5 stroke-[2.5]" />;
        break;
      case 'New':
      default:
        circleBg = 'bg-amber-500';
        ringColor = 'ring-amber-200';
        textTitle = 'جدید در صف';
        icon = <Clock className="w-3.5 h-3.5 stroke-[2.5]" />;
        break;
    }

    if (!showText) {
      return (
        <span
          className={`w-7 h-7 rounded-full ${circleBg} text-white flex items-center justify-center shrink-0 shadow-xs ring-2 ${ringColor} transition-all duration-300 ${
            isRecent ? 'ring-4 ring-amber-400 scale-110 shadow-md animate-bounce' : ''
          }`}
          title={`وضعیت: ${textTitle}`}
        >
          {icon}
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black border transition-all duration-300 bg-stone-50 text-stone-800 border-stone-200 ${
          isRecent ? 'ring-4 ring-amber-400 scale-105 animate-pulse' : ''
        }`}
      >
        <span className={`w-5 h-5 rounded-full ${circleBg} text-white flex items-center justify-center shrink-0 shadow-xs ring-2 ${ringColor}`}>
          {icon}
        </span>
        <span>{textTitle}</span>
      </span>
    );
  };

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      r.trackingCode.toLowerCase().includes(q) ||
      r.applicantName.toLowerCase().includes(q) ||
      r.companyName.toLowerCase().includes(q) ||
      r.mobile.includes(q) ||
      r.city.toLowerCase().includes(q) ||
      r.province.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  // Calculate Statistics
  const totalRequests = requests.length;
  const newRequests = requests.filter((r) => r.status === 'New').length;
  const approvedRequests = requests.filter((r) => r.status === 'Approved').length;
  const totalTonnageKg = requests.reduce((sum, r) => sum + (r.estimatedQuantityKg || 0), 0);

  return (
    <div className="space-y-6">
      {/* Overview Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold">کل درخواست‌های عمده</span>
            <Briefcase className="w-5 h-5 text-stone-700" />
          </div>
          <p className="text-2xl font-black text-stone-900">{toPersianDigits(totalRequests)} عدد</p>
          <span className="text-[11px] text-stone-400 block">ثبت شده در سامانه</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/40 to-white shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-xs font-bold">درخواست‌های جدید در انتظار</span>
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-900">{toPersianDigits(newRequests)} مورد</p>
          <span className="text-[11px] text-amber-700 font-bold block">نیازمند تماس اولیه و تعیین قیمت</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/40 to-white shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-xs font-bold">تأییدشده و در حال تولید</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-900">{toPersianDigits(approvedRequests)} قرارداد</p>
          <span className="text-[11px] text-emerald-700 font-bold block">همکاری رسمی منعقد شده</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold">مجموع تناژ تقاضا</span>
            <TrendingUp className="w-5 h-5 text-rose-700" />
          </div>
          <p className="text-2xl font-black text-rose-900">
            {toPersianDigits(totalTonnageKg >= 1000 ? (totalTonnageKg / 1000).toFixed(1) : totalTonnageKg)}{' '}
            <span className="text-sm font-bold text-stone-600">
              {totalTonnageKg >= 1000 ? 'تُن' : 'کیلوگرم'}
            </span>
          </p>
          <span className="text-[11px] text-stone-400 block">ظرفیت درخواستی بازار</span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xs overflow-hidden">
        {/* Header & Controls */}
        <div className="p-6 border-b border-stone-100 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-stone-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-amber-600" />
                <span>مدیریت قراردادها و سفارش‌های عمده</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                رسیدگی به درخواست‌های تأمین فروشگاه‌های زنجیره‌ای، قنادی‌ها، خشکبار و بازرگانان صادراتی (بدون نیاز به اسکرول افقی)
              </p>
            </div>

            {/* Search */}
            <div className="relative flex-1 sm:max-w-xs">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو نام، شرکت، شهر یا کد..."
                className="w-full bg-stone-50 border border-stone-200 rounded-xl pr-9 pl-3 py-2 text-xs text-stone-800 placeholder-stone-400 focus:bg-white focus:border-amber-500 outline-hidden"
              />
              <Search className="w-4 h-4 text-stone-400 absolute right-3 top-2.5" />
            </div>
          </div>

          {/* Quick Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {[
              { id: 'all', label: 'همه درخواست‌ها', count: requests.length },
              { id: 'New', label: 'جدید در صف', count: requests.filter((r) => r.status === 'New').length },
              { id: 'Reviewing', label: 'در حال بررسی', count: requests.filter((r) => r.status === 'Reviewing').length },
              { id: 'Contacted', label: 'تماس گرفته شد', count: requests.filter((r) => r.status === 'Contacted').length },
              { id: 'Approved', label: 'تأیید و قرارداد', count: requests.filter((r) => r.status === 'Approved').length },
              { id: 'Rejected', label: 'رد شده', count: requests.filter((r) => r.status === 'Rejected').length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    statusFilter === tab.id ? 'bg-amber-800 text-amber-100' : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {toPersianDigits(tab.count)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Requests Table Feed (Row-based design) */}
        {filteredRequests.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
              <Briefcase className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-stone-700">هیچ درخواستی با مشخصات فوق یافت نشد.</p>
            <p className="text-xs text-stone-400">می‌توانید فیلترها را تغییر داده یا عبارت دیگری را جستجو کنید.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs divide-y divide-stone-200">
              <thead>
                <tr className="bg-stone-50 text-stone-600 font-bold whitespace-nowrap">
                  <th className="p-3.5 whitespace-nowrap">کد پیگیری</th>
                  <th className="p-3.5 whitespace-nowrap">شرکت و متقاضی</th>
                  <th className="p-3.5 whitespace-nowrap">تماس مستقیم</th>
                  <th className="p-3.5 whitespace-nowrap">استان / شهر</th>
                  <th className="p-3.5 whitespace-nowrap">حجم تقاضا</th>
                  <th className="p-3.5 whitespace-nowrap">وضعیت</th>
                  <th className="p-3.5 whitespace-nowrap">تاریخ ثبت</th>
                  <th className="p-3.5 text-center whitespace-nowrap">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredRequests.map((req) => (
                  <tr
                    key={req.id}
                    onClick={() => openDetailModal(req)}
                    className={`hover:bg-amber-50/40 transition-colors cursor-pointer ${
                      recentlyChangedId === req.id ? 'bg-amber-50/70 ring-2 ring-amber-400/80 animate-pulse' : ''
                    }`}
                  >
                    {/* 1. Tracking code (strictly single line) */}
                    <td className="p-3.5 font-mono font-bold whitespace-nowrap">
                      <span className="text-rose-900 bg-rose-50 border border-rose-200/80 px-2.5 py-1 rounded-lg whitespace-nowrap inline-block">
                        {req.trackingCode}
                      </span>
                    </td>

                    {/* 2. Company & Applicant */}
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-black text-stone-900 text-xs flex items-center gap-1.5 whitespace-nowrap">
                        <Building className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="whitespace-nowrap">{req.companyName}</span>
                      </div>
                      <div className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-1 whitespace-nowrap">
                        <span className="whitespace-nowrap">{req.applicantName}</span>
                        <span className="text-stone-300">•</span>
                        <span className="text-stone-400 font-medium whitespace-nowrap">{req.businessType}</span>
                      </div>
                    </td>

                    {/* 3. Phone & Contact shortcuts */}
                    <td className="p-3.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <span className="font-mono text-stone-700 dir-ltr text-xs whitespace-nowrap">{req.mobile}</span>
                        <a
                          href={`tel:${req.mobile}`}
                          className="p-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                          title="تماس مستقیم"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={`https://wa.me/98${req.mobile.replace(/^0/, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                          title="ارسال پیام واتساپ"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>

                    {/* 4. Province / City */}
                    <td className="p-3.5 text-stone-600 whitespace-nowrap">
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="whitespace-nowrap">{req.province}، {req.city}</span>
                      </div>
                    </td>

                    {/* 5. Estimated Quantity */}
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-black text-amber-950 bg-amber-100 border border-amber-200/80 px-2.5 py-1 rounded-lg text-xs whitespace-nowrap">
                        <Package className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span className="whitespace-nowrap">
                          {toPersianDigits(
                            req.estimatedQuantityKg >= 1000
                              ? (req.estimatedQuantityKg / 1000).toFixed(1)
                              : req.estimatedQuantityKg
                          )}{' '}
                          {req.estimatedQuantityKg >= 1000 ? 'تُن' : 'کیلوگرم'}
                        </span>
                      </span>
                    </td>

                    {/* 6. Merged Status & Status Change (circle with icon, NO text) */}
                    <td className="p-3.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        {getStatusBadge(req.status, recentlyChangedId === req.id, false)}
                        <select
                          value={req.status}
                          onChange={(e) => handleQuickStatusChange(req.id, e.target.value as WholesaleStatus)}
                          className="bg-stone-50 hover:bg-white border border-stone-200 hover:border-stone-300 focus:border-amber-500 rounded-xl px-2.5 py-1.5 text-xs font-bold text-stone-800 outline-hidden cursor-pointer shadow-2xs transition-all whitespace-nowrap"
                        >
                          <option value="New">جدید در صف</option>
                          <option value="Reviewing">در حال بررسی</option>
                          <option value="Contacted">تماس گرفته شد</option>
                          <option value="Approved">تأیید و پیش‌فاکتور</option>
                          <option value="Rejected">رد شده</option>
                        </select>
                      </div>
                    </td>

                    {/* 8. Registration date */}
                    <td className="p-3.5 text-stone-500 font-mono text-[11px] whitespace-nowrap">
                      {formatDateFa(req.createdAt)}
                    </td>

                    {/* 9. Actions: View modal & Delete */}
                    <td className="p-3.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                        <button
                          onClick={() => openDetailModal(req)}
                          className="bg-stone-900 hover:bg-stone-800 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer whitespace-nowrap"
                          title="مشاهده جزئیات کامل، اقلام درخواستی و صدور پیش‌فاکتور"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>مشاهده</span>
                        </button>
                        <button
                          onClick={() => handleDelete(req.id, req.trackingCode)}
                          className="p-1.5 rounded-xl text-stone-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="حذف پرونده"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Comprehensive Request Details & Quotation Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-stone-200 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <div>
                <span className="text-[11px] font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-md">
                  پرونده سفارش عمده: {selectedRequest.trackingCode}
                </span>
                <h3 className="font-black text-stone-900 text-lg mt-1">
                  {selectedRequest.companyName} ({selectedRequest.applicantName})
                </h3>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Applicant Information Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
                <h4 className="font-black text-stone-900 text-xs border-b border-stone-200 pb-1.5 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-stone-600" />
                  <span>اطلاعات هویت تجاری</span>
                </h4>
                <p>
                  <strong>شرکت / فروشگاه:</strong> {selectedRequest.companyName}
                </p>
                <p>
                  <strong>نام متقاضی / رابط:</strong> {selectedRequest.applicantName}
                </p>
                <p>
                  <strong>حوزه فعالیت:</strong> {selectedRequest.businessType}
                </p>
                <p>
                  <strong>موقعیت:</strong> {selectedRequest.province}، {selectedRequest.city}
                </p>
                {selectedRequest.email && (
                  <p>
                    <strong>ایمیل:</strong> {selectedRequest.email}
                  </p>
                )}
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
                <h4 className="font-black text-stone-900 text-xs border-b border-stone-200 pb-1.5 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-stone-600" />
                  <span>مشخصات تقاضا و سفارش</span>
                </h4>
                <p>
                  <strong>تناژ برآوردی:</strong>{' '}
                  <span className="font-black text-rose-900 text-sm">
                    {toPersianDigits(selectedRequest.estimatedQuantityKg)} کیلوگرم
                  </span>
                </p>
                <p>
                  <strong>محصولات مد نظر:</strong> {selectedRequest.requestedProducts}
                </p>
                <p>
                  <strong>تاریخ ثبت درخواست:</strong> {formatDateFa(selectedRequest.createdAt)}
                </p>
                <div className="pt-2 flex items-center gap-2">
                  <a
                    href={`tel:${selectedRequest.mobile}`}
                    className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-1.5 px-3 rounded-xl text-center flex items-center justify-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>تماس فوری</span>
                  </a>
                  <a
                    href={`https://wa.me/98${selectedRequest.mobile.replace(/^0/, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-xl text-center flex items-center justify-center gap-1"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>پیام واتساپ</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Customer Description */}
            {selectedRequest.description && (
              <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/70 text-xs space-y-1">
                <strong className="text-amber-950 font-bold block">توضیحات و نیازمندی‌های اعلامی مشتری:</strong>
                <p className="text-amber-900 leading-relaxed">{selectedRequest.description}</p>
              </div>
            )}

            {/* Management & Quotation Form */}
            <form onSubmit={handleSaveModal} className="space-y-4 pt-2 border-t border-stone-200 text-xs">
              <h4 className="font-black text-stone-900 text-sm flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>تعیین قیمت و صدور پیش‌فاکتور رسمی</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">وضعیت جاری پرونده</label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value as WholesaleStatus)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 outline-hidden"
                  >
                    <option value="New">جدید در صف بررسی (New)</option>
                    <option value="Reviewing">در حال بررسی کیفیت و تناژ (Reviewing)</option>
                    <option value="Contacted">مذاکره تلفنی انجام شد (Contacted)</option>
                    <option value="Approved">تأیید قرارداد و ارسال پیش‌فاکتور (Approved)</option>
                    <option value="Rejected">رد درخواست یا عدم توافق طرفین (Rejected)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    قیمت پیشنهادی هر کیلوگرم
                  </label>
                  <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl overflow-hidden focus-within:bg-white focus-within:border-amber-500">
                    <input
                      type="number"
                      value={modalPrice}
                      onChange={(e) => setModalPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="مثلاً: ۲۴۰۰۰۰"
                      className="flex-1 bg-transparent px-3 py-2 text-xs font-mono dir-ltr text-left outline-hidden"
                    />
                    <span className="px-3 py-2 bg-stone-100 text-stone-500 font-bold text-xs border-r border-stone-200 select-none">
                      تومان
                    </span>
                  </div>
                </div>
              </div>

              {modalPrice !== '' && Number(modalPrice) > 0 && selectedRequest && (
                <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-950 font-bold">
                    <DollarSign className="w-4 h-4 text-emerald-700" />
                    <span>ارزش برآوردی کل پیش‌فاکتور (تناژ × نرخ):</span>
                  </div>
                  <span className="font-black text-emerald-900 text-sm">
                    {formatPrice(selectedRequest.estimatedQuantityKg * Number(modalPrice))}
                  </span>
                </div>
              )}

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  یادداشت‌های داخلی مدیر / شرایط حمل و تحویل
                </label>
                <textarea
                  rows={3}
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="نکات توافق با مشتری، نوع بسته‌بندی درخواستی، موعد تحویل و شرایط تسویه..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-stone-800 outline-hidden focus:bg-white focus:border-stone-400"
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                <input
                  type="checkbox"
                  id="quotationSentCheck"
                  checked={modalQuotationSent}
                  onChange={(e) => setModalQuotationSent(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-800 border-stone-300 focus:ring-rose-800"
                />
                <label htmlFor="quotationSentCheck" className="text-xs font-bold text-stone-800 cursor-pointer">
                  پیش‌فاکتور رسمی صادر و برای مشتری ارسال شد (علامت‌گذاری برای هماهنگی انبار و تولید)
                </label>
              </div>

              <div className="flex items-center justify-between gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => handleDelete(selectedRequest.id, selectedRequest.trackingCode)}
                  className="text-rose-700 hover:text-rose-800 text-xs font-bold flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف پرونده</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRequest(null)}
                    className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-4 py-2 rounded-xl text-xs"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="bg-rose-800 hover:bg-rose-900 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-rose-950/10"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isUpdating ? 'در حال ذخیره...' : 'ثبت تغییرات و به‌روزرسانی'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
