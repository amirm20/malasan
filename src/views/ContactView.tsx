import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { MapPin, Phone, Mail, Clock, MessageSquare, Send, CheckCircle2 } from 'lucide-react';

export const ContactView: React.FC = () => {
  const { showToast } = useToast();
  const { settings } = useSettings();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('انتقاد یا پیشنهاد');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    showToast('پیام شما با موفقیت ارسال شد. کارشناسان ما به زودی پاسخ خواهند داد.', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-black text-stone-900">تماس با مجموعه ملس‌بان</h1>
        <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
          مشتاقانه آماده شنیدن نظرات، پیشنهادات، انتقادات و پاسخ به سوالات شما عزیزان هستیم.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Contact Info (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-2xs space-y-6">
            <h2 className="font-black text-base text-stone-900 pb-3 border-b border-stone-100">
              اطلاعات دفاتر و کارخانه
            </h2>

            <div className="space-y-4 text-xs text-stone-700">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-stone-900 font-bold mb-0.5">آدرس کارخانه و دفتر مرکزی:</strong>
                  <span>{settings.address || 'تهران، جاده شهریار، شهرک صنعتی نور، بلوار کارآفرینان، پلاک ۱۴، مجتمع تولیدی ملس‌بان'}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-stone-900 font-bold mb-0.5">تلفن‌های تماس:</strong>
                  <p className="font-mono dir-ltr text-right">{settings.supportPhone || '۰۲۱-۸۸۹۹۲۲۱۱'} (پشتیبانی و فروش)</p>
                  {settings.supportMobile && (
                    <p className="font-mono dir-ltr text-right">{settings.supportMobile} (موبایل و واتساپ)</p>
                  )}
                  {settings.wholesalePhone && (
                    <p className="font-mono dir-ltr text-right">{settings.wholesalePhone} (امور عمده و بازرگانی)</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-stone-900 font-bold mb-0.5">پست الکترونیکی:</strong>
                  <span className="font-mono dir-ltr">{settings.supportEmail || 'info@malasban.ir'}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-stone-900 font-bold mb-0.5">ساعت پاسخگویی:</strong>
                  <span>{settings.workingHours || 'شنبه تا چهارشنبه ۹:۰۰ الی ۱۸:۰۰ | پنج‌شنبه‌ها ۹:۰۰ الی ۱۴:۰۰'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-2xs">
          <h2 className="font-black text-base text-stone-900 mb-2">ارسال پیام به مدیریت</h2>
          <p className="text-xs text-stone-500 mb-6">فرم زیر را تکمیل کنید؛ در اسرع وقت با شما تماس می‌گیریم.</p>

          {sent ? (
            <div className="py-12 text-center space-y-4">
              <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-stone-900">پیام شما ثبت شد</h3>
              <p className="text-xs text-stone-500">از اینکه با ما در ارتباط هستید متشکریم.</p>
              <button
                onClick={() => setSent(false)}
                className="bg-stone-900 text-white text-xs font-bold px-6 py-2 rounded-xl"
              >
                ارسال پیام دیگر
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">نام و نام خانوادگی *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثلاً: حمید کاظمی"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 outline-hidden focus:bg-white focus:border-rose-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">شماره تماس *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912xxxxxxx"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 outline-hidden focus:bg-white focus:border-rose-800 dir-ltr text-left font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">موضوع پیام</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 outline-hidden focus:bg-white focus:border-rose-800 font-bold"
                >
                  <option value="انتقاد یا پیشنهاد">انتقاد یا پیشنهاد</option>
                  <option value="پیگیری سفارش خرد">پیگیری سفارش خرد</option>
                  <option value="همکاری در فروش">همکاری در فروش و بازاریابی</option>
                  <option value="امور نمایندگی‌ها">امور نمایندگی‌ها و شعب</option>
                  <option value="سایر موضوعات">سایر موضوعات</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">متن پیام *</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="دیدگاه یا پیام خود را بنویسید..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 outline-hidden focus:bg-white focus:border-rose-800"
                ></textarea>
              </div>

              <button
                type="submit"
                className="bg-rose-800 hover:bg-rose-900 text-white font-bold px-8 py-3.5 rounded-2xl shadow-md transition-all inline-flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>ثبت و ارسال پیام</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
