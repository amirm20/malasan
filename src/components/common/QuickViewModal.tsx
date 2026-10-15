import React, { useState } from 'react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { formatPrice, formatWeight, getSournessBadge, toPersianDigits } from '../../lib/formatters';
import { X, Heart, ShoppingBag, Check, Star, ShieldCheck, Sparkles } from 'lucide-react';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onViewDetails: (slug: string) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, onClose, onViewDetails }) => {
  const [qty, setQty] = useState(1);
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  if (!product) return null;

  const isFavorite = isInWishlist(product.id);
  const sourness = getSournessBadge(product.sournessLevel);
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div
        className="relative bg-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border border-stone-200 flex flex-col md:flex-row max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-20 w-9 h-9 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-stone-600 hover:text-rose-700 shadow-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image */}
        <div className="md:w-1/2 bg-stone-100 relative p-4 flex items-center justify-center">
          <img
            src={product.mainImage}
            alt={product.name}
            className="w-full max-h-72 md:max-h-full object-cover rounded-2xl shadow-inner"
          />
          <div className="absolute bottom-6 right-6 flex items-center gap-2">
            <span className={`px-3 py-1 text-xs font-bold rounded-lg border shadow-xs ${sourness.bg}`}>
              {sourness.label}
            </span>
            <span className="bg-white/90 text-stone-800 text-xs font-bold px-3 py-1 rounded-lg shadow-xs">
              {formatWeight(product.weightGrams)}
            </span>
          </div>
        </div>

        {/* Product Details */}
        <div className="md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
              <span>{product.categoryName}</span>
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{toPersianDigits(product.rating)}</span>
                <span className="text-stone-400 font-normal">({toPersianDigits(product.reviewCount)} نظر)</span>
              </div>
            </div>

            <h2 className="text-xl font-black text-stone-900 leading-snug">{product.name}</h2>
            <p className="text-xs text-stone-500 mt-1 font-mono">کد کالا: {product.sku}</p>

            <p className="text-sm text-stone-600 mt-3 leading-relaxed">
              {product.shortDescription}
            </p>

            {/* Ingredients */}
            <div className="mt-4 pt-3 border-t border-stone-100">
              <span className="text-xs font-bold text-stone-700 block mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-rose-700" />
                مواد اولیه طبیعی:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {product.ingredients.map((ing, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-stone-100 text-stone-700 px-2.5 py-1 rounded-md"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>

            {/* Health Guarantee */}
            <div className="mt-3 flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>دارای نشان سیب سلامت و ضمانت ۱۰۰٪ میوه ارگانیک بدون مواد افزودنی</span>
            </div>
          </div>

          {/* Action & Price Bottom */}
          <div className="mt-6 pt-4 border-t border-stone-200">
            <div className="flex items-baseline justify-between mb-4">
              <span className="text-xs text-stone-500">قیمت مصرف‌کننده:</span>
              <div className="flex items-baseline gap-2">
                {hasDiscount && (
                  <span className="text-sm text-stone-400 line-through">
                    {formatPrice(product.price)}
                  </span>
                )}
                <span className="text-xl font-black text-rose-900">
                  {formatPrice(product.discountPrice ?? product.price)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Quantity selector */}
              <div className="flex items-center border border-stone-300 rounded-xl bg-stone-50 p-1">
                <button
                  onClick={() => setQty((q) => Math.min(product.stockQuantity, q + 1))}
                  className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-bold text-stone-700 hover:bg-stone-200 transition-colors shadow-xs"
                >
                  +
                </button>
                <span className="w-10 text-center font-bold text-stone-800 text-sm">
                  {toPersianDigits(qty)}
                </span>
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-bold text-stone-700 hover:bg-stone-200 transition-colors shadow-xs"
                >
                  -
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={() => {
                  addToCart(product, qty);
                  onClose();
                }}
                disabled={product.stockQuantity === 0}
                className="flex-1 bg-rose-800 hover:bg-rose-900 text-white py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:bg-stone-300"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>افزودن به سبد خرید</span>
              </button>

              <button
                onClick={() => toggleWishlist(product)}
                className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-colors ${
                  isFavorite
                    ? 'border-rose-600 bg-rose-50 text-rose-600'
                    : 'border-stone-300 text-stone-600 hover:text-rose-600'
                }`}
                title="علاقه‌مندی"
              >
                <Heart className="w-5 h-5 fill-current" />
              </button>
            </div>

            <button
              onClick={() => {
                onClose();
                onViewDetails(product.slug);
              }}
              className="w-full text-center text-xs text-stone-500 hover:text-rose-800 font-medium mt-3 transition-colors"
            >
              مشاهده توضیحات کامل و مشخصات فنی محصول &larr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
