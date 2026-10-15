import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import {
  HelpCircle,
  Search,
  ChevronDown,
  Phone,
  MessageCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { toPersianDigits } from '../lib/formatters';

interface FaqViewProps {
  onNavigate: (route: string, param?: string) => void;
}

export const FaqView: React.FC<FaqViewProps> = ({ onNavigate }) => {
  const { settings } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeFaqId, setActiveFaqId] = useState<string | null>(null);

  const defaultFaqs = [
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

  const allFaqs = settings.faqs && settings.faqs.length > 0 ? settings.faqs : defaultFaqs;

  // Categories extraction
  const categories = ['all', ...Array.from(new Set(allFaqs.map((f) => f.category || 'عمومی')))];

  // Filtering
  const filteredFaqs = allFaqs.filter((f) => {
    const matchesCategory = selectedCategory === 'all' || (f.category || 'عمومی') === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-stone-50/50 py-10 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-stone-500 font-bold">
          <button
            onClick={() => onNavigate('home')}
            className="hover:text-rose-900 transition-colors cursor-pointer"
          >
            صفحه اصلی
          </button>
          <span>/</span>
          <span className="text-stone-800">سوالات متداول</span>
        </div>

        {/* Hero Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-900 px-3.5 py-1.5 rounded-full text-xs font-black border border-rose-200 shadow-2xs">
            <HelpCircle className="w-4 h-4 text-rose-700" />
            <span>مرکز راهنمایی و پاسخ به پرسش‌ها</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-stone-900 tracking-tight">
            سوالات متداول مشتریان ملس‌بان
          </h1>

          <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto leading-relaxed">
            پاسخ سریع به متداول‌ترین پرسش‌ها درباره ترکیبات ارگانیک، شیوه سفارش خرده و عمده، ارسال و شرایط نگهداری
          </p>

          {/* Search Box */}
          <div className="max-w-md mx-auto pt-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در بین پرسش‌ها..."
                className="w-full bg-white border border-stone-200 focus:border-rose-700 rounded-2xl pr-11 pl-4 py-3 text-xs sm:text-sm text-stone-800 outline-hidden shadow-xs transition-all"
              />
              <Search className="w-5 h-5 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-rose-900 text-white shadow-xs'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}
            >
              {cat === 'all' ? 'همه سوالات' : cat}
            </button>
          ))}
        </div>

        {/* FAQs Accordion List */}
        <div className="space-y-3">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, idx) => {
              const isOpen = activeFaqId === faq.id || (activeFaqId === null && idx === 0 && !searchQuery);
              return (
                <div
                  key={faq.id}
                  className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs transition-all"
                >
                  <button
                    onClick={() => setActiveFaqId(isOpen ? 'none' : faq.id)}
                    className="w-full text-right p-4 sm:p-5 flex items-center justify-between gap-4 font-bold text-sm text-stone-900 hover:text-rose-900 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 text-xs font-black flex items-center justify-center shrink-0">
                        {toPersianDigits(idx + 1)}
                      </span>
                      <span>{faq.q}</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-stone-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-rose-800' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-stone-600 leading-relaxed border-t border-stone-100 animate-in fade-in bg-stone-50/40">
                      {faq.category && (
                        <span className="inline-block mb-2 text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                          دسته‌بندی: {faq.category}
                        </span>
                      )}
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="bg-white p-12 text-center rounded-3xl border border-stone-200 space-y-3">
              <HelpCircle className="w-10 h-10 text-stone-300 mx-auto" />
              <p className="text-sm font-bold text-stone-700">پرسشی با این مشخصات یافت نشد.</p>
              <p className="text-xs text-stone-400">می‌توانید عبارت دیگری را جستجو کرده یا فیلتر دسته‌بندی را تغییر دهید.</p>
            </div>
          )}
        </div>

        {/* Need More Help / Contact Support Box */}
        <div className="bg-gradient-to-r from-rose-900 to-rose-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-black flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>پاسخ سوال خود را پیدا نکردید؟</span>
              </h3>
              <p className="text-xs text-stone-300 leading-relaxed max-w-md">
                تیم پشتیبانی و کارشناسان فروش ملس‌بان همواره آماده پاسخگویی به پرسش‌ها و راهنمایی شما در انتخاب طعم‌های دلخواه هستند.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={`tel:${(settings.supportPhone || '02188992211').replace(/[^0-9]/g, '')}`}
                className="bg-white hover:bg-stone-100 text-rose-950 text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-colors whitespace-nowrap"
              >
                <Phone className="w-4 h-4 text-rose-700" />
                <span className="dir-ltr">{settings.supportPhone || '۰۲۱-۸۸۹۹۲۲۱۱'}</span>
              </a>

              <a
                href={settings.whatsapp || 'https://wa.me/989123456789'}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-colors whitespace-nowrap"
              >
                <MessageCircle className="w-4 h-4" />
                <span>پشتیبانی واتساپ</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
