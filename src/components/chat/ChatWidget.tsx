import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Paperclip,
  Smile,
  ShoppingBag,
  Package,
  Headphones,
  Sparkles,
  Star,
  Check,
  CheckCheck,
  Volume2,
  VolumeX,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Minimize2,
  Maximize2,
  RefreshCw,
  PhoneCall,
  User,
  AlertCircle,
  MessagesSquare,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { formatPrice, toPersianDigits } from '../../lib/formatters';
import { getOrCreateChatGuestId } from '../../lib/chatCookies';
import {
  ChatMessage,
  ChatConversation,
  ChatSettings,
  ChatProductAttachment,
  ChatOrderAttachment,
  Product,
} from '../../types';

interface ChatWidgetProps {
  onNavigate?: (route: string, param?: string) => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [settings, setSettings] = useState<ChatSettings | null>(null);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('malasban_chat_sound') !== 'false';
  });

  // UI extra states
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingScore, setRatingScore] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // Offline Lead Form state
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [offlineName, setOfflineName] = useState(user?.name || '');
  const [offlineMobile, setOfflineMobile] = useState(user?.mobile || '');
  const [offlineMessage, setOfflineMessage] = useState('');
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);

  // Exit intent popup state
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [exitIntentDismissed, setExitIntentDismissed] = useState(false);

  // File attachment state
  const [attachedFile, setAttachedFile] = useState<{
    url: string;
    name: string;
    type: 'image' | 'file';
  } | null>(null);

  // Context product attached to current message
  const [currentProductContext, setCurrentProductContext] = useState<ChatProductAttachment | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Play notification chime
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.28);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch {}
  };

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('malasban_chat_sound', String(next));
      return next;
    });
  };

  // Scroll to bottom helper (strictly scrolls internal container, never parent window)
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom('auto');
    }
  }, [messages, isOpen, isMinimized, isTyping]);

  // Fetch settings on mount
  useEffect(() => {
    fetch('/api/chat/settings')
      .then((res) => res.json())
      .then((data) => setSettings(data))
      .catch(() => {});
  }, []);

  // Listen for custom open event (e.g. from ProductDetailView or elsewhere)
  useEffect(() => {
    const handleOpenChatEvent = (e: any) => {
      const detail = e.detail;
      setIsOpen(true);
      setIsMinimized(false);
      setShowExitIntent(false);

      if (detail?.product) {
        const prod = detail.product;
        const attachment: ChatProductAttachment = {
          id: prod.id,
          name: prod.name,
          price: prod.price,
          discountPrice: prod.discountPrice,
          image: prod.mainImage || (prod.images && prod.images[0]) || '',
          inStock: prod.stockQuantity > 0,
          slug: prod.slug,
          weightGrams: prod.weightGrams,
        };
        setCurrentProductContext(attachment);
        initializeChat(attachment);
      } else {
        initializeChat();
      }
    };

    window.addEventListener('open-malasban-chat', handleOpenChatEvent);
    return () => window.removeEventListener('open-malasban-chat', handleOpenChatEvent);
  }, [user]);

  // Exit intent listener (mouse leaves viewport top)
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 15 && !isOpen && !exitIntentDismissed && !sessionStorage.getItem('malasban_chat_exit_seen')) {
        setShowExitIntent(true);
        sessionStorage.setItem('malasban_chat_exit_seen', 'true');
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [isOpen, exitIntentDismissed]);

  // Initialize or resume conversation
  const initializeChat = async (initialProd?: ChatProductAttachment) => {
    try {
      const guestId = getOrCreateChatGuestId();
      const payload: any = {
        customerId: user?.id,
        guestId: user ? undefined : guestId,
        customerName: user ? `${user.name} ${user.family || ''}`.trim() : 'کاربر مهمان',
        customerMobile: user?.mobile,
        customerEmail: user?.email,
        initialProduct: initialProd || currentProductContext,
      };

      const res = await fetch('/api/chat/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setConversation(data.conversation);
        setMessages(data.messages || []);
        localStorage.setItem('malasban_conv_id', data.conversation.id);
      }
    } catch {
      // Fallback
    }
  };

  // Restore guest conversation from cookie if guest user visits
  useEffect(() => {
    if (!user) {
      const guestId = getOrCreateChatGuestId();
      fetch(`/api/chat/guest/${guestId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data && data.conversation) {
            setConversation(data.conversation);
            setMessages(data.messages || []);
            localStorage.setItem('malasban_conv_id', data.conversation.id);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  // Clean customer chat history when user logs out so it is not visible to others
  const prevUserIdRef = useRef<string | undefined>(user?.id);
  useEffect(() => {
    if (prevUserIdRef.current && !user?.id) {
      setConversation(null);
      setMessages([]);
      localStorage.removeItem('malasban_conv_id');
      const guestId = getOrCreateChatGuestId();
      fetch(`/api/chat/guest/${guestId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data && data.conversation) {
            setConversation(data.conversation);
            setMessages(data.messages || []);
          }
        })
        .catch(() => {});
    }
    prevUserIdRef.current = user?.id;
  }, [user?.id]);

  useEffect(() => {
    const handleLogoutEvent = () => {
      setConversation(null);
      setMessages([]);
      localStorage.removeItem('malasban_conv_id');
      const guestId = getOrCreateChatGuestId();
      fetch(`/api/chat/guest/${guestId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data && data.conversation) {
            setConversation(data.conversation);
            setMessages(data.messages || []);
          }
        })
        .catch(() => {});
    };
    window.addEventListener('malasban-auth-logout', handleLogoutEvent);
    return () => window.removeEventListener('malasban-auth-logout', handleLogoutEvent);
  }, []);

  // When widget is opened, initialize if not already done
  const handleOpenWidget = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setShowExitIntent(false);
    setUnreadCount(0);
    if (!conversation) {
      initializeChat();
    } else {
      // Mark read
      fetch(`/api/chat/conversations/${conversation.id}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'customer' }),
      }).catch(() => {});
    }
  };

  // Poll for messages while chat is open
  useEffect(() => {
    if (!isOpen || !conversation?.id) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/conversations/${conversation.id}/messages`);
        if (res.ok) {
          const remoteMsgs: ChatMessage[] = await res.json();
          setMessages((prev) => {
            if (remoteMsgs.length > prev.length) {
              const latest = remoteMsgs[remoteMsgs.length - 1];
              if (latest.sender === 'agent' || latest.sender === 'bot') {
                playChime();
              }
              return remoteMsgs;
            }
            return prev;
          });
        }
      } catch {}
    }, 3500);

    return () => clearInterval(interval);
  }, [isOpen, conversation?.id, soundEnabled]);

  // Send message
  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText !== undefined ? customText : inputText).trim();
    if (!textToSend && !attachedFile && !currentProductContext) return;
    if (!conversation?.id) {
      await initializeChat();
    }

    const convId = conversation?.id || localStorage.getItem('malasban_conv_id');
    if (!convId) return;

    setIsSending(true);
    setInputText('');
    setShowEmojiPicker(false);

    // Optimistic UI for customer message
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      conversationId: convId,
      sender: 'customer',
      senderName: user?.name || 'شما',
      text: textToSend,
      createdAt: new Date().toISOString(),
      status: 'sending',
      attachmentUrl: attachedFile?.url,
      attachmentType: attachedFile?.type,
      attachmentName: attachedFile?.name,
      product: currentProductContext || undefined,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setAttachedFile(null);
    setCurrentProductContext(null);

    // Simulate agent/bot typing animation
    setIsTyping(true);

    try {
      const res = await fetch(`/api/chat/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'customer',
          senderName: user ? `${user.name} ${user.family || ''}`.trim() : 'مشتری عزیز',
          text: textToSend,
          attachmentUrl: optimisticMsg.attachmentUrl,
          attachmentType: optimisticMsg.attachmentType,
          attachmentName: optimisticMsg.attachmentName,
          product: optimisticMsg.product,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        // Replace temp message with server message
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...result.message, status: 'delivered' } : m))
        );

        // If bot replied automatically
        if (result.botMessage) {
          setTimeout(() => {
            setIsTyping(false);
            setMessages((prev) => [...prev, result.botMessage]);
            playChime();
          }, 700);
        } else {
          setIsTyping(false);
        }
      } else {
        setIsTyping(false);
      }
    } catch {
      setIsTyping(false);
      showToast('خطا در برقراری ارتباط با سرور چت', 'error');
    } finally {
      setIsSending(false);
    }
  };

  // Handle Quick Reply chip click
  const handleQuickReply = (qr: string) => {
    handleSendMessage(qr);
  };

  // Handle File Upload from device
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('حجم فایل نباید بیشتر از ۵ مگابایت باشد.', 'info');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Url = reader.result as string;
      const isImg = file.type.startsWith('image/');
      setAttachedFile({
        url: base64Url,
        name: file.name,
        type: isImg ? 'image' : 'file',
      });
      showToast(`فایل «${file.name}» پیوست شد.`, 'info');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle rating submit
  const handleRateConversation = async () => {
    if (!conversation?.id) return;
    setIsSubmittingRating(true);
    try {
      const res = await fetch(`/api/chat/conversations/${conversation.id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: ratingScore, feedback: feedbackText }),
      });
      if (res.ok) {
        showToast('از امتیاز و نظر شما صمیمانه سپاسگزاریم! ❤️', 'success');
        setShowRatingModal(false);
        setFeedbackText('');
      }
    } catch {
      showToast('خطا در ثبت نظر', 'error');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  // Handle offline lead submit
  const handleSubmitOfflineLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offlineName || !offlineMobile) {
      showToast('نام و شماره همراه خود را وارد فرمایید.', 'info');
      return;
    }

    setIsSubmittingLead(true);
    try {
      const res = await fetch('/api/chat/offline-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: offlineName,
          mobile: offlineMobile,
          message: offlineMessage,
          product: currentProductContext,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        showToast('پیام شما با موفقیت ثبت شد! به زودی تماس خواهیم گرفت.', 'success');
        setShowOfflineModal(false);
        setOfflineMessage('');
        // Initialize conversation to show greeting
        if (data.conversationId) {
          localStorage.setItem('malasban_conv_id', data.conversationId);
          initializeChat();
        }
      }
    } catch {
      showToast('خطا در ارسال پیام آفلاین', 'error');
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const isOnline = settings?.isOnline ?? true;
  const operatorName = settings?.operatorName || 'خانم رضایی';
  const operatorTitle = settings?.operatorTitle || 'مشاور فروش و پشتیبانی';

  return (
    <>
      {/* 1. Floating Exit Intent Prompt Bubble */}
      {showExitIntent && !isOpen && (
        <div className="fixed bottom-24 left-6 z-40 max-w-sm w-[90vw] sm:w-88 bg-white border border-rose-200 rounded-3xl p-4 shadow-2xl shadow-rose-900/15 animate-in fade-in slide-in-from-bottom-5">
          <button
            onClick={() => {
              setShowExitIntent(false);
              setExitIntentDismissed(true);
            }}
            className="absolute top-3 left-3 text-stone-400 hover:text-stone-700"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-rose-800" />
            </div>
            <div className="space-y-1">
              <h4 className="font-black text-rose-950 text-xs">
                قبل از رفتن! کد تخفیف خرید اول ۲۵٪
              </h4>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                {settings?.exitIntentMessage ||
                  'کد FIRSTBUY برای اولین سفارش شما فعال است. سوالی در مورد طعم‌ها یا بسته‌بندی دارید؟'}
              </p>
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowExitIntent(false);
                    handleOpenWidget();
                  }}
                  className="bg-rose-800 hover:bg-rose-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-md active:scale-95"
                >
                  گفتگوی زنده با پشتیبان
                </button>
                <button
                  onClick={() => {
                    setShowExitIntent(false);
                    setExitIntentDismissed(true);
                  }}
                  className="text-stone-500 hover:text-stone-800 text-[11px] font-bold px-2 py-1"
                >
                  بعداً
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Floating Launcher Button (Bottom Left, above MobileNav on mobile) */}
      {(!isOpen || isMinimized) && (
        <div className="fixed left-4 sm:left-6 bottom-20 lg:bottom-6 z-40">
          <button
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
              setShowExitIntent(false);
              setUnreadCount(0);
              if (!conversation) {
                initializeChat();
              }
            }}
            className="group relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-700 via-rose-600 to-amber-600 text-white shadow-xl shadow-rose-900/35 hover:shadow-2xl hover:shadow-rose-600/40 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center border-2 border-white/40 ring-4 ring-rose-500/20 cursor-pointer select-none"
            title="گفتگوی زنده و پشتیبانی ملس‌بان"
            aria-label="گفتگوی زنده"
          >
            <MessagesSquare className="w-6 h-6 text-white group-hover:scale-110 transition-transform drop-shadow-sm" />

            {/* Online Indicator Status Ring */}
            <span
              className={`absolute top-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ring-2 ring-emerald-400/40 ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
              }`}
            />

            {/* Minimized indicator badge when active chat is minimized */}
            {isMinimized && unreadCount === 0 && (
              <span
                className="absolute -top-1 -left-1 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-white animate-pulse"
                title="گفتگو در حال اجرا"
              />
            )}

            {/* Unread badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -left-1.5 bg-amber-400 text-stone-950 font-black text-[11px] min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center border-2 border-white shadow-md animate-bounce">
                {toPersianDigits(unreadCount)}
              </span>
            )}
          </button>
        </div>
      )}

      {/* 3. Main Chat Floating Window */}
      {isOpen && !isMinimized && (
        <div className="fixed left-0 sm:left-6 bottom-0 sm:bottom-6 w-full sm:w-[420px] h-[92vh] sm:h-[620px] sm:max-h-[85vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-200/90 overflow-hidden flex flex-col z-50 animate-in fade-in duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white px-4 py-3 sm:py-3.5 flex items-center justify-between border-b border-stone-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-800 to-amber-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  <Headphones className="w-5 h-5 text-white" />
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-stone-900 ${
                    isOnline ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-black text-xs sm:text-sm text-stone-100">
                    پشتیبانی زنده ملس‌بان
                  </h3>
                  <span className="bg-rose-950/80 text-rose-300 text-[10px] px-1.5 py-0.2 rounded-md font-bold border border-rose-800/40">
                    {isOnline ? 'پاسخگویی آنلاین' : 'خارج از ساعات'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 font-medium">
                  {operatorName} • {operatorTitle}
                </p>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleSound}
                className="p-1.5 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition-colors"
                title={soundEnabled ? 'قطع صدای پیام' : 'فعال‌سازی صدای پیام'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-stone-500" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="p-1.5 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition-colors flex items-center justify-center cursor-pointer"
                title="کوچک‌نمایی چت"
              >
                <Minimize2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsMinimized(false);
                }}
                className="p-1.5 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition-colors cursor-pointer"
                title="بستن چت"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Top Banner (Hours & Offline Alert) */}
          {!isOnline && (
            <div className="bg-amber-50 border-b border-amber-200 px-3.5 py-2 flex items-center justify-between text-xs text-amber-900 shrink-0">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-[11px] font-medium">
                  ساعات کاری: {settings?.workingHoursStart || '۰۸:۳۰'} تا{' '}
                  {settings?.workingHoursEnd || '۲۲:۳۰'}
                </span>
              </div>
              <button
                onClick={() => setShowOfflineModal(true)}
                className="font-bold text-rose-800 text-[11px] hover:underline"
              >
                فرم تماس &larr;
              </button>
            </div>
          )}

              {/* Message List Area */}
              <div
                ref={messagesContainerRef}
                className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3.5 bg-stone-50/60 text-xs"
              >
                {/* Intro Greeting Card */}
                <div className="bg-white rounded-2xl p-3 border border-stone-200 shadow-2xs text-center space-y-2">
                  <div className="w-9 h-9 mx-auto rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="font-black text-stone-900 text-xs">
                    دستیار تخصصی و مشاوره ترشی و طعم‌های ملس‌بان
                  </h4>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    سلام به خانواده ملس‌بان خوش آمدید! درباره کیفیت، درجه ترشی، استعلام ارسال یا
                    تخفیف‌ها در خدمتیم.
                  </p>
                </div>

                {/* Messages Stream */}
                {messages.map((msg) => {
                  const isUser = msg.sender === 'customer';
                  const isBot = msg.sender === 'bot';
                  const isSystem = msg.sender === 'system';

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="text-center my-2">
                        <span className="bg-stone-200/80 text-stone-600 text-[10px] px-3 py-1 rounded-full font-medium inline-block max-w-[90%]">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                    >
                      {/* Sender label */}
                      <div className="flex items-center gap-1 text-[10px] text-stone-400 font-medium px-1">
                        {!isUser && isBot && (
                          <span className="bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded-sm font-bold text-[9px]">
                            دستیار هوشمند
                          </span>
                        )}
                        <span>{msg.senderName}</span>
                        <span>•</span>
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString('fa-IR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* Bubble */}
                      <div
                        className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-3 leading-relaxed shadow-2xs ${
                          isUser
                            ? 'bg-rose-800 text-white rounded-tl-xs'
                            : 'bg-white text-stone-800 border border-stone-200/80 rounded-tr-xs'
                        }`}
                      >
                        {/* Text */}
                        {msg.text && (
                          <p className="whitespace-pre-line text-xs font-normal selection:bg-amber-300 selection:text-stone-900">
                            {msg.text}
                          </p>
                        )}

                        {/* Attached Image */}
                        {msg.attachmentUrl && msg.attachmentType === 'image' && (
                          <div className="mt-2 rounded-xl overflow-hidden border border-black/10">
                            <img
                              src={msg.attachmentUrl}
                              alt={msg.attachmentName || 'عکس پیوست'}
                              className="max-h-48 w-full object-cover"
                            />
                          </div>
                        )}

                        {/* Attached File */}
                        {msg.attachmentUrl && msg.attachmentType === 'file' && (
                          <a
                            href={msg.attachmentUrl}
                            download={msg.attachmentName || 'file'}
                            className={`mt-2 flex items-center gap-2 p-2 rounded-xl text-[11px] font-bold ${
                              isUser ? 'bg-rose-900 text-white' : 'bg-stone-100 text-stone-800'
                            }`}
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                            <span className="truncate">{msg.attachmentName || 'دانلود فایل'}</span>
                          </a>
                        )}

                        {/* Interactive Product Card */}
                        {msg.product && (
                          <div className="mt-2.5 bg-white text-stone-900 rounded-xl p-2.5 border border-stone-200 shadow-xs flex flex-col gap-2">
                            <div className="flex gap-2.5 items-center">
                              {msg.product.image && (
                                <img
                                  src={msg.product.image}
                                  alt={msg.product.name}
                                  className="w-14 h-14 rounded-lg object-cover border border-stone-100 shrink-0"
                                />
                              )}
                              <div className="min-w-0 flex-1">
                                <h5 className="font-black text-[11px] truncate text-stone-900">
                                  {msg.product.name}
                                </h5>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="font-bold text-rose-800 text-xs">
                                    {formatPrice(msg.product.discountPrice || msg.product.price)}
                                  </span>
                                  {msg.product.discountPrice && (
                                    <span className="line-through text-stone-400 text-[10px]">
                                      {formatPrice(msg.product.price)}
                                    </span>
                                  )}
                                </div>
                                <span
                                  className={`text-[9px] font-bold ${
                                    msg.product.inStock ? 'text-emerald-700' : 'text-stone-400'
                                  }`}
                                >
                                  {msg.product.inStock ? 'موجود در انبار' : 'اتمام موجودی'}
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-1.5 pt-1 border-t border-stone-100">
                              <button
                                type="button"
                                onClick={() => {
                                  addToCart(
                                    {
                                      id: msg.product!.id,
                                      name: msg.product!.name,
                                      price: msg.product!.price,
                                      discountPrice: msg.product!.discountPrice,
                                      mainImage: msg.product!.image || '',
                                      stockQuantity: msg.product!.inStock ? 10 : 0,
                                      slug: msg.product!.slug,
                                    } as Product,
                                    1
                                  );
                                  showToast(
                                    `«${msg.product!.name}» به سبد خرید افزوده شد.`,
                                    'success'
                                  );
                                }}
                                disabled={!msg.product.inStock}
                                className="flex-1 bg-rose-800 hover:bg-rose-900 text-white font-bold py-1.5 px-2 rounded-lg text-[10px] flex items-center justify-center gap-1 transition-all disabled:bg-stone-300"
                              >
                                <ShoppingBag className="w-3 h-3" />
                                <span>افزودن به سبد</span>
                              </button>

                              {onNavigate && msg.product.slug && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsOpen(false);
                                    onNavigate('product-detail', msg.product!.slug);
                                  }}
                                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-2 py-1.5 rounded-lg text-[10px] flex items-center justify-center"
                                  title="مشاهده صفحه محصول"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Interactive Order Card */}
                        {msg.order && (
                          <div className="mt-2.5 bg-stone-50 text-stone-900 rounded-xl p-3 border border-stone-200 space-y-1.5">
                            <div className="flex items-center justify-between font-bold text-[11px]">
                              <span>سفارش: {msg.order.orderNumber}</span>
                              <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md text-[10px]">
                                {msg.order.status}
                              </span>
                            </div>
                            <div className="text-[10px] text-stone-600 flex justify-between">
                              <span>تعداد اقلام: {toPersianDigits(msg.order.itemsCount)}</span>
                              <span>مبلغ: {formatPrice(msg.order.totalAmount)}</span>
                            </div>
                            {onNavigate && (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsOpen(false);
                                  onNavigate('account', 'orders');
                                }}
                                className="w-full bg-white hover:bg-stone-100 text-stone-800 font-bold py-1.5 rounded-lg border border-stone-200 text-[10px] text-center mt-1 block"
                              >
                                پیگیری و مشاهده فاکتور سفارش &larr;
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Quick Replies below bot message if available */}
                      {msg.quickReplies && msg.quickReplies.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1 max-w-[95%]">
                          {msg.quickReplies.map((qr, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleQuickReply(qr)}
                              className="bg-white hover:bg-rose-50 text-rose-900 border border-rose-200 font-bold text-[10px] px-2.5 py-1 rounded-xl transition-all shadow-2xs hover:border-rose-400 active:scale-95"
                            >
                              {qr}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Animated Typing Indicator */}
                {isTyping && (
                  <div className="flex items-center gap-2 text-stone-400 text-xs px-2 py-1 animate-in fade-in">
                    <div className="w-7 h-7 rounded-xl bg-stone-200 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-stone-600" />
                    </div>
                    <div className="bg-white border border-stone-200 rounded-2xl rounded-tr-xs px-3 py-2 flex items-center gap-1 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-700 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-700 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-700 animate-bounce [animation-delay:0.4s]" />
                      <span className="text-[10px] text-stone-500 font-medium mr-1.5">
                        در حال نگارش پاسخ...
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Context Product Preview before sending (if chosen) */}
              {currentProductContext && (
                <div className="px-3.5 py-2 bg-rose-50 border-t border-rose-100 flex items-center justify-between text-xs text-rose-950 shrink-0">
                  <div className="flex items-center gap-2 truncate">
                    <ShoppingBag className="w-4 h-4 text-rose-800 shrink-0" />
                    <span className="font-bold text-[11px] truncate">
                      ضمیمه: {currentProductContext.name}
                    </span>
                  </div>
                  <button
                    onClick={() => setCurrentProductContext(null)}
                    className="text-stone-400 hover:text-stone-700 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Attached file preview */}
              {attachedFile && (
                <div className="px-3.5 py-2 bg-amber-50 border-t border-amber-200 flex items-center justify-between text-xs text-amber-950 shrink-0">
                  <div className="flex items-center gap-2 truncate">
                    <Paperclip className="w-4 h-4 text-amber-700 shrink-0" />
                    <span className="font-bold text-[11px] truncate">
                      فایل پیوست: {attachedFile.name}
                    </span>
                  </div>
                  <button
                    onClick={() => setAttachedFile(null)}
                    className="text-stone-400 hover:text-stone-700 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Bottom Quick Reply Shortcut Pills */}
              <div className="px-3 py-1.5 bg-stone-100/80 border-t border-stone-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                <button
                  type="button"
                  onClick={() => handleQuickReply('📦 پیگیری وضعیت سفارش من')}
                  className="whitespace-nowrap bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 text-[10px] font-bold px-2.5 py-1 rounded-xl transition-colors shadow-2xs"
                >
                  📦 پیگیری سفارش
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickReply('🍒 راهنمای انتخاب درجه ترشی و طعم‌ها')}
                  className="whitespace-nowrap bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 text-[10px] font-bold px-2.5 py-1 rounded-xl transition-colors shadow-2xs"
                >
                  🍒 مشاوره طعم‌ها
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickReply('🚚 هزینه و زمان ارسال چقدر است؟')}
                  className="whitespace-nowrap bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 text-[10px] font-bold px-2.5 py-1 rounded-xl transition-colors shadow-2xs"
                >
                  🚚 شرایط ارسال
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickReply('👩‍💼 اتصال به اپراتور و کارشناس پشتیبانی')}
                  className="whitespace-nowrap bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 text-[10px] font-bold px-2.5 py-1 rounded-xl transition-colors shadow-2xs"
                >
                  👩‍💼 صحبت با اپراتور
                </button>
              </div>

              {/* Ready Emoji Bar */}
              {showEmojiPicker && (
                <div className="px-3 py-2 bg-white border-t border-stone-200 flex items-center justify-between gap-1 overflow-x-auto text-base shrink-0 animate-in fade-in">
                  {['😊', '❤️', '🍒', '🍋', '🎁', '🚚', '📦', '🙏', '👍', '👌', '⭐'].map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setInputText((prev) => prev + em)}
                      className="p-1 hover:scale-125 transition-transform"
                    >
                      {em}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowRatingModal(true)}
                    className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 font-bold px-2 py-1 rounded-lg"
                  >
                    ⭐ ثبت نظر چت
                  </button>
                </div>
              )}

              {/* Chat Input Field Bar */}
              <div className="p-2.5 sm:p-3 bg-white border-t border-stone-200 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-1.5"
                >
                  {/* File attach button */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,application/pdf"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors shrink-0"
                    title="ارسال عکس یا فایل"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  {/* Emoji toggle */}
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors shrink-0"
                    title="انتخاب ایموجی"
                  >
                    <Smile className="w-4 h-4" />
                  </button>

                  {/* Text Input */}
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="پیام خود را بنویسید..."
                    className="flex-1 bg-stone-100 focus:bg-white border border-transparent focus:border-rose-800 rounded-xl px-3 py-2.5 text-xs text-stone-900 outline-hidden transition-all placeholder:text-stone-400"
                  />

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={isSending || (!inputText.trim() && !attachedFile && !currentProductContext)}
                    className="w-10 h-10 rounded-xl bg-rose-800 hover:bg-rose-900 text-white flex items-center justify-center transition-all disabled:bg-stone-300 disabled:cursor-not-allowed shadow-md active:scale-95 shrink-0"
                    title="ارسال پیام"
                  >
                    <Send className="w-4 h-4 rotate-180" />
                  </button>
                </form>
              </div>

          {/* 4. Modal: Customer Rating & Satisfaction */}
          {showRatingModal && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-2xs z-30 flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white rounded-3xl p-5 w-full max-w-xs border border-stone-200 shadow-2xl space-y-3.5 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <Star className="w-6 h-6 fill-amber-500" />
                </div>
                <div>
                  <h4 className="font-black text-stone-900 text-sm">
                    میزان رضایت از پشتیبانی ملس‌بان
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-1">
                    نظر ارزشمند شما در ارتقای کیفیت خدمات کارشناسان به کار گرفته می‌شود.
                  </p>
                </div>

                {/* Stars selector */}
                <div className="flex justify-center gap-1.5 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingScore(star)}
                      className="p-1 hover:scale-125 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= ratingScore
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-stone-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="پیشنهاد یا بازخورد شما (اختیاری)..."
                  rows={2}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs outline-hidden focus:border-amber-600"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleRateConversation}
                    disabled={isSubmittingRating}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-xl text-xs transition-colors shadow-sm"
                  >
                    {isSubmittingRating ? 'در حال ثبت...' : 'ثبت امتیاز'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRatingModal(false)}
                    className="bg-stone-100 text-stone-600 font-bold px-3 py-2 rounded-xl text-xs"
                  >
                    انصراف
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 5. Modal: Offline Lead Capture Form */}
          {showOfflineModal && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-2xs z-30 flex items-center justify-center p-4 animate-in fade-in">
              <form
                onSubmit={handleSubmitOfflineLead}
                className="bg-white rounded-3xl p-5 w-full max-w-sm border border-stone-200 shadow-2xl space-y-3.5"
              >
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <h4 className="font-black text-stone-900 text-xs">
                      ثبت پیام در زمان عدم حضور اپراتور
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowOfflineModal(false)}
                    className="text-stone-400 hover:text-stone-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-[11px] text-stone-600 leading-relaxed">
                  {settings?.offlineMessage ||
                    'در حال حاضر خارج از ساعات کاری هستیم. اطلاعات تماس خود را بگذارید تا صبح اولین فرصت بررسی و تماس گرفته شود.'}
                </p>

                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      نام و نام خانوادگی *
                    </label>
                    <input
                      type="text"
                      required
                      value={offlineName}
                      onChange={(e) => setOfflineName(e.target.value)}
                      placeholder="مثال: مریم کریمی"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs outline-hidden focus:border-rose-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      شماره تماس همراه *
                    </label>
                    <input
                      type="tel"
                      required
                      value={offlineMobile}
                      onChange={(e) => setOfflineMobile(e.target.value)}
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono outline-hidden focus:border-rose-800 dir-ltr text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      متن سوال یا پیام
                    </label>
                    <textarea
                      rows={2}
                      value={offlineMessage}
                      onChange={(e) => setOfflineMessage(e.target.value)}
                      placeholder="درباره سفارش، محصولات یا خرید عمده..."
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs outline-hidden focus:border-rose-800"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isSubmittingLead}
                    className="flex-1 bg-rose-800 hover:bg-rose-900 text-white font-bold py-2 rounded-xl text-xs transition-colors shadow-md"
                  >
                    {isSubmittingLead ? 'در حال ثبت...' : 'ارسال درخواست تماس'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOfflineModal(false)}
                    className="bg-stone-100 text-stone-600 font-bold px-3 py-2 rounded-xl text-xs"
                  >
                    انصراف
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </>
  );
};
