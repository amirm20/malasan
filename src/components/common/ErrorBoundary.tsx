import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.hash = '';
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4 dir-rtl text-right font-sans">
          <div className="bg-white border border-stone-200 rounded-3xl p-8 max-w-lg w-full shadow-xl text-center space-y-6">
            <div className="w-16 h-16 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-stone-900">مشکلی در بارگذاری صفحه پیش آمده</h2>
              <p className="text-xs text-stone-500 leading-relaxed">
                متأسفانه در هنگام بارگذاری اطلاعات خطایی رخ داده است. جای نگرانی نیست؛ با زدن دکمه زیر صفحه را بارگذاری مجدد نمایید.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-left dir-ltr font-mono text-[11px] text-stone-700 max-h-28 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-rose-800 hover:bg-rose-900 text-white text-xs font-bold px-6 py-3 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>بارگذاری مجدد صفحه</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.hash = '';
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold px-6 py-3 rounded-xl transition-all active:scale-95 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>صفحه اصلی</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
