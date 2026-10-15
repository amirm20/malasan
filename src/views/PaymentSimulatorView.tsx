import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatPrice, toPersianDigits } from '../lib/formatters';
import { ShieldCheck, Lock, CreditCard, CheckCircle2, XCircle } from 'lucide-react';

interface PaymentSimulatorViewProps {
  authority: string;
  onNavigate: (route: string, param?: string) => void;
}

export const PaymentSimulatorView: React.FC<PaymentSimulatorViewProps> = ({
  authority,
  onNavigate,
}) => {
  const { clearCart } = useCart();
  const { showToast } = useToast();
  const [processing, setProcessing] = useState(false);

  // Bank form simulated state
  const [cardNumber, setCardNumber] = useState('6037-9977-1234-5678');
  const [cvv2, setCvv2] = useState('345');
  const [expMonth, setExpMonth] = useState('08');
  const [expYear, setExpYear] = useState('05');
  const [dynamicPin, setDynamicPin] = useState('123456');

  const handlePay = async (status: 'OK' | 'NOK') => {
    setProcessing(true);
    try {
      const res = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authority, status }),
      });
      const data = await res.json();

      if (data.success) {
        clearCart();
        showToast('پرداخت شما با موفقیت تایید شد!', 'success');
        onNavigate('order-confirmation', data.orderId);
      } else {
        showToast(data.message || 'پرداخت لغو شد یا ناموفق بود.', 'error');
        if (data.orderId) {
          onNavigate('order-confirmation', data.orderId);
        } else {
          onNavigate('cart');
        }
      }
    } catch {
      showToast('خطا در پردازش درگاه پرداخت', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 bg-stone-100">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl border border-stone-300 overflow-hidden">
        {/* Gateway Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-rose-900 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="font-black text-lg">درگاه پرداخت الکترونیک شاپرک</h2>
              <p className="text-xs text-amber-100 font-medium">شبیه‌ساز پرداخت زرین‌پال / ملس‌بان</p>
            </div>
          </div>
          <div className="text-left font-mono text-xs text-amber-200">
            <span>امنیت بالا</span>
            <Lock className="w-4 h-4 inline-block mr-1" />
          </div>
        </div>

        {/* Transaction Info */}
        <div className="p-6 bg-stone-50 border-b border-stone-200 text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-stone-500">پذیرنده:</span>
            <span className="font-bold text-stone-800">برند ملس‌بان (طعم اصیل لواشک)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">کد پیگیری درخواست (Authority):</span>
            <span className="font-mono text-stone-700 font-bold dir-ltr">{authority}</span>
          </div>
        </div>

        {/* Simulated Bank Card Form */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">شماره کارت (تستی)</label>
            <div className="relative">
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-800 font-mono dir-ltr text-center font-bold"
              />
              <CreditCard className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">CVV2</label>
              <input
                type="text"
                value={cvv2}
                onChange={(e) => setCvv2(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 font-mono text-center"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">ماه انقضاء</label>
              <input
                type="text"
                value={expMonth}
                onChange={(e) => setExpMonth(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 font-mono text-center"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">سال انقضاء</label>
              <input
                type="text"
                value={expYear}
                onChange={(e) => setExpYear(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 font-mono text-center"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">رمز پویا / اینترنتی</label>
            <input
              type="text"
              value={dynamicPin}
              onChange={(e) => setDynamicPin(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 font-mono text-center"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col gap-2">
            <button
              onClick={() => handlePay('OK')}
              disabled={processing}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{processing ? 'در حال اتصال به بانک...' : 'پرداخت موفقیت‌آمیز (تست پرداخت)'}</span>
            </button>

            <button
              onClick={() => handlePay('NOK')}
              disabled={processing}
              className="w-full bg-stone-200 hover:bg-red-100 hover:text-red-700 text-stone-700 font-bold py-3 rounded-xl transition-colors text-xs flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              <span>انصراف از پرداخت و بازگشت</span>
            </button>
          </div>
        </div>

        <div className="bg-stone-100 p-3 text-center text-[11px] text-stone-500 border-t border-stone-200">
          این یک صفحه پرداخت شبیه‌سازی‌شده تستی است و نیازی به کارت بانکی واقعی ندارد.
        </div>
      </div>
    </div>
  );
};
