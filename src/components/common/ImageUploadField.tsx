import React, { useState, useRef, useId } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  Link,
  CheckCircle2,
  FileImage,
  FolderOpen,
} from 'lucide-react';

interface PresetImage {
  label: string;
  url: string;
}

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
  helpText?: string;
  maxDim?: number;
  quality?: number;
  aspectRatioClass?: string; // e.g. 'aspect-video' or 'aspect-square' or 'h-48'
  presetImages?: PresetImage[];
  placeholderText?: string;
}

/**
 * Resizes and compresses an image file to a lightweight data URL
 */
function compressImageFile(file: File, maxDim = 1400, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    // If SVG or GIF, keep as base64 without canvas resize
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Draw image smoothed
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  value,
  onChange,
  required = false,
  helpText,
  maxDim = 1400,
  quality = 0.85,
  aspectRatioClass = 'h-44 sm:h-52',
  presetImages,
  placeholderText = 'عکس خود را اینجا بکشید یا دکمه انتخاب را بزنید',
}) => {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputVal, setUrlInputVal] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('لطفاً یک فایل تصویری معتبر (JPG, PNG, WebP) انتخاب نمایید.');
      return;
    }
    setErrorMsg(null);
    setIsProcessing(true);

    try {
      const dataUrl = await compressImageFile(file, maxDim, quality);
      onChange(dataUrl);
    } catch (err) {
      console.error('Failed to process image:', err);
      setErrorMsg('خطا در پردازش تصویر. لطفاً تصویر دیگری انتخاب کنید.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Clear input value so selecting the exact same file again also triggers onChange
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleTriggerBrowse = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleRemoveImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange('');
    setUrlInputVal('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleApplyUrl = () => {
    if (urlInputVal.trim()) {
      onChange(urlInputVal.trim());
      setUrlInputVal('');
      setShowUrlInput(false);
    }
  };

  return (
    <div className="space-y-2 text-xs">
      {/* Label and Actions */}
      <div className="flex items-center justify-between">
        <label className="block font-bold text-stone-800">
          {label} {required && <span className="text-rose-600">*</span>}
        </label>
        <div className="flex items-center gap-2">
          {value && (
            <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>تصویر بارگذاری شده</span>
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-[11px] text-stone-500 hover:text-stone-800 flex items-center gap-1 transition-colors"
          >
            <Link className="w-3 h-3" />
            <span>{showUrlInput ? 'بستن ورودی لینک' : 'ورود با آدرس اینترنتی (URL)'}</span>
          </button>
        </div>
      </div>

      {/* Accessible File Input */}
      <input
        id={inputId}
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp, image/gif"
        className="sr-only"
        onClick={(e) => {
          (e.target as HTMLInputElement).value = '';
        }}
        onChange={handleInputChange}
      />

      {/* Optional URL input box */}
      {showUrlInput && (
        <div className="flex gap-2 p-2.5 bg-stone-100/80 rounded-2xl border border-stone-200 animate-in fade-in">
          <input
            type="url"
            value={urlInputVal}
            onChange={(e) => setUrlInputVal(e.target.value)}
            placeholder="آدرس اینترنتی تصویر (https://...)"
            className="flex-1 bg-white border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-mono dir-ltr text-left outline-hidden focus:border-stone-400"
          />
          <button
            type="button"
            onClick={handleApplyUrl}
            className="bg-stone-800 hover:bg-stone-900 text-white font-bold px-3 py-1.5 rounded-xl text-xs"
          >
            اعمال لینک
          </button>
        </div>
      )}

      {/* Main Image View or Browse Dropzone */}
      {value ? (
        <div className="relative rounded-2xl border-2 border-stone-200 overflow-hidden bg-stone-100 group">
          {/* Preview Image */}
          <div className={`w-full ${aspectRatioClass} flex items-center justify-center bg-stone-900/5`}>
            <img
              src={value}
              alt={label}
              className="w-full h-full object-cover"
              onError={(e) => {
                // If image load fails
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          {/* Always Visible Quick Badge on Preview */}
          <label
            htmlFor={inputId}
            className="cursor-pointer absolute top-3 right-3 bg-stone-900/85 hover:bg-stone-950 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl backdrop-blur-md shadow-md flex items-center gap-1.5 transition-all hover:scale-105 select-none"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>تغییر تصویر (Browse)</span>
          </label>

          {/* Action Overlay on Hover */}
          <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 p-4">
            <label
              htmlFor={inputId}
              className="cursor-pointer bg-white hover:bg-stone-100 text-stone-900 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg transition-transform hover:scale-105 select-none"
            >
              <FolderOpen className="w-4 h-4 text-amber-600" />
              <span>تغییر تصویر (Browse)</span>
            </label>
            <button
              type="button"
              onClick={handleRemoveImage}
              className="bg-rose-700 hover:bg-rose-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
            >
              <Trash2 className="w-4 h-4" />
              <span>حذف تصویر</span>
            </button>
          </div>

          {/* Bottom Bar Info & Browse Button (Always accessible) */}
          <div className="p-3 bg-white border-t border-stone-200 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-stone-600 truncate min-w-0">
              <FileImage className="w-4 h-4 text-rose-800 shrink-0" />
              <span className="text-[11px] truncate font-medium">
                {value.startsWith('data:') ? 'تصویر انتخاب شده از حافظه دستگاه' : value}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <label
                htmlFor={inputId}
                className="cursor-pointer bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors select-none"
              >
                <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>تغییر با عکس جدید (Browse)</span>
              </label>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="text-rose-700 hover:text-rose-900 p-1.5 rounded-xl hover:bg-rose-50 transition-colors"
                title="حذف"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State Dropzone with Prominent Browse Button */
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => handleTriggerBrowse()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all flex flex-col items-center justify-center gap-3 ${
            isDragging
              ? 'border-rose-600 bg-rose-50/70 scale-[1.01]'
              : 'border-stone-300 hover:border-rose-500 bg-stone-50 hover:bg-white'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center shadow-xs">
            {isProcessing ? (
              <RefreshCw className="w-6 h-6 animate-spin text-rose-700" />
            ) : (
              <UploadCloud className="w-6 h-6 text-rose-800" />
            )}
          </div>

          <div>
            <p className="font-bold text-stone-900 text-sm">
              {isProcessing ? 'در حال آماده‌سازی و بهینه‌سازی تصویر...' : placeholderText}
            </p>
            <p className="text-[11px] text-stone-500 mt-1">
              {helpText || 'برای انتخاب عکس کلیک کنید یا فایل را بکشید و رها نمایید (JPG, PNG, WebP)'}
            </p>
          </div>

          <label
            htmlFor={inputId}
            onClick={(e) => e.stopPropagation()}
            className="cursor-pointer mt-1 bg-stone-900 hover:bg-rose-800 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-md transition-all select-none"
          >
            <FolderOpen className="w-4 h-4 text-amber-400" />
            <span>انتخاب عکس از کامپیوتر یا موبایل (Browse)</span>
          </label>
        </div>
      )}

      {/* Error display */}
      {errorMsg && (
        <p className="text-[11px] text-rose-600 font-bold bg-rose-50 p-2 rounded-xl border border-rose-200">
          {errorMsg}
        </p>
      )}

      {/* Quick Curated Preset Chips */}
      {presetImages && presetImages.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] text-stone-500 font-bold">یا انتخاب از تصاویر آماده:</span>
          {presetImages.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onChange(preset.url)}
              className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ImageIcon className="w-3 h-3 text-stone-500" />
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
