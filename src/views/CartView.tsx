import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { formatPrice, formatWeight, toPersianDigits } from '../lib/formatters';
import {
  Trash2,
  ShoppingBag,
  ArrowLeft,
  Truck,
  Tag,
  ShieldCheck,
  CheckCircle2,
  X,
} from 'lucide-react';

interface CartViewProps {
  onNavigate: (route: string, param?: string) => void;
}

export const CartView: React.FC<CartViewProps> = ({ onNavigate }) => {
  const {
    items,
    itemCount,
    subtotal,
    shippingFee,
    discountAmount,
    total,
    couponCode,
    freeShippingThreshold,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [inputCoupon, setInputCoupon] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const amountToFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;
    setApplyingCoupon(true);
    await applyCoupon(inputCoupon.trim());
    setApplyingCoupon(false);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-24 h-24 bg-rose-50 text-rose-800 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <ShoppingBag className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-black text-stone-900">سبد خرید شما در حال حاضر خالی است</h2>
        <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
          انواع لواشک‌های ترش و ملس طبیعی ملس‌بان منتظر شما هستند! همین الان به فروشگاه بروید و سبد خود را پر کنید.
        </p>
        <button
          onClick={() => onNavigate('shop')}
          className="bg-rose-800 hover:bg-rose-900 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg transition-all text-xs inline-flex items-center gap-2"
        >
          <span>مشاهده و خرید محصولات</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title & Clear */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900">سبد خرید شما</h1>
          <p className="text-xs text-stone-500 mt-1">
            شامل {toPersianDigits(itemCount)} بسته از محصولات تازه ملس‌بان
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-stone-400 hover:text-red-700 font-bold transition-colors"
        >
          خالی کردن کل سبد
        </button>
      </div>

      {/* Free Shipping Progress Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-1.5 text-stone-800">
            <Truck className="w-4 h-4 text-rose-800" />
            {amountToFreeShipping === 0 ? (
              <span className="text-emerald-700 font-bold">
                تبریک! سفارش شما شامل ارسال کاملاً رایگان شد.
              </span>
            ) : (
              <span>
                تنها {formatPrice(amountToFreeShipping)} دیگر تا دریافت{' '}
                <strong className="text-rose-800">ارسال رایگان</strong> به سراسر کشور
              </span>
            )}
          </div>
          <span className="text-stone-500 font-mono">٪{toPersianDigits(freeShippingPercent)}</span>
        </div>
        <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-rose-700 to-emerald-600 transition-all duration-500 rounded-full"
            style={{ width: `${freeShippingPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Cart Grid: Items (8 cols) & Summary (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Items List */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-stone-200 p-4 sm:p-6 shadow-2xs divide-y divide-stone-100">
          {items.map(({ product, quantity }) => {
            const unitPrice = product.discountPrice ?? product.price;
            const lineTotal = unitPrice * quantity;

            return (
              <div
                key={product.id}
                className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                {/* Product details and image */}
                <div className="flex items-center gap-4 flex-1">
                  <img
                    src={product.mainImage}
                    alt={product.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-2xl bg-stone-100 shrink-0"
                  />
                  <div>
                    <h3
                      onClick={() => onNavigate('product-detail', product.slug)}
                      className="font-bold text-sm text-stone-900 hover:text-rose-800 cursor-pointer"
                    >
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-stone-400 mt-1">
                      <span>وزن: {formatWeight(product.weightGrams)}</span>
                      <span>•</span>
                      <span>کد: {product.sku}</span>
                    </div>
                    <div className="text-xs font-bold text-rose-900 mt-1">
                      فی: {formatPrice(unitPrice)}
                    </div>
                  </div>
                </div>

                {/* Controls and line total */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-stone-100">
                  {/* Quantity */}
                  <div className="flex items-center border border-stone-300 rounded-xl bg-stone-50 p-0.5">
                    <button
                      onClick={() => updateQuantity(product.id, quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-white flex items-center justify-center font-bold text-stone-700 hover:bg-stone-200 transition-colors shadow-2xs text-xs"
                    >
                      +
                    </button>
                    <span className="w-8 text-center font-bold text-stone-900 text-xs">
                      {toPersianDigits(quantity)}
                    </span>
                    <button
                      onClick={() => updateQuantity(product.id, quantity - 1)}
                      className="w-7 h-7 rounded-lg bg-white flex items-center justify-center font-bold text-stone-700 hover:bg-stone-200 transition-colors shadow-2xs text-xs"
                    >
                      -
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="text-left">
                    <span className="text-xs text-stone-400 block font-normal sm:hidden">مجموع:</span>
                    <span className="font-black text-stone-900 text-sm">
                      {formatPrice(lineTotal)}
                    </span>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(product.id)}
                    className="text-stone-400 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    title="حذف از سبد"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary Box */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-2xs space-y-5">
            <h3 className="text-base font-black text-stone-900 pb-3 border-b border-stone-100">
              خلاصه فاکتور سفارش
            </h3>

            {/* Subtotal */}
            <div className="space-y-3 text-xs text-stone-600">
              <div className="flex items-center justify-between">
                <span>قیمت کل کالاها:</span>
                <span className="font-bold text-stone-900">{formatPrice(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-emerald-700 font-bold">
                  <span>سود شما از تخفیف:</span>
                  <span>- {formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span>هزینه بسته‌بندی و ارسال:</span>
                <span className="font-bold text-stone-900">
                  {shippingFee === 0 ? (
                    <span className="text-emerald-700">رایگان</span>
                  ) : (
                    formatPrice(shippingFee)
                  )}
                </span>
              </div>
            </div>

            {/* Coupon Code Input */}
            <div className="pt-3 border-t border-stone-100">
              {couponCode ? (
                <div className="flex items-center justify-between bg-emerald-50 text-emerald-800 border border-emerald-200 p-2.5 rounded-xl text-xs">
                  <span className="font-bold">کد تخفیف «{couponCode}» اعمال شد</span>
                  <button onClick={removeCoupon} className="text-stone-500 hover:text-red-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCouponSubmit} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputCoupon}
                      onChange={(e) => setInputCoupon(e.target.value)}
                      placeholder="کد تخفیف (مثلاً: MALAS1404)"
                      className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs uppercase font-mono dir-ltr text-left outline-hidden focus:bg-white focus:border-rose-800"
                    />
                    <button
                      type="submit"
                      disabled={applyingCoupon}
                      className="bg-stone-900 hover:bg-stone-800 text-white font-bold px-3 py-2 rounded-xl text-xs transition-colors"
                    >
                      {applyingCoupon ? '...' : 'اعمال'}
                    </button>
                  </div>
                  <span className="text-[10px] text-stone-400 block">
                    کد تخفیف ویژه خرید اول: <span className="font-mono font-bold text-rose-800">FIRSTBUY</span> (۲۵٪ تخفیف خرید اول)
                  </span>
                </form>
              )}
            </div>

            {/* Total */}
            <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
              <span className="font-black text-stone-900 text-sm">مبلغ قابل پرداخت:</span>
              <span className="text-xl font-black text-rose-900">{formatPrice(total)}</span>
            </div>

            {/* Checkout Button */}
            <button
              onClick={() => onNavigate('checkout')}
              className="w-full bg-rose-800 hover:bg-rose-900 text-white font-bold py-3.5 rounded-2xl shadow-lg hover:shadow-rose-900/20 transition-all text-xs flex items-center justify-center gap-2 active:scale-95"
            >
              <span>ادامه فرایند خرید و ثبت آدرس</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 text-xs text-stone-600 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>ضمانت سلامت فیزیکی، تاریخ تولید روز و بسته‌بندی محکم ضد ضربه</span>
          </div>
        </div>
      </div>
    </div>
  );
};
