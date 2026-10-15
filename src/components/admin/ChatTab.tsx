import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  Tag,
  User,
  ShoppingBag,
  Send,
  Sparkles,
  Paperclip,
  Star,
  Settings,
  BarChart3,
  TrendingUp,
  FileText,
  Plus,
  Trash2,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  Phone,
  Mail,
  Calendar,
  Smile,
  Shield,
  Bot,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatPrice, toPersianDigits } from '../../lib/formatters';
import {
  ChatConversation,
  ChatMessage,
  ChatSettings,
  CannedResponse,
  ChatAnalytics,
  Product,
  Order,
  ChatProductAttachment,
} from '../../types';

interface ChatTabProps {
  token: string | null;
  onNavigate?: (route: string, param?: string) => void;
}

export const ChatTab: React.FC<ChatTabProps> = ({ token, onNavigate }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<'console' | 'analytics' | 'settings'>('console');

  // Console State
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [activeConv, setActiveConv] = useState<ChatConversation | null>(null);
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([]);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'waiting' | 'closed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'urgent' | 'normal' | 'low'>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');

  // Input & Reply
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [showCannedDropdown, setShowCannedDropdown] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  // Products list for recommendation picker
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  // Analytics & Settings State
  const [analytics, setAnalytics] = useState<ChatAnalytics | null>(null);
  const [settings, setSettings] = useState<ChatSettings | null>(null);
  const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>([]);

  // New canned modal
  const [showAddCannedModal, setShowAddCannedModal] = useState(false);
  const [cannedShortcut, setCannedShortcut] = useState('');
  const [cannedTitle, setCannedTitle] = useState('');
  const [cannedContent, setCannedContent] = useState('');
  const [cannedCategory, setCannedCategory] = useState('عمومی');

  // AI Summary state
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToMessagesBottom = (smooth = true) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  };

  // Fetch initial conversations list
  const fetchConversations = async (autoSelectFirst = true) => {
    if (!token) return;
    try {
      let url = `/api/admin/chat/conversations?status=${statusFilter}&priority=${priorityFilter}`;
      if (searchQuery.trim()) url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      if (tagFilter !== 'all') url += `&tag=${encodeURIComponent(tagFilter)}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: ChatConversation[] = await res.json();
        // If a conversation is currently selected, keep its unread count 0 locally
        setConversations(
          data.map((c) =>
            c.id === selectedConvId ? { ...c, unreadAgentCount: 0 } : c
          )
        );
        if (autoSelectFirst && data.length > 0 && !selectedConvId) {
          setSelectedConvId(data[0].id);
        }
      }
    } catch {
      // Ignore
    }
  };

  // Immediate selection handler that clears unread badge instantly
  const handleSelectConversation = (conv: ChatConversation) => {
    if (selectedConvId === conv.id) return;
    setSelectedConvId(conv.id);
    setActiveConv(conv);
    // 1. Instantly zero out badge in UI state
    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unreadAgentCount: 0 } : c))
    );
    // 2. Clear previous messages to avoid displaying old chat while loading
    setActiveMessages([]);
  };

  // Fetch conversation detail
  const fetchConversationDetail = async (id: string, isInitial = false) => {
    if (!token) return;
    if (isInitial) setIsLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/chat/conversations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setActiveConv(data.conversation);
        setCustomerOrders(data.customerOrders || []);

        setActiveMessages((prev) => {
          const incoming: ChatMessage[] = data.messages || [];
          if (
            prev.length === incoming.length &&
            prev[prev.length - 1]?.id === incoming[incoming.length - 1]?.id
          ) {
            return prev;
          }

          // If new messages arrived while polling, scroll only if user was near bottom
          if (!isInitial && messagesContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            if (isNearBottom) {
              setTimeout(() => scrollToMessagesBottom(true), 60);
            }
          }

          return incoming;
        });

        // Clear badge on this conversation in list
        setConversations((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  unreadAgentCount: 0,
                  lastMessageText: data.conversation?.lastMessageText || c.lastMessageText,
                  lastMessageTime: data.conversation?.lastMessageTime || c.lastMessageTime,
                }
              : c
          )
        );

        if (isInitial) {
          setTimeout(() => scrollToMessagesBottom(false), 60);
        }
      }
    } catch {
      // Ignore
    } finally {
      if (isInitial) setIsLoadingDetail(false);
    }
  };

  // Fetch analytics & settings
  const fetchAnalyticsAndSettings = async () => {
    if (!token) return;
    try {
      const [resAnal, resSet, resCan, resProd] = await Promise.all([
        fetch('/api/admin/chat/analytics', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/chat/settings'),
        fetch('/api/admin/chat/canned-responses', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/products'),
      ]);

      if (resAnal.ok) setAnalytics(await resAnal.json());
      if (resSet.ok) setSettings(await resSet.json());
      if (resCan.ok) setCannedResponses(await resCan.json());
      if (resProd.ok) setAllProducts(await resProd.json());
    } catch {}
  };

  useEffect(() => {
    fetchConversations();
    fetchAnalyticsAndSettings();
  }, [token, statusFilter, priorityFilter, tagFilter]);

  // Debounced search for conversations
  useEffect(() => {
    const delay = setTimeout(() => {
      fetchConversations();
    }, 250);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  useEffect(() => {
    if (selectedConvId) {
      setConversations((prev) =>
        prev.map((c) => (c.id === selectedConvId ? { ...c, unreadAgentCount: 0 } : c))
      );
      fetchConversationDetail(selectedConvId, true);
      // Mark read
      fetch(`/api/chat/conversations/${selectedConvId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'agent' }),
      }).catch(() => {});
    }
  }, [selectedConvId, token]);

  // Periodic poll for active conversation thread
  useEffect(() => {
    if (!selectedConvId || !token || activeSubTab !== 'console') return;
    const interval = setInterval(() => {
      fetchConversationDetail(selectedConvId, false);
    }, 3500);
    return () => clearInterval(interval);
  }, [selectedConvId, token, activeSubTab]);

  // Periodic poll for conversations list to discover new customer chats
  useEffect(() => {
    if (!token || activeSubTab !== 'console') return;
    const interval = setInterval(() => {
      fetchConversations(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [token, activeSubTab, statusFilter, priorityFilter, tagFilter]);

  // Send reply from operator
  const handleSendReply = async (customText?: string, attachedProduct?: ChatProductAttachment) => {
    const text = customText !== undefined ? customText : replyText;
    if (!text.trim() && !attachedProduct) return;
    if (!selectedConvId || !token) return;

    setIsSendingReply(true);
    try {
      const res = await fetch(`/api/chat/conversations/${selectedConvId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sender: 'agent',
          senderName: user?.name ? `${user.name} (${user.role === 'SuperAdmin' ? 'مدیر ارشد' : 'پشتیبان'})` : 'پشتیبان ملس‌بان',
          text: text.trim(),
          product: attachedProduct,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setActiveMessages((prev) => [...prev, data.message]);
        setReplyText('');
        setShowCannedDropdown(false);
        setShowProductPicker(false);
        // Refresh conversations list to update lastMessage
        fetchConversations();
        setTimeout(() => scrollToMessagesBottom(true), 50);
      } else {
        showToast('خطا در ارسال پیام اپراتور', 'error');
      }
    } catch {
      showToast('خطای شبکه در ارسال پیام', 'error');
    } finally {
      setIsSendingReply(false);
    }
  };

  // Update conversation status or priority or assignment
  const handleUpdateConversation = async (data: Partial<ChatConversation>) => {
    if (!selectedConvId || !token) return;
    try {
      const res = await fetch(`/api/admin/chat/conversations/${selectedConvId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const updated = await res.json();
        setActiveConv(updated);
        setConversations((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        showToast('اطلاعات گفتگو با موفقیت بروز شد.', 'success');
      }
    } catch {
      showToast('خطا در ذخیره تغییرات گفتگو', 'error');
    }
  };

  // AI Summary Generator
  const handleGenerateSummary = async () => {
    if (!selectedConvId || !token) return;
    setIsGeneratingSummary(true);
    try {
      const res = await fetch(`/api/admin/chat/conversations/${selectedConvId}/summary`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (activeConv) {
          setActiveConv({ ...activeConv, summary: data.summary });
        }
        showToast('خلاصه‌سازی مکالمه با هوش مصنوعی آماده شد.', 'success');
      }
    } catch {
      showToast('خطا در تولید خلاصه‌سازی هوشمند', 'error');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Add tag
  const handleAddTag = () => {
    if (!newTagInput.trim() || !activeConv) return;
    const tag = newTagInput.trim();
    if (activeConv.tags.includes(tag)) return;
    const nextTags = [...activeConv.tags, tag];
    handleUpdateConversation({ tags: nextTags });
    setNewTagInput('');
  };

  // Remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    if (!activeConv) return;
    const nextTags = activeConv.tags.filter((t) => t !== tagToRemove);
    handleUpdateConversation({ tags: nextTags });
  };

  // Create canned response
  const handleCreateCanned = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cannedShortcut || !cannedTitle || !cannedContent) {
      showToast('لطفاً همه فیلدهای پاسخ آماده را تکمیل نمایید.', 'info');
      return;
    }

    try {
      const res = await fetch('/api/admin/chat/canned-responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shortcut: cannedShortcut,
          title: cannedTitle,
          content: cannedContent,
          category: cannedCategory,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setCannedResponses((prev) => [...prev, created]);
        showToast('پاسخ آماده جدید افزوده شد.', 'success');
        setShowAddCannedModal(false);
        setCannedShortcut('');
        setCannedTitle('');
        setCannedContent('');
      }
    } catch {
      showToast('خطا در افزودن پاسخ آماده', 'error');
    }
  };

  // Delete canned response
  const handleDeleteCanned = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/chat/canned-responses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setCannedResponses((prev) => prev.filter((c) => c.id !== id));
        showToast('پاسخ آماده حذف شد.', 'info');
      }
    } catch {
      showToast('خطا در حذف پاسخ آماده', 'error');
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings || !token) return;
    try {
      const res = await fetch('/api/admin/chat/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        showToast('تنظیمات چت و پشتیبانی با موفقیت ذخیره شد.', 'success');
      }
    } catch {
      showToast('خطا در ذخیره تنظیمات', 'error');
    }
  };

  // Distinct tags in conversations for filtering
  const allAvailableTags = Array.from(
    new Set(conversations.flatMap((c) => c.tags || []))
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-stone-900">
              مرکز گفتگوی زنده، پشتیبانی و دستیار هوشمند
            </h2>
            <span className="bg-rose-100 text-rose-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
              نسخه ۴.۲ ملس‌بان
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            پاسخگویی سریع، ارسال کارت محصول و پیگیری سفارشات همراه با دستیار خودکار
          </p>
        </div>

        {/* Sub tabs */}
        <div className="flex items-center gap-1.5 bg-stone-100 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveSubTab('console')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'console'
                ? 'bg-white text-stone-900 shadow-xs font-black'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-rose-800" />
            <span>میز گفتگوهای زنده</span>
            {conversations.filter((c) => c.status === 'active').length > 0 && (
              <span className="bg-rose-800 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {toPersianDigits(conversations.filter((c) => c.status === 'active').length)}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('analytics')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'analytics'
                ? 'bg-white text-stone-900 shadow-xs font-black'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-amber-600" />
            <span>گزارش و تحلیل</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('settings')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'settings'
                ? 'bg-white text-stone-900 shadow-xs font-black'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Settings className="w-4 h-4 text-stone-600" />
            <span>تنظیمات و پاسخ‌های آماده</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: LIVE CONSOLE */}
      {activeSubTab === 'console' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[800px] max-h-[85vh]">
          {/* Column 1: Conversations List & Filters (4 Cols) */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-stone-200 shadow-2xs flex flex-col overflow-hidden">
            {/* Filter toolbar */}
            <div className="p-3.5 border-b border-stone-200 space-y-2.5 bg-stone-50/60">
              <div className="relative">
                <Search className="w-4 h-4 absolute right-3 top-2.5 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchConversations()}
                  placeholder="جستجو بر اساس نام، موبایل، متن..."
                  className="w-full bg-white border border-stone-200 rounded-xl pr-9 pl-3 py-2 text-xs outline-hidden focus:border-rose-800"
                />
              </div>

              {/* Status pills */}
              <div className="flex gap-1 overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: 'همه' },
                  { id: 'active', label: 'فعال' },
                  { id: 'waiting', label: 'در انتظار' },
                  { id: 'closed', label: 'بسته شده' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStatusFilter(st.id as any)}
                    className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      statusFilter === st.id
                        ? 'bg-rose-800 text-white shadow-2xs'
                        : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Priority & Tag selects */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as any)}
                  className="bg-white border border-stone-200 rounded-lg p-1.5 font-bold text-stone-700 outline-hidden"
                >
                  <option value="all">تمام اولویت‌ها</option>
                  <option value="urgent">🔴 فقط فوری</option>
                  <option value="normal">🟡 عادی</option>
                  <option value="low">🟢 کم‌اهمیت</option>
                </select>

                <select
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  className="bg-white border border-stone-200 rounded-lg p-1.5 font-bold text-stone-700 outline-hidden truncate"
                >
                  <option value="all">تمام تگ‌ها</option>
                  {allAvailableTags.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Conversation Items List */}
            <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-stone-400 text-xs space-y-2">
                  <MessageSquare className="w-8 h-8 mx-auto text-stone-300" />
                  <p>هیچ گفتگویی با این فیلترها یافت نشد.</p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const isSelected = conv.id === selectedConvId;
                  const isUrgent = conv.priority === 'urgent';

                  return (
                    <div
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`p-3.5 transition-all cursor-pointer flex flex-col gap-1.5 ${
                        isSelected
                          ? 'bg-rose-50/80 border-r-4 border-rose-800'
                          : 'hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              conv.status === 'active'
                                ? 'bg-emerald-500'
                                : conv.status === 'waiting'
                                ? 'bg-amber-400'
                                : 'bg-stone-300'
                            }`}
                          />
                          <h4 className="font-black text-xs text-stone-900 truncate">
                            {conv.customerName}
                          </h4>
                          {isUrgent && (
                            <span className="bg-red-100 text-red-700 text-[9px] px-1.5 py-0.2 rounded font-black shrink-0">
                              فوری
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-stone-400 whitespace-nowrap">
                          {conv.lastMessageTime
                            ? new Date(conv.lastMessageTime).toLocaleTimeString('fa-IR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </span>
                      </div>

                      {/* Last message preview */}
                      <p className="text-[11px] text-stone-500 truncate leading-snug">
                        {conv.lastSender === 'agent' && (
                          <span className="font-bold text-stone-700 ml-1">پاسخ شما:</span>
                        )}
                        {conv.lastMessageText || 'بدون پیام'}
                      </p>

                      {/* Tags & Badges */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1 overflow-hidden">
                          {conv.tags?.slice(0, 2).map((t, idx) => (
                            <span
                              key={idx}
                              className="bg-stone-100 text-stone-600 text-[9px] px-1.5 py-0.5 rounded font-medium truncate max-w-24"
                            >
                              {t}
                            </span>
                          ))}
                        </div>

                        {conv.unreadAgentCount > 0 && (
                          <span className="bg-rose-800 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                            {toPersianDigits(conv.unreadAgentCount)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 2: Thread View & Response Console (5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-stone-200 shadow-2xs flex flex-col overflow-hidden relative">
            {isLoadingDetail && (
              <div className="absolute top-0 inset-x-0 h-1 bg-rose-100 overflow-hidden z-20">
                <div className="h-full bg-rose-700 animate-pulse w-full"></div>
              </div>
            )}
            {activeConv ? (
              <>
                {/* Active Thread Header */}
                <div className="p-3.5 border-b border-stone-200 bg-stone-50/70 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center font-black text-sm shrink-0">
                      {activeConv.customerName?.[0] || 'م'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-xs text-stone-900 truncate">
                          {activeConv.customerName}
                        </h3>
                        {activeConv.customerMobile && (
                          <span className="font-mono text-[10px] text-stone-500 dir-ltr">
                            {activeConv.customerMobile}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-stone-400 mt-0.5">
                        <span>مسئول: {activeConv.assignedAgentName || 'تخصیص‌نیافته'}</span>
                        <span>•</span>
                        <span className="font-bold text-stone-600">
                          {activeConv.status === 'active'
                            ? '🟢 گفتگو فعال'
                            : activeConv.status === 'waiting'
                            ? '🟡 در انتظار'
                            : '⚪ بسته شده'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Status and Priority Switcher */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateConversation({
                          status: activeConv.status === 'closed' ? 'active' : 'closed',
                        })
                      }
                      className={`text-xs font-bold px-2.5 py-1 rounded-xl transition-all ${
                        activeConv.status === 'closed'
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                      }`}
                      title={activeConv.status === 'closed' ? 'بازگشایی گفتگو' : 'بستن گفتگو'}
                    >
                      {activeConv.status === 'closed' ? 'باز کردن مجدد' : 'بستن پرونده'}
                    </button>
                  </div>
                </div>

                {/* Message Stream */}
                <div
                  ref={messagesContainerRef}
                  className="flex-1 p-4 overflow-y-auto space-y-3 bg-stone-50/40 text-xs"
                >
                  {activeMessages.length === 0 && !isLoadingDetail && (
                    <div className="h-full min-h-60 flex flex-col items-center justify-center text-center p-8 text-stone-400 space-y-2 select-none">
                      <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400 mb-1">
                        <MessageSquare className="w-6 h-6 text-stone-400" />
                      </div>
                      <p className="text-xs font-bold text-stone-600">هنوز پیامی در این گفتگو ثبت نشده است</p>
                      <p className="text-[11px] text-stone-400">می‌توانید با کادر پاسخ زیر، اولین پیام را برای مشتری ارسال فرمایید.</p>
                    </div>
                  )}

                  {activeMessages.map((msg) => {
                    const isAgent = msg.sender === 'agent';
                    const isBot = msg.sender === 'bot';
                    const isSystem = msg.sender === 'system';

                    if (isSystem) {
                      return (
                        <div key={msg.id} className="text-center my-2">
                          <span className="bg-stone-200 text-stone-600 text-[10px] px-2.5 py-1 rounded-full">
                            {msg.text}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'} space-y-1`}
                      >
                        <div className="flex items-center gap-1 text-[10px] text-stone-400 font-medium px-1">
                          {isBot && (
                            <span className="bg-sky-100 text-sky-800 px-1 py-0.2 rounded font-bold text-[9px]">
                              دستیار خودکار
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

                        <div
                          className={`max-w-[85%] rounded-2xl p-3 leading-relaxed shadow-2xs ${
                            isAgent
                              ? 'bg-rose-800 text-white rounded-tl-xs'
                              : 'bg-white text-stone-800 border border-stone-200/90 rounded-tr-xs'
                          }`}
                        >
                          {msg.text && <p className="whitespace-pre-line">{msg.text}</p>}

                          {msg.attachmentUrl && msg.attachmentType === 'image' && (
                            <img
                              src={msg.attachmentUrl}
                              alt="پیوست"
                              className="mt-2 rounded-lg max-h-40 object-cover"
                            />
                          )}

                          {msg.attachmentUrl && msg.attachmentType === 'file' && (
                            <a
                              href={msg.attachmentUrl}
                              download
                              className="mt-2 flex items-center gap-2 p-2 bg-stone-100 rounded-lg text-[11px] font-bold text-stone-800"
                            >
                              <Paperclip className="w-3.5 h-3.5" />
                              <span>{msg.attachmentName || 'دانلود فایل'}</span>
                            </a>
                          )}

                          {/* Product Attachment inside message */}
                          {msg.product && (
                            <div className="mt-2 bg-white text-stone-900 rounded-xl p-2.5 border border-stone-200 flex items-center gap-2">
                              {msg.product.image && (
                                <img
                                  src={msg.product.image}
                                  alt={msg.product.name}
                                  className="w-12 h-12 rounded-lg object-cover"
                                />
                              )}
                              <div className="min-w-0 flex-1">
                                <h5 className="font-bold text-[11px] truncate">
                                  {msg.product.name}
                                </h5>
                                <span className="font-black text-rose-800 text-xs">
                                  {formatPrice(msg.product.discountPrice || msg.product.price)}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Order Attachment */}
                          {msg.order && (
                            <div className="mt-2 bg-amber-50 text-stone-900 rounded-xl p-2.5 border border-amber-200 text-[11px] space-y-1">
                              <div className="flex justify-between font-bold">
                                <span>سفارش: {msg.order.orderNumber}</span>
                                <span className="text-amber-800">{msg.order.status}</span>
                              </div>
                              <div className="flex justify-between text-stone-600 text-[10px]">
                                <span>مبلغ: {formatPrice(msg.order.totalAmount)}</span>
                                <span>تعداد اقلام: {toPersianDigits(msg.order.itemsCount)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Operator Actions & Canned Responses bar */}
                <div className="p-2 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs shrink-0">
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {/* Canned response button */}
                    <button
                      type="button"
                      onClick={() => setShowCannedDropdown(!showCannedDropdown)}
                      className="flex items-center gap-1 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition-colors"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>پاسخ‌های آماده ({toPersianDigits(cannedResponses.length)})</span>
                    </button>

                    {/* Recommend Product button */}
                    <button
                      type="button"
                      onClick={() => setShowProductPicker(!showProductPicker)}
                      className="flex items-center gap-1 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition-colors"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-rose-800" />
                      <span>ارسال کارت محصول</span>
                    </button>

                    {/* AI Summary button */}
                    <button
                      type="button"
                      onClick={handleGenerateSummary}
                      disabled={isGeneratingSummary}
                      className="flex items-center gap-1 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition-colors"
                      title="خلاصه‌سازی کل مکالمه با هوش مصنوعی"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>{isGeneratingSummary ? 'در حال تحلیل...' : 'خلاصه مکالمه با هوش مصنوعی'}</span>
                    </button>
                  </div>
                </div>

                {/* Dropdown: Canned responses */}
                {showCannedDropdown && (
                  <div className="p-2 bg-stone-100 border-t border-stone-200 max-h-40 overflow-y-auto space-y-1 text-xs shrink-0 animate-in fade-in">
                    {cannedResponses.map((cr) => (
                      <div
                        key={cr.id}
                        onClick={() => {
                          setReplyText(cr.content);
                          setShowCannedDropdown(false);
                        }}
                        className="bg-white hover:bg-rose-50 p-2 rounded-xl cursor-pointer border border-stone-200 flex items-center justify-between"
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-stone-900 block truncate">
                            {cr.title}
                          </span>
                          <span className="text-[10px] text-stone-500 truncate block">
                            {cr.content}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                          {cr.shortcut}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Dropdown: Product picker to send product card */}
                {showProductPicker && (
                  <div className="p-2 bg-stone-100 border-t border-stone-200 max-h-48 overflow-y-auto space-y-1 text-xs shrink-0 animate-in fade-in">
                    <p className="text-[11px] font-bold text-stone-700 px-1">
                      محصول مورد نظر را برای ارسال مستقیم در چت انتخاب کنید:
                    </p>
                    {allProducts.slice(0, 10).map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => {
                          const attachment: ChatProductAttachment = {
                            id: prod.id,
                            name: prod.name,
                            price: prod.price,
                            discountPrice: prod.discountPrice,
                            image: prod.mainImage,
                            inStock: prod.stockQuantity > 0,
                            slug: prod.slug,
                          };
                          handleSendReply(
                            `پیشنهاد ما برای شما: محصول «${prod.name}» با بهترین کیفیت.`,
                            attachment
                          );
                        }}
                        className="bg-white hover:bg-rose-50 p-2 rounded-xl cursor-pointer border border-stone-200 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 truncate">
                          {prod.mainImage && (
                            <img
                              src={prod.mainImage}
                              alt={prod.name}
                              className="w-8 h-8 rounded-lg object-cover"
                            />
                          )}
                          <span className="font-bold text-stone-900 text-xs truncate">
                            {prod.name}
                          </span>
                        </div>
                        <span className="font-bold text-rose-800 text-xs shrink-0">
                          {formatPrice(prod.discountPrice || prod.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Operator Textarea Input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendReply();
                  }}
                  className="p-3 border-t border-stone-200 bg-white flex items-center gap-2 shrink-0"
                >
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="پاسخ خود به مشتری را بنویسید (یا از پاسخ‌های آماده انتخاب کنید)..."
                    className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs outline-hidden focus:border-rose-800"
                  />
                  <button
                    type="submit"
                    disabled={isSendingReply || !replyText.trim()}
                    className="bg-rose-800 hover:bg-rose-900 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all disabled:bg-stone-300 shadow-md"
                  >
                    <span>ارسال</span>
                    <Send className="w-3.5 h-3.5 rotate-180" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-400">
                <MessageSquare className="w-12 h-12 text-stone-300 mb-2" />
                <h4 className="font-bold text-stone-700 text-sm">گفتگویی انتخاب نشده است</h4>
                <p className="text-xs text-stone-500 mt-1">
                  از ستون سمت راست یک مکالمه را جهت پاسخگویی انتخاب فرمایید.
                </p>
              </div>
            )}
          </div>

          {/* Column 3: Customer Profile & Order History & Summary (3 Cols) */}
          <div className="lg:col-span-3 bg-white rounded-3xl border border-stone-200 shadow-2xs flex flex-col overflow-y-auto p-4 space-y-4">
            {activeConv ? (
              <>
                {/* Customer card */}
                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-rose-800" />
                    <h4 className="font-black text-xs text-stone-900">مشخصات مشتری</h4>
                  </div>
                  <div className="space-y-1 text-xs text-stone-600">
                    <p>
                      <strong>نام:</strong> {activeConv.customerName}
                    </p>
                    {activeConv.customerMobile && (
                      <p>
                        <strong>تلفن:</strong>{' '}
                        <span className="font-mono dir-ltr">{activeConv.customerMobile}</span>
                      </p>
                    )}
                    {activeConv.customerEmail && (
                      <p className="truncate">
                        <strong>ایمیل:</strong> {activeConv.customerEmail}
                      </p>
                    )}
                    <p className="text-[10px] text-stone-400">
                      ثبت اولیه: {new Date(activeConv.createdAt).toLocaleDateString('fa-IR')}
                    </p>
                  </div>
                </div>

                {/* Priority Selector */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-stone-700">
                    سطح اولویت گفتگو:
                  </label>
                  <select
                    value={activeConv.priority}
                    onChange={(e) =>
                      handleUpdateConversation({ priority: e.target.value as any })
                    }
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2 text-xs font-bold"
                  >
                    <option value="urgent">🔴 فوری و بحرانی</option>
                    <option value="normal">🟡 عادی و عمومی</option>
                    <option value="low">🟢 کم‌اهمیت / آرشیو</option>
                  </select>
                </div>

                {/* Assigned Agent */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-stone-700">
                    ارجاع به کارشناس:
                  </label>
                  <select
                    value={activeConv.assignedAgentId || ''}
                    onChange={(e) =>
                      handleUpdateConversation({
                        assignedAgentId: e.target.value,
                        assignedAgentName:
                          e.target.value === 'usr-admin-01'
                            ? 'خانم رضایی'
                            : e.target.value === 'usr-staff-01'
                            ? 'علیرضا صادقی'
                            : 'پشتیبان ملس‌بان',
                      })
                    }
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2 text-xs font-bold"
                  >
                    <option value="">(انتخاب نشده)</option>
                    <option value="usr-admin-01">خانم رضایی (مدیر ارشد فروش)</option>
                    <option value="usr-staff-01">علیرضا صادقی (کارشناس ارسال و انبار)</option>
                  </select>
                </div>

                {/* Tags Management */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-xs font-bold text-stone-700">
                    <Tag className="w-3.5 h-3.5 text-stone-500" />
                    <span>برچسب‌های گفتگو</span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {activeConv.tags?.map((tg, i) => (
                      <span
                        key={i}
                        className="bg-stone-100 text-stone-700 text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 border border-stone-200"
                      >
                        <span>{tg}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tg)}
                          className="text-stone-400 hover:text-red-600"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                      placeholder="برچسب جدید..."
                      className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="bg-stone-800 text-white font-bold px-2.5 py-1 rounded-lg text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* AI Summary Card */}
                {activeConv.summary && (
                  <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-1">
                    <div className="flex items-center gap-1 text-purple-900 font-bold text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                      <span>خلاصه هوشمند مکالمه:</span>
                    </div>
                    <p className="text-[11px] text-purple-950 leading-relaxed">
                      {activeConv.summary}
                    </p>
                  </div>
                )}

                {/* Customer Past Orders History */}
                <div className="space-y-2 pt-2 border-t border-stone-200">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-stone-800 flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-stone-600" />
                      <span>سوابق خرید این مشتری ({toPersianDigits(customerOrders.length)})</span>
                    </h4>
                  </div>

                  {customerOrders.length === 0 ? (
                    <p className="text-[10px] text-stone-400">سفارش ثبت‌شده‌ای یافت نشد.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {customerOrders.map((ord) => (
                        <div
                          key={ord.id}
                          className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-[10px] space-y-1"
                        >
                          <div className="flex justify-between font-bold text-stone-900">
                            <span>{ord.orderNumber}</span>
                            <span className="text-amber-800">{ord.status}</span>
                          </div>
                          <div className="flex justify-between text-stone-500">
                            <span>مبلغ: {formatPrice(ord.totalAmount)}</span>
                            <span>{toPersianDigits(ord.items.length)} قلم کالا</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Rating if available */}
                {activeConv.rating && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-1">
                    <div className="flex items-center gap-1 text-amber-900 font-bold">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                      <span>امتیاز مشتری: {toPersianDigits(activeConv.rating)} از ۵</span>
                    </div>
                    {activeConv.feedback && (
                      <p className="text-[11px] text-stone-700 italic">
                        «{activeConv.feedback}»
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="p-6 text-center text-xs text-stone-400">
                اطلاعات مشتری پس از انتخاب گفتگو نمایش داده می‌شود.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: ANALYTICS & REPORTS */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-stone-500">کل گفتگوها</span>
              <div className="text-xl font-black text-stone-900">
                {toPersianDigits(analytics?.totalConversations || conversations.length)}
              </div>
              <span className="text-[10px] text-emerald-600 font-bold">+۱۸٪ رشد این ماه</span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-stone-500">گفتگوهای فعال</span>
              <div className="text-xl font-black text-rose-800">
                {toPersianDigits(analytics?.activeConversations || 3)}
              </div>
              <span className="text-[10px] text-stone-400 font-medium">پاسخگویی آنی</span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-stone-500">در انتظار پاسخ</span>
              <div className="text-xl font-black text-amber-600">
                {toPersianDigits(analytics?.waitingConversations || 1)}
              </div>
              <span className="text-[10px] text-amber-700 font-medium">نیاز به رسیدگی</span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-stone-500">میانگین زمان پاسخ</span>
              <div className="text-xl font-black text-stone-900">
                {toPersianDigits(analytics?.avgResponseTimeSeconds || 45)} ثانیه
              </div>
              <span className="text-[10px] text-emerald-600 font-bold">بسیار عالی (زیر ۱ دقیقه)</span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-stone-500">زمان حل مشکل</span>
              <div className="text-xl font-black text-stone-900">
                {toPersianDigits(analytics?.avgResolutionTimeMinutes || 12)} دقیقه
              </div>
              <span className="text-[10px] text-stone-500">از شروع تا حل کامل</span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-stone-500">رضایت مشتریان</span>
              <div className="text-xl font-black text-amber-600 flex items-center gap-1">
                <Star className="w-5 h-5 fill-amber-500" />
                <span>{toPersianDigits(analytics?.satisfactionRate || 4.9)}</span>
                <span className="text-xs text-stone-400">/۵</span>
              </div>
              <span className="text-[10px] text-stone-500">بر اساس نظرات ثبت‌شده</span>
            </div>
          </div>

          {/* Topics Breakdown & Operator Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Top Topics Card */}
            <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm text-stone-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-rose-800" />
                  <span>پرتکرارترین سؤالات و موضوعات مشتریان</span>
                </h3>
                <span className="text-xs text-stone-400">تحلیل هوشمند</span>
              </div>

              <div className="space-y-3">
                {(
                  analytics?.topTopics || [
                    { topic: 'پیگیری مرسوله و کد رهگیری پستی', count: 28, percentage: 42 },
                    { topic: 'مشاوره درجه ترشی و طعم‌های ساوه', count: 21, percentage: 31 },
                    { topic: 'سفارش عمده، کارتن و تخفیف همکاری', count: 12, percentage: 18 },
                    { topic: 'امور پرداخت و شماره شبا/کارت', count: 6, percentage: 9 },
                  ]
                ).map((top, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-stone-700">
                      <span>{top.topic}</span>
                      <span>
                        {toPersianDigits(top.count)} گفتگو ({toPersianDigits(top.percentage)}٪)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                      <div
                        className="h-full bg-rose-800 rounded-full transition-all duration-500"
                        style={{ width: `${top.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Operator Performance */}
            <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-2xs space-y-4">
              <h3 className="font-black text-sm text-stone-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-600" />
                <span>عملکرد و آمار اپراتورهای پشتیبانی</span>
              </h3>

              <div className="divide-y divide-stone-100">
                <div className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center font-black text-xs">
                      خانم ر
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-stone-900">خانم رضایی</h4>
                      <p className="text-[11px] text-stone-500">کارشناس ارشد مشاوره فروش</p>
                    </div>
                  </div>
                  <div className="text-left text-xs">
                    <span className="font-black text-stone-900 block">۴۸ گفتگو</span>
                    <span className="text-emerald-700 font-bold text-[11px]">رضایت: ۹۸٪</span>
                  </div>
                </div>

                <div className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-xs">
                      علیرضا
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-stone-900">علیرضا صادقی</h4>
                      <p className="text-[11px] text-stone-500">پشتیبانی ارسال و انبارداری</p>
                    </div>
                  </div>
                  <div className="text-left text-xs">
                    <span className="font-black text-stone-900 block">۲۲ گفتگو</span>
                    <span className="text-emerald-700 font-bold text-[11px]">رضایت: ۹۴٪</span>
                  </div>
                </div>

                <div className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center font-black text-xs">
                      <Bot className="w-5 h-5 text-sky-700" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-stone-900">دستیار هوشمند خودکار</h4>
                      <p className="text-[11px] text-stone-500">پاسخ‌های فوری ۲۴ ساعته</p>
                    </div>
                  </div>
                  <div className="text-left text-xs">
                    <span className="font-black text-stone-900 block">۹۵ پاسخ خودکار</span>
                    <span className="text-sky-700 font-bold text-[11px]">حل بدون اپراتور: ۶۵٪</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: SETTINGS & CANNED RESPONSES */}
      {activeSubTab === 'settings' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Working Hours & General Chat Config Form */}
          {settings && (
            <form
              onSubmit={handleSaveSettings}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-2xs space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <h3 className="font-black text-sm text-stone-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-rose-800" />
                  <span>پیکربندی ساعت کاری و پیام‌های خودکار پشتیبانی</span>
                </h3>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-600">وضعیت فعلی سیستم:</span>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, isOnline: !settings.isOnline })}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      settings.isOnline
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {settings.isOnline ? '🟢 آنلاین (آماده پاسخگویی)' : '🟠 آفلاین (خارج از شیفت)'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    ساعت شروع کار پشتیبانی
                  </label>
                  <input
                    type="text"
                    value={settings.workingHoursStart}
                    onChange={(e) =>
                      setSettings({ ...settings, workingHoursStart: e.target.value })
                    }
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono"
                    placeholder="08:30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    ساعت پایان کار پشتیبانی
                  </label>
                  <input
                    type="text"
                    value={settings.workingHoursEnd}
                    onChange={(e) =>
                      setSettings({ ...settings, workingHoursEnd: e.target.value })
                    }
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono"
                    placeholder="22:30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    نام پیش‌فرض اپراتور
                  </label>
                  <input
                    type="text"
                    value={settings.operatorName}
                    onChange={(e) =>
                      setSettings({ ...settings, operatorName: e.target.value })
                    }
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs"
                    placeholder="خانم رضایی"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    عنوان و سمت اپراتور
                  </label>
                  <input
                    type="text"
                    value={settings.operatorTitle}
                    onChange={(e) =>
                      setSettings({ ...settings, operatorTitle: e.target.value })
                    }
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs"
                    placeholder="مشاور فروش و پشتیبانی"
                  />
                </div>
              </div>

              {/* Automated Texts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    پیام خوشامدگویی خودکار
                  </label>
                  <textarea
                    rows={2}
                    value={settings.autoWelcomeMessage}
                    onChange={(e) =>
                      setSettings({ ...settings, autoWelcomeMessage: e.target.value })
                    }
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    پیام خارج از ساعات کاری (آفلاین)
                  </label>
                  <textarea
                    rows={2}
                    value={settings.offlineMessage}
                    onChange={(e) =>
                      setSettings({ ...settings, offlineMessage: e.target.value })
                    }
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  پیام خودکار هنگام خروج از صفحه (Exit Intent)
                </label>
                <input
                  type="text"
                  value={settings.exitIntentMessage}
                  onChange={(e) =>
                    setSettings({ ...settings, exitIntentMessage: e.target.value })
                  }
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-6 pt-2 border-t border-stone-100">
                <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableAiAssistant}
                    onChange={(e) =>
                      setSettings({ ...settings, enableAiAssistant: e.target.checked })
                    }
                    className="rounded text-rose-800"
                  />
                  <span>فعال‌سازی دستیار هوشمند پاسخگوی خودکار ۲۴ ساعته</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableSoundNotifications}
                    onChange={(e) =>
                      setSettings({ ...settings, enableSoundNotifications: e.target.checked })
                    }
                    className="rounded text-rose-800"
                  />
                  <span>پخش صدای اعلان هنگام دریافت پیام جدید</span>
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-rose-800 hover:bg-rose-900 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors shadow-md"
                >
                  ذخیره تنظیمات
                </button>
              </div>
            </form>
          )}

          {/* Canned Responses Table & Management */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm text-stone-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600" />
                  <span>بانک پاسخ‌های آماده و میانبرها (Canned Responses)</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  ارسال سریع پاسخ به سوالات پرتکرار با یک کلیک یا تایپ میانبر در کنسول
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddCannedModal(true)}
                className="bg-stone-900 hover:bg-black text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن پاسخ آماده</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-y border-stone-200 text-stone-600 font-bold">
                    <th className="p-3">میانبر</th>
                    <th className="p-3">عنوان پاسخ</th>
                    <th className="p-3">متن پاسخ آماده</th>
                    <th className="p-3">دسته‌بندی</th>
                    <th className="p-3 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {cannedResponses.map((cr) => (
                    <tr key={cr.id} className="hover:bg-stone-50">
                      <td className="p-3 font-mono font-bold text-rose-900 dir-ltr text-right">
                        {cr.shortcut}
                      </td>
                      <td className="p-3 font-bold text-stone-900">{cr.title}</td>
                      <td className="p-3 text-stone-600 max-w-xs truncate">{cr.content}</td>
                      <td className="p-3">
                        <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                          {cr.category}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteCanned(cr.id)}
                          className="p-1.5 text-stone-400 hover:text-red-700 transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Canned Response Modal */}
          {showAddCannedModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4 animate-in fade-in">
              <form
                onSubmit={handleCreateCanned}
                className="bg-white rounded-3xl p-5 w-full max-w-md border border-stone-200 shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <h4 className="font-black text-sm text-stone-900">افزودن پاسخ آماده جدید</h4>
                  <button
                    type="button"
                    onClick={() => setShowAddCannedModal(false)}
                    className="text-stone-400 hover:text-stone-700"
                  >
                    &times;
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      میانبر کیبورد (با / شروع شود) *
                    </label>
                    <input
                      type="text"
                      required
                      value={cannedShortcut}
                      onChange={(e) => setCannedShortcut(e.target.value)}
                      placeholder="/ship یا /order"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono dir-ltr text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      عنوان پاسخ آماده *
                    </label>
                    <input
                      type="text"
                      required
                      value={cannedTitle}
                      onChange={(e) => setCannedTitle(e.target.value)}
                      placeholder="مثال: نحوه رهگیری مرسوله"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      دسته‌بندی
                    </label>
                    <input
                      type="text"
                      value={cannedCategory}
                      onChange={(e) => setCannedCategory(e.target.value)}
                      placeholder="ارسال، محصولات، مالی، عمومی"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      متن کامل پاسخ آماده *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={cannedContent}
                      onChange={(e) => setCannedContent(e.target.value)}
                      placeholder="متن پیام که برای مشتری ارسال می‌شود..."
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-stone-100">
                  <button
                    type="submit"
                    className="flex-1 bg-rose-800 hover:bg-rose-900 text-white font-bold py-2 rounded-xl text-xs transition-colors"
                  >
                    ثبت پاسخ آماده
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddCannedModal(false)}
                    className="bg-stone-100 text-stone-600 font-bold px-4 py-2 rounded-xl text-xs"
                  >
                    انصراف
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
