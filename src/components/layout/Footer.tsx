import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { useSettings } from '../../context/SettingsContext';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Send,
  Instagram,
  MessageCircle,
} from 'lucide-react';

interface FooterProps {
  onNavigate: (route: string, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const { showToast } = useToast();
  const { settings } = useSettings();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      showToast('با تشکر! ایمیل شما برای دریافت تخفیف‌های ویژه ثبت شد.', 'success');
      setEmail('');
    }
  };

  return (
    <footer className="bg-stone-900 text-stone-300 pt-16 pb-12 border-t border-stone-800">
      {/* Top Value Propositions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-12 border-b border-stone-800">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-stone-800/40 border border-stone-800">
            <div className="w-12 h-12 rounded-xl bg-rose-950/60 text-rose-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">۱۰۰٪ میوه خالص</h4>
              <p className="text-xs text-stone-400 mt-0.5">بدون جوهر لیمو و اسیدهای شیمیایی</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-stone-800/40 border border-stone-800">
            <div className="w-12 h-12 rounded-xl bg-rose-950/60 text-rose-400 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">ارسال سریع به سراسر ایران</h4>
              <p className="text-xs text-stone-400 mt-0.5">بسته‌بندی ضربه‌گیر و وکیوم بهداشتی</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-stone-800/40 border border-stone-800">
            <div className="w-12 h-12 rounded-xl bg-rose-950/60 text-rose-400 flex items-center justify-center shrink-0">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">ضمانت رضایت و تازگی</h4>
              <p className="text-xs text-stone-400 mt-0.5">امکان مرجوعی کالا در صورت عدم رضایت</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-stone-800/40 border border-stone-800">
            <div className="w-12 h-12 rounded-xl bg-rose-950/60 text-rose-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">قیمت دست اول کارخانه</h4>
              <p className="text-xs text-stone-400 mt-0.5">تخفیف‌های پلکانی ویژه خریداران عمده</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand Bio */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-rose-700 rounded-xl flex items-center justify-center text-white font-black text-lg">
              {settings.brandName ? settings.brandName.trim().charAt(0) : 'م'}
            </div>
            <span className="font-black text-xl text-white">{settings.brandName || 'ملس‌بان'}</span>
          </div>
          <p className="text-xs text-stone-400 leading-relaxed">
            {settings.tagline ? `${settings.tagline}. ` : ''}برند تخصصی تولید انواع لواشک طبیعی، پذیرایی، کیک لواشکی و سس‌های انار ارگانیک. ما با بهره‌گیری از تازه‌ترین میوه‌های فصلی و بهداشت مدرن، خاطره خوش طعم‌های نوستالژیک را دوباره زنده کرده‌ایم.
          </p>

          <div className="flex items-center gap-3 pt-2">
            {settings.instagram && (
              <a
                href={settings.instagram}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-rose-900 text-stone-300 hover:text-white flex items-center justify-center transition-colors"
                title="اینستاگرام"
              >
                <Instagram className="w-4 h-4" />
              </a>
            )}
            {settings.whatsapp && (
              <a
                href={settings.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-emerald-800 text-stone-300 hover:text-white flex items-center justify-center transition-colors"
                title="واتساپ"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            )}
            {settings.telegram && (
              <a
                href={settings.telegram}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-sky-800 text-stone-300 hover:text-white flex items-center justify-center transition-colors"
                title="تلگرام"
              >
                <Send className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-bold text-white text-sm mb-4 border-r-2 border-rose-600 pr-2.5">
            دسترسی سریع
          </h4>
          <ul className="space-y-2.5 text-xs text-stone-400">
            <li>
              <button onClick={() => onNavigate('shop')} className="hover:text-white transition-colors">
                فروشگاه و محصولات
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('wholesale')} className="hover:text-amber-400 transition-colors font-bold">
                فرم درخواست سفارش عمده
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('blog')} className="hover:text-white transition-colors">
                وبلاگ و مقالات سلامت
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('about')} className="hover:text-white transition-colors">
                درباره برند ملس‌بان
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('contact')} className="hover:text-white transition-colors">
                تماس با کارشناسان فروش
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('faq')} className="hover:text-white transition-colors">
                پرسش‌های متداول
              </button>
            </li>
          </ul>
        </div>

        {/* Categories */}
        <div>
          <h4 className="font-bold text-white text-sm mb-4 border-r-2 border-rose-600 pr-2.5">
            دسته‌بندی‌های محبوب
          </h4>
          <ul className="space-y-2.5 text-xs text-stone-400">
            <li>
              <button onClick={() => onNavigate('shop', 'category=cat-anar')} className="hover:text-white transition-colors">
                لواشک انار ساوه اصل
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('shop', 'category=cat-albaloo')} className="hover:text-white transition-colors">
                لواشک آلبالو و زرشک ترش
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('shop', 'category=cat-alou')} className="hover:text-white transition-colors">
                لواشک آلو و زردآلو ملس
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('shop', 'category=cat-majlesi')} className="hover:text-white transition-colors">
                سینی‌های رولی مجلسی
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('shop', 'category=cat-gift')} className="hover:text-white transition-colors">
                پک‌های هدیه چوبی کادویی
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('wholesale')} className="hover:text-white transition-colors">
                کارتن‌های ۲۰ کیلویی عمده
              </button>
            </li>
          </ul>
        </div>

        {/* Contact Info & Newsletter */}
        <div className="space-y-4">
          <h4 className="font-bold text-white text-sm border-r-2 border-rose-600 pr-2.5">
            ارتباط با ما
          </h4>
          <div className="space-y-2.5 text-xs text-stone-400">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="dir-ltr text-right">
                {settings.supportPhone || '۰۲۱-۸۸۹۹۲۲۱۱'}{settings.supportMobile ? ` / ${settings.supportMobile}` : ''}
              </span>
            </div>
            {settings.supportEmail && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="font-mono">{settings.supportEmail}</span>
              </div>
            )}
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                {settings.address || 'تهران، خیابان شریعتی، بعد از پل رومی، پلاک ۴۲'}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <p className="text-xs font-bold text-white mb-2">عضویت در باشگاه مشتریان:</p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ایمیل خود را وارد کنید..."
                required
                className="flex-1 bg-stone-800 border border-stone-700 text-xs px-3 py-2 rounded-xl text-white placeholder-stone-500 outline-hidden focus:border-rose-600 dir-ltr text-left"
              />
              <button
                type="submit"
                className="bg-rose-700 hover:bg-rose-800 text-white p-2.5 rounded-xl transition-colors shrink-0"
                title="ارسال"
              >
                <Send className="w-4 h-4 rotate-180" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Copyright & Licenses */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
        <p>
          © ۱۴۰۴ تمامی حقوق مادی و معنوی این وبسایت متعلق به برند «ملس‌بان» می‌باشد.
        </p>
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-md bg-stone-800 text-stone-400 font-mono">
            نشان استاندارد و سیب سلامت
          </span>
          <span className="px-2.5 py-1 rounded-md bg-stone-800 text-stone-400 font-mono">
            درگاه امن شاپرک
          </span>
        </div>
      </div>
    </footer>
  );
};
