export function toPersianDigits(n: number | string): string {
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(n).replace(/\d/g, (x) => farsiDigits[parseInt(x, 10)]);
}

export function formatPrice(tomans: number): string {
  return `${toPersianDigits(tomans.toLocaleString('en-US'))} تومان`;
}

export function formatWeight(grams: number): string {
  if (grams >= 1000) {
    const kg = grams / 1000;
    return `${toPersianDigits(kg)} کیلوگرم`;
  }
  return `${toPersianDigits(grams)} گرم`;
}

export function formatDateFa(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return isoString;
  }
}

export function getSournessBadge(level: string): { label: string; bg: string; text: string; barCount: number } {
  switch (level) {
    case 'ExtraSour':
      return { label: 'فوق‌العاده ترش', bg: 'bg-red-100 text-red-800 border-red-200', text: 'text-red-700', barCount: 4 };
    case 'Sour':
      return { label: 'ترش خالص', bg: 'bg-rose-100 text-rose-800 border-rose-200', text: 'text-rose-700', barCount: 3 };
    case 'Sweet':
      return { label: 'شیرین و ملایم', bg: 'bg-amber-100 text-amber-800 border-amber-200', text: 'text-amber-800', barCount: 1 };
    case 'SweetSour':
    default:
      return { label: 'ملس خوشمزه', bg: 'bg-orange-100 text-orange-800 border-orange-200', text: 'text-orange-700', barCount: 2 };
  }
}

export function getOrderStatusText(status: string): string {
  switch (status) {
    case 'Pending':
      return 'در انتظار پرداخت';
    case 'Paid':
      return 'پرداخت شده (آماده بسته‌بندی)';
    case 'Processing':
      return 'در حال پردازش و آماده‌سازی';
    case 'Shipped':
      return 'ارسال شده (تحویل پست)';
    case 'Delivered':
      return 'تحویل داده شده';
    case 'Cancelled':
      return 'لغو شده';
    case 'Returned':
      return 'مرجوع شده';
    default:
      return status || 'نامشخص';
  }
}

export function getOrderStatusBadge(status: string): { label: string; bg: string; text: string; border: string } {
  switch (status) {
    case 'Delivered':
      return {
        label: 'تحویل داده شده',
        bg: 'bg-emerald-50 text-emerald-800',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
      };
    case 'Shipped':
      return {
        label: 'تحویل به پست (ارسال شده)',
        bg: 'bg-blue-50 text-blue-800',
        text: 'text-blue-700',
        border: 'border-blue-200',
      };
    case 'Processing':
      return {
        label: 'در حال آماده‌سازی',
        bg: 'bg-purple-50 text-purple-800',
        text: 'text-purple-700',
        border: 'border-purple-200',
      };
    case 'Paid':
      return {
        label: 'پرداخت شده / آماده بسته‌بندی',
        bg: 'bg-indigo-50 text-indigo-800',
        text: 'text-indigo-700',
        border: 'border-indigo-200',
      };
    case 'Cancelled':
      return {
        label: 'لغو شده',
        bg: 'bg-rose-50 text-rose-800',
        text: 'text-rose-700',
        border: 'border-rose-200',
      };
    case 'Returned':
      return {
        label: 'مرجوع شده',
        bg: 'bg-stone-100 text-stone-800',
        text: 'text-stone-700',
        border: 'border-stone-300',
      };
    case 'Pending':
    default:
      return {
        label: 'در انتظار پرداخت',
        bg: 'bg-amber-50 text-amber-800',
        text: 'text-amber-700',
        border: 'border-amber-200',
      };
  }
}

export function getPaymentStatusText(status: string): string {
  switch (status) {
    case 'Successful':
      return 'پرداخت موفق شاپرک';
    case 'Failed':
      return 'پرداخت ناموفق';
    case 'Refunded':
      return 'مسترد شده (عودت وجه)';
    case 'PartiallyRefunded':
      return 'بخشی مسترد شده';
    case 'Pending':
    default:
      return 'در انتظار پرداخت';
  }
}

export function getPaymentStatusBadge(status: string): { label: string; bg: string; text: string; border: string } {
  switch (status) {
    case 'Successful':
      return {
        label: 'پرداخت موفق شاپرک',
        bg: 'bg-emerald-100 text-emerald-800',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
      };
    case 'Failed':
      return {
        label: 'پرداخت ناموفق',
        bg: 'bg-rose-100 text-rose-800',
        text: 'text-rose-700',
        border: 'border-rose-200',
      };
    case 'Refunded':
      return {
        label: 'مسترد شده کامل',
        bg: 'bg-purple-100 text-purple-800',
        text: 'text-purple-700',
        border: 'border-purple-200',
      };
    case 'PartiallyRefunded':
      return {
        label: 'بخشی مسترد شده',
        bg: 'bg-violet-100 text-violet-800',
        text: 'text-violet-700',
        border: 'border-violet-200',
      };
    case 'Pending':
    default:
      return {
        label: 'در انتظار پرداخت',
        bg: 'bg-amber-100 text-amber-800',
        text: 'text-amber-700',
        border: 'border-amber-200',
      };
  }
}

