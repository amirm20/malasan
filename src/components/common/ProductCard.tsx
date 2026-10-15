import React from 'react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { formatPrice, formatWeight, getSournessBadge, toPersianDigits } from '../../lib/formatters';
import { ShoppingBag, Heart, Eye, Star } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
  onNavigate?: (slug: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView, onNavigate }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const isFavorite = isInWishlist(product.id);
  const sourness = getSournessBadge(product.sournessLevel);
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
    : 0;

  return (
    <div className="group relative bg-white rounded-2xl border border-stone-200/80 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
      {/* Product Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-stone-100 cursor-pointer" onClick={() => onNavigate?.(product.slug)}>
        <img
          src={product.mainImage}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Badges Top Corner */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-start z-10 pointer-events-none">
          {hasDiscount && (
            <span className="bg-rose-600 text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-sm">
              ٪{toPersianDigits(discountPercent)} تخفیف
            </span>
          )}
          {product.isNew && (
            <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
              جدید
            </span>
          )}
          {product.isBestSeller && (
            <span className="bg-stone-900 text-amber-300 text-xs font-medium px-2 py-0.5 rounded-lg shadow-sm">
              پرفروش
            </span>
          )}
        </div>

        {/* Weight & Sourness Pills Bottom of Image */}
        <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between text-xs pointer-events-none">
          <span className="bg-white/95 backdrop-blur-xs text-stone-700 font-medium px-2.5 py-1 rounded-md shadow-xs">
            {formatWeight(product.weightGrams)}
          </span>
          <span className={`px-2.5 py-1 rounded-md font-medium shadow-xs border ${sourness.bg}`}>
            {sourness.label}
          </span>
        </div>

        {/* Quick Action Floating Buttons (Left Side in RTL) */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product);
            }}
            className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-colors ${
              isFavorite
                ? 'bg-rose-600 text-white hover:bg-rose-700'
                : 'bg-white text-stone-600 hover:text-rose-600 hover:bg-rose-50'
            }`}
            title="علاقه‌مندی"
          >
            <Heart className="w-4 h-4 fill-current" />
          </button>
          {onQuickView && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(product);
              }}
              className="w-9 h-9 rounded-full bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-50 flex items-center justify-center shadow-md transition-colors"
              title="مشاهده سریع"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5">
            <span>{product.categoryName || 'لواشک طبیعی'}</span>
            <div className="flex items-center gap-1 text-amber-500 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{toPersianDigits(product.rating)}</span>
              <span className="text-stone-400 font-normal">({toPersianDigits(product.reviewCount)})</span>
            </div>
          </div>

          {/* Product Name */}
          <h3
            onClick={() => onNavigate?.(product.slug)}
            className="font-bold text-stone-800 text-base leading-snug line-clamp-2 hover:text-rose-700 cursor-pointer transition-colors"
          >
            {product.name}
          </h3>

          <p className="text-xs text-stone-500 line-clamp-1 mt-1 font-light">
            {product.shortDescription}
          </p>
        </div>

        {/* Pricing & Add to Cart */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
          <div className="flex flex-col">
            {hasDiscount && (
              <span className="text-xs text-stone-400 line-through">
                {formatPrice(product.price)}
              </span>
            )}
            <span className="font-black text-rose-900 text-base">
              {formatPrice(product.discountPrice ?? product.price)}
            </span>
          </div>

          <button
            onClick={() => addToCart(product, 1)}
            disabled={product.stockQuantity === 0}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all shadow-xs active:scale-95 ${
              product.stockQuantity === 0
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                : 'bg-rose-800 hover:bg-rose-900 text-white hover:shadow-rose-900/20'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{product.stockQuantity === 0 ? 'ناموجود' : 'افزودن'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
