import React, { useState, useEffect } from 'react';
import { Product, Category, BlogPost } from '../types';
import { ProductCard } from '../components/common/ProductCard';
import { useSettings } from '../context/SettingsContext';
import {
  Sparkles,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  ArrowLeft,
  Briefcase,
  ChevronDown,
  Quote,
  Star,
  BookOpen,
} from 'lucide-react';
import { toPersianDigits } from '../lib/formatters';

interface HomeViewProps {
  onNavigate: (route: string, param?: string) => void;
  onQuickView: (product: Product) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, onQuickView }) => {
  const { settings } = useSettings();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    // Fetch products
    fetch('/api/products?featured=true')
      .then((r) => r.json())
      .then((data) => setFeaturedProducts(data))
      .catch(() => {});

    // Fetch categories
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => setCategories(data))
      .catch(() => {});

    // Fetch blog posts
    fetch('/api/blog')
      .then((r) => r.json())
      .then((data) => setBlogPosts(data.slice(0, 3)))
      .catch(() => {});
  }, []);

  const defaultFaqs = [
    {
      q: 'آیا در تهیه لواشک‌های ملس‌بان از شکر یا جوهر لیمو استفاده می‌شود؟',
      a: 'خیر، به هیچ وجه! تمام محصولات ملس‌بان از ۱۰۰٪ پوره میوه طبیعی تهیه شده و ترشی آن کاملاً حاصل اسیدهای ارگانیک میوه (مانند اسید مالیک و اسید تارتاریک طبیعی) است و هیچ‌گونه شکر مصنوعی یا افزودنی سنتتیک به آن اضافه نمی‌شود.',
    },
    {
      q: 'حداقل میزان سفارش در بخش فروش عمده چقدر است؟',
      a: 'حداقل سفارش عمده ۲۰ کیلوگرم یا یک کارتن مادر استاندارد است. برای سفارش‌های بالای ۱۰۰ کیلوگرم تخفیف‌های پلکانی ویژه همکاران در نظر گرفته شده است.',
    },
    {
      q: 'سفارش‌ها چگونه ارسال می‌شوند و چند روزه به دست ما می‌رسند؟',
      a: 'سفارش‌های تهران با پیک سریع و سفارش‌های شهرستان با پست پیشتاز یا تیپاکس ارسال می‌گردد. زمان تحویل در تهران همان روز یا حداکثر ۲۴ ساعت و برای شهرستان‌ها بین ۲ الی ۳ روز کاری است.',
    },
    {
      q: 'شرایط نگهداری لواشک‌ها برای ماندگاری بیشتر چیست؟',
      a: 'از آنجایی که مواد نگهدارنده شیمیایی در محصولات وجود ندارد، بهتر است لواشک‌ها در جای خشک، خنک و دور از نور مستقیم خورشید (یا داخل یخچال) نگهداری شوند. در این شرایط تا ۶ ماه طراوت اولیه خود را حفظ می‌کنند.',
    },
  ];

  const faqs = settings.faqs && settings.faqs.length > 0 ? settings.faqs : defaultFaqs;

  return (
    <div className="space-y-20 pb-16">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-stone-100 via-rose-50/40 to-stone-50 pt-10 pb-20 border-b border-stone-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content (RTL Right) */}
            <div className="lg:col-span-7 space-y-6 text-right">
              <div className="inline-flex items-center gap-2 bg-rose-100/80 text-rose-900 border border-rose-200 px-3.5 py-1.5 rounded-full text-xs font-bold">
                <Sparkles className="w-4 h-4 text-rose-700" />
                <span>{settings.heroBadge || 'فرآوری سنتی با بالاترین استانداردهای بهداشتی روز'}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-stone-900 leading-[1.25] tracking-tight">
                {settings.heroTitle ? (
                  settings.heroTitle
                ) : (
                  <>
                    طعم واقعی میوه، <br />
                    <span className="text-rose-800 underline decoration-rose-300 decoration-wavy decoration-2">
                      در هر تکه لواشک
                    </span>
                  </>
                )}
              </h1>

              <p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-2xl font-normal">
                {settings.heroSubtitle ||
                  'ملس‌بان، طعم‌های خاطره‌انگیز و اصیل ایرانی را با خالص‌ترین پوره‌های انار، زرشک، آلبالو و زردآلو به خانه‌های شما می‌آورد. ۱۰۰٪ طبیعی، سرشار از ویتامین، با بسته‌بندی بهداشتی تک‌نفره و مجلسی.'}
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => onNavigate('shop')}
                  className="bg-rose-800 hover:bg-rose-900 text-white font-bold px-7 py-3.5 rounded-2xl shadow-lg hover:shadow-rose-900/25 transition-all text-sm flex items-center gap-2 active:scale-95"
                >
                  <span>مشاهده و خرید محصولات</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onNavigate('wholesale')}
                  className="bg-white hover:bg-amber-50 text-amber-900 border-2 border-amber-500 font-bold px-7 py-3.5 rounded-2xl shadow-xs transition-all text-sm flex items-center gap-2 active:scale-95"
                >
                  <Briefcase className="w-4 h-4 text-amber-600" />
                  <span>ثبت سفارش عمده و همکاری</span>
                </button>
              </div>

              {/* Quick USP Highlights */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-stone-200/80 text-xs font-bold text-stone-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>بدون جوهر لیمو و اسید</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>دارای سیب سلامت رسمی</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>تضمین بازگشت وجه</span>
                </div>
              </div>
            </div>

            {/* Right Hero Visuals */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Decorative background blob */}
                <div className="absolute -inset-4 bg-gradient-to-tr from-rose-200 to-amber-100 rounded-3xl blur-2xl opacity-60"></div>

                {/* Hero Showcase Card */}
                <div className="relative bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-2xl overflow-hidden">
                  <img
                    src={
                      settings.heroImageUrl ||
                      'https://images.unsplash.com/photo-1541344999736-83eca872f242?w=900&q=80'
                    }
                    alt={settings.brandName || 'لواشک ملس‌بان'}
                    className="w-full h-80 sm:h-96 object-cover rounded-2xl"
                  />

                  {/* Floating Highlight Pill */}
                  <div className="absolute top-8 right-8 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-stone-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-lg">
                      ٪۱۰۰
                    </div>
                    <div>
                      <p className="text-xs font-black text-stone-900">ارگانیک و خالص</p>
                      <p className="text-[10px] text-stone-500">پوره میوه دست‌چین باغی</p>
                    </div>
                  </div>

                  {/* Floating Best Seller Badge */}
                  <div className="absolute bottom-8 left-8 bg-stone-900/90 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-lg flex items-center gap-3">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <span className="text-xs font-bold">بیش از ۵,۰۰۰ خریدار راضی</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Categories Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-rose-800 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
            تنوع بی‌نظیر طعم‌ها
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 mt-2">
            دسته‌بندی‌های تخصصی لواشک ملس‌بان
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-2">
            از ترش‌ترین طعم‌های قائنات و کوهستان تا ملایم‌ترین لواشک‌های شیرین و سینی‌های پذیرایی
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onNavigate('shop', `category=${cat.id}`)}
              className="group relative bg-white p-3 rounded-2xl border border-stone-200 shadow-2xs hover:shadow-lg hover:border-rose-300 transition-all cursor-pointer text-center flex flex-col items-center"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-stone-100 mb-3 group-hover:scale-105 transition-transform duration-300">
                <img
                  src={cat.imageUrl}
                  alt={cat.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-stone-800 group-hover:text-rose-900 transition-colors">
                {cat.name}
              </h3>
              <span className="text-[10px] text-stone-400 mt-1">مشاهده محصولات &larr;</span>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Featured & Best Seller Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold text-rose-800 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
              پرطرفدارترین‌ها
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 mt-2">
              محصولات ویژه و پرفروش
            </h2>
          </div>

          <button
            onClick={() => onNavigate('shop')}
            className="text-xs font-bold text-rose-800 hover:text-rose-950 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>مشاهده همه محصولات فروشگاه</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {featuredProducts.slice(0, 8).map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              onQuickView={onQuickView}
              onNavigate={(slug) => onNavigate('product-detail', slug)}
            />
          ))}
        </div>
      </section>

      {/* 4. Wholesale Banner Call-to-Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-gradient-to-br from-stone-900 via-stone-900 to-rose-950 rounded-3xl text-white p-8 sm:p-12 overflow-hidden shadow-2xl border border-stone-800">
          {/* Background pattern */}
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4 text-right">
              <span className="inline-block bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold px-3.5 py-1 rounded-full">
                ویژه فروشگاه‌ها، قنادی‌ها، هایپرمارکت‌ها و صادرکنندگان
              </span>

              <h3 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                تأمین عمده و مستمر لواشک طبیعی با قیمت درب کارخانه
              </h3>

              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-2xl">
                اگر صاحب فروشگاه زنجیره‌ای، قنادی، کافه، یا صادرکننده مواد غذایی هستید؛ ملس‌بان آمادگی دارد با تضمین کیفیت، بسته‌بندی استاندارد بین‌المللی و حاشیه سود عالی، محصولات را به صورت تناژ و کارتنی تأمین نماید.
              </p>

              <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-amber-200">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>تخفیف‌های پلکانی تا ۳۵٪</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>صدور فاکتور رسمی معتبر</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>ارسال نمونه رایگان قبل از عقد قرارداد</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col items-center sm:items-start lg:items-end justify-center">
              <button
                onClick={() => onNavigate('wholesale')}
                className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-black px-8 py-4 rounded-2xl shadow-lg transition-all text-sm flex items-center gap-2 hover:scale-105 active:scale-95"
              >
                <span>مشاهده شرایط و ثبت سفارش عمده</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-[11px] text-stone-400 mt-2">
                تماس مستقیم با واحد بازرگانی: {settings.wholesalePhone || settings.salesMobile || settings.supportPhone || '۰۲۱-۸۸۹۹۲۲۱۱'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Quality & Natural Flavor Spectrum Guide */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-12 shadow-sm">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-rose-800 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
              راهنمای طعم‌شناسی
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 mt-2">
              طیف درجه‌بندی ترشی لواشک‌های ملس‌بان
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-2">
              سلیقه شما کدام است؟ از طعم‌های ملایم تابستانی تا ترش‌ترین عصاره‌های جنگلی
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-100 text-right space-y-2">
              <span className="inline-block px-2.5 py-1 text-xs font-black rounded-lg bg-amber-200 text-amber-900">
                درجه ۱: شیرین و ملایم
              </span>
              <h4 className="font-bold text-sm text-stone-800">زردآلو، سیب و انبه</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                بدون ترشی آزاردهنده، مناسب برای کودکان و سالمندان، دارای عطر دلنشین میوه شیرین آفتاب‌خورده.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-orange-50/60 border border-orange-100 text-right space-y-2">
              <span className="inline-block px-2.5 py-1 text-xs font-black rounded-lg bg-orange-200 text-orange-900">
                درجه ۲: ملس دلنشین
              </span>
              <h4 className="font-bold text-sm text-stone-800">انار ساوه و آلو قطره‌طلا</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                تعادل بی‌نظیر ترش و شیرین؛ پرطرفدارترین طعم ملس‌بان با بافتی نرم و گوشتی.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-100 text-right space-y-2">
              <span className="inline-block px-2.5 py-1 text-xs font-black rounded-lg bg-rose-200 text-rose-900">
                درجه ۳: ترش جنگلی
              </span>
              <h4 className="font-bold text-sm text-stone-800">آلبالو کوهی و کیوی تالش</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                ترشی پرطراوت و اصیل با بوی تند میوه کوهستانی که دهان را خنک و باطراوت می‌کند.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-red-50/60 border border-red-100 text-right space-y-2">
              <span className="inline-block px-2.5 py-1 text-xs font-black rounded-lg bg-red-200 text-red-900">
                درجه ۴: فوق‌العاده ترش
              </span>
              <h4 className="font-bold text-sm text-stone-800">زرشک اعلای قائنات و قره‌قروت</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                مخصوص عاشقان ترشی‌های سنگین و گزنده! پر از آنتی‌اکسیدان، تصفیه‌کننده کبد و خون.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Customer Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold text-rose-800 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
            صدای مشتریان
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 mt-2">
            نظرات خریداران واقعی ملس‌بان
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs space-y-4">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <p className="text-xs text-stone-600 leading-relaxed italic">
              «من به خاطر رفلاکس معده نمی‌تونستم لواشک‌های بازاری بخورم چون سریع ترش می‌کردم. ولی لواشک انار ملس‌بان رو امتحان کردم و واقعاً احساس طبیعی بودنش مشخصه. هیچ اسید شیمیایی نداره.»
            </p>
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
              <span className="font-bold text-stone-800">دکتر رضا فرهمند</span>
              <span className="text-stone-400">خریدار لواشک انار ساوه</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs space-y-4">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <p className="text-xs text-stone-600 leading-relaxed italic">
              «سینی‌های رولی مجلسی رو برای افتتاحیه کلینیک‌مون سفارش دادیم. چیدمان و طعم رول‌ها فوق‌العاده شیک بود و همه مهمون‌ها آدرس سایت شما رو می‌خواستن!»
            </p>
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
              <span className="font-bold text-stone-800">شادی نادری</span>
              <span className="text-stone-400">خریدار سینی رولی مجلسی</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs space-y-4">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <p className="text-xs text-stone-600 leading-relaxed italic">
              «ما برای قنادی‌مون از ملس‌بان به صورت عمده ۲۰ کیلویی خریدیم. بسته‌بندی عالی، بدون چسبندگی به سلفون و تاریخ تولید روز. فروش‌مون خیلی بالا رفت.»
            </p>
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
              <span className="font-bold text-stone-800">حاج محمود صابری</span>
              <span className="text-stone-400">مشتری عمده - اصفهان</span>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Blog Highlights */}
      {blogPosts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs font-bold text-rose-800 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                مجله ملس‌بان
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-stone-900 mt-2">
                آخرین مقالات و دانستنی‌های تغذیه
              </h2>
            </div>
            <button
              onClick={() => onNavigate('blog')}
              className="text-xs font-bold text-rose-800 hover:text-rose-950 flex items-center gap-1"
            >
              <span>مشاهده همه مقالات</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {blogPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => onNavigate('blog-post', post.slug)}
                className="group bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-2xs hover:shadow-lg transition-all cursor-pointer flex flex-col"
              >
                <div className="h-48 overflow-hidden bg-stone-100">
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[11px] font-bold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-md">
                      {post.category}
                    </span>
                    <h3 className="font-bold text-sm text-stone-900 mt-2 group-hover:text-rose-900 transition-colors leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-xs text-stone-500 mt-2 line-clamp-2 leading-relaxed">
                      {post.summary}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
                    <span>زمان مطالعه: {toPersianDigits(post.readTimeMinutes)} دقیقه</span>
                    <span className="font-bold text-rose-800">ادامه مطلب &larr;</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 8. FAQ Accordion */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <span className="text-xs font-bold text-rose-800 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
            پرسش‌های رایج
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 mt-2">
            پاسخ به سوالات متداول مشتریان
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-stone-200 overflow-hidden transition-all"
            >
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full text-right p-4 sm:p-5 flex items-center justify-between gap-4 font-bold text-sm text-stone-800 hover:text-rose-900"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-stone-400 shrink-0 transition-transform duration-200 ${
                    activeFaq === idx ? 'rotate-180 text-rose-800' : ''
                  }`}
                />
              </button>
              {activeFaq === idx && (
                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-stone-600 leading-relaxed border-t border-stone-100 animate-in fade-in">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
