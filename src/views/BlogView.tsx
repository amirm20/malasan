import React, { useState, useEffect } from 'react';
import { BlogPost } from '../types';
import { formatDateFa, toPersianDigits } from '../lib/formatters';
import { BookOpen, Calendar, User, Clock, ArrowLeft, ArrowRight } from 'lucide-react';

interface BlogViewProps {
  onNavigate: (route: string, param?: string) => void;
  initialSlug?: string;
}

export const BlogView: React.FC<BlogViewProps> = ({ onNavigate, initialSlug }) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [activePost, setActivePost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/blog')
      .then((r) => r.json())
      .then((data: BlogPost[]) => {
        setPosts(data);
        if (initialSlug) {
          const matched = data.find((p) => p.slug === initialSlug);
          if (matched) setActivePost(matched);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [initialSlug]);

  if (activePost) {
    return (
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <button
          onClick={() => setActivePost(null)}
          className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-rose-800 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به مقالات ملس‌بان</span>
        </button>

        <div className="space-y-4">
          <span className="bg-rose-100 text-rose-900 text-xs font-bold px-3 py-1 rounded-full">
            {activePost.category}
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-stone-900 leading-tight">
            {activePost.title}
          </h1>

          <div className="flex items-center gap-4 text-xs text-stone-400 pb-4 border-b border-stone-200">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDateFa(activePost.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              {activePost.author}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              زمان مطالعه: {toPersianDigits(activePost.readTimeMinutes || 5)} دقیقه
            </span>
          </div>
        </div>

        <img
          src={activePost.featuredImage}
          alt={activePost.title}
          className="w-full h-80 sm:h-[400px] object-cover rounded-3xl shadow-md"
        />

        <div className="prose prose-stone max-w-none text-stone-700 leading-loose text-sm sm:text-base space-y-4 font-normal">
          <p className="font-bold text-stone-900 text-base leading-relaxed bg-amber-50/70 p-4 rounded-2xl border border-amber-200">
            {activePost.summary}
          </p>

          <div className="whitespace-pre-line">{activePost.content}</div>
        </div>
      </article>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-black text-stone-900">مجله سلامت و ترشیجات ملس‌بان</h1>
        <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
          دانستنی‌ها، مقالات علمی تغذیه، فواید لواشک‌های ارگانیک و راهنمای انتخاب سالم‌ترین فرآورده‌های میوه‌ای
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-stone-400">در حال بارگذاری مقالات...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <div
              key={post.id}
              onClick={() => setActivePost(post)}
              className="group bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-2xs hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="overflow-hidden h-48 bg-stone-100">
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6 space-y-3">
                  <span className="text-[11px] font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-full">
                    {post.category}
                  </span>
                  <h3 className="font-black text-base text-stone-900 group-hover:text-rose-800 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-xs text-stone-500 line-clamp-3 leading-relaxed">
                    {post.summary}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0 flex items-center justify-between text-xs text-stone-400 border-t border-stone-100 mt-4">
                <span>{formatDateFa(post.createdAt)}</span>
                <span className="font-bold text-rose-800 flex items-center gap-1 group-hover:translate-x-[-4px] transition-transform">
                  <span>ادامه مطلب</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
