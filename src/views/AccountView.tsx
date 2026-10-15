import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { Order, Address } from '../types';
import { formatPrice, formatWeight, toPersianDigits, formatDateFa } from '../lib/formatters';
import {
  User as UserIcon,
  Package,
  Heart,
  MapPin,
  LogOut,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowLeft,
} from 'lucide-react';

interface AccountViewProps {
  initialTab?: string;
  onNavigate: (route: string, param?: string) => void;
  onOpenAuth: () => void;
}

export const AccountView: React.FC<AccountViewProps> = ({
  initialTab = 'orders',
  onNavigate,
  onOpenAuth,
}) => {
  const { user, token, logout, updateProfile } = useAuth();
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'addresses' | 'wishlist'>(
    (initialTab as any) || 'orders'
  );

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Profile fields
  const [name, setName] = useState(user?.name || '');
  const [family, setFamily] = useState(user?.family || '');

  // Add address modal
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newTitle, setNewTitle] = useState('منزل');
  const [newReceiverName, setNewReceiverName] = useState(user ? `${user.name} ${user.family}` : '');
  const [newReceiverMobile, setNewReceiverMobile] = useState(user?.mobile || '');
  const [newProvince, setNewProvince] = useState('تهران');
  const [newCity, setNewCity] = useState('تهران');
  const [newFullAddress, setNewFullAddress] = useState('');
  const [newPostalCode, setNewPostalCode] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setFamily(user.family);
      setNewReceiverName(`${user.name} ${user.family}`);
      setNewReceiverMobile(user.mobile || '');
    }
  }, [user]);

  useEffect(() => {
    if (user && token) {
      setLoadingOrders(true);
      fetch('/api/orders/my-orders', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => setOrders(Array.isArray(data) ? data : []))
        .catch(() => {})
        .finally(() => setLoadingOrders(false));
    }
  }, [user, token]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-5">
        <div className="w-16 h-16 bg-rose-100 text-rose-800 rounded-full flex items-center justify-center mx-auto">
          <UserIcon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-stone-900">جهت مشاهده حساب کاربری وارد شوید</h2>
        <p className="text-xs text-stone-500">
          برای پیگیری وضعیت سفارش‌ها، ویرایش آدرس‌ها و لیست علاقه‌مندی‌ها نیاز به ورود به حساب دارید.
        </p>
        <button
          onClick={onOpenAuth}
          className="bg-rose-800 hover:bg-rose-900 text-white text-xs font-bold px-8 py-3 rounded-xl shadow-md transition-all"
        >
          ورود یا عضویت سریع
        </button>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({ name, family });
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const newAddress: Address = {
      id: `addr-${Date.now()}`,
      title: newTitle,
      receiverName: newReceiverName,
      receiverMobile: newReceiverMobile,
      province: newProvince,
      city: newCity,
      fullAddress: newFullAddress,
      postalCode: newPostalCode,
      isDefault: (user.addresses || []).length === 0,
    };

    const updated = [...(user.addresses || []), newAddress];
    const ok = await updateProfile({ name: user.name, family: user.family, addresses: updated });
    if (ok) {
      setShowAddressModal(false);
      setNewFullAddress('');
      setNewPostalCode('');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    const updated = (user.addresses || []).filter((a) => a.id !== id);
    await updateProfile({ name: user.name, family: user.family, addresses: updated });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Profile Summary */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-2xs mb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-800 text-white font-black text-2xl flex items-center justify-center shadow-md">
            {user.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-black text-stone-900">
              {user.name} {user.family}
            </h1>
            <p className="text-xs text-stone-500 font-mono mt-1">{user.mobile || user.email}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 text-xs font-bold text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors border border-red-200"
        >
          <LogOut className="w-4 h-4" />
          <span>خروج از حساب</span>
        </button>
      </div>

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar (4 cols) */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-stone-200 p-3 shadow-2xs space-y-1">
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full text-right p-3 rounded-2xl text-xs font-bold flex items-center justify-between transition-all ${
              activeTab === 'orders'
                ? 'bg-rose-800 text-white shadow-xs'
                : 'text-stone-700 hover:bg-stone-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Package className="w-4 h-4" />
              <span>سفارش‌های من</span>
            </div>
            <span className="font-mono text-[11px] opacity-80">{toPersianDigits(orders.length)}</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full text-right p-3 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition-all ${
              activeTab === 'profile'
                ? 'bg-rose-800 text-white shadow-xs'
                : 'text-stone-700 hover:bg-stone-50'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>اطلاعات حساب کاربری</span>
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`w-full text-right p-3 rounded-2xl text-xs font-bold flex items-center justify-between transition-all ${
              activeTab === 'addresses'
                ? 'bg-rose-800 text-white shadow-xs'
                : 'text-stone-700 hover:bg-stone-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4" />
              <span>دفترچه آدرس‌ها</span>
            </div>
            <span className="font-mono text-[11px] opacity-80">
              {toPersianDigits(user.addresses?.length || 0)}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('wishlist')}
            className={`w-full text-right p-3 rounded-2xl text-xs font-bold flex items-center justify-between transition-all ${
              activeTab === 'wishlist'
                ? 'bg-rose-800 text-white shadow-xs'
                : 'text-stone-700 hover:bg-stone-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Heart className="w-4 h-4" />
              <span>علاقه‌مندی‌ها</span>
            </div>
            <span className="font-mono text-[11px] opacity-80">{toPersianDigits(wishlist.length)}</span>
          </button>
        </div>

        {/* Content Area (8 cols) */}
        <div className="lg:col-span-9 bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-2xs">
          {/* Tab 1: Orders */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h2 className="text-base font-black text-stone-900 pb-3 border-b border-stone-100">
                تاریخچه سفارش‌های شما
              </h2>

              {loadingOrders ? (
                <div className="py-12 text-center text-xs text-stone-400">در حال دریافت لیست سفارش‌ها...</div>
              ) : orders.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <Package className="w-12 h-12 text-stone-300 mx-auto" />
                  <p className="text-xs text-stone-500">هنوز سفارشی توسط شما ثبت نشده است.</p>
                  <button
                    onClick={() => onNavigate('shop')}
                    className="bg-rose-800 text-white text-xs font-bold px-6 py-2 rounded-xl"
                  >
                    شروع خرید از فروشگاه
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="p-5 rounded-2xl border border-stone-200 hover:border-stone-300 transition-all space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100 text-xs">
                        <div className="flex items-center gap-3 whitespace-nowrap">
                          <span className="font-bold text-stone-900 whitespace-nowrap">سفارش: <span className="font-mono text-rose-900">{order.orderNumber}</span></span>
                          <span className="text-stone-400 font-mono whitespace-nowrap">{formatDateFa(order.createdAt)}</span>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap ${
                            order.status === 'Delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.status === 'Shipped'
                              ? 'bg-blue-100 text-blue-800'
                              : order.status === 'Processing' || order.status === 'Paid'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {order.status === 'Pending' && 'در انتظار پرداخت'}
                          {order.status === 'Paid' && 'پرداخت شده / آماده بسته‌بندی'}
                          {order.status === 'Processing' && 'در حال آماده‌سازی'}
                          {order.status === 'Shipped' && 'تحویل به پست / ارسال شده'}
                          {order.status === 'Delivered' && 'تحویل داده شده'}
                          {order.status === 'Cancelled' && 'لغو شده'}
                        </span>
                      </div>

                      {/* Items row */}
                      <div className="flex items-center gap-3 overflow-x-auto py-1">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-2 bg-stone-50 p-2 rounded-xl text-xs shrink-0">
                            <img src={item.productImage} alt="" className="w-8 h-8 rounded-lg object-cover" />
                            <span className="font-bold text-stone-800 max-w-[120px] truncate">{item.productName}</span>
                            <span className="text-stone-500 font-mono">({toPersianDigits(item.quantity)})</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 flex items-center justify-between text-xs">
                        <span className="font-bold text-stone-800">
                          مبلغ کل: <strong className="text-rose-900 font-black">{formatPrice(order.totalAmount)}</strong>
                        </span>
                        <button
                          onClick={() => onNavigate('order-confirmation', order.id)}
                          className="text-xs font-bold text-rose-800 hover:underline flex items-center gap-1"
                        >
                          <span>مشاهده فاکتور</span>
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Profile */}
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-lg">
              <h2 className="text-base font-black text-stone-900 pb-3 border-b border-stone-100">
                ویرایش مشخصات حساب
              </h2>

              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">نام</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 outline-hidden focus:bg-white focus:border-rose-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">نام خانوادگی</label>
                    <input
                      type="text"
                      required
                      value={family}
                      onChange={(e) => setFamily(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 outline-hidden focus:bg-white focus:border-rose-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">شماره همراه (غیرقابل تغییر)</label>
                  <input
                    type="text"
                    disabled
                    value={user.mobile}
                    className="w-full bg-stone-100 border border-stone-200 rounded-xl px-3 py-2.5 text-stone-500 dir-ltr text-left"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">ایمیل</label>
                  <input
                    type="email"
                    disabled
                    value={user.email || ''}
                    className="w-full bg-stone-100 border border-stone-200 rounded-xl px-3 py-2.5 text-stone-500 dir-ltr text-left"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-rose-800 hover:bg-rose-900 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                >
                  ذخیره تغییرات پروفایل
                </button>
              </form>
            </div>
          )}

          {/* Tab 3: Addresses */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <h2 className="text-base font-black text-stone-900">آدرس‌های ثبت‌شده</h2>
                <button
                  onClick={() => setShowAddressModal(true)}
                  className="flex items-center gap-1 bg-rose-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-rose-900 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>افزودن آدرس جدید</span>
                </button>
              </div>

              {(!user.addresses || user.addresses.length === 0) ? (
                <p className="text-xs text-stone-500 py-8 text-center">هنوز آدرسی اضافه نکرده‌اید.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="p-4 rounded-2xl border border-stone-200 relative flex flex-col justify-between space-y-2 text-xs"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-stone-900">{addr.title}</span>
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-stone-400 hover:text-red-700 p-1"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-stone-700 leading-relaxed">
                          {addr.province}، {addr.city}، {addr.fullAddress}
                        </p>
                        {addr.postalCode && (
                          <p className="text-stone-400 text-[11px] font-mono mt-1">کد پستی: {addr.postalCode}</p>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-500 pt-2 border-t border-stone-100 flex justify-between">
                        <span>گیرنده: {addr.receiverName}</span>
                        <span className="dir-ltr">{addr.receiverMobile}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Wishlist */}
          {activeTab === 'wishlist' && (
            <div className="space-y-6">
              <h2 className="text-base font-black text-stone-900 pb-3 border-b border-stone-100">
                کالاهای مورد علاقه شما ({toPersianDigits(wishlist.length)})
              </h2>

              {wishlist.length === 0 ? (
                <p className="text-xs text-stone-500 py-8 text-center">لیست علاقه‌مندی‌های شما خالی است.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wishlist.map((prod) => (
                    <div
                      key={prod.id}
                      className="p-4 rounded-2xl border border-stone-200 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <img src={prod.mainImage} alt="" className="w-14 h-14 object-cover rounded-xl" />
                        <div>
                          <h4 className="font-bold text-xs text-stone-900 line-clamp-1">{prod.name}</h4>
                          <span className="text-xs font-black text-rose-900 mt-1 block">
                            {formatPrice(prod.discountPrice ?? prod.price)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => addToCart(prod, 1)}
                          className="bg-rose-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-rose-900"
                        >
                          خرید
                        </button>
                        <button
                          onClick={() => toggleWishlist(prod)}
                          className="text-stone-400 hover:text-red-700 p-1.5"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-stone-200 shadow-2xl space-y-4">
            <h3 className="font-black text-stone-900 text-sm">افزودن نشانی جدید</h3>
            <form onSubmit={handleAddAddress} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">عنوان (منزل، محل کار...)</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">نام گیرنده</label>
                  <input
                    type="text"
                    required
                    value={newReceiverName}
                    onChange={(e) => setNewReceiverName(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">موبایل گیرنده</label>
                  <input
                    type="tel"
                    required
                    value={newReceiverMobile}
                    onChange={(e) => setNewReceiverMobile(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 dir-ltr text-left"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">استان</label>
                  <input
                    type="text"
                    required
                    value={newProvince}
                    onChange={(e) => setNewProvince(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">شهر</label>
                  <input
                    type="text"
                    required
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">آدرس کامل پستی</label>
                <textarea
                  required
                  rows={2}
                  value={newFullAddress}
                  onChange={(e) => setNewFullAddress(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5"
                ></textarea>
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">کد پستی ۱۰ رقمی</label>
                <input
                  type="text"
                  value={newPostalCode}
                  onChange={(e) => setNewPostalCode(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 dir-ltr text-left font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-rose-800 text-white font-bold py-2.5 rounded-xl hover:bg-rose-900"
                >
                  ثبت آدرس
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="bg-stone-100 text-stone-700 font-bold px-4 py-2.5 rounded-xl"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
