import React from 'react';
import { Award, ShieldCheck, Heart, Sparkles, Factory, CheckCircle2, ArrowLeft } from 'lucide-react';

interface AboutViewProps {
  onNavigate: (route: string, param?: string) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* 1. Hero Section */}
      <div className="relative rounded-3xl overflow-hidden bg-stone-900 text-white p-8 sm:p-16 shadow-xl">
        <div className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-overlay" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1541344999736-83eca872f242?w=1600&q=80')` }}></div>
        <div className="relative z-10 max-w-2xl space-y-5">
          <span className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            داستان تولد ملس‌بان
          </span>
          <h1 className="text-3xl sm:text-5xl font-black leading-tight text-white">
            اصالت طعم‌های نوستالژیک با بالاترین استانداردهای سلامت
          </h1>
          <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
            ملس‌بان با هدف احیای خاطره لواشک‌های سنتی دست‌ساز ایرانی و ارتقای آن به سطح یک محصول غذایی مدرن، بهداشتی و بدون هیچ‌گونه ماده شیمیایی آغاز به کار کرد.
          </p>
        </div>
      </div>

      {/* 2. Brand Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-800 flex items-center justify-center">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="font-black text-stone-900 text-base">میوه‌های ۱۰۰٪ طبیعی</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            هیچ پوره صنعتی، اسید سیتریک صنعتی، نشاسته یا ژلاتینی در ملس‌بان راه ندارد. تمام بافت و طعم از گوشت خالص میوه تأمین می‌شود.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-black text-stone-900 text-base">سیب سلامت و اتاق تمیز</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            فرآوری در کلین‌روم‌های کاملاً استریل با نظارت مستمر آزمایشگاه کنترل کیفی و دارای نشان ملی استاندارد و پروانه ساخت سازمان غذا و دارو.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center">
            <Factory className="w-6 h-6" />
          </div>
          <h3 className="font-black text-stone-900 text-base">خشک‌کن‌های هوای گرم مدرن</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            جلوگیری از جذب گرد و غبار با خشک‌کن‌های اتوماتیک در دمای کنترل‌شده که باعث حفظ حداکثری ویتامین‌ها و آنتی‌اکسیدان‌های میوه می‌شود.
          </p>
        </div>
      </div>

      {/* 3. Story Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 text-stone-700 leading-relaxed text-sm">
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900">
            چرا لواشک ملس‌بان متفاوت است؟
          </h2>
          <p>
            همه ما طعم لواشک‌های حیاط مادربزرگ را به یاد داریم؛ پهن‌شده در سینی‌های بزرگ روی پشت‌بام با ترشی بی‌نظیر انار و آلبالو. اما در زندگی امروز، دغدغه آلودگی محیطی و بیماری‌ها مانع از لذت بردن از لواشک‌های دست‌ساز بدون نظارت می‌شود.
          </p>
          <p>
            از طرفی دیگر، لواشک‌های صنعتی موجود در بازار اغلب پر از رنگ‌های مصنوعی خوراکی، اسیدهای زننده و شکر افزوده هستند که ارزش غذایی میوه را از بین می‌برند.
          </p>
          <p className="font-bold text-rose-900">
            ملس‌بان نقطه پیوند سنت و مدرنیته است: همان عطر و طعم خالص باغ‌های میوه ایران، اما در فضایی کاملاً مکانیزه، استریل و بدون کوچکترین ناخالصی.
          </p>

          <div className="pt-4">
            <button
              onClick={() => onNavigate('shop')}
              className="bg-rose-800 hover:bg-rose-900 text-white font-bold px-8 py-3.5 rounded-2xl shadow-md transition-all text-xs inline-flex items-center gap-2"
            >
              <span>مشاهده محصولات ملس‌بان</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="relative">
          <img
            src="https://images.unsplash.com/photo-1557800636-894a64c1696f?w=800&q=80"
            alt="میوه‌های تازه باغی"
            className="rounded-3xl shadow-xl w-full h-[420px] object-cover"
          />
          <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-3xl shadow-lg border border-stone-200 hidden sm:block max-w-xs">
            <div className="flex items-center gap-2 text-rose-800 font-black text-sm mb-1">
              <Award className="w-5 h-5" />
              <span>تضمین اصالت و مرغوبیت</span>
            </div>
            <p className="text-xs text-stone-500">
              در صورت عدم رضایت از تازگی یا طعم، مرجوعی بدون قید و شرط امکان‌پذیر است.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
