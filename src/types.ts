export type UserRole = 'SuperAdmin' | 'Admin' | 'Customer';

export type AdminPermission =
  | 'overview'
  | 'products'
  | 'orders'
  | 'wholesale'
  | 'reviews'
  | 'categories'
  | 'coupons'
  | 'customers'
  | 'staff'
  | 'blog'
  | 'settings'
  | 'chat';

export interface User {
  id: string;
  name: string;
  family: string;
  email: string;
  mobile: string;
  role: UserRole;
  isSuperAdmin?: boolean;
  permissions?: AdminPermission[];
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  addresses: Address[];
}

export interface Address {
  id: string;
  title: string;
  receiverName: string;
  receiverMobile: string;
  province: string;
  city: string;
  fullAddress: string;
  postalCode: string;
  plaque?: string;
  unit?: string;
  isDefault: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
}

export type SournessLevel = 'Sweet' | 'SweetSour' | 'Sour' | 'ExtraSour';

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  categoryName?: string;
  shortDescription: string;
  description: string;
  price: number;
  discountPrice?: number;
  stockQuantity: number;
  weightGrams: number;
  piecesPerPack?: number;
  images: string[];
  mainImage: string;
  sournessLevel: SournessLevel;
  ingredients: string[];
  nutritionalFacts?: {
    caloriesPer100g: number;
    sugarGrams: number;
    fiberGrams: number;
    vitaminCPercent: number;
    fatGrams: number;
    saltGrams: number;
  };
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNew: boolean;
  isWholesaleAvailable: boolean;
  minWholesaleQty?: number;
  wholesaleUnitPrice?: number;
  isActive: boolean;
  createdAt: string;
}

export type OrderStatus =
  | 'Pending'
  | 'Paid'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'
  | 'Returned';

export type PaymentStatus =
  | 'Pending'
  | 'Successful'
  | 'Failed'
  | 'Refunded'
  | 'PartiallyRefunded';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  sku?: string;
  productImage: string;
  weightGrams: number;
  unitPrice: number;
  discountAmount?: number;
  quantity: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  customerName: string;
  customerMobile: string;
  customerEmail?: string;
  shippingAddress: Address;
  shippingMethod: string;
  shippingFee: number;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  couponId?: string;
  couponCode?: string;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  paymentRefId?: string;
  trackingNumber?: string;
  customerNotes?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type CouponType = 'Percent' | 'FixedAmount';

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  usageLimit: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  firstOrderOnly?: boolean;
}

export type WholesaleStatus =
  | 'New'
  | 'Reviewing'
  | 'Contacted'
  | 'Approved'
  | 'Rejected';

export interface WholesaleRequest {
  id: string;
  trackingCode: string;
  applicantName: string;
  companyName: string;
  mobile: string;
  email?: string;
  province: string;
  city: string;
  businessType: string;
  requestedProducts: string;
  estimatedQuantityKg: number;
  description?: string;
  status: WholesaleStatus;
  adminNotes?: string;
  offeredPricePerKg?: number;
  quotationSent?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Review {
  id: string;
  productId: string;
  productName?: string;
  userId?: string;
  userName: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  isOfficialStaff?: boolean;
  adminReply?: string;
  createdAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  featuredImage: string;
  category: string;
  tags: string[];
  author: string;
  readTimeMinutes: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface WholesaleTier {
  id: string;
  tierName: string;
  minQuantityKg: number;
  maxQuantityKg?: number | null;
  discountPercent: number;
  packaging: string;
  shippingCondition: string;
  description?: string;
}

export interface FAQItem {
  id: string;
  q: string;
  a: string;
  category?: string;
  order?: number;
}

export interface SiteSetting {
  brandName: string;
  tagline: string;
  supportPhone: string;
  supportPhone2?: string;
  supportMobile: string;
  salesMobile?: string;
  wholesalePhone?: string;
  supportEmail: string;
  address: string;
  factoryAddress?: string;
  workingHours: string;
  instagram: string;
  telegram: string;
  whatsapp: string;
  announcementBarText?: string;
  announcementBarLink?: string;
  isAnnouncementActive?: boolean;
  heroTitle?: string;
  heroSubtitle?: string;
  heroBadge?: string;
  heroImageUrl?: string;
  promoBannerTitle?: string;
  promoBannerText?: string;
  promoBannerDiscount?: string;
  promoBannerImageUrl?: string;
  freeShippingThreshold: number;
  standardShippingFee: number;
  wholesaleMinOrderKg: number;
  wholesaleTiers?: WholesaleTier[];
  faqs?: FAQItem[];
}

export type ChatSenderType = 'customer' | 'agent' | 'bot' | 'system';
export type ConversationStatus = 'active' | 'waiting' | 'closed';
export type ChatPriority = 'low' | 'normal' | 'urgent';

export interface ChatProductAttachment {
  id: string;
  name: string;
  price: number;
  discountPrice?: number;
  image?: string;
  inStock: boolean;
  slug: string;
  weightGrams?: number;
}

export interface ChatOrderAttachment {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  createdAt: string;
  itemsCount: number;
  customerName: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: ChatSenderType;
  senderName: string;
  senderAvatar?: string;
  text: string;
  createdAt: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  attachmentUrl?: string;
  attachmentType?: 'image' | 'file';
  attachmentName?: string;
  product?: ChatProductAttachment;
  order?: ChatOrderAttachment;
  quickReplies?: string[];
}

export interface ChatConversation {
  id: string;
  customerId?: string;
  guestId?: string;
  customerName: string;
  customerMobile?: string;
  customerEmail?: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  status: ConversationStatus;
  priority: ChatPriority;
  tags: string[];
  unreadCustomerCount: number;
  unreadAgentCount: number;
  lastMessageText: string;
  lastMessageTime: string;
  lastSender: ChatSenderType;
  rating?: number;
  feedback?: string;
  summary?: string;
  contextProduct?: ChatProductAttachment;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatSettings {
  isOnline: boolean;
  workingHoursStart: string;
  workingHoursEnd: string;
  autoWelcomeMessage: string;
  offlineMessage: string;
  exitIntentMessage: string;
  enableSoundNotifications: boolean;
  enableAiAssistant: boolean;
  operatorName: string;
  operatorTitle: string;
}

export interface CannedResponse {
  id: string;
  shortcut: string;
  title: string;
  content: string;
  category: string;
}

export interface ChatHourlyDistribution {
  timeSlot: string;
  shortSlot: string;
  chatsCount: number;
  avgResponseSec: number;
  label?: string;
}

export interface ChatAnalytics {
  totalConversations: number;
  activeConversations: number;
  waitingConversations: number;
  unansweredConversations: number;
  closedConversations: number;
  avgResponseTimeSeconds: number;
  avgResolutionTimeMinutes: number;
  satisfactionRate: number;
  totalRatingsCount: number;
  topTopics: { topic: string; count: number; percentage: number }[];
  hourlyDistribution: ChatHourlyDistribution[];
}
