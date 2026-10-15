import React, { useState } from 'react';
import { WholesaleRequest } from '../types';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { toPersianDigits, formatDateFa } from '../lib/formatters';
import {
  Briefcase,
  CheckCircle2,
  ShieldCheck,
  Truck,
  FileText,
  BadgePercent,
  Search,
  PhoneCall,
  Sparkles,
  Copy,
} from 'lucide-react';

interface WholesaleViewProps {
  onNavigate: (route: string, param?: string) => void;
}

export const WholesaleView: React.FC<WholesaleViewProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const { settings } = useSettings();

  // Form states
  const [applicantName, setApplicantName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [businessType, setBusinessType] = useState('قنادی و خشکبار');
  const [requestedProducts, setRequestedProducts] = useState('');
  const [estimatedQuantityKg, setEstimatedQuantityKg] = useState<number>(50);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Success modal with tracking code
  const [createdRequest, setCreatedRequest] = useState<WholesaleRequest | null>(null);

  // Dynamic wholesale tiers from settings
  const wholesaleTiers =
    settings.wholesaleTiers && settings.wholesaleTiers.length > 0
      ? settings.wholesaleTiers
      : [
          {
            id: 'tier-1',
            tierName: 'برنزی (فروشگاهی)',
            minQuantityKg: 20,
            maxQuantityKg: 50,
            discountPercent: 15,
            packaging: 'کارتن‌های ۵ و ۱۰ کیلویی',
            shippingCondition: 'تیپاکس یا باربری',
          },
          {
            id: 'tier-2',
            tierName: 'نقره‌ای (قنادی‌ها و پخش استانی)',
            minQuantityKg: 50,
            maxQuantityKg: 200,
            discountPercent: 25,
            packaging: 'کارتن‌های مادر وکیوم',
            shippingCondition: 'ارسال رایگان به باربری',
          },
          {
            id: 'tier-3',
            tierName: 'طلایی (صادراتی و تناژ بالا)',
            minQuantityKg: 200,
            maxQuantityKg: null,
            discountPercent: 35,
            packaging: 'پالت شیرینگ‌شده صادراتی',
            shippingCondition: 'تحویل درب کارخانه یا گمرک',
          },
        ];

  const minWholesaleKg = settings.wholesaleMinOrderKg || 20;
  const maxDiscountPercent = Math.max(...wholesaleTiers.map((t) => t.discountPercent), 35);

  // Tracking query state
  const [trackingInput, setTrackingInput] = useState('');
  const [trackedRequest, setTrackedRequest] = useState<WholesaleRequest | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/wholesale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantName,
          companyName,
          mobile,
          email,
          province,
          city,
          businessType,
          requestedProducts,
          estimatedQuantityKg: Number(estimatedQuantityKg),
          description,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCreatedRequest(data.request);
        showToast('درخواست عمده شما با موفقیت ثبت شد!', 'success');
      } else {
        showToast(data.message || 'خطا در ثبت درخواست', 'error');
      }
    } catch {
      showToast('خطا در برقراری ارتباط با سرور', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingInput.trim()) return;
    setTrackingLoading(true);
    try {
      const res = await fetch(`/api/wholesale/${trackingInput.trim().toUpperCase()}`);
      const data = await res.json();
      if (res.ok) {
        setTrackedRequest(data.request);
      } else {
        showToast(data.message || 'کد رهگیری یافت نشد', 'error');
        setTrackedRequest(null);
      }
    } catch {
      showToast('خطا در پیگیری درخواست', 'error');
    } finally {
      setTrackingLoading(false);
    }
  };

  const copyTracking = (code: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      showToast('کد پیگیری کپی شد', 'success');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* 1. Wholesale Hero Header */}
      <section className="bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-stone-800">
        <div className="max-w-3xl space-y-4">
          <span className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-3.5 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            تأمین مستقیم و بدون واسطه از کارخانه
          </span>

          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
            فروش عمده، صادراتی و همکاری ملس‌بان
          </h1>

          <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
            کارخانه ملس‌بان آمادگی دارد نیاز فروشگاه‌ها، قنادی‌ها، عمده‌فروشان و صادرکنندگان مواد غذایی را با بهترین قیمت رقابتی، بالاترین استانداردهای بهداشتی و بسته‌بندی صادراتی تأمین نماید.
          </p>

          <div className="flex flex-wrap gap-4 pt-4 text-xs font-bold">
            <div className="flex items-center gap-2 bg-stone-800/60 px-3.5 py-2 rounded-xl border border-stone-700">
              <BadgePercent className="w-4 h-4 text-amber-400" />
              <span>تخفیف‌های پلکانی تا {toPersianDigits(maxDiscountPercent)} درصد</span>
            </div>
            <div className="flex items-center gap-2 bg-stone-800/60 px-3.5 py-2 rounded-xl border border-stone-700">
              <Truck className="w-4 h-4 text-amber-400" />
              <span>ارسال پالت و کارتن با باربری مطمئن</span>
            </div>
            <div className="flex items-center gap-2 bg-stone-800/60 px-3.5 py-2 rounded-xl border border-stone-700">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>فاکتور رسمی و گواهی سیب سلامت</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Tier Pricing Table & Terms */}
      <section className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-2xs space-y-6">
        <div>
          <h2 className="text-xl font-black text-stone-900">جدول تخفیف‌های پلکانی همکاری (عمده)</h2>
          <p className="text-xs text-stone-500 mt-1">
            حداقل حجم سفارش عمده {toPersianDigits(minWholesaleKg)} کیلوگرم می‌باشد
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs divide-y divide-stone-200">
            <thead>
              <tr className="bg-stone-50 text-stone-700 font-black">
                <th className="p-3.5">سطح همکاری</th>
                <th className="p-3.5">حجم سفارش (کیلوگرم)</th>
                <th className="p-3.5">درصد تخفیف از قیمت مصرف‌کننده</th>
                <th className="p-3.5">نوع بسته‌بندی</th>
                <th className="p-3.5">شرایط ارسال</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {wholesaleTiers.map((tier, idx) => (
                <tr key={tier.id || idx} className={idx % 2 === 1 ? 'bg-amber-50/40' : ''}>
                  <td className="p-3.5 font-bold text-rose-900">{tier.tierName}</td>
                  <td className="p-3.5">
                    {tier.maxQuantityKg
                      ? `${toPersianDigits(tier.minQuantityKg)} تا ${toPersianDigits(tier.maxQuantityKg)} کیلوگرم`
                      : `بالای ${toPersianDigits(tier.minQuantityKg)} کیلوگرم (تناژ)`}
                  </td>
                  <td className="p-3.5 font-bold text-emerald-700">{toPersianDigits(tier.discountPercent)}٪ تخفیف</td>
                  <td className="p-3.5">{tier.packaging}</td>
                  <td className="p-3.5">{tier.shippingCondition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Form & Tracking Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Form - 8 cols */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-2xs space-y-6">
          <div>
            <h3 className="text-xl font-black text-stone-900">فرم درخواست استعلام قیمت عمده و همکاری</h3>
            <p className="text-xs text-stone-500 mt-1">
              اطلاعات زیر را تکمیل کنید؛ کارشناسان واحد فروش عمده ظرف ۲ ساعت کاری با شما تماس می‌گیرند.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">نام و نام خانوادگی متقاضی *</label>
                <input
                  type="text"
                  required
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="مثلاً: محمد کریمی"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 outline-hidden focus:bg-white focus:border-rose-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">نام فروشگاه / شرکت / قنادی *</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="مثلاً: قنادی لاله / شرکت پخش آوا"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 outline-hidden focus:bg-white focus:border-rose-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">شماره تماس مستقیم *</label>
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="0912xxxxxxx"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 outline-hidden focus:bg-white focus:border-rose-800 dir-ltr text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">ایمیل (اختیاری)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="company@domain.ir"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 outline-hidden focus:bg-white focus:border-rose-800 dir-ltr text-left"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">استان *</label>
                <input
                  type="text"
                  required
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="تهران، خراسان، اصفهان..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 outline-hidden focus:bg-white focus:border-rose-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">شهر *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="نام شهر"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 outline-hidden focus:bg-white focus:border-rose-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">زمینه فعالیت *</label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 outline-hidden focus:bg-white focus:border-rose-800 font-bold"
                >
                  <option value="قنادی و خشکبار">قنادی و خشکبار</option>
                  <option value="هایپرمارکت و سوپرمارکت">هایپرمارکت و سوپرمارکت</option>
                  <option value="شرکت پخش مواد غذایی">شرکت پخش مواد غذایی</option>
                  <option value="صادرات و بازرگانی خارجی">صادرات و بازرگانی خارجی</option>
                  <option value="کافه و رستوران">کافه و رستوران</option>
                  <option value="آنلاین شاپ">آنلاین‌شاپ و فروشگاه اینترنتی</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  محصولات مورد نظر *
                </label>
                <input
                  type="text"
                  required
                  value={requestedProducts}
                  onChange={(e) => setRequestedProducts(e.target.value)}
                  placeholder="مثلاً: کارتن ۲۰ کیلویی انار، رول‌های مجلسی، آلوچه"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 outline-hidden focus:bg-white focus:border-rose-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  حجم تخمینی اولیه *
                </label>
                <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl overflow-hidden focus-within:bg-white focus-within:border-rose-800">
                  <input
                    type="number"
                    min={20}
                    step={10}
                    required
                    value={estimatedQuantityKg}
                    onChange={(e) => setEstimatedQuantityKg(Number(e.target.value))}
                    className="flex-1 bg-transparent px-3 py-2.5 text-xs text-stone-800 outline-hidden dir-ltr text-left"
                  />
                  <span className="px-3 py-2.5 bg-stone-100 text-stone-500 font-bold text-xs border-r border-stone-200 select-none">
                    کیلوگرم
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">توضیحات و نیازمندی‌های ویژه</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="در صورت نیاز به نمونه تستی، برش خاص، برچسب اختصاصی یا مشخصات بسته‌بندی بنویسید..."
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-stone-800 outline-hidden focus:bg-white focus:border-rose-800"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto bg-rose-800 hover:bg-rose-900 text-white font-bold px-8 py-3.5 rounded-2xl shadow-md transition-all active:scale-95 disabled:bg-stone-300 text-xs"
            >
              {submitting ? 'در حال ثبت اطلاعات...' : 'ارسال درخواست استعلام قیمت عمده'}
            </button>
          </form>
        </div>

        {/* Tracking & Direct Contact Box - 4 cols */}
        <div className="lg:col-span-4 space-y-6">
          {/* Tracking Box */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-2xs space-y-4">
            <h3 className="font-black text-stone-900 text-base flex items-center gap-2">
              <Search className="w-4 h-4 text-rose-800" />
              پیگیری درخواست قبلی
            </h3>
            <p className="text-xs text-stone-500">
              اگر قبلاً درخواست همکاری ثبت کرده‌اید، کد پیگیری را وارد کنید:
            </p>

            <form onSubmit={handleTrack} className="space-y-3">
              <input
                type="text"
                required
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                placeholder="مثلاً WHS-12345"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 uppercase outline-hidden focus:bg-white focus:border-rose-800 dir-ltr text-left font-mono"
              />
              <button
                type="submit"
                disabled={trackingLoading}
                className="w-full bg-stone-900 hover:bg-stone-800 text-white py-2.5 rounded-xl font-bold text-xs transition-colors"
              >
                {trackingLoading ? 'در حال جستجو...' : 'استعلام وضعیت درخواست'}
              </button>
            </form>

            {/* Tracked Request Result Display */}
            {trackedRequest && (
              <div className="mt-4 p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs animate-in fade-in">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-stone-700 whitespace-nowrap">کد: <span className="font-mono text-rose-900">{trackedRequest.trackingCode}</span></span>
                  <span
                    className={`px-2 py-0.5 rounded-md font-bold text-[11px] whitespace-nowrap ${
                      trackedRequest.status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : trackedRequest.status === 'Contacted'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {trackedRequest.status === 'New' && 'در صف بررسی اولیه'}
                    {trackedRequest.status === 'Reviewing' && 'در حال کارشناسی بازرگانی'}
                    {trackedRequest.status === 'Contacted' && 'تماس گرفته شد'}
                    {trackedRequest.status === 'Approved' && 'تأیید شد و آماده ارسال'}
                    {trackedRequest.status === 'Rejected' && 'رد شد'}
                  </span>
                </div>
                <p className="text-stone-600">شرکت / فروشگاه: {trackedRequest.companyName}</p>
                <p className="text-stone-600">میزان: {toPersianDigits(trackedRequest.estimatedQuantityKg)} کیلوگرم</p>
                {trackedRequest.adminNotes && (
                  <p className="text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    یادداشت بازرگانی: {trackedRequest.adminNotes}
                  </p>
                )}
                <span className="text-[10px] text-stone-400 block pt-1">
                  تاریخ ثبت: {formatDateFa(trackedRequest.createdAt)}
                </span>
              </div>
            )}
          </div>

          {/* Direct Sales Contacts */}
          <div className="bg-rose-50/70 border border-rose-200 rounded-3xl p-6 space-y-4">
            <h4 className="font-black text-rose-950 text-sm flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-rose-800" />
              ارتباط مستقیم با مدیر بازرگانی
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              برای سفارش‌های فوری، هماهنگی عقد قراردادهای رسمی سالانه و بازدید از خط تولید کارخانه:
            </p>
            <div className="space-y-2 text-xs font-bold text-rose-900">
              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-rose-100">
                <span>تلفن ثابت کارخانه:</span>
                <span className="font-mono dir-ltr">{settings.wholesalePhone || settings.supportPhone || '۰۲۱-۸۸۹۹۲۲۱۱'}</span>
              </div>
              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-rose-100">
                <span>موبایل واحد عمده:</span>
                <span className="font-mono dir-ltr">{settings.salesMobile || settings.supportMobile || '۰۹۱۲۳۴۵۶۷۸۹'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal after Submission */}
      {createdRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-5 border border-stone-200 shadow-2xl">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-xl font-black text-stone-900">
              درخواست همکاری شما ثبت گردید!
            </h3>

            <p className="text-xs text-stone-600 leading-relaxed">
              از حسن انتخاب ملس‌بان سپاسگزاریم. کارشناس بازرگانی ما جهت ارائه پیش‌فاکتور رسمی و ارسال نمونه تستی با شما تماس خواهد گرفت.
            </p>

            <div className="bg-stone-100 p-4 rounded-2xl flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 whitespace-nowrap">کد رهگیری شما:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-base text-rose-900 whitespace-nowrap">
                  {createdRequest.trackingCode}
                </span>
                <button
                  onClick={() => copyTracking(createdRequest.trackingCode)}
                  className="p-1 text-stone-500 hover:text-stone-800"
                  title="کپی کد"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setCreatedRequest(null);
                setApplicantName('');
                setCompanyName('');
                setMobile('');
                setRequestedProducts('');
              }}
              className="w-full bg-rose-800 hover:bg-rose-900 text-white font-bold py-3 rounded-xl text-xs"
            >
              متوجه شدم و بستن
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
