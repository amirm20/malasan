import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SiteSetting } from '../types';

const defaultSettings: SiteSetting = {
  brandName: 'فروشگاه تخصصی لواشک ملس‌بان',
  tagline: 'طعم واقعی میوه، در هر تکه لواشک',
  supportPhone: '021-88992211',
  supportPhone2: '021-65220011',
  supportMobile: '09123456789',
  salesMobile: '09129876543',
  supportEmail: 'info@malasban.ir',
  address: 'تهران، خیابان شریعتی، بعد از پل رومی، پلاک ۴۲، مجموعه کارگاهی ملس‌بان',
  factoryAddress: 'تهران، جاده شهریار، شهرک صنعتی نور، بلوار کارآفرینان، پلاک ۱۴، مجتمع کارگاهی ملس‌بان',
  workingHours: 'شنبه تا پنج‌شنبه از ساعت ۹:۰۰ الی ۲۱:۰۰',
  instagram: 'https://instagram.com/malasban_official',
  telegram: 'https://t.me/malasban_ir',
  whatsapp: 'https://wa.me/989123456789',
  announcementBarText: '🎉 ارسال رایگان سفارش‌های بالای ۴۰۰ هزار تومان | ضمانت اصالت ۱۰۰٪ پوره طبیعی میوه',
  announcementBarLink: '/shop',
  isAnnouncementActive: true,
  heroTitle: 'طعم واقعی میوه، در هر تکه لواشک',
  heroSubtitle: 'ملس‌بان، طعم‌های خاطره‌انگیز و اصیل ایرانی را با خالص‌ترین پوره‌های انار، زرشک، آلبالو و زردآلو به خانه‌های شما می‌آورد. ۱۰۰٪ طبیعی، سرشار از ویتامین، با بسته‌بندی بهداشتی تک‌نفره و مجلسی.',
  heroBadge: 'فرآوری سنتی با بالاترین استانداردهای بهداشتی روز',
  heroImageUrl: 'https://images.unsplash.com/photo-1541344999736-83eca872f242?w=900&q=80',
  promoBannerTitle: 'جشنواره ترش و شیرین ملس‌بان',
  promoBannerText: 'تخفیف‌های هیجان‌انگیز روی سینی‌های پذیرایی و بسته‌های هدیه مخلوط ترشک و لواشک ارگانیک',
  promoBannerDiscount: 'تا ۳۰٪ تخفیف ویژه',
  promoBannerImageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=900&q=80',
  freeShippingThreshold: 400000,
  standardShippingFee: 45000,
  wholesaleMinOrderKg: 20,
  wholesaleTiers: [
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
  ],
  faqs: [
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
  ],
};

interface SettingsContextType {
  settings: SiteSetting;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<SiteSetting>, customToken?: string) => Promise<boolean>;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  loading: false,
  refreshSettings: async () => {},
  updateSettings: async () => false,
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSetting>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings((prev) => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (newSettings: Partial<SiteSetting>, customToken?: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });

      if (res.ok) {
        const updated = await res.json();
        setSettings((prev) => ({ ...prev, ...updated }));
        return true;
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.error('Failed to update settings, server returned:', res.status, errJson);
        return false;
      }
    } catch (err) {
      console.error('Failed to update settings network error:', err);
      return false;
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        refreshSettings: fetchSettings,
        updateSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
