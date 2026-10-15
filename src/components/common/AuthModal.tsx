import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Lock, Mail, Phone, User as UserIcon, ShieldAlert, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultTab = 'login' }) => {
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab);
  const { login, register } = useAuth();
  const [loading, setLoading] = useState(false);

  // Login form
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // Register form
  const [regName, setRegName] = useState('');
  const [regFamily, setRegFamily] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const ok = await login(identifier, password);
    setLoading(false);
    if (ok) onClose();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const ok = await register(regName, regFamily, regMobile, regEmail, regPassword);
    setLoading(false);
    if (ok) onClose();
  };

  const prefillAdmin = () => {
    setTab('login');
    setIdentifier('admin@malasban.ir');
    setPassword('Admin@123456');
  };

  const prefillCustomer = () => {
    setTab('login');
    setIdentifier('user@malasban.ir');
    setPassword('user123');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div
        className="relative bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-stone-200 p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 text-stone-400 hover:text-stone-700 w-8 h-8 rounded-full flex items-center justify-center hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-rose-100 text-rose-800 rounded-2xl flex items-center justify-center mx-auto mb-3 font-black text-xl shadow-inner">
            ملس
          </div>
          <h2 className="text-xl font-black text-stone-900">
            {tab === 'login' ? 'ورود به حساب ملس‌بان' : 'عضویت در خانواده ملس‌بان'}
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            برای ثبت و پیگیری سریع سفارش‌ها، دسترسی به تخفیف‌های ویژه و سبد خرید
          </p>
        </div>

        {/* Demo Fast Login Pills */}
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3 mb-5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>حساب‌های پیش‌فرض تست سریع:</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={prefillAdmin}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-1.5 px-2 rounded-lg transition-colors shadow-xs"
            >
              مدیر سایت (Admin)
            </button>
            <button
              type="button"
              onClick={prefillCustomer}
              className="flex-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold py-1.5 px-2 rounded-lg transition-colors shadow-xs"
            >
              مشتری نمونه (User)
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-stone-100 p-1 mb-6">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              tab === 'login'
                ? 'bg-white text-rose-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            ورود به حساب
          </button>
          <button
            onClick={() => setTab('register')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              tab === 'register'
                ? 'bg-white text-rose-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            ثبت‌نام جدید
          </button>
        </div>

        {/* Forms */}
        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                شماره موبایل یا ایمیل
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="09123456789 یا admin@malasban.ir"
                  className="w-full pl-4 pr-10 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-rose-800 focus:ring-1 focus:ring-rose-800 outline-hidden transition-all text-left dir-ltr"
                />
                <Mail className="w-4 h-4 text-stone-400 absolute right-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">رمز عبور</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-4 pr-10 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-rose-800 focus:ring-1 focus:ring-rose-800 outline-hidden transition-all text-left dir-ltr"
                />
                <Lock className="w-4 h-4 text-stone-400 absolute right-3 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-800 hover:bg-rose-900 text-white font-bold py-3 rounded-xl shadow-md transition-all active:scale-95 disabled:bg-stone-300 text-sm mt-2"
            >
              {loading ? 'در حال بررسی...' : 'ورود به حساب'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">نام</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="مثلاً علی"
                  className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-rose-800 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">نام خانوادگی</label>
                <input
                  type="text"
                  required
                  value={regFamily}
                  onChange={(e) => setRegFamily(e.target.value)}
                  placeholder="مثلاً مرادی"
                  className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-rose-800 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">شماره موبایل</label>
              <input
                type="tel"
                required
                value={regMobile}
                onChange={(e) => setRegMobile(e.target.value)}
                placeholder="0912xxxxxxx"
                className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-rose-800 outline-hidden text-left dir-ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">ایمیل (اختیاری)</label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-rose-800 outline-hidden text-left dir-ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">رمز عبور</label>
              <input
                type="password"
                required
                minLength={6}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="حداقل ۶ کاراکتر"
                className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-rose-800 outline-hidden text-left dir-ltr"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-800 hover:bg-rose-900 text-white font-bold py-3 rounded-xl shadow-md transition-all active:scale-95 disabled:bg-stone-300 text-sm mt-2"
            >
              {loading ? 'در حال ساخت حساب...' : 'ایجاد حساب کاربری'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
