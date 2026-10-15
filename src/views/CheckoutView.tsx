import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatPrice, formatWeight, toPersianDigits } from '../lib/formatters';
import {
  MapPin,
  Truck,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Lock,
} from 'lucide-react';

interface CheckoutViewProps {
  onNavigate: (route: string, param?: string) => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { items, subtotal, shippingFee, discountAmount, total, couponCode, clearCart } = useCart();
  const { showToast } = useToast();

  // Receiver Form Fields
  const [receiverName, setReceiverName] = useState('');
  const [receiverMobile, setReceiverMobile] = useState('');
  const [receiverEmail, setReceiverEmail] = useState('');
  const [province, setProvince] = useState('تهران');
  const [city, setCity] = useState('تهران');
  const [fullAddress, setFullAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [shippingMethod, setShippingMethod] = useState('پست پیشتاز سراسری');
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [customerNotes, setCustomerNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Autofill if user is logged in
  useEffect(() => {
    if (user) {
      setReceiverName(`${user.name} ${user.family}`);
      setReceiverMobile(user.mobile || '');
      setReceiverEmail(user.email || '');
      if (user.addresses && user.addresses.length > 0) {
        const defaultAddr = user.addresses.find((a) => a.isDefault) || user.addresses[0];
        setProvince(defaultAddr.province);
        setCity(defaultAddr.city);
        setFullAddress(defaultAddr.fullAddress);
        setPostalCode(defaultAddr.postalCode);
      }
    }
  }, [user]);

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="text-xl font-black text-stone-900">سبد خرید شما خالی است!</h2>
        <p className="text-xs text-stone-500">ابتدا محصولاتی را به سبد خرید اضافه کنید.</p>
        <button
          onClick={() => onNavigate('shop')}
          className="bg-rose-800 text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-rose-900"
        >
          بازگشت به فروشگاه
        </button>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverName.trim() || !receiverMobile.trim() || !fullAddress.trim()) {
      showToast('لطفاً مشخصات تحویل‌گیرنده و آدرس را کامل وارد کنید.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create order
      const orderPayload = {
        userId: user?.id,
        customerName: receiverName,
        customerMobile: receiverMobile,
        customerEmail: receiverEmail,
        shippingAddress: {
          id: `addr-${Date.now()}`,
          title: 'آدرس تحویل',
          receiverName,
          receiverMobile,
          province,
          city,
          fullAddress,
          postalCode,
          isDefault: true,
        },
        shippingMethod,
        shippingFee,
        items: items.map((i) => ({
          id: `item-${Date.now()}-${i.product.id}`,
          productId: i.product.id,
          productName: i.product.name,
          productImage: i.product.mainImage,
          weightGrams: i.product.weightGrams,
          unitPrice: i.product.discountPrice ?? i.product.price,
          quantity: i.quantity,
          totalPrice: (i.product.discountPrice ?? i.product.price) * i.quantity,
        })),
        subtotal,
        discountAmount,
        couponCode: couponCode || undefined,
        totalAmount: total,
        paymentMethod: paymentMethod === 'online' ? 'درگاه پرداخت شاپرک' : 'کارت به کارت',
        customerNotes,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });
      const orderData = await res.json();

      if (!res.ok) {
        showToast(orderData.message || 'خطا در ثبت سفارش', 'error');
        setIsSubmitting(false);
        return;
      }

      const order = orderData.order;

      // 2. If online payment selected: initiate payment gateway
      if (paymentMethod === 'online') {
        const payRes = await fetch('/api/payment/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: order.id }),
        });
        const payData = await payRes.json();
        if (payRes.ok && payData.authority) {
          // Redirect to simulator
          onNavigate('payment-gateway', payData.authority);
        } else {
          showToast('خطا در اتصال به درگاه، سفارش ثبت شد.', 'info');
          clearCart();
          onNavigate('order-confirmation', order.id);
        }
      } else {
        // Card to card
        clearCart();
        showToast('سفارش شما با موفقیت ثبت شد.', 'success');
        onNavigate('order-confirmation', order.id);
      }
    } catch {
      showToast('خطا در برقراری ارتباط با سرور', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-stone-900">ثبت آدرس و پرداخت سفارش</h1>
        <p className="text-xs text-stone-500 mt-1">
          اطلاعات دقیق تحویل را وارد کنید تا سفارش شما در سریع‌ترین زمان ارسال گردد.
        </p>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left/Main Column - Forms (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Step 1: Receiver Details & Address */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-2xs space-y-5">
            <h2 className="text-base font-black text-stone-900 flex items-center gap-2 pb-3 border-b border-stone-100">
              <MapPin className="w-5 h-5 text-rose-800" />
              <span>مشخصات تحویل‌گیرنده و نشانی پستی</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  نام و نام خانوادگی گیرنده *
                </label>
                <input
                  type="text"
                  required
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="مثلاً: علیرضا رضایی"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 outline-hidden focus:bg-white focus:border-rose-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  شماره موبایل گیرنده (جهت هماهنگی تحویل) *
                </label>
                <input
                  type="tel"
                  required
                  value={receiverMobile}
                  onChange={(e) => setReceiverMobile(e.target.value)}
                  placeholder="0912xxxxxxx"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 outline-hidden focus:bg-white focus:border-rose-800 dir-ltr text-left"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">استان *</label>
                <input
                  type="text"
                  required
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 outline-hidden focus:bg-white focus:border-rose-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">شهر *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 outline-hidden focus:bg-white focus:border-rose-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">کد پستی ۱۰ رقمی</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="اختیاری یا ۱۰ رقم"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 outline-hidden focus:bg-white focus:border-rose-800 dir-ltr text-left font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                آدرس کامل پستی (خیابان، کوچه، پلاک، واحد) *
              </label>
              <textarea
                required
                rows={2}
                value={fullAddress}
                onChange={(e) => setFullAddress(e.target.value)}
                placeholder="نشانی دقیق جهت ارسال سریع بسته"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-stone-800 outline-hidden focus:bg-white focus:border-rose-800"
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                یادداشت یا توضیحات سفارش (اختیاری)
              </label>
              <input
                type="text"
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="ساعت تحویل مناسب، زنگ خراب است، و..."
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 outline-hidden focus:bg-white focus:border-rose-800"
              />
            </div>
          </div>

          {/* Step 2: Shipping Method Selection */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-2xs space-y-4">
            <h2 className="text-base font-black text-stone-900 flex items-center gap-2 pb-3 border-b border-stone-100">
              <Truck className="w-5 h-5 text-rose-800" />
              <span>روش ارسال مرسوله</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <label
                className={`p-4 rounded-2xl border-2 cursor-pointer flex flex-col justify-between transition-all ${
                  shippingMethod === 'پست پیشتاز سراسری'
                    ? 'border-rose-800 bg-rose-50/50'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-stone-900">پست پیشتاز سراسری</span>
                  <input
                    type="radio"
                    name="shipping"
                    checked={shippingMethod === 'پست پیشتاز سراسری'}
                    onChange={() => setShippingMethod('پست پیشتاز سراسری')}
                    className="text-rose-800"
                  />
                </div>
                <p className="text-stone-500">تحویل ۲ الی ۳ روز کاری در سراسر شهرهای ایران با رهگیری پیامکی</p>
              </label>

              <label
                className={`p-4 rounded-2xl border-2 cursor-pointer flex flex-col justify-between transition-all ${
                  shippingMethod === 'تیپاکس اکسپرس'
                    ? 'border-rose-800 bg-rose-50/50'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-stone-900">تیپاکس اکسپرس (درب منزل)</span>
                  <input
                    type="radio"
                    name="shipping"
                    checked={shippingMethod === 'تیپاکس اکسپرس'}
                    onChange={() => setShippingMethod('تیپاکس اکسپرس')}
                    className="text-rose-800"
                  />
                </div>
                <p className="text-stone-500">تحویل ۲۴ ساعته در مراکز استان و ۴۸ ساعته سایر شهرستان‌ها</p>
              </label>
            </div>
          </div>

          {/* Step 3: Payment Method Selection */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-2xs space-y-4">
            <h2 className="text-base font-black text-stone-900 flex items-center gap-2 pb-3 border-b border-stone-100">
              <CreditCard className="w-5 h-5 text-rose-800" />
              <span>نحوه پرداخت وجه سفارش</span>
            </h2>

            <div className="space-y-3 text-xs">
              <label
                className={`p-4 rounded-2xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                  paymentMethod === 'online'
                    ? 'border-rose-800 bg-rose-50/50'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'online'}
                    onChange={() => setPaymentMethod('online')}
                    className="text-rose-800"
                  />
                  <div>
                    <span className="font-bold text-stone-900 block">
                      پرداخت آنلاین امن (درگاه زرین‌پال / شاپرک)
                    </span>
                    <span className="text-stone-500 text-[11px]">
                      با کلیه کارت‌های عضو شتاب به همراه دریافت آنی شماره تراکنش و تأییدیه
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-stone-400 font-mono text-[11px]">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>SSL امن</span>
                </div>
              </label>

              <label
                className={`p-4 rounded-2xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                  paymentMethod === 'card'
                    ? 'border-rose-800 bg-rose-50/50'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="text-rose-800"
                  />
                  <div>
                    <span className="font-bold text-stone-900 block">کارت به کارت بانکی</span>
                    <span className="text-stone-500 text-[11px]">
                      واریز به شماره کارت رسمی بازرگانی ملس‌بان و ارسال فیش در حساب کاربری
                    </span>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right/Side Column - Review & Submit (4 cols) */}
        <div className="lg:col-span-4 space-y-6 sticky top-28">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-2xs space-y-5">
            <h3 className="text-base font-black text-stone-900 pb-3 border-b border-stone-100">
              اقلام سفارش شما ({toPersianDigits(items.length)})
            </h3>

            {/* Items mini list */}
            <div className="max-h-56 overflow-y-auto divide-y divide-stone-100 space-y-2 text-xs">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="pt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={product.mainImage}
                      alt=""
                      className="w-10 h-10 object-cover rounded-lg bg-stone-100 shrink-0"
                    />
                    <div className="truncate">
                      <p className="font-bold text-stone-800 truncate">{product.name}</p>
                      <p className="text-stone-400 text-[10px]">
                        {toPersianDigits(quantity)} عدد × {formatPrice(product.discountPrice ?? product.price)}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-stone-900 shrink-0">
                    {formatPrice((product.discountPrice ?? product.price) * quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="pt-4 border-t border-stone-100 space-y-2.5 text-xs text-stone-600">
              <div className="flex items-center justify-between">
                <span>جمع اقلام:</span>
                <span className="font-bold text-stone-800">{formatPrice(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-emerald-700 font-bold">
                  <span>تخفیف:</span>
                  <span>- {formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span>هزینه ارسال:</span>
                <span className="font-bold text-stone-800">
                  {shippingFee === 0 ? <span className="text-emerald-700">رایگان</span> : formatPrice(shippingFee)}
                </span>
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
                <span className="font-black text-stone-900 text-sm">مبلغ نهایی:</span>
                <span className="text-xl font-black text-rose-900">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-rose-800 hover:bg-rose-900 text-white font-black py-4 rounded-2xl shadow-lg hover:shadow-rose-900/20 transition-all text-xs flex items-center justify-center gap-2 active:scale-95 disabled:bg-stone-300"
            >
              {isSubmitting ? (
                <span>در حال ثبت سفارش...</span>
              ) : (
                <>
                  <span>پرداخت و ثبت نهایی سفارش</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 text-xs text-emerald-900">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>اتصال مستقیم به شاپرک و درگاه مورد تأیید بانک مرکزی</span>
          </div>
        </div>
      </form>
    </div>
  );
};
