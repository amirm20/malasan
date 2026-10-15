import React, { useState } from 'react';
import { BlogPost } from '../../types';
import { useToast } from '../../context/ToastContext';
import { toPersianDigits, formatDateFa } from '../../lib/formatters';
import { ImageUploadField } from '../common/ImageUploadField';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  Clock,
  Eye,
  X,
  Sparkles,
  FileText,
  Tag,
  Check,
  ExternalLink,
  Layers,
} from 'lucide-react';

interface BlogTabProps {
  posts: BlogPost[];
  onRefresh: () => void;
  token: string | null;
  onNavigate: (route: string, param?: string) => void;
}

const PRESET_IMAGES = [
  {
    label: 'لواشک انار ساوه',
    url: 'https://images.unsplash.com/photo-1541344999736-83eca872f242?w=800&q=80',
  },
  {
    label: 'باغ میوه‌های آلبالو و زردآلو',
    url: 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=800&q=80',
  },
  {
    label: 'سینی پذیرایی میوه خشک',
    url: 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=800&q=80',
  },
  {
    label: 'برداشت انار طبیعی',
    url: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=800&q=80',
  },
  {
    label: 'لواشک ترش زرشک و آلبالو',
    url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&q=80',
  },
];

const DEFAULT_CATEGORIES = [
  'خواص و سلامت',
  'طرز تهیه و فرآوری',
  'راهنمای خرید عمده',
  'پذیرایی و تشریفات',
  'اخبار و جشنواره‌ها',
];

export const BlogTab: React.FC<BlogTabProps> = ({ posts, onRefresh, token, onNavigate }) => {
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [author, setAuthor] = useState('واحد تحریریه ملس‌بان');
  const [readTimeMinutes, setReadTimeMinutes] = useState(5);
  const [featuredImage, setFeaturedImage] = useState(PRESET_IMAGES[0].url);
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  const openNewPostModal = () => {
    setEditingPost(null);
    setTitle('');
    setSlug(`post-${Date.now().toString().slice(-4)}`);
    setCategory(DEFAULT_CATEGORIES[0]);
    setAuthor('واحد تحریریه ملس‌بان');
    setReadTimeMinutes(5);
    setFeaturedImage(PRESET_IMAGES[0].url);
    setSummary('');
    setContent('');
    setTagsInput('لواشک ارگانیک, سلامتی, تغذیه طبیعی');
    setIsPublished(true);
    setShowModal(true);
  };

  const openEditModal = (post: BlogPost) => {
    setEditingPost(post);
    setTitle(post.title);
    setSlug(post.slug);
    setCategory(post.category);
    setAuthor(post.author);
    setReadTimeMinutes(post.readTimeMinutes);
    setFeaturedImage(post.featuredImage);
    setSummary(post.summary);
    setContent(post.content);
    setTagsInput(post.tags?.join(', ') || '');
    setIsPublished(post.isPublished);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showToast('لطفاً عنوان و متن مقاله را وارد کنید.', 'error');
      return;
    }

    setIsSubmitting(true);
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      title,
      slug: slug.trim() || `post-${Date.now()}`,
      category,
      author,
      readTimeMinutes: Number(readTimeMinutes) || 5,
      featuredImage: featuredImage.trim() || PRESET_IMAGES[0].url,
      summary: summary.trim() || title,
      content,
      tags,
      isPublished,
    };

    try {
      const url = editingPost ? `/api/blog/${editingPost.id}` : '/api/blog';
      const method = editingPost ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast(
          editingPost ? 'مقاله با موفقیت ویرایش شد.' : 'مقاله جدید با موفقیت منتشر گردید.',
          'success'
        );
        setShowModal(false);
        onRefresh();
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.message || 'خطا در ذخیره مقاله.', 'error');
      }
    } catch {
      showToast('خطا در برقراری ارتباط با سرور.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublish = async (post: BlogPost) => {
    try {
      const res = await fetch(`/api/blog/${post.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ isPublished: !post.isPublished }),
      });

      if (res.ok) {
        showToast(
          !post.isPublished ? 'مقاله منتشر شد و در سایت قرار گرفت.' : 'مقاله به حالت پیش‌نویس تغییر یافت.',
          'success'
        );
        onRefresh();
      } else {
        showToast('خطا در تغییر وضعیت مقاله.', 'error');
      }
    } catch {
      showToast('خطا در ارتباط با سرور.', 'error');
    }
  };

  const handleDelete = async (id: string, postTitle: string) => {
    if (!window.confirm(`آیا از حذف مقاله "${postTitle}" اطمینان دارید؟`)) {
      return;
    }

    try {
      const res = await fetch(`/api/blog/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        showToast('مقاله با موفقیت حذف گردید.', 'success');
        onRefresh();
      } else {
        showToast('خطا در حذف مقاله.', 'error');
      }
    } catch {
      showToast('خطا در اتصال به سرور.', 'error');
    }
  };

  // Filter posts
  const filteredPosts = posts.filter((p) => {
    const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.summary.toLowerCase().includes(q) ||
      p.author.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  const totalCount = posts.length;
  const publishedCount = posts.filter((p) => p.isPublished).length;
  const draftCount = totalCount - publishedCount;

  return (
    <div className="space-y-6">
      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold">کل مقالات وبلاگ</span>
            <BookOpen className="w-5 h-5 text-stone-700" />
          </div>
          <p className="text-2xl font-black text-stone-900">{toPersianDigits(totalCount)} مقاله</p>
          <span className="text-[11px] text-stone-400 block">پایگاه دانش و مقالات سلامت</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/40 to-white shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-xs font-bold">مقالات منتشر شده در سایت</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-900">{toPersianDigits(publishedCount)} مقاله</p>
          <span className="text-[11px] text-emerald-700 font-bold block">قابل مشاهده توسط مشتریان و گوگل</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/40 to-white shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-xs font-bold">پیش‌نویس‌ها و در دست بازبینی</span>
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-900">{toPersianDigits(draftCount)} مقاله</p>
          <span className="text-[11px] text-amber-700 font-bold block">مخفی تا تأیید انتشار نهایی</span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xs overflow-hidden">
        {/* Header & Controls */}
        <div className="p-6 border-b border-stone-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-black text-stone-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-rose-800" />
              <span>مدیریت مقالات و وبلاگ ملس‌بان</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              تولید محتوا، ارتقای سئو، آموزش فواید میوه‌های ارگانیک و راهنمای خرید مشتریان
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 sm:w-60">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در عنوان یا متن مقاله..."
                className="w-full bg-stone-50 border border-stone-200 rounded-xl pr-9 pl-3 py-2 text-xs text-stone-800 placeholder-stone-400 focus:bg-white focus:border-stone-400 outline-hidden"
              />
              <Search className="w-4 h-4 text-stone-400 absolute right-3 top-2.5" />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-700 outline-hidden focus:bg-white"
            >
              <option value="all">همه دسته‌ها</option>
              {DEFAULT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <button
              onClick={openNewPostModal}
              className="bg-rose-800 hover:bg-rose-900 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>نوشتن مقاله جدید</span>
            </button>
          </div>
        </div>

        {/* Blog Table */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-stone-700">هیچ مقاله‌ای یافت نشد.</p>
            <p className="text-xs text-stone-400">می‌توانید اولین مقاله وبلاگ فروشگاه را ایجاد کنید.</p>
            <button
              onClick={openNewPostModal}
              className="bg-stone-900 text-white font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1 mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن اولین مقاله</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs divide-y divide-stone-200">
              <thead>
                <tr className="bg-stone-50/80 text-stone-600 font-bold">
                  <th className="p-3.5">تصویر</th>
                  <th className="p-3.5">عنوان و چکیده</th>
                  <th className="p-3.5">دسته‌بندی</th>
                  <th className="p-3.5">نویسنده</th>
                  <th className="p-3.5">زمان مطالعه</th>
                  <th className="p-3.5">وضعیت انتشار</th>
                  <th className="p-3.5">تاریخ</th>
                  <th className="p-3.5 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="p-3.5">
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-14 h-11 object-cover rounded-xl border border-stone-200 shadow-2xs"
                      />
                    </td>

                    <td className="p-3.5 max-w-sm">
                      <p className="font-bold text-stone-900 text-sm leading-snug line-clamp-1">{post.title}</p>
                      <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">{post.summary}</p>
                      <span className="inline-block text-[10px] text-stone-400 font-mono mt-0.5 dir-ltr">
                        /{post.slug}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span className="bg-rose-50 text-rose-900 border border-rose-200/80 px-2.5 py-1 rounded-md text-[11px] font-bold">
                        {post.category}
                      </span>
                    </td>

                    <td className="p-3.5 text-stone-700 font-medium">{post.author}</td>

                    <td className="p-3.5 text-stone-600">
                      <span className="font-bold">{toPersianDigits(post.readTimeMinutes)}</span> دقیقه
                    </td>

                    <td className="p-3.5">
                      <button
                        onClick={() => handleTogglePublish(post)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                          post.isPublished
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                        title="کلیک برای تغییر وضعیت انتشار"
                      >
                        {post.isPublished ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>منتشر شده</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-stone-400" />
                            <span>پیش‌نویس</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="p-3.5 text-[11px] text-stone-500 font-mono">{formatDateFa(post.createdAt)}</td>

                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onNavigate('blog', post.slug)}
                          className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors"
                          title="مشاهده زنده در سایت"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => openEditModal(post)}
                          className="w-8 h-8 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 flex items-center justify-center transition-colors"
                          title="ویرایش مقاله"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(post.id, post.title)}
                          className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 flex items-center justify-center transition-colors"
                          title="حذف مقاله"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Article Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full border border-stone-200 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-800 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-stone-900 text-base">
                    {editingPost ? 'ویرایش مقاله وبلاگ' : 'نگارش و انتشار مقاله جدید'}
                  </h3>
                  <p className="text-xs text-stone-500">پایگاه مقالات علمی، تغذیه و راهنمای خرید ملس‌بان</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Title & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-8">
                  <label className="block font-bold text-stone-800 mb-1">عنوان مقاله *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثلاً: راهنمای تشخیص لواشک طبیعی از تقلبی"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-hidden focus:bg-white focus:border-stone-400"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block font-bold text-stone-800 mb-1">نامک آدرس انگلیسی (Slug)</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="natural-lavashak-guide"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono dir-ltr text-left outline-hidden focus:bg-white focus:border-stone-400"
                  />
                </div>
              </div>

              {/* Category, Author, Read Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">دسته‌بندی موضوعی</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 outline-hidden"
                  >
                    {DEFAULT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">نویسنده مقاله</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs outline-hidden focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">زمان مطالعه (دقیقه)</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={readTimeMinutes}
                    onChange={(e) => setReadTimeMinutes(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs outline-hidden focus:bg-white"
                  />
                </div>
              </div>

              {/* Featured Image & Presets */}
              <div className="pt-1">
                <ImageUploadField
                  label="تصویر شاخص مقاله"
                  value={featuredImage}
                  onChange={(val) => setFeaturedImage(val)}
                  aspectRatioClass="h-44 sm:h-52"
                  maxDim={1200}
                  quality={0.88}
                  helpText="برای انتخاب عکس مقاله کلیک کرده یا فایل را بکشید و رها کنید (Browse)"
                  placeholderText="انتخاب تصویر شاخص مقاله (Browse)"
                  presetImages={PRESET_IMAGES}
                />
              </div>

              {/* Summary / Abstract */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">خلاصه کوتاه مقاله (برای کارت‌ها و پیش‌نمایش)</label>
                <textarea
                  rows={2}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="چکیده‌ای جذاب از مطالب مقاله برای جذب خواننده..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs outline-hidden focus:bg-white focus:border-stone-400"
                />
              </div>

              {/* Full Content */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">متن کامل مقاله *</label>
                <textarea
                  rows={7}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="متن کامل مقاله را بنویسید (پاراگراف‌ها را با اینتر جدا نمایید)..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs leading-relaxed outline-hidden focus:bg-white focus:border-stone-400 font-normal"
                />
              </div>

              {/* Tags & Publish Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                <div className="sm:col-span-8">
                  <label className="block font-bold text-stone-800 mb-1">برچسب‌ها (با ویرگول انگلیسی یا کاما جدا کنید)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="لواشک سنتی, سلامت گوارش, پوره میوه"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs outline-hidden focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-4 pt-4 sm:pt-0">
                  <label className="flex items-center gap-2.5 p-2.5 bg-stone-50 border border-stone-200 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="w-4 h-4 rounded text-rose-800 border-stone-300 focus:ring-rose-800"
                    />
                    <span className="font-bold text-stone-800 text-xs">انتشار فوری در سایت</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-4 py-2.5 rounded-xl text-xs"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-rose-800 hover:bg-rose-900 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-rose-950/10"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'در حال ثبت...' : editingPost ? 'ذخیره تغییرات' : 'انتشار مقاله'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
