import React, { useState, useEffect } from 'react';
import { SiteSetting, WholesaleTier, FAQItem } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useSettings } from '../../context/SettingsContext';
import { ImageUploadField } from '../common/ImageUploadField';
import { toPersianDigits } from '../../lib/formatters';
import {
  Settings,
  Phone,
  MessageSquare,
  Image as ImageIcon,
  Truck,
  Building,
  Save,
  RotateCcw,
  Sparkles,
  Megaphone,
  Share2,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Clock,
  Mail,
  BadgePercent,
  Plus,
  Trash2,
  Pencil,
  Package,
  X,
  AlertCircle,
  TrendingUp,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Database,
} from 'lucide-react';
import { DatabaseSettingsSection } from './DatabaseSettingsSection';

const DEFAULT_FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    q: 'آیا در تهیه لواشک‌های ملس‌بان از شکر یا جوهر لیمو استفاده می‌شود؟',
    a: 'خیر، به هیچ وجه! تمام محصولات ملس‌بان از ۱۰۰٪ پوره میوه طبیعی تهیه شده و ترشی آن کاملاً حاصل اسیدهای ارگانیک میوه (مانند اسید مالیک و اسید تارتاریک طبیعی) است و هیچ‌گونه شکر مصنوعی یا افزودنی سنتتیک به آن اضافه نمی‌شود.',
    category: 'کیفیت و سلامت',
  },
  {
    id: 'faq-2',
    q: 'حداقل میزان سفارش در بخش فروش عمده چقدر است؟',
    a: 'حداقل سفارش عمده ۲۰ کیلوگرم یا یک کارتن مادر استاندارد است. برای سفارش‌های بالای ۱۰۰ کیلوگرم تخفیف‌های پلکانی ویژه همکاران در نظر گرفته شده است.',
    category: 'فروش عمده',
  },
  {
    id: 'faq-3',
    q: 'سفارش‌ها چگونه ارسال می‌شوند و چند روزه به دست ما می‌رسند؟',
    a: 'سفارش‌های تهران با پیک سریع و سفارش‌های شهرستان با پست پیشتاز یا تیپاکس ارسال می‌گردد. زمان تحویل در تهران همان روز یا حداکثر ۲۴ ساعت و برای شهرستان‌ها بین ۲ الی ۳ روز کاری است.',
    category: 'ارسال و پیگیری',
  },
  {
    id: 'faq-4',
    q: 'شرایط نگهداری لواشک‌ها برای ماندگاری بیشتر چیست؟',
    a: 'از آنجایی که مواد نگهدارنده شیمیایی در محصولات وجود ندارد، بهتر است لواشک‌ها در جای خشک، خنک و دور از نور مستقیم خورشید (یا داخل یخچال) نگهداری شوند. در این شرایط تا ۶ ماه طراوت اولیه خود را حفظ می‌کنند.',
    category: 'نگهداری و مصرف',
  },
];

const DEFAULT_WHOLESALE_TIERS: WholesaleTier[] = [
  {
    id: 'tier-1',
    tierName: 'برنزی (فروشگاهی)',
    minQuantityKg: 20,
    maxQuantityKg: 50,
    discountPercent: 15,
    packaging: 'کارتن‌های ۵ و ۱۰ کیلویی',
    shippingCondition: 'تیپاکس یا باربری',
    description: 'مناسب برای سوپرمارکت‌ها، لبنیاتی‌ها و فروشگاه‌های محلی',
  },
  {
    id: 'tier-2',
    tierName: 'نقره‌ای (قنادی‌ها و پخش استانی)',
    minQuantityKg: 50,
    maxQuantityKg: 200,
    discountPercent: 25,
    packaging: 'کارتن‌های مادر وکیوم',
    shippingCondition: 'ارسال رایگان به باربری',
    description: 'ویژه قنادی‌ها، خشکبارفروشان و شبکه‌های توزیع استانی',
  },
  {
    id: 'tier-3',
    tierName: 'طلایی (صادراتی و تناژ بالا)',
    minQuantityKg: 200,
    maxQuantityKg: null,
    discountPercent: 35,
    packaging: 'پالت و وکیوم صادراتی استاندارد',
    shippingCondition: 'تحویل درب انبار خریدار یا گمرک',
    description: 'بهترین قیمت رقابتی برای بازرگانان، شرکت‌های صادراتی و خریداران عمده کشوری',
  },
];

const BANNER_IMAGE_PRESETS = [
  {
    label: 'لواشک انار ساوه',
    url: 'https://images.unsplash.com/photo-1541344999736-83eca872f242?w=900&q=80',
  },
  {
    label: 'میوه‌های تازه باغی ترش',
    url: 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=900&q=80',
  },
  {
    label: 'سینی پذیرایی میوه و لواشک',
    url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=900&q=80',
  },
  {
    label: 'فرآوری سنتی لواشک آفتابی',
    url: 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=900&q=80',
  },
];

interface SettingsTabProps {
  token?: string | null;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ token }) => {
  const { settings, updateSettings, refreshSettings } = useSettings();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<SiteSetting>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<
    'phones' | 'brand' | 'banners' | 'announcement' | 'shipping' | 'wholesaleTiers' | 'faqs' | 'database'
  >('phones');

  // Wholesale Tiers state
  const [editingTier, setEditingTier] = useState<WholesaleTier | null>(null);
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [tierFormName, setTierFormName] = useState('');
  const [tierFormMinKg, setTierFormMinKg] = useState<number | ''>(20);
  const [tierFormMaxKg, setTierFormMaxKg] = useState<number | ''>('');
  const [tierFormDiscount, setTierFormDiscount] = useState<number | ''>(15);
  const [tierFormPackaging, setTierFormPackaging] = useState('');
  const [tierFormShipping, setTierFormShipping] = useState('');
  const [tierFormDescription, setTierFormDescription] = useState('');
  const [tierToDelete, setTierToDelete] = useState<WholesaleTier | null>(null);

  // FAQ state
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [faqFormQuestion, setFaqFormQuestion] = useState('');
  const [faqFormAnswer, setFaqFormAnswer] = useState('');
  const [faqFormCategory, setFaqFormCategory] = useState('کیفیت و سلامت');
  const [faqToDelete, setFaqToDelete] = useState<FAQItem | null>(null);
  const [faqPreviewActiveIdx, setFaqPreviewActiveIdx] = useState<number | null>(null);
  const [faqFilterCategory, setFaqFilterCategory] = useState<string>('all');

  // Keep in sync with global settings
  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const currentTiers: WholesaleTier[] =
    formData.wholesaleTiers && formData.wholesaleTiers.length > 0
      ? formData.wholesaleTiers
      : DEFAULT_WHOLESALE_TIERS;

  const openAddTierModal = () => {
    setEditingTier(null);
    setTierFormName('');
    setTierFormMinKg(20);
    setTierFormMaxKg('');
    setTierFormDiscount(15);
    setTierFormPackaging('کارتن‌های ۵ و ۱۰ کیلویی');
    setTierFormShipping('تیپاکس یا باربری');
    setTierFormDescription('');
    setIsTierModalOpen(true);
  };

  const openEditTierModal = (tier: WholesaleTier) => {
    setEditingTier(tier);
    setTierFormName(tier.tierName);
    setTierFormMinKg(tier.minQuantityKg);
    setTierFormMaxKg(tier.maxQuantityKg ?? '');
    setTierFormDiscount(tier.discountPercent);
    setTierFormPackaging(tier.packaging);
    setTierFormShipping(tier.shippingCondition);
    setTierFormDescription(tier.description || '');
    setIsTierModalOpen(true);
  };

  const handleSaveTier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tierFormName.trim()) {
      showToast('لطفاً عنوان سطح همکاری را وارد کنید.', 'error');
      return;
    }
    if (tierFormMinKg === '' || Number(tierFormMinKg) <= 0) {
      showToast('لطفاً حداقل مقدار سفارش را به درستی وارد کنید.', 'error');
      return;
    }
    if (tierFormDiscount === '' || Number(tierFormDiscount) <= 0 || Number(tierFormDiscount) > 100) {
      showToast('درصد تخفیف باید بین ۱ تا ۱۰۰ باشد.', 'error');
      return;
    }

    const updatedTier: WholesaleTier = {
      id: editingTier ? editingTier.id : `tier-${Date.now()}`,
      tierName: tierFormName.trim(),
      minQuantityKg: Number(tierFormMinKg),
      maxQuantityKg: tierFormMaxKg === '' ? null : Number(tierFormMaxKg),
      discountPercent: Number(tierFormDiscount),
      packaging: tierFormPackaging.trim() || 'استاندارد کارتن',
      shippingCondition: tierFormShipping.trim() || 'باربری',
      description: tierFormDescription.trim(),
    };

    let nextTiers: WholesaleTier[];
    if (editingTier) {
      nextTiers = currentTiers.map((t) => (t.id === editingTier.id ? updatedTier : t));
    } else {
      nextTiers = [...currentTiers, updatedTier];
    }

    // Sort by minQuantityKg
    nextTiers.sort((a, b) => a.minQuantityKg - b.minQuantityKg);

    setFormData((prev) => ({
      ...prev,
      wholesaleTiers: nextTiers,
    }));

    setIsTierModalOpen(false);
    showToast(
      editingTier ? 'سطح همکاری با موفقیت ویرایش شد.' : 'پله تخفیف همکاری با موفقیت افزوده شد.',
      'success'
    );
  };

  const handleDeleteTier = (id: string) => {
    const nextTiers = currentTiers.filter((t) => t.id !== id);
    setFormData((prev) => ({
      ...prev,
      wholesaleTiers: nextTiers,
    }));
    setTierToDelete(null);
    showToast('سطح تخفیف حذف شد. جهت اعمال دکمه ذخیره تنظیمات را بزنید.', 'success');
  };

  const handleResetTiersToDefault = () => {
    setFormData((prev) => ({
      ...prev,
      wholesaleTiers: [...DEFAULT_WHOLESALE_TIERS],
    }));
    showToast('پله‌های تخفیف به مقادیر اولیه کارخانه بازگردانده شدند.', 'info');
  };

  // FAQ Handlers
  const currentFaqs: FAQItem[] =
    formData.faqs && formData.faqs.length > 0 ? formData.faqs : DEFAULT_FAQS;

  const openAddFaqModal = () => {
    setEditingFaq(null);
    setFaqFormQuestion('');
    setFaqFormAnswer('');
    setFaqFormCategory('کیفیت و سلامت');
    setIsFaqModalOpen(true);
  };

  const openEditFaqModal = (faq: FAQItem) => {
    setEditingFaq(faq);
    setFaqFormQuestion(faq.q);
    setFaqFormAnswer(faq.a);
    setFaqFormCategory(faq.category || 'عمومی');
    setIsFaqModalOpen(true);
  };

  const handleSaveFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqFormQuestion.trim()) {
      showToast('لطفاً عنوان سوال را وارد فرمایید.', 'error');
      return;
    }
    if (!faqFormAnswer.trim()) {
      showToast('لطفاً پاسخ کامل به این سوال را وارد نمایید.', 'error');
      return;
    }

    const updatedFaq: FAQItem = {
      id: editingFaq ? editingFaq.id : `faq-${Date.now()}`,
      q: faqFormQuestion.trim(),
      a: faqFormAnswer.trim(),
      category: faqFormCategory.trim() || 'عمومی',
      order: editingFaq?.order ?? currentFaqs.length + 1,
    };

    let nextFaqs: FAQItem[];
    if (editingFaq) {
      nextFaqs = currentFaqs.map((f) => (f.id === editingFaq.id ? updatedFaq : f));
    } else {
      nextFaqs = [...currentFaqs, updatedFaq];
    }

    setFormData((prev) => ({
      ...prev,
      faqs: nextFaqs,
    }));

    setIsFaqModalOpen(false);
    showToast(
      editingFaq ? 'پرسش متداول با موفقیت ویرایش گردید.' : 'پرسش متداول جدید با موفقیت افزوده شد.',
      'success'
    );
  };

  const handleDeleteFaq = (id: string) => {
    const nextFaqs = currentFaqs.filter((f) => f.id !== id);
    setFormData((prev) => ({
      ...prev,
      faqs: nextFaqs,
    }));
    setFaqToDelete(null);
    showToast('پرسش متداول با موفقیت حذف گردید.', 'success');
  };

  const handleMoveFaq = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentFaqs.length) return;
    const newFaqs = [...currentFaqs];
    const temp = newFaqs[index];
    newFaqs[index] = newFaqs[targetIndex];
    newFaqs[targetIndex] = temp;
    setFormData((prev) => ({
      ...prev,
      faqs: newFaqs,
    }));
    showToast('ترتیب نمایش سوالات متداول به‌روزرسانی شد.', 'info');
  };

  const handleResetFaqsToDefault = () => {
    setFormData((prev) => ({
      ...prev,
      faqs: [...DEFAULT_FAQS],
    }));
    showToast('سوالات متداول به پرسش‌های پیش‌فرض کارخانه بازگردانده شدند.', 'info');
  };

  const handleChange = (field: keyof SiteSetting, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const success = await updateSettings(formData, token || undefined);
      if (success) {
        showToast('تنظیمات سایت با موفقیت در سیستم ذخیره و اعمال شد.', 'success');
        refreshSettings();
      } else {
        showToast('خطا در ذخیره تنظیمات سایت. لطفاً مجدداً تلاش نمایید.', 'error');
      }
    } catch {
      showToast('خطا در ارتباط با سرور.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(settings);
    showToast('تغییرات به مقادیر قبلی بازگردانده شد.', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Settings Navigation Card */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
          <div>
            <h2 className="text-base font-black text-stone-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-600" />
              <span>تنظیمات جامع و سفارشی‌سازی وب‌سایت</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              مدیریت شماره تلفن‌های چندگانه، شعار برند، بنرها و جشنواره‌ها، نوار اعلان و هزینه‌های ارسال
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>بازنشانی</span>
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="bg-rose-800 hover:bg-rose-900 disabled:opacity-50 text-white text-xs font-bold px-5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-rose-950/15 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'در حال ذخیره‌سازی...' : 'ذخیره تمام تنظیمات'}</span>
            </button>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex flex-wrap gap-2 pt-5">
          <button
            type="button"
            onClick={() => setActiveSection('phones')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSection === 'phones'
                ? 'bg-rose-800 text-white shadow-xs'
                : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>شماره تلفن‌ها و ارتباطات</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('brand')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSection === 'brand'
                ? 'bg-rose-800 text-white shadow-xs'
                : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>شعار و هویت برند</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('banners')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSection === 'banners'
                ? 'bg-rose-800 text-white shadow-xs'
                : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>بنرها و جشنواره‌ها</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('announcement')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSection === 'announcement'
                ? 'bg-rose-800 text-white shadow-xs'
                : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>نوار اعلان بالای سایت</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('shipping')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSection === 'shipping'
                ? 'bg-rose-800 text-white shadow-xs'
                : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>قوانین ارسال و سفارش عمده</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('wholesaleTiers')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'wholesaleTiers'
                ? 'bg-rose-800 text-white shadow-xs'
                : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <BadgePercent className="w-4 h-4 text-amber-500" />
            <span>جدول تخفیف‌های پلکانی همکاری</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('faqs')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'faqs'
                ? 'bg-rose-800 text-white shadow-xs'
                : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-amber-500" />
            <span>سوالات متداول (FAQ)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('database')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'database'
                ? 'bg-rose-800 text-white shadow-xs'
                : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Database className="w-4 h-4 text-amber-500" />
            <span>پایگاه داده (SQL) و مایگریشن‌ها</span>
          </button>
        </div>
      </div>

      {activeSection === 'database' && (
        <DatabaseSettingsSection token={token} />
      )}

      {/* Main Settings Form */}
      {activeSection !== 'database' && (
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Phone Numbers & Communication Section */}
        {activeSection === 'phones' && (
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-2xs space-y-6 animate-in fade-in">
            <div className="border-b border-stone-100 pb-4">
              <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                <Phone className="w-4 h-4 text-rose-800" />
                <span>شماره‌های تماس دفتر، کارخانه، موبایل پشتیبانی و شبکه‌های اجتماعی</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                این شماره‌ها در نوار بالای سایت، فوتر و صفحه تماس به صورت زنده نمایش داده می‌شوند.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  تلفن ثابت دفتر مرکزی و امور مشتریان *
                </label>
                <input
                  type="text"
                  required
                  value={formData.supportPhone || ''}
                  onChange={(e) => handleChange('supportPhone', e.target.value)}
                  placeholder="۰۲۱-۸۸۹۹۲۲۱۱"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono dir-ltr text-left outline-hidden focus:bg-white focus:border-stone-400"
                />
                <span className="text-[10px] text-stone-400 mt-0.5 block">نمایش در نوار بالای سایت و فوتر</span>
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  تلفن ثابت کارخانه و امور قراردادها (تلفن دوم)
                </label>
                <input
                  type="text"
                  value={formData.supportPhone2 || ''}
                  onChange={(e) => handleChange('supportPhone2', e.target.value)}
                  placeholder="۰۲۱-۶۵۲۲۰۰۱۱"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono dir-ltr text-left outline-hidden focus:bg-white focus:border-stone-400"
                />
                <span className="text-[10px] text-stone-400 mt-0.5 block">نمایش در بخش تماس با کارخانه و فروش عمده</span>
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  شماره موبایل پشتیبانی ۲۴ ساعته *
                </label>
                <input
                  type="text"
                  required
                  value={formData.supportMobile || ''}
                  onChange={(e) => handleChange('supportMobile', e.target.value)}
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono dir-ltr text-left outline-hidden focus:bg-white focus:border-stone-400"
                />
                <span className="text-[10px] text-stone-400 mt-0.5 block">برای هماهنگی پیامکی و ارسال کد تایید</span>
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  شماره موبایل واحد فروش عمده و صادرات
                </label>
                <input
                  type="text"
                  value={formData.salesMobile || ''}
                  onChange={(e) => handleChange('salesMobile', e.target.value)}
                  placeholder="۰۹۱۲۹۸۷۶۵۴۳"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono dir-ltr text-left outline-hidden focus:bg-white focus:border-stone-400"
                />
                <span className="text-[10px] text-stone-400 mt-0.5 block">نمایش اختصاصی در صفحه ثبت سفارش عمده</span>
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  تلفن مستقیم خط فروش عمده و بازرگانی
                </label>
                <input
                  type="text"
                  value={formData.wholesalePhone || ''}
                  onChange={(e) => handleChange('wholesalePhone', e.target.value)}
                  placeholder="۰۲۱-۸۸۹۹۲۲۱۱"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono dir-ltr text-left outline-hidden focus:bg-white focus:border-stone-400"
                />
                <span className="text-[10px] text-stone-400 mt-0.5 block">نمایش در باکس تماس بخش عمده و صفحه نخست</span>
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  لینک یا شماره واتساپ (WhatsApp)
                </label>
                <input
                  type="text"
                  value={formData.whatsapp || ''}
                  onChange={(e) => handleChange('whatsapp', e.target.value)}
                  placeholder="https://wa.me/989123456789"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono dir-ltr text-left outline-hidden focus:bg-white focus:border-stone-400"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  لینک کانال یا آیدی تلگرام (Telegram)
                </label>
                <input
                  type="text"
                  value={formData.telegram || ''}
                  onChange={(e) => handleChange('telegram', e.target.value)}
                  placeholder="https://t.me/malasban_ir"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono dir-ltr text-left outline-hidden focus:bg-white focus:border-stone-400"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  آدرس پیج اینستاگرام (Instagram)
                </label>
                <input
                  type="text"
                  value={formData.instagram || ''}
                  onChange={(e) => handleChange('instagram', e.target.value)}
                  placeholder="https://instagram.com/malasban_official"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono dir-ltr text-left outline-hidden focus:bg-white focus:border-stone-400"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">ایمیل رسمی پشتیبانی</label>
                <input
                  type="email"
                  value={formData.supportEmail || ''}
                  onChange={(e) => handleChange('supportEmail', e.target.value)}
                  placeholder="info@malasban.ir"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono dir-ltr text-left outline-hidden focus:bg-white focus:border-stone-400"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1 text-xs">ساعات کاری و پاسخگویی</label>
              <input
                type="text"
                value={formData.workingHours || ''}
                onChange={(e) => handleChange('workingHours', e.target.value)}
                placeholder="شنبه تا پنج‌شنبه از ساعت ۹:۰۰ الی ۲۱:۰۰"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs outline-hidden focus:bg-white"
              />
            </div>
          </div>
        )}

        {/* 2. Brand & Identity Section */}
        {activeSection === 'brand' && (
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-2xs space-y-6 animate-in fade-in">
            <div className="border-b border-stone-100 pb-4">
              <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                <Building className="w-4 h-4 text-rose-800" />
                <span>اطلاعات هویتی برند، شعار تبلیغاتی و آدرس دفاتر</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                تنظیم نام رسمی و شعاری که در هدر، فوتر و صفحه اول نمایش داده می‌شود.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block font-bold text-stone-800 mb-1">نام برند / فروشگاه *</label>
                <input
                  type="text"
                  required
                  value={formData.brandName || ''}
                  onChange={(e) => handleChange('brandName', e.target.value)}
                  placeholder="فروشگاه تخصصی لواشک ملس‌بان"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-hidden focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">شعار اصلی برند (Tagline) *</label>
                <input
                  type="text"
                  required
                  value={formData.tagline || ''}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                  placeholder="طعم واقعی میوه، در هر تکه لواشک"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-hidden focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-800 mb-1">آدرس دفتر مرکزی و فروشگاه حضوری</label>
                <textarea
                  rows={2}
                  value={formData.address || ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="تهران، خیابان شریعتی، بعد از پل رومی، پلاک ۴۲، مجموعه کارگاهی ملس‌بان"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs outline-hidden focus:bg-white focus:border-stone-400"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">آدرس کارخانه و خط تولید</label>
                <textarea
                  rows={2}
                  value={formData.factoryAddress || ''}
                  onChange={(e) => handleChange('factoryAddress', e.target.value)}
                  placeholder="تهران، جاده شهریار، شهرک صنعتی نور، بلوار کارآفرینان، پلاک ۱۴، مجتمع کارگاهی ملس‌بان"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs outline-hidden focus:bg-white focus:border-stone-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. Banners & Promotions Section */}
        {activeSection === 'banners' && (
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-2xs space-y-8 animate-in fade-in">
            {/* Hero Banner Controls */}
            <div className="space-y-4">
              <div className="border-b border-stone-100 pb-3">
                <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-rose-800" />
                  <span>بنر اسلایدر اصلی صفحه اول (Hero Banner)</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  تیتر اصلی، تصویر و متن جلب توجه کننده در بالای صفحه نخست
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 text-xs">
                <div className="sm:col-span-8">
                  <label className="block font-bold text-stone-800 mb-1">تیتر اصلی بنر هدر (H1)</label>
                  <input
                    type="text"
                    value={formData.heroTitle || ''}
                    onChange={(e) => handleChange('heroTitle', e.target.value)}
                    placeholder="طعم واقعی میوه، در هر تکه لواشک"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-hidden focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block font-bold text-stone-800 mb-1">بج طلایی بالای هدر</label>
                  <input
                    type="text"
                    value={formData.heroBadge || ''}
                    onChange={(e) => handleChange('heroBadge', e.target.value)}
                    placeholder="فرآوری سنتی با بالاترین استانداردهای بهداشتی روز"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs outline-hidden focus:bg-white"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="block font-bold text-stone-800 mb-1">زیرتیتر و متن تشریحی هدر</label>
                <textarea
                  rows={2}
                  value={formData.heroSubtitle || ''}
                  onChange={(e) => handleChange('heroSubtitle', e.target.value)}
                  placeholder="ملس‌بان، طعم‌های خاطره‌انگیز و اصیل ایرانی را با خالص‌ترین پوره‌های انار..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs outline-hidden focus:bg-white focus:border-stone-400"
                />
              </div>

              <div className="pt-2">
                <ImageUploadField
                  label="تصویر بنر اصلی هدر صفحه نخست"
                  value={formData.heroImageUrl || ''}
                  onChange={(val) => handleChange('heroImageUrl', val)}
                  aspectRatioClass="h-48 sm:h-64"
                  maxDim={1600}
                  quality={0.88}
                  presetImages={BANNER_IMAGE_PRESETS}
                  helpText="برای انتخاب از کامپیوتر یا موبایل کلیک کرده یا عکس بنر را اینجا رها کنید (JPG, PNG, WebP)"
                  placeholderText="انتخاب تصویر بنر هدر اصلی (Browse)"
                />
              </div>
            </div>

            {/* Promo Banner Controls */}
            <div className="space-y-4 pt-6 border-t border-stone-200">
              <div className="border-b border-stone-100 pb-3">
                <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>بنر پروموشن و جشنواره تخفیف ویژه (وسط صفحه نخست)</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  اطلاع‌رسانی جشنواره‌های فصلی مانند یلدا، نوروز و بسته‌های تخفیف‌دار
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 text-xs">
                <div className="sm:col-span-8">
                  <label className="block font-bold text-stone-800 mb-1">عنوان جشنواره تخفیف</label>
                  <input
                    type="text"
                    value={formData.promoBannerTitle || ''}
                    onChange={(e) => handleChange('promoBannerTitle', e.target.value)}
                    placeholder="جشنواره ترش و شیرین ملس‌بان"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-hidden focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block font-bold text-stone-800 mb-1">نشان درصد تخفیف (Badge)</label>
                  <input
                    type="text"
                    value={formData.promoBannerDiscount || ''}
                    onChange={(e) => handleChange('promoBannerDiscount', e.target.value)}
                    placeholder="تا ۳۰٪ تخفیف ویژه"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs outline-hidden focus:bg-white"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="block font-bold text-stone-800 mb-1">متن توضیحات بنر جشنواره</label>
                <textarea
                  rows={2}
                  value={formData.promoBannerText || ''}
                  onChange={(e) => handleChange('promoBannerText', e.target.value)}
                  placeholder="تخفیف‌های هیجان‌انگیز روی سینی‌های پذیرایی و بسته‌های هدیه مخلوط ترشک و لواشک ارگانیک..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs outline-hidden focus:bg-white focus:border-stone-400"
                />
              </div>

              <div className="pt-2">
                <ImageUploadField
                  label="تصویر بنر پروموشن و جشنواره"
                  value={formData.promoBannerImageUrl || ''}
                  onChange={(val) => handleChange('promoBannerImageUrl', val)}
                  aspectRatioClass="h-44 sm:h-56"
                  maxDim={1600}
                  quality={0.88}
                  presetImages={BANNER_IMAGE_PRESETS}
                  helpText="عکس باکیفیت جشنواره را انتخاب کنید یا فایل را بکشید و رها کنید (Browse)"
                  placeholderText="انتخاب تصویر بنر جشنواره (Browse)"
                />
              </div>
            </div>
          </div>
        )}

        {/* 4. Top Announcement Bar Section */}
        {activeSection === 'announcement' && (
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-2xs space-y-6 animate-in fade-in">
            <div className="border-b border-stone-100 pb-4">
              <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-rose-800" />
                <span>نوار پیام و اعلان بالای وب‌سایت (Top Announcement Bar)</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                این نوار باریک در بالاترین بخش تمام صفحات سایت جهت اعلام تخفیف‌ها و شرایط ارسال قرار می‌گیرد.
              </p>
            </div>

            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-200">
              <div>
                <p className="font-bold text-stone-900 text-xs">فعال بودن نوار اعلان</p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  با غیرفعال کردن این گزینه، نوار اعلان به طور کامل از بالای سایت مخفی می‌شود.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isAnnouncementActive ?? true}
                  onChange={(e) => handleChange('isAnnouncementActive', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-800 mb-1">متن نوار اعلان *</label>
                <input
                  type="text"
                  value={formData.announcementBarText || ''}
                  onChange={(e) => handleChange('announcementBarText', e.target.value)}
                  placeholder="🎉 ارسال رایگان سفارش‌های بالای ۴۰۰ هزار تومان | ضمانت اصالت ۱۰۰٪ پوره طبیعی میوه"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-hidden focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">لینک هدف هنگام کلیک روی اعلان</label>
                <input
                  type="text"
                  value={formData.announcementBarLink || ''}
                  onChange={(e) => handleChange('announcementBarLink', e.target.value)}
                  placeholder="/shop یا https://..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono dir-ltr text-left outline-hidden focus:bg-white"
                />
              </div>

              {/* Live Preview of Announcement Bar */}
              <div className="space-y-1.5 pt-3">
                <span className="text-[11px] font-bold text-stone-500">پیش‌نمایش زنده نوار بالای سایت:</span>
                <div className="bg-rose-950 text-rose-100 text-xs py-2 px-4 rounded-xl flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="bg-rose-800 text-white font-bold px-2 py-0.5 rounded-sm text-[10px]">
                      پیشنهاد ویژه
                    </span>
                    <span>{formData.announcementBarText || 'متن پیش‌فرض اعلان'}</span>
                  </div>
                  <span className="text-rose-300 font-mono text-[11px] dir-ltr hidden sm:inline">
                    {formData.supportPhone}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. Shipping & Wholesale Rules Section */}
        {activeSection === 'shipping' && (
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-2xs space-y-6 animate-in fade-in">
            <div className="border-b border-stone-100 pb-4">
              <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-rose-800" />
                <span>قوانین ارسال سفارش، سقف رایگان و حداقل تناژ فروش عمده</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                مبالغ تعیین‌شده مستقیماً در سبد خرید و فرم ثبت سفارش مشتریان محاسبه می‌شوند.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  سقف خرید برای ارسال رایگان
                </label>
                <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl overflow-hidden focus-within:bg-white focus-within:border-stone-400">
                  <input
                    type="number"
                    value={formData.freeShippingThreshold || 0}
                    onChange={(e) => handleChange('freeShippingThreshold', Number(e.target.value))}
                    className="flex-1 bg-transparent px-3 py-2 text-xs font-mono dir-ltr text-left outline-hidden"
                  />
                  <span className="px-3 py-2 bg-stone-100 text-stone-500 font-bold text-xs border-r border-stone-200 select-none">
                    تومان
                  </span>
                </div>
                <span className="text-[10px] text-stone-400 mt-0.5 block">سبدهای بالاتر از این رقم، هزینه ارسال ۰ می‌شود.</span>
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  هزینه ارسال استاندارد
                </label>
                <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl overflow-hidden focus-within:bg-white focus-within:border-stone-400">
                  <input
                    type="number"
                    value={formData.standardShippingFee || 0}
                    onChange={(e) => handleChange('standardShippingFee', Number(e.target.value))}
                    className="flex-1 bg-transparent px-3 py-2 text-xs font-mono dir-ltr text-left outline-hidden"
                  />
                  <span className="px-3 py-2 bg-stone-100 text-stone-500 font-bold text-xs border-r border-stone-200 select-none">
                    تومان
                  </span>
                </div>
                <span className="text-[10px] text-stone-400 mt-0.5 block">برای سفارش‌های زیر سقف ارسال رایگان</span>
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  حداقل تناژ سفارش عمده
                </label>
                <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl overflow-hidden focus-within:bg-white focus-within:border-stone-400">
                  <input
                    type="number"
                    value={formData.wholesaleMinOrderKg || 0}
                    onChange={(e) => handleChange('wholesaleMinOrderKg', Number(e.target.value))}
                    className="flex-1 bg-transparent px-3 py-2 text-xs font-mono dir-ltr text-left outline-hidden"
                  />
                  <span className="px-3 py-2 bg-stone-100 text-stone-500 font-bold text-xs border-r border-stone-200 select-none">
                    کیلوگرم
                  </span>
                </div>
                <span className="text-[10px] text-stone-400 mt-0.5 block">حداقل مقدار مجاز در فرم استعلام عمده</span>
              </div>
            </div>
          </div>
        )}

        {/* 6. Wholesale Discount Tiers Section */}
        {activeSection === 'wholesaleTiers' && (
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-2xs space-y-6 animate-in fade-in">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
              <div>
                <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                  <BadgePercent className="w-5 h-5 text-amber-600" />
                  <span>مدیریت کامل جدول تخفیف‌های پلکانی فروش عمده و همکاری</span>
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  این جدول مستقیماً در صفحه فروش عمده (/wholesale) به مشتریان عمده، قنادی‌ها و صادرکنندگان نمایش داده می‌شود.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetTiersToDefault}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="بازگردانی به مقادیر پیش‌فرض ملس‌بان"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>پله‌های پیش‌فرض</span>
                </button>
                <button
                  type="button"
                  onClick={openAddTierModal}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>افزودن پله تخفیف جدید</span>
                </button>
              </div>
            </div>

            {/* Quick KPI stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-1">
                <span className="text-stone-500 text-xs font-bold">تعداد سطوح فعال همکاری</span>
                <p className="text-xl font-black text-stone-900">{toPersianDigits(currentTiers.length)} سطح</p>
              </div>
              <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 space-y-1">
                <span className="text-emerald-700 text-xs font-bold">حداکثر درصد تخفیف همکاری</span>
                <p className="text-xl font-black text-emerald-900">
                  {toPersianDigits(Math.max(...currentTiers.map((t) => t.discountPercent), 0))}٪ تخفیف
                </p>
              </div>
              <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 space-y-1">
                <span className="text-amber-800 text-xs font-bold">شروع حجم سفارش عمده</span>
                <p className="text-xl font-black text-amber-950">
                  از {toPersianDigits(Math.min(...currentTiers.map((t) => t.minQuantityKg), 20))} کیلوگرم
                </p>
              </div>
            </div>

            {/* Tiers Management Table */}
            <div className="overflow-x-auto border border-stone-200 rounded-2xl shadow-2xs">
              <table className="w-full text-right text-xs divide-y divide-stone-200">
                <thead className="bg-stone-100 text-stone-800 font-black">
                  <tr>
                    <th className="p-3.5">سطح همکاری</th>
                    <th className="p-3.5">حجم سفارش</th>
                    <th className="p-3.5">درصد تخفیف</th>
                    <th className="p-3.5">نوع بسته‌بندی</th>
                    <th className="p-3.5">شرایط ارسال</th>
                    <th className="p-3.5">توضیحات و مخاطب</th>
                    <th className="p-3.5 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {currentTiers.map((tier, idx) => (
                    <tr key={tier.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="p-3.5 font-black text-rose-900 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-800 text-[11px] font-bold flex items-center justify-center shrink-0">
                          {toPersianDigits(idx + 1)}
                        </span>
                        <span>{tier.tierName}</span>
                      </td>
                      <td className="p-3.5 font-bold text-stone-800">
                        {tier.maxQuantityKg
                          ? `${toPersianDigits(tier.minQuantityKg)} تا ${toPersianDigits(tier.maxQuantityKg)} کیلوگرم`
                          : `بالای ${toPersianDigits(tier.minQuantityKg)} کیلوگرم (تناژ)`}
                      </td>
                      <td className="p-3.5 font-black text-emerald-700">
                        <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg">
                          {toPersianDigits(tier.discountPercent)}٪ تخفیف
                        </span>
                      </td>
                      <td className="p-3.5 text-stone-600">{tier.packaging}</td>
                      <td className="p-3.5 text-stone-600">{tier.shippingCondition}</td>
                      <td className="p-3.5 text-stone-500 max-w-xs truncate">{tier.description || '—'}</td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditTierModal(tier)}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                            title="ویرایش سطح"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setTierToDelete(tier)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="حذف سطح"
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

            {/* Live Preview Box */}
            <div className="bg-stone-50 rounded-2xl p-5 border border-dashed border-stone-300 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>پیش‌نمایش زنده نحوه نمایش در صفحه فروش عمده:</span>
                </span>
                <span className="text-[11px] text-stone-400">به‌روزرسانی خودکار بر اساس جدول بالا</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {currentTiers.map((t) => (
                  <div key={t.id} className="bg-white p-4 rounded-xl border border-stone-200 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-rose-900">{t.tierName}</span>
                      <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {toPersianDigits(t.discountPercent)}٪
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-600">
                      <strong>حجم: </strong>
                      {t.maxQuantityKg
                        ? `${toPersianDigits(t.minQuantityKg)} تا ${toPersianDigits(t.maxQuantityKg)} کیلوگرم`
                        : `بیش از ${toPersianDigits(t.minQuantityKg)} کیلوگرم`}
                    </div>
                    <div className="text-[11px] text-stone-500">
                      <strong>بسته‌بندی: </strong>{t.packaging}
                    </div>
                    <div className="text-[11px] text-stone-500">
                      <strong>ارسال: </strong>{t.shippingCondition}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 7. FAQs Section */}
        {activeSection === 'faqs' && (
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-2xs space-y-6 animate-in fade-in">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
              <div>
                <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-amber-600" />
                  <span>مدیریت سوالات متداول (FAQ) وب‌سایت</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  پرسش‌های متداول مشتریان را اضافه، ویرایش، حذف و مرتب‌سازی کنید تا در صفحه اصلی و صفحه اختصاصی سوالات نمایش یابند.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetFaqsToDefault}
                  className="text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  title="بازگرداندن به پرسش‌های پیش‌فرض کارخانه"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>پیش‌فرض</span>
                </button>
                <button
                  type="button"
                  onClick={openAddFaqModal}
                  className="bg-rose-800 hover:bg-rose-900 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-rose-950/15 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>افزودن پرسش جدید</span>
                </button>
              </div>
            </div>

            {/* Quick Stats & Category Filter */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-50 p-3.5 rounded-2xl border border-stone-200 text-xs">
              <div className="flex items-center gap-2 font-bold text-stone-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>تعداد کل پرسش‌های ثبت‌شده: <strong className="text-rose-900 font-black">{toPersianDigits(currentFaqs.length)}</strong> مورد</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-stone-500 font-bold">فیلتر دسته‌بندی:</span>
                <select
                  value={faqFilterCategory}
                  onChange={(e) => setFaqFilterCategory(e.target.value)}
                  className="bg-white border border-stone-200 rounded-xl px-2.5 py-1 text-xs font-bold text-stone-800 outline-hidden cursor-pointer"
                >
                  <option value="all">همه دسته‌ها</option>
                  <option value="کیفیت و سلامت">کیفیت و سلامت</option>
                  <option value="فروش عمده">فروش عمده</option>
                  <option value="ارسال و پیگیری">ارسال و پیگیری</option>
                  <option value="نگهداری و مصرف">نگهداری و مصرف</option>
                  <option value="عمومی">عمومی</option>
                </select>
              </div>
            </div>

            {/* FAQs List Table */}
            <div className="overflow-x-auto border border-stone-200 rounded-2xl shadow-2xs">
              <table className="w-full text-right text-xs divide-y divide-stone-200">
                <thead className="bg-stone-100 text-stone-800 font-black">
                  <tr className="whitespace-nowrap">
                    <th className="p-3.5 whitespace-nowrap w-12 text-center">ردیف</th>
                    <th className="p-3.5 whitespace-nowrap">دسته‌بندی</th>
                    <th className="p-3.5">عنوان پرسش</th>
                    <th className="p-3.5">پاسخ</th>
                    <th className="p-3.5 text-center whitespace-nowrap w-24">ترتیب</th>
                    <th className="p-3.5 text-center whitespace-nowrap w-24">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {currentFaqs
                    .filter((f) => faqFilterCategory === 'all' || f.category === faqFilterCategory)
                    .map((faq, idx) => (
                      <tr key={faq.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="p-3.5 text-center font-bold text-stone-500 whitespace-nowrap">
                          {toPersianDigits(idx + 1)}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="bg-amber-100 text-amber-900 px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap">
                            {faq.category || 'عمومی'}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-stone-900 min-w-[200px]">
                          {faq.q}
                        </td>
                        <td className="p-3.5 text-stone-600 max-w-md leading-relaxed">
                          {faq.a}
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveFaq(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 rounded-md text-stone-400 hover:text-stone-800 disabled:opacity-30 transition-colors cursor-pointer"
                              title="انتقال به بالا"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveFaq(idx, 'down')}
                              disabled={idx === currentFaqs.length - 1}
                              className="p-1 rounded-md text-stone-400 hover:text-stone-800 disabled:opacity-30 transition-colors cursor-pointer"
                              title="انتقال به پایین"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => openEditFaqModal(faq)}
                              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                              title="ویرایش پرسش"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setFaqToDelete(faq)}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="حذف پرسش"
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

            {/* Live Interactive Accordion Preview */}
            <div className="bg-stone-50 rounded-2xl p-5 border border-dashed border-stone-300 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>پیش‌نمایش زنده نحوه نمایش در وب‌سایت:</span>
                </span>
                <span className="text-[11px] text-stone-400">روی پرسش‌ها کلیک کنید تا باز و بسته شوند</span>
              </div>

              <div className="space-y-2.5">
                {currentFaqs.map((faq, idx) => {
                  const isOpen = faqPreviewActiveIdx === idx;
                  return (
                    <div
                      key={faq.id}
                      className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs transition-all"
                    >
                      <button
                        type="button"
                        onClick={() => setFaqPreviewActiveIdx(isOpen ? null : idx)}
                        className="w-full p-3.5 text-right flex items-center justify-between gap-3 hover:bg-stone-50 transition-colors text-xs font-bold text-stone-900 cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 text-[10px] flex items-center justify-center shrink-0">
                            ؟
                          </span>
                          <span>{faq.q}</span>
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-stone-400 transition-transform duration-200 shrink-0 ${
                            isOpen ? 'rotate-180 text-rose-800' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 pt-1 text-xs text-stone-600 border-t border-stone-100 bg-stone-50/50 leading-relaxed">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Save Action Bar */}
        <div className="p-4 bg-stone-900 text-white rounded-2xl flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold">تغییرات شما به صورت آنی در سایت ذخیره و فعال خواهد شد.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-stone-950 text-xs font-black px-6 py-2 rounded-xl shadow-lg transition-all cursor-pointer"
            >
              {isSaving ? 'در حال ذخیره‌سازی...' : 'ذخیره نهایی تنظیمات'}
            </button>
          </div>
        </div>
      </form>
      )}

      {/* Modal: Add / Edit Wholesale Tier */}
      {isTierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-stone-200 space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <BadgePercent className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-stone-900">
                    {editingTier ? 'ویرایش سطح تخفیف همکاری' : 'تعریف پله جدید تخفیف همکاری'}
                  </h3>
                  <p className="text-[11px] text-stone-400">تنظیم مشخصات و تخفیف متناسب با حجم خرید عمده</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTierModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTier} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">نام و عنوان سطح همکاری *</label>
                <input
                  type="text"
                  required
                  value={tierFormName}
                  onChange={(e) => setTierFormName(e.target.value)}
                  placeholder="مثلاً: برنزی (فروشگاهی) یا نقره‌ای (پخش استانی)"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 outline-hidden focus:bg-white focus:border-stone-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">حداقل حجم *</label>
                  <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl overflow-hidden focus-within:bg-white focus-within:border-stone-400">
                    <input
                      type="number"
                      min={1}
                      required
                      value={tierFormMinKg}
                      onChange={(e) => setTierFormMinKg(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="مثلاً: ۲۰"
                      className="flex-1 bg-transparent px-3 py-2 text-stone-800 outline-hidden dir-ltr text-left"
                    />
                    <span className="px-2.5 py-2 bg-stone-100 text-stone-500 font-bold text-xs border-r border-stone-200 select-none">
                      کیلوگرم
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">حداکثر حجم</label>
                  <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl overflow-hidden focus-within:bg-white focus-within:border-stone-400">
                    <input
                      type="number"
                      min={1}
                      value={tierFormMaxKg}
                      onChange={(e) => setTierFormMaxKg(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="خالی = بدون سقف"
                      className="flex-1 bg-transparent px-3 py-2 text-stone-800 outline-hidden dir-ltr text-left placeholder:text-[10px]"
                    />
                    <span className="px-2.5 py-2 bg-stone-100 text-stone-500 font-bold text-xs border-r border-stone-200 select-none">
                      کیلوگرم
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400 mt-0.5 block">اگر خالی باشد، بالای حداقل در نظر گرفته می‌شود</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">درصد تخفیف از قیمت مصرف‌کننده *</label>
                <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl overflow-hidden focus-within:bg-white focus-within:border-stone-400">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={tierFormDiscount}
                    onChange={(e) => setTierFormDiscount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="مثلاً: ۲۵"
                    className="flex-1 bg-transparent px-3 py-2 text-stone-800 outline-hidden dir-ltr text-left font-black text-emerald-700"
                  />
                  <span className="px-3 py-2 bg-stone-100 text-stone-500 font-bold text-xs border-r border-stone-200 select-none">
                    درصد (٪)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">نوع بسته‌بندی</label>
                  <input
                    type="text"
                    value={tierFormPackaging}
                    onChange={(e) => setTierFormPackaging(e.target.value)}
                    placeholder="مثلاً: کارتن‌های مادر وکیوم"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 outline-hidden focus:bg-white focus:border-stone-400"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">شرایط و نحوه ارسال</label>
                  <input
                    type="text"
                    value={tierFormShipping}
                    onChange={(e) => setTierFormShipping(e.target.value)}
                    placeholder="مثلاً: ارسال رایگان به باربری"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 outline-hidden focus:bg-white focus:border-stone-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">توضیحات و مخاطبان این سطح (اختیاری)</label>
                <input
                  type="text"
                  value={tierFormDescription}
                  onChange={(e) => setTierFormDescription(e.target.value)}
                  placeholder="مثلاً: ویژه قنادی‌ها، خشکبارفروشان و شبکه‌های توزیع استانی"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 outline-hidden focus:bg-white focus:border-stone-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsTierModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {editingTier ? 'ذخیره تغییرات سطح' : 'افزودن به جدول'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting Tier */}
      {tierToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-stone-900">حذف سطح تخفیف</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                آیا از حذف سطح همکاری <strong className="text-stone-900">«{tierToDelete.tierName}»</strong> اطمینان دارید؟
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTierToDelete(null)}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => handleDeleteTier(tierToDelete.id)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-md transition-colors cursor-pointer"
              >
                بله، حذف شود
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add / Edit FAQ */}
      {isFaqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-stone-200 space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-stone-900">
                    {editingFaq ? 'ویرایش پرسش متداول' : 'افزودن پرسش متداول جدید'}
                  </h3>
                  <p className="text-[11px] text-stone-400">تنظیم عنوان و متن پاسخ دقیق برای نمایش در سایت</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFaqModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFaq} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">دسته‌بندی پرسش</label>
                <select
                  value={faqFormCategory}
                  onChange={(e) => setFaqFormCategory(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 font-bold outline-hidden focus:bg-white focus:border-stone-400 cursor-pointer"
                >
                  <option value="کیفیت و سلامت">کیفیت و سلامت (مواد اولیه و ارگانیک)</option>
                  <option value="فروش عمده">فروش عمده و شرایط همکاری</option>
                  <option value="ارسال و پیگیری">ارسال و تحویل سفارشات</option>
                  <option value="نگهداری و مصرف">شرایط نگهداری و مصرف</option>
                  <option value="عمومی">عمومی و سایر سوالات</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">متن پرسش *</label>
                <input
                  type="text"
                  required
                  value={faqFormQuestion}
                  onChange={(e) => setFaqFormQuestion(e.target.value)}
                  placeholder="مثلاً: آیا محصولات ملس‌بان دارای سیب سلامت و استانداردهای بهداشتی هستند؟"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 font-bold outline-hidden focus:bg-white focus:border-stone-400"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">پاسخ کامل به پرسش *</label>
                <textarea
                  rows={4}
                  required
                  value={faqFormAnswer}
                  onChange={(e) => setFaqFormAnswer(e.target.value)}
                  placeholder="پاسخ کامل، شفاف و محترمانه به این پرسش متداول..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-800 leading-relaxed outline-hidden focus:bg-white focus:border-stone-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsFaqModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {editingFaq ? 'ذخیره تغییرات پرسش' : 'افزودن به لیست سوالات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting FAQ */}
      {faqToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-stone-900">حذف پرسش متداول</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                آیا از حذف پرسش <strong className="text-stone-900">«{faqToDelete.q}»</strong> اطمینان دارید؟
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFaqToDelete(null)}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => handleDeleteFaq(faqToDelete.id)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-md transition-colors cursor-pointer"
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
