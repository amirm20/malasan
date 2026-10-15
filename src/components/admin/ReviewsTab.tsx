import React, { useState } from 'react';
import { Review } from '../../types';
import { useToast } from '../../context/ToastContext';
import { toPersianDigits, formatDateFa } from '../../lib/formatters';
import {
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Trash2,
  CornerDownLeft,
  Star,
  Clock,
  ShieldCheck,
  Send,
  User,
  Package,
  AlertCircle,
  Check,
  Pencil,
  Plus,
  X,
  ShieldAlert,
} from 'lucide-react';

interface ReviewsTabProps {
  reviews: Review[];
  onRefresh: () => void;
  token: string | null;
}

export const ReviewsTab: React.FC<ReviewsTabProps> = ({ reviews, onRefresh, token }) => {
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');

  // Reply state
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  // In-app confirmation dialog state (replaces window.confirm for iframe safety)
  const [deleteReplyTarget, setDeleteReplyTarget] = useState<Review | null>(null);
  const [deleteReviewTarget, setDeleteReviewTarget] = useState<Review | null>(null);

  // Admin add review state
  const [isAddReviewModalOpen, setIsAddReviewModalOpen] = useState(false);
  const [productsList, setProductsList] = useState<{ id: string; name: string }[]>([]);
  const [newReviewProductId, setNewReviewProductId] = useState('');
  const [newReviewAuthor, setNewReviewAuthor] = useState('مدیر فروشگاه (کارشناس ملس‌بان)');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewIsOfficial, setNewReviewIsOfficial] = useState(true);
  const [isSubmittingNewReview, setIsSubmittingNewReview] = useState(false);

  const handleOpenAddReview = () => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProductsList(data);
          if (data[0]) setNewReviewProductId(data[0].id);
        }
      })
      .catch(() => {});
    setIsAddReviewModalOpen(true);
  };

  const handleSaveNewReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewProductId || !newReviewComment.trim()) {
      showToast('لطفاً محصول و متن دیدگاه را وارد کنید.', 'error');
      return;
    }
    setIsSubmittingNewReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          productId: newReviewProductId,
          userName: newReviewAuthor.trim() || 'کارشناس ملس‌بان',
          rating: Number(newReviewRating),
          comment: newReviewComment.trim(),
          isOfficialStaff: newReviewIsOfficial,
          isApproved: true,
        }),
      });
      if (res.ok) {
        showToast('دیدگاه با موفقیت ثبت و تأیید شد.', 'success');
        setIsAddReviewModalOpen(false);
        setNewReviewComment('');
        onRefresh();
      } else {
        const err = await res.json();
        showToast(err.message || 'خطا در ثبت دیدگاه', 'error');
      }
    } catch {
      showToast('خطای شبکه در ثبت دیدگاه', 'error');
    } finally {
      setIsSubmittingNewReview(false);
    }
  };

  // Filtered reviews
  const filteredReviews = reviews.filter((r) => {
    if (statusFilter === 'pending' && r.isApproved) return false;
    if (statusFilter === 'approved' && !r.isApproved) return false;
    if (ratingFilter !== 'all' && r.rating !== ratingFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.userName?.toLowerCase().includes(q);
      const matchComment = r.comment?.toLowerCase().includes(q);
      const matchProd = r.productName?.toLowerCase().includes(q);
      return matchName || matchComment || matchProd;
    }
    return true;
  });

  const pendingCount = reviews.filter((r) => !r.isApproved).length;
  const approvedCount = reviews.filter((r) => r.isApproved).length;
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : '5.0';

  const handleToggleApproval = async (id: string, currentStatus: boolean) => {
    setIsActionLoading(id);
    const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const res = await fetch(`/api/reviews/${id}/toggle`, {
        method: 'PATCH',
        headers: authHeader,
      });
      if (res.ok) {
        showToast(
          currentStatus ? 'نظر از حالت انتشار خارج شد.' : 'نظر با موفقیت تأیید و منتشر شد.',
          'success'
        );
        onRefresh();
      } else {
        showToast('خطا در تغییر وضعیت نظر.', 'error');
      }
    } catch {
      showToast('خطا در برقراری ارتباط با سرور.', 'error');
    } finally {
      setIsActionLoading(null);
    }
  };

  const executeDeleteReview = async (id: string) => {
    setIsActionLoading(id);
    const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'DELETE',
        headers: authHeader,
      });
      if (res.ok) {
        showToast('دیدگاه با موفقیت حذف گردید.', 'success');
        setDeleteReviewTarget(null);
        onRefresh();
      } else {
        showToast('خطا در حذف نظر.', 'error');
      }
    } catch {
      showToast('خطای شبکه در حذف نظر.', 'error');
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleSendReply = async (id: string) => {
    if (!replyText.trim()) {
      showToast('لطفاً متن پاسخ مدیر را وارد نمایید.', 'error');
      return;
    }
    setIsSubmittingReply(true);
    const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const res = await fetch(`/api/reviews/${id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify({ reply: replyText.trim() }),
      });
      if (res.ok) {
        showToast('پاسخ مدیر با موفقیت ثبت شد.', 'success');
        setReplyText('');
        setActiveReplyId(null);
        onRefresh();
      } else {
        showToast('خطا در ثبت پاسخ.', 'error');
      }
    } catch {
      showToast('خطای شبکه در ارسال پاسخ.', 'error');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const executeDeleteReply = async (id: string) => {
    setIsActionLoading(`delete-reply-${id}`);
    const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const res = await fetch(`/api/reviews/${id}/reply`, {
        method: 'DELETE',
        headers: {
          ...authHeader,
        },
      });
      if (res.ok) {
        showToast('پاسخ مدیر با موفقیت حذف شد.', 'success');
        if (activeReplyId === id) {
          setActiveReplyId(null);
          setReplyText('');
        }
        setDeleteReplyTarget(null);
        onRefresh();
      } else {
        showToast('خطا در حذف پاسخ مدیر.', 'error');
      }
    } catch {
      showToast('خطای شبکه در حذف پاسخ مدیر.', 'error');
    } finally {
      setIsActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner & KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold">
            <span>کل نظرات ثبت شده</span>
            <MessageSquare className="w-5 h-5 text-stone-700" />
          </div>
          <p className="text-2xl font-black text-stone-900">{toPersianDigits(reviews.length)} نظر</p>
          <span className="text-[11px] text-stone-400">دیدگاه‌های کاربران در صفحات محصولات</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-amber-200 bg-amber-50/40 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-amber-700 text-xs font-bold">
            <span>در انتظار بررسی و تأیید</span>
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-900">{toPersianDigits(pendingCount)} نظر</p>
          <span className="text-[11px] text-amber-700">نیازمند بازبینی مدیر جهت انتشار عمومی</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-emerald-200 bg-emerald-50/40 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-bold">
            <span>نظرات تأیید و منتشر شده</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-900">{toPersianDigits(approvedCount)} نظر</p>
          <span className="text-[11px] text-emerald-700">قابل مشاهده برای کلیه مشتریان در سایت</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold">
            <span>میانگین رضایت مشتریان</span>
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          </div>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-black text-stone-900">{toPersianDigits(avgRating)}</p>
            <span className="text-xs text-stone-500 font-bold">از ۵ ستاره</span>
          </div>
          <span className="text-[11px] text-stone-400">شاخص کلی کیفیت و رضایت از طعم ملس‌بان</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در نام کاربر، نام محصول یا متن دیدگاه..."
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl pr-10 pl-4 py-2.5 text-xs text-stone-800 outline-hidden focus:bg-white focus:border-stone-400 transition-colors"
            />
          </div>

          {/* Status and Rating Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  statusFilter === 'all' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                همه ({toPersianDigits(reviews.length)})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
                  statusFilter === 'pending'
                    ? 'bg-amber-500 text-stone-950 font-black shadow-2xs'
                    : 'text-amber-800 hover:text-amber-950'
                }`}
              >
                <span>در انتظار بررسی</span>
                {pendingCount > 0 && (
                  <span className="bg-amber-700 text-white text-[10px] px-1.5 py-0.2 rounded-full">
                    {toPersianDigits(pendingCount)}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('approved')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  statusFilter === 'approved'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-emerald-700 hover:text-emerald-900'
                }`}
              >
                منتشر شده ({toPersianDigits(approvedCount)})
              </button>
            </div>

            {/* Rating Filter Dropdown */}
            <select
              value={ratingFilter}
              onChange={(e) =>
                setRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="bg-stone-50 border border-stone-200 rounded-2xl px-3 py-2 text-xs text-stone-700 font-bold outline-hidden focus:bg-white"
            >
              <option value="all">همه امتیازها</option>
              <option value="5">۵ ستاره (عالی)</option>
              <option value="4">۴ ستاره (خوب)</option>
              <option value="3">۳ ستاره (متوسط)</option>
              <option value="2">۲ ستاره (ضعیف)</option>
              <option value="1">۱ ستاره (ناراضی)</option>
            </select>
          </div>
        </div>

        {/* Review Items List */}
        <div className="space-y-3 pt-2">
          {filteredReviews.length === 0 ? (
            <div className="text-center py-12 bg-stone-50 rounded-2xl border border-dashed border-stone-200 space-y-2">
              <MessageSquare className="w-10 h-10 text-stone-300 mx-auto" />
              <p className="text-xs font-bold text-stone-600">هیچ نظری با فیلترهای انتخابی یافت نشد.</p>
              <p className="text-[11px] text-stone-400">می‌توانید فیلترها را تغییر داده یا جستجو را پاک کنید.</p>
            </div>
          ) : (
            filteredReviews.map((rev) => {
              const isReplying = activeReplyId === rev.id;
              const isLoading = isActionLoading === rev.id;

              return (
                <div
                  key={rev.id}
                  className={`rounded-3xl border transition-all p-5 space-y-4 ${
                    rev.isApproved
                      ? 'bg-white border-stone-200 hover:border-stone-300'
                      : 'bg-amber-50/50 border-amber-300 shadow-xs'
                  }`}
                >
                  {/* Header info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-sm shrink-0">
                        {rev.userName ? rev.userName.charAt(0) : <User className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-stone-900">{rev.userName}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              rev.isApproved
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-200 text-amber-900'
                            }`}
                          >
                            {rev.isApproved ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                <span>تأیید و منتشر شده</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 text-amber-700" />
                                <span>در انتظار تأیید مدیر</span>
                              </>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                          <Package className="w-3.5 h-3.5 text-rose-800" />
                          <span className="font-medium text-stone-700">
                            {rev.productName || 'محصول ملس‌بان'}
                          </span>
                          <span>•</span>
                          <span>{formatDateFa(rev.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Star rating and Action Buttons */}
                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      {/* Rating stars */}
                      <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                        <div className="flex text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= rev.rating
                                  ? 'text-amber-500 fill-amber-500'
                                  : 'text-stone-200 fill-stone-100'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-black text-amber-900 mr-1">
                          {toPersianDigits(rev.rating)}
                        </span>
                      </div>

                      {/* Approval Toggle */}
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleToggleApproval(rev.id, rev.isApproved)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs ${
                          rev.isApproved
                            ? 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {rev.isApproved ? (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-stone-500" />
                            <span>عدم انتشار</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>تأیید و انتشار</span>
                          </>
                        )}
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => setDeleteReviewTarget(rev)}
                        className="text-stone-400 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-xl transition-colors"
                        title="حذف نظر"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Comment Body */}
                  <div className="text-xs text-stone-800 leading-relaxed pr-2 font-medium">
                    {rev.comment}
                  </div>

                  {/* Existing Admin Reply */}
                  {rev.adminReply && (
                    <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-3.5 space-y-1.5 mr-4">
                      <div className="flex items-center justify-between text-[11px] font-bold text-rose-900">
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-rose-800" />
                          <span>پاسخ رسمی پشتیبانی ملس‌بان:</span>
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveReplyId(rev.id);
                              setReplyText(rev.adminReply || '');
                            }}
                            className="text-[11px] font-bold text-rose-800 hover:text-rose-950 flex items-center gap-1 hover:underline cursor-pointer"
                            title="ویرایش پاسخ"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>ویرایش پاسخ</span>
                          </button>
                          <span className="text-rose-300">|</span>
                          <button
                            type="button"
                            disabled={isActionLoading === `delete-reply-${rev.id}`}
                            onClick={() => setDeleteReplyTarget(rev)}
                            className="text-[11px] font-bold text-red-600 hover:text-red-800 flex items-center gap-1 hover:underline disabled:opacity-50 cursor-pointer"
                            title="حذف پاسخ مدیر"
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                            <span>{isActionLoading === `delete-reply-${rev.id}` ? 'در حال حذف...' : 'حذف پاسخ'}</span>
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-stone-700 leading-normal">{rev.adminReply}</p>
                    </div>
                  )}

                  {/* Reply Button or Form */}
                  <div className="pt-1 flex flex-col gap-2">
                    {!isReplying && !rev.adminReply && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveReplyId(rev.id);
                          setReplyText('');
                        }}
                        className="text-xs font-bold text-stone-600 hover:text-rose-800 flex items-center gap-1 self-start transition-colors cursor-pointer"
                      >
                        <CornerDownLeft className="w-3.5 h-3.5 text-rose-800" />
                        <span>ثبت پاسخ مدیر به این دیدگاه</span>
                      </button>
                    )}

                    {isReplying && (
                      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 space-y-2.5 animate-in fade-in">
                        <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                          <span className="flex items-center gap-1">
                            <CornerDownLeft className="w-3.5 h-3.5 text-rose-800" />
                            <span>ارسال پاسخ برای «{rev.userName}»:</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveReplyId(null)}
                            className="text-stone-400 hover:text-stone-700 text-xs"
                          >
                            انصراف
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="متن پاسخ رسمی به نظر مشتری..."
                          className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs text-stone-800 outline-hidden focus:border-stone-400"
                        />
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            {rev.adminReply && (
                              <button
                                type="button"
                                disabled={isActionLoading === `delete-reply-${rev.id}`}
                                onClick={() => setDeleteReplyTarget(rev)}
                                className="text-xs font-bold text-red-600 hover:text-red-700 px-2.5 py-1.5 rounded-lg flex items-center gap-1 hover:bg-red-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>حذف این پاسخ</span>
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setActiveReplyId(null)}
                              className="text-xs font-bold text-stone-500 hover:text-stone-800 px-3 py-1.5 rounded-xl cursor-pointer"
                            >
                              انصراف
                            </button>
                            <button
                              type="button"
                              disabled={isSubmittingReply}
                              onClick={() => handleSendReply(rev.id)}
                              className="bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs px-4 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>{isSubmittingReply ? 'در حال ثبت...' : 'ثبت و نمایش پاسخ'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Confirmation Modal for Deleting Admin Reply */}
      {deleteReplyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-stone-900">حذف پاسخ مدیر به نظر</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                آیا از حذف پاسخ رسمی ثبت‌شده برای نظر کاربر{' '}
                <strong className="text-stone-900">«{deleteReplyTarget.userName}»</strong> اطمینان دارید؟
                با حذف، متن پاسخ از سایت برداشته خواهد شد.
              </p>
            </div>

            {deleteReplyTarget.adminReply && (
              <div className="bg-stone-50 border border-stone-200 p-3 rounded-2xl text-xs text-stone-700 italic max-h-24 overflow-y-auto">
                «{deleteReplyTarget.adminReply}»
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteReplyTarget(null)}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={isActionLoading === `delete-reply-${deleteReplyTarget.id}`}
                onClick={() => executeDeleteReply(deleteReplyTarget.id)}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-xl shadow-md transition-colors cursor-pointer"
              >
                {isActionLoading === `delete-reply-${deleteReplyTarget.id}` ? 'در حال حذف...' : 'بله، حذف پاسخ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting Customer Review */}
      {deleteReviewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-stone-900">حذف دیدگاه مشتری</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                آیا از حذف کامل دیدگاه ثبت‌شده توسط{' '}
                <strong className="text-stone-900">«{deleteReviewTarget.userName}»</strong> اطمینان دارید؟
                این عملیات غیرقابل بازگشت است.
              </p>
            </div>

            <div className="bg-stone-50 border border-stone-200 p-3 rounded-2xl text-xs text-stone-700 max-h-24 overflow-y-auto">
              «{deleteReviewTarget.comment}»
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteReviewTarget(null)}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={isActionLoading === deleteReviewTarget.id}
                onClick={() => executeDeleteReview(deleteReviewTarget.id)}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-xl shadow-md transition-colors cursor-pointer"
              >
                {isActionLoading === deleteReviewTarget.id ? 'در حال حذف...' : 'بله، حذف دیدگاه'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
