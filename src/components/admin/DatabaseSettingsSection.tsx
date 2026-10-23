import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { toPersianDigits } from '../../lib/formatters';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Play,
  Download,
  Layers,
  Table,
  FileCode,
  Terminal,
  RefreshCw,
  Server,
  Zap,
} from 'lucide-react';

interface DatabaseSettingsSectionProps {
  token?: string | null;
}

export const DatabaseSettingsSection: React.FC<DatabaseSettingsSectionProps> = ({ token }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/database/status', {
        headers: {
          
        },
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      } else {
        showToast('خطا در دریافت وضعیت پایگاه داده', 'error');
      }
    } catch (err) {
      showToast('خطا در اتصال به سرور', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleRunMigrations = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/database/migrate', {
        method: 'POST',
        headers: {
          
        },
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'مایگریشن‌ها با موفقیت اعمال شدند', 'success');
        fetchStatus();
      } else {
        showToast(data.message || data.error || 'خطا در اعمال مایگریشن‌ها', 'error');
      }
    } catch (err) {
      showToast('خطا در برقراری ارتباط با سرور', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunSeed = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/database/seed', {
        method: 'POST',
        headers: {
          
        },
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'داده‌های اولیه با موفقیت درج شدند', 'success');
        fetchStatus();
      } else {
        showToast(data.message || data.error || 'خطا در درج داده‌های اولیه', 'error');
      }
    } catch (err) {
      showToast('خطا در برقراری ارتباط با سرور', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSyncDatabase = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/database/sync', {
        method: 'POST',
        headers: {
          
        },
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'همگام‌سازی داده‌ها با PostgreSQL با موفقیت انجام شد', 'success');
        fetchStatus();
      } else {
        showToast(data.message || data.error || 'خطا در همگام‌سازی با پایگاه داده', 'error');
      }
    } catch (err) {
      showToast('خطا در برقراری ارتباط با سرور', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = (type: 'schema' | 'seed', dialect: 'postgres' | 'mysql') => {
    const url = `/api/admin/database/sql-${type}?dialect=${dialect}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 rounded-3xl p-6 sm:p-8 text-white border border-stone-800 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Database className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">مدیریت دیتابیس (PostgreSQL / MySQL) و مایگریشن‌ها</h3>
                <span className="bg-amber-400/10 text-amber-400 border border-amber-400/20 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                  SQL Relational Engine
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-1">
                ساختار جدول‌ها، مایگریشن‌های نسخه‌بندی‌شده و داده‌های اولیه کارخانه (Init Seed) برای PostgreSQL و MySQL
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchStatus}
            disabled={loading}
            className="flex items-center gap-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors cursor-pointer border border-stone-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>بروزرسانی وضعیت</span>
          </button>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-stone-800">
          <div className="bg-stone-950/60 border border-stone-800/80 rounded-2xl p-4">
            <span className="text-[11px] text-stone-400 font-medium">موتور فعال:</span>
            <div className="flex items-center gap-2 mt-1.5">
              <Server className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-black text-white">
                {status?.activeProvider || 'دیتابیس رابطه‌ای'}
              </span>
            </div>
          </div>

          <div className="bg-stone-950/60 border border-stone-800/80 rounded-2xl p-4">
            <span className="text-[11px] text-stone-400 font-medium">وضعیت اتصال به PostgreSQL:</span>
            <div className="flex items-center gap-2 mt-1.5">
              {status?.connected ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-300">متصل و آماده</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-300">
                    آماده اتصال (کانفیگ با DATABASE_URL)
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="bg-stone-950/60 border border-stone-800/80 rounded-2xl p-4">
            <span className="text-[11px] text-stone-400 font-medium">مایگریشن‌های آماده:</span>
            <div className="flex items-center gap-2 mt-1.5">
              <Layers className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black text-white">
                {toPersianDigits(status?.migrations?.postgres?.length || 2)} فایل مایگریشن (SQL)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
          <div>
            <h4 className="text-sm font-black text-stone-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>عملیات سریع مایگریشن و درج داده‌های اولیه</span>
            </h4>
            <p className="text-xs text-stone-500 mt-0.5">
              اعمال جداول (اسکیما) و انتقال اطلاعات محصولات، دسته‌بندی‌ها، کاربران و سفارش‌ها به دیتابیس
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRunMigrations}
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              <span>اجرای مایگریشن‌ها (Run Migrations)</span>
            </button>

            <button
              type="button"
              onClick={handleRunSeed}
              disabled={actionLoading}
              className="bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Database className="w-3.5 h-3.5" />
              <span>درج دیتای اولیه (Seed Init Data)</span>
            </button>

            <button
              type="button"
              onClick={handleSyncDatabase}
              disabled={actionLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
              <span>همگام‌سازی با PostgreSQL (Sync Data)</span>
            </button>
          </div>
        </div>

        {/* Counts of Tables */}
        <div>
          <h5 className="text-xs font-black text-stone-800 mb-3 flex items-center gap-2">
            <Table className="w-3.5 h-3.5 text-stone-500" />
            <span>آمار رکوردهای داده‌ای سیستم در دیتابیس</span>
          </h5>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center">
            <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3">
              <span className="text-[11px] text-stone-500">دسته‌بندی‌ها</span>
              <p className="text-sm font-black text-stone-900 mt-1">
                {toPersianDigits(status?.counts?.categories ?? 6)}
              </p>
            </div>
            <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3">
              <span className="text-[11px] text-stone-500">محصولات</span>
              <p className="text-sm font-black text-stone-900 mt-1">
                {toPersianDigits(status?.counts?.products ?? 12)}
              </p>
            </div>
            <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3">
              <span className="text-[11px] text-stone-500">کاربران</span>
              <p className="text-sm font-black text-stone-900 mt-1">
                {toPersianDigits(status?.counts?.users ?? 3)}
              </p>
            </div>
            <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3">
              <span className="text-[11px] text-stone-500">نشانی‌ها (Addresses)</span>
              <p className="text-sm font-black text-stone-900 mt-1">
                {toPersianDigits(status?.counts?.addresses ?? 1)}
              </p>
            </div>
            <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3">
              <span className="text-[11px] text-stone-500">سفارش‌ها (Orders)</span>
              <p className="text-sm font-black text-stone-900 mt-1">
                {toPersianDigits(status?.counts?.orders ?? 2)}
              </p>
            </div>
            <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3">
              <span className="text-[11px] text-stone-500">اقلام سفارش (Order Items)</span>
              <p className="text-sm font-black text-stone-900 mt-1">
                {toPersianDigits(status?.counts?.orderItems ?? 3)}
              </p>
            </div>
            <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3">
              <span className="text-[11px] text-stone-500">کدهای تخفیف</span>
              <p className="text-sm font-black text-stone-900 mt-1">
                {toPersianDigits(status?.counts?.coupons ?? 4)}
              </p>
            </div>
            <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3">
              <span className="text-[11px] text-stone-500">درخواست‌های عمده</span>
              <p className="text-sm font-black text-stone-900 mt-1">
                {toPersianDigits(status?.counts?.wholesaleRequests ?? 6)}
              </p>
            </div>
            <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3">
              <span className="text-[11px] text-stone-500">نظرات مشتریان</span>
              <p className="text-sm font-black text-stone-900 mt-1">
                {toPersianDigits(status?.counts?.reviews ?? 6)}
              </p>
            </div>
            <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3">
              <span className="text-[11px] text-stone-500">مقالات وبلاگ</span>
              <p className="text-sm font-black text-stone-900 mt-1">
                {toPersianDigits(status?.counts?.blogPosts ?? 3)}
              </p>
            </div>
            <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3">
              <span className="text-[11px] text-stone-500">مکالمات چت</span>
              <p className="text-sm font-black text-stone-900 mt-1">
                {toPersianDigits(status?.counts?.chatConversations ?? 5)}
              </p>
            </div>
            <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3">
              <span className="text-[11px] text-stone-500">پیام‌های پشتیبانی</span>
              <p className="text-sm font-black text-stone-900 mt-1">
                {toPersianDigits(status?.counts?.chatMessages ?? 24)}
              </p>
            </div>
          </div>
        </div>

        {/* Migration Files & Downloads */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-stone-100">
          {/* PostgreSQL Card */}
          <div className="bg-stone-50/70 border border-stone-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-sky-600" />
                <h6 className="text-xs font-black text-stone-900">مایگریشن‌های PostgreSQL</h6>
              </div>
              <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-md">
                database/migrations/postgres
              </span>
            </div>

            <ul className="text-xs text-stone-600 space-y-1.5 font-mono">
              <li className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-stone-200/60">
                <span>001_initial_schema.sql</span>
                <button
                  type="button"
                  onClick={() => handleDownload('schema', 'postgres')}
                  className="text-stone-500 hover:text-stone-900 flex items-center gap-1 text-[11px] font-sans font-bold cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>دانلود SQL</span>
                </button>
              </li>
              <li className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-stone-200/60">
                <span>002_seed_initial_data.sql</span>
                <button
                  type="button"
                  onClick={() => handleDownload('seed', 'postgres')}
                  className="text-stone-500 hover:text-stone-900 flex items-center gap-1 text-[11px] font-sans font-bold cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>دانلود SQL</span>
                </button>
              </li>
            </ul>
          </div>

          {/* MySQL Card */}
          <div className="bg-stone-50/70 border border-stone-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-orange-600" />
                <h6 className="text-xs font-black text-stone-900">مایگریشن‌های MySQL</h6>
              </div>
              <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded-md">
                database/migrations/mysql
              </span>
            </div>

            <ul className="text-xs text-stone-600 space-y-1.5 font-mono">
              <li className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-stone-200/60">
                <span>001_initial_schema.sql</span>
                <button
                  type="button"
                  onClick={() => handleDownload('schema', 'mysql')}
                  className="text-stone-500 hover:text-stone-900 flex items-center gap-1 text-[11px] font-sans font-bold cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>دانلود SQL</span>
                </button>
              </li>
              <li className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-stone-200/60">
                <span>002_seed_initial_data.sql</span>
                <button
                  type="button"
                  onClick={() => handleDownload('seed', 'mysql')}
                  className="text-stone-500 hover:text-stone-900 flex items-center gap-1 text-[11px] font-sans font-bold cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>دانلود SQL</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* CLI / Terminal Commands Guide */}
        <div className="bg-stone-900 text-stone-200 rounded-2xl p-5 space-y-3 font-mono text-xs border border-stone-850">
          <div className="flex items-center gap-2 text-amber-400 font-sans font-bold text-xs">
            <Terminal className="w-4 h-4" />
            <span>دستورات خط فرمان (CLI) مایگریشن در پروژه:</span>
          </div>
          <div className="space-y-1.5 text-stone-300">
            <div className="flex items-center justify-between bg-stone-950 px-3 py-1.5 rounded-lg border border-stone-800">
              <code>npm run db:status</code>
              <span className="text-[11px] text-stone-500 font-sans">بررسی وضعیت اتصال و مایگریشن‌ها</span>
            </div>
            <div className="flex items-center justify-between bg-stone-950 px-3 py-1.5 rounded-lg border border-stone-800">
              <code>npm run db:migrate</code>
              <span className="text-[11px] text-stone-500 font-sans">اجرای مایگریشن‌های اسکیما</span>
            </div>
            <div className="flex items-center justify-between bg-stone-950 px-3 py-1.5 rounded-lg border border-stone-800">
              <code>npm run db:seed</code>
              <span className="text-[11px] text-stone-500 font-sans">درج داده‌های اولیه (محصولات، دسته‌ها و...)</span>
            </div>
            <div className="flex items-center justify-between bg-stone-950 px-3 py-1.5 rounded-lg border border-stone-800">
              <code>npm run db:init</code>
              <span className="text-[11px] text-stone-500 font-sans">راه‌اندازی کامل (مایگریشن + دیتای اولیه)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
