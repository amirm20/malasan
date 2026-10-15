import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import {
  formatPrice,
  formatWeight,
  toPersianDigits,
  formatDateFa,
  getOrderStatusText,
  getOrderStatusBadge,
  getPaymentStatusText,
} from '../lib/formatters';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  Package,
  MapPin,
  ArrowLeft,
  FileText,
} from 'lucide-react';

interface OrderConfirmationViewProps {
  orderId: string;
  onNavigate: (route: string, param?: string) => void;
}

export const OrderConfirmationView: React.FC<OrderConfirmationViewProps> = ({
  orderId,
  onNavigate,
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((data) => setOrder(data))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-12 h-12 border-4 border-rose-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-xs text-stone-500">در حال دریافت اطلاعات فاکتور سفارش...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="text-xl font-black text-stone-900">سفارش یافت نشد!</h2>
        <button
          onClick={() => onNavigate('shop')}
          className="bg-rose-800 text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-rose-900"
        >
          بازگشت به فروشگاه
        </button>
      </div>
    );
  }

  const isSuccess = order.paymentStatus === 'Successful' || order.status === 'Paid';
  const isPending = order.paymentStatus === 'Pending';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Status Header Banner */}
      <div
        className={`p-6 sm:p-8 rounded-3xl text-center space-y-3 ${
          isSuccess
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-950'
            : isPending
            ? 'bg-amber-50 border border-amber-200 text-amber-950'
            : 'bg-red-50 border border-red-200 text-red-950'
        }`}
      >
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-xs">
          {isSuccess ? (
            <CheckCircle2 className="w-16 h-16 text-emerald-600" />
          ) : isPending ? (
            <Clock className="w-16 h-16 text-amber-600" />
          ) : (
            <XCircle className="w-16 h-16 text-red-600" />
          )}
        </div>

        <h1 className="text-2xl font-black">
          {isSuccess
            ? 'پرداخت با موفقیت انجام شد و سفارش شما ثبت گردید!'
            : isPending
            ? 'سفارش شما با وضعیت در انتظار پرداخت ثبت شد.'
            : 'پرداخت سفارش ناموفق بود.'}
        </h1>

        <p className="text-xs text-stone-600 max-w-lg mx-auto leading-relaxed">
          {isSuccess
            ? 'سفارش شما به واحد بسته‌بندی ملس‌بان ارسال شده و به زودی از طریق پیامک کد رهگیری پستی دریافت خواهید کرد.'
            : 'در صورت تمایل می‌توانید پرداخت را مجدداً انجام دهید یا با پشتیبانی تماس بگیرید.'}
        </p>

        <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-xs px-4 py-2 rounded-xl text-xs font-bold text-stone-800 shadow-2xs">
          <span>شماره فاکتور سفارش:</span>
          <span className="font-mono text-rose-900 font-black">{order.orderNumber}</span>
          {order.paymentRefId && (
            <>
              <span className="text-stone-300">|</span>
              <span>کد پیگیری بانکی:</span>
              <span className="font-mono text-stone-700">{order.paymentRefId}</span>
            </>
          )}
        </div>
      </div>

      {/* Invoice Card */}
      <div id="invoice-printable" className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-200 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-rose-800 text-white rounded-xl flex items-center justify-center font-black text-sm">
                م
              </div>
              <span className="font-black text-lg text-stone-900">پیش‌فاکتور رسمی ملس‌بان</span>
            </div>
            <p className="text-xs text-stone-400 mt-1">تولید و توزیع تخصصی انواع لواشک طبیعی و بهداشتی</p>
          </div>

          <div className="text-left text-xs text-stone-600 space-y-1.5">
            <div className="font-mono">تاریخ ثبت: {formatDateFa(order.createdAt)}</div>
            <div className="flex items-center gap-1.5 justify-end">
              <span className="text-stone-500">وضعیت سفارش:</span>
              <span
                className={`px-2.5 py-0.5 rounded-md font-bold text-[11px] border ${
                  getOrderStatusBadge(order.status).bg
                } ${getOrderStatusBadge(order.status).border}`}
              >
                {getOrderStatusText(order.status)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 justify-end">
              <span className="text-stone-500">وضعیت پرداخت:</span>
              <span
                className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                  order.paymentStatus === 'Successful'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {getPaymentStatusText(order.paymentStatus)}
              </span>
            </div>
          </div>
        </div>

        {/* Shipping Address Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-stone-50 text-xs text-stone-700">
          <div>
            <span className="font-bold block text-stone-900 mb-1">مشخصات خریدار:</span>
            <p>{order.customerName}</p>
            <p className="dir-ltr text-right">{order.customerMobile}</p>
          </div>
          <div>
            <span className="font-bold block text-stone-900 mb-1">نشانی تحویل و روش ارسال:</span>
            <p>
              {order.shippingAddress.province}، {order.shippingAddress.city}، {order.shippingAddress.fullAddress}
            </p>
            <p className="text-stone-500 text-[11px] mt-1 font-sans">
              روش ارسال: {order.shippingMethod}
            </p>
          </div>
        </div>

        {/* Items Table */}
        <div>
          <h3 className="text-xs font-bold text-stone-800 mb-3">ریز اقلام سفارش:</h3>
          <table className="w-full text-right text-xs divide-y divide-stone-200">
            <thead>
              <tr className="bg-stone-50 text-stone-600 font-bold">
                <th className="p-2.5">ردیف</th>
                <th className="p-2.5">نام کالا</th>
                <th className="p-2.5">وزن</th>
                <th className="p-2.5">تعداد</th>
                <th className="p-2.5">قیمت واحد</th>
                <th className="p-2.5">مبلغ کل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {order.items.map((item, idx) => (
                <tr key={item.id}>
                  <td className="p-2.5 font-bold text-stone-400">{toPersianDigits(idx + 1)}</td>
                  <td className="p-2.5 font-bold text-stone-900">{item.productName}</td>
                  <td className="p-2.5 text-stone-500">{formatWeight(item.weightGrams)}</td>
                  <td className="p-2.5 font-bold">{toPersianDigits(item.quantity)}</td>
                  <td className="p-2.5">{formatPrice(item.unitPrice)}</td>
                  <td className="p-2.5 font-black text-rose-900">{formatPrice(item.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="pt-4 border-t border-stone-200 flex justify-end">
          <div className="w-full sm:w-72 space-y-2 text-xs text-stone-600">
            <div className="flex justify-between">
              <span>جمع اقلام:</span>
              <span className="font-bold text-stone-800">{formatPrice(order.subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>تخفیف:</span>
                <span>- {formatPrice(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>هزینه حمل و نقل:</span>
              <span className="font-bold text-stone-800">
                {order.shippingFee === 0 ? 'رایگان' : formatPrice(order.shippingFee)}
              </span>
            </div>
            <div className="pt-2 border-t border-stone-200 flex justify-between text-sm font-black text-rose-900">
              <span>مبلغ نهایی پرداختی:</span>
              <span>{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => window.print()}
          className="bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 font-bold px-6 py-3 rounded-2xl text-xs flex items-center gap-2 transition-colors shadow-2xs"
        >
          <Printer className="w-4 h-4 text-stone-500" />
          <span>چاپ یا ذخیره فاکتور</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('account', 'tab=orders')}
            className="bg-stone-900 hover:bg-stone-800 text-white font-bold px-6 py-3 rounded-2xl text-xs transition-colors"
          >
            مشاهده در سابقه سفارش‌ها
          </button>
          <button
            onClick={() => onNavigate('shop')}
            className="bg-rose-800 hover:bg-rose-900 text-white font-bold px-6 py-3 rounded-2xl text-xs transition-colors"
          >
            ادامه خرید از فروشگاه
          </button>
        </div>
      </div>
    </div>
  );
};
