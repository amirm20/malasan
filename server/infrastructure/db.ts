import fs from 'fs';
import path from 'path';
import {
  User,
  Product,
  Category,
  Order,
  Coupon,
  WholesaleRequest,
  Review,
  BlogPost,
  SiteSetting,
  ChatConversation,
  ChatMessage,
  ChatSettings,
  CannedResponse,
} from '../domain/models.js';
import { hashPassword } from './auth.js';
import { syncSchemaToPostgres, checkPgConnection } from './pgSync.js';
import { loadFullDatabaseFromPostgres } from './pgRepository.js';

export interface DatabaseSchema {
  users: User[];
  categories: Category[];
  products: Product[];
  orders: Order[];
  coupons: Coupon[];
  wholesaleRequests: WholesaleRequest[];
  reviews: Review[];
  blogPosts: BlogPost[];
  settings: SiteSetting;
  chatConversations: ChatConversation[];
  chatMessages: ChatMessage[];
  chatSettings: ChatSettings;
  cannedResponses: CannedResponse[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'malasban_db.json');

class DatabaseContext {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.data = this.loadOrInitialize();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadOrInitialize(): DatabaseSchema {
    const defaultData = this.createSeedData();
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Merge missing settings
        parsed.settings = { ...defaultData.settings, ...(parsed.settings || {}) };
        if (!parsed.settings.wholesaleTiers || !Array.isArray(parsed.settings.wholesaleTiers) || parsed.settings.wholesaleTiers.length === 0) {
          parsed.settings.wholesaleTiers = defaultData.settings.wholesaleTiers;
        }
        if (!parsed.settings.faqs || !Array.isArray(parsed.settings.faqs) || parsed.settings.faqs.length === 0) {
          parsed.settings.faqs = defaultData.settings.faqs;
        }

        // Ensure users have proper roles and permissions
        if (Array.isArray(parsed.users)) {
          const allPermissions: any[] = [
            'overview',
            'products',
            'orders',
            'wholesale',
            'reviews',
            'categories',
            'coupons',
            'customers',
            'staff',
            'blog',
            'settings',
            'chat',
          ];
          parsed.users.forEach((u: any) => {
            if (u.id === 'usr-admin-01' || u.email === 'admin@malasban.ir' || u.role === 'Admin' && (!u.permissions || u.permissions.length === 0)) {
              if (u.id === 'usr-admin-01' || u.email === 'admin@malasban.ir') {
                u.role = 'SuperAdmin';
                u.isSuperAdmin = true;
              }
              u.permissions = allPermissions;
            }
          });

          // Check if seed staff exists
          if (!parsed.users.some((u: any) => u.id === 'usr-staff-01')) {
            const staffAuth = hashPassword('staff123');
            parsed.users.push({
              id: 'usr-staff-01',
              name: 'علیرضا',
              family: 'صادقی (کارشناس فروش و انبار)',
              email: 'staff@malasban.ir',
              mobile: '09121112233',
              passwordHash: staffAuth.hash,
              salt: staffAuth.salt,
              role: 'Admin',
              isSuperAdmin: false,
              permissions: ['overview', 'products', 'orders', 'wholesale', 'reviews'],
              isActive: true,
              createdAt: '2026-02-01T09:00:00.000Z',
              updatedAt: '2026-02-01T09:00:00.000Z',
              addresses: [],
            });
          }
        }

        // Initialize chat collections if missing in db file
        if (!Array.isArray(parsed.chatConversations)) {
          parsed.chatConversations = defaultData.chatConversations;
        }
        if (!Array.isArray(parsed.chatMessages)) {
          parsed.chatMessages = defaultData.chatMessages;
        } else {
          // Ensure all seed messages exist for conversations (e.g. Mehrdad Kazemi & Sara Amini)
          for (const seedMsg of defaultData.chatMessages) {
            if (!parsed.chatMessages.some((m: any) => m.id === seedMsg.id)) {
              parsed.chatMessages.push(seedMsg);
            }
          }
        }
        if (!parsed.chatSettings) {
          parsed.chatSettings = defaultData.chatSettings;
        }
        if (!Array.isArray(parsed.cannedResponses)) {
          parsed.cannedResponses = defaultData.cannedResponses;
        }

        return parsed;
      } catch (err) {
        console.error('Failed to read db file, initializing seed data:', err);
      }
    }
    this.saveData(defaultData);
    return defaultData;
  }

  private saveData(data: DatabaseSchema) {
    try {
      this.ensureDataDir();
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save database file:', err);
    }
  }

  private syncTimeout: NodeJS.Timeout | null = null;
  private triggerPgSync() {
    if (this.syncTimeout) return;
    this.syncTimeout = setTimeout(async () => {
      this.syncTimeout = null;
      try {
        const isPg = await checkPgConnection();
        if (isPg) {
          await syncSchemaToPostgres(this.data);
        }
      } catch {
        // Silently skip if DB not configured yet
      }
    }, 500);
  }

  public persist() {
    this.saveData(this.data);
    this.triggerPgSync();
  }

  public async initFromPostgres(): Promise<boolean> {
    try {
      const isPg = await checkPgConnection();
      if (!isPg) return false;
      const loaded = await loadFullDatabaseFromPostgres();
      if (loaded && loaded.users.length > 0) {
        this.data = loaded;
        this.saveData(this.data);
        console.log(`[PostgreSQL Engine] Loaded ${loaded.products.length} products, ${loaded.orders.length} orders, and ${loaded.users.length} users directly from PostgreSQL database.`);
        return true;
      }
      return false;
    } catch (e: any) {
      console.warn('[PostgreSQL Engine] Init from PostgreSQL skipped:', e.message);
      return false;
    }
  }

  public getFullSchema(): DatabaseSchema {
    return this.data;
  }

  // Getters
  public get users(): User[] {
    return this.data.users;
  }

  public get categories(): Category[] {
    return this.data.categories;
  }

  public get products(): Product[] {
    return this.data.products;
  }

  public get orders(): Order[] {
    return this.data.orders;
  }

  public get coupons(): Coupon[] {
    return this.data.coupons;
  }

  public get wholesaleRequests(): WholesaleRequest[] {
    return this.data.wholesaleRequests;
  }

  public get reviews(): Review[] {
    return this.data.reviews;
  }

  public get blogPosts(): BlogPost[] {
    return this.data.blogPosts;
  }

  public get settings(): SiteSetting {
    return this.data.settings;
  }

  public updateSettings(newSettings: Partial<SiteSetting>) {
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.persist();
    return this.data.settings;
  }

  public get chatConversations(): ChatConversation[] {
    return this.data.chatConversations;
  }

  public get chatMessages(): ChatMessage[] {
    return this.data.chatMessages;
  }

  public get chatSettings(): ChatSettings {
    return this.data.chatSettings;
  }

  public get cannedResponses(): CannedResponse[] {
    return this.data.cannedResponses;
  }

  public updateChatSettings(newSettings: Partial<ChatSettings>) {
    this.data.chatSettings = { ...this.data.chatSettings, ...newSettings };
    this.persist();
    return this.data.chatSettings;
  }

  private createSeedData(): DatabaseSchema {
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const adminAuth = hashPassword(adminPassword);
    const userAuth = hashPassword('user123');

    const allPerms: any[] = [
      'overview',
      'products',
      'orders',
      'wholesale',
      'reviews',
      'categories',
      'coupons',
      'customers',
      'staff',
      'blog',
      'settings',
      'chat',
    ];

    const adminUser: User = {
      id: 'usr-admin-01',
      name: 'مدیر',
      family: 'سیستم ملس‌بان',
      email: process.env.ADMIN_EMAIL || 'admin@malasban.ir',
      mobile: '09120000000',
      passwordHash: adminAuth.hash,
      salt: adminAuth.salt,
      role: 'SuperAdmin',
      isSuperAdmin: true,
      permissions: allPerms,
      isActive: true,
      createdAt: '2026-01-01T08:00:00.000Z',
      updatedAt: '2026-01-01T08:00:00.000Z',
      addresses: [],
    };

    const staffAuth = hashPassword('staff123');
    const staffUser: User = {
      id: 'usr-staff-01',
      name: 'علیرضا',
      family: 'صادقی (کارشناس فروش و انبار)',
      email: 'staff@malasban.ir',
      mobile: '09121112233',
      passwordHash: staffAuth.hash,
      salt: staffAuth.salt,
      role: 'Admin',
      isSuperAdmin: false,
      permissions: ['overview', 'products', 'orders', 'wholesale', 'reviews'],
      isActive: true,
      createdAt: '2026-02-01T09:00:00.000Z',
      updatedAt: '2026-02-01T09:00:00.000Z',
      addresses: [],
    };

    const demoUser: User = {
      id: 'usr-demo-02',
      name: 'سهراب',
      family: 'سپهری',
      email: 'user@malasban.ir',
      mobile: '09123456789',
      passwordHash: userAuth.hash,
      salt: userAuth.salt,
      role: 'Customer',
      isActive: true,
      createdAt: '2026-02-15T10:30:00.000Z',
      updatedAt: '2026-02-15T10:30:00.000Z',
      addresses: [
        {
          id: 'addr-01',
          title: 'منزل تهران',
          receiverName: 'سهراب سپهری',
          receiverMobile: '09123456789',
          province: 'تهران',
          city: 'تهران',
          fullAddress: 'خیابان ولیعصر، بالاتر از پارک ساعی، کوچه گلستان، پلاک ۱۲، واحد ۴',
          postalCode: '1511874521',
          isDefault: true,
        },
      ],
    };

    const categories: Category[] = [
      {
        id: 'cat-anar',
        name: 'لواشک انار',
        slug: 'pomegranate',
        description: 'تهیه شده از دانه‌های انار درجه یک ملس و ترش ساوه بدون هیچ‌گونه ماده افزودنی',
        imageUrl: 'https://images.unsplash.com/photo-1541344999736-83eca872f242?w=800&q=80',
        displayOrder: 1,
        isActive: true,
      },
      {
        id: 'cat-albaloo',
        name: 'لواشک آلبالو و زرشک',
        slug: 'sour-cherry-barberry',
        description: 'نهایت ترشی طبیعی با عطر بی‌نظیر آلبالوی کوهی و زرشک تازه قائنات',
        imageUrl: 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=800&q=80',
        displayOrder: 2,
        isActive: true,
      },
      {
        id: 'cat-alou',
        name: 'لواشک آلو و زردآلو',
        slug: 'plum-apricot',
        description: 'بافت گوشتی، طعم ملس و سرشار از فیبر طبیعی تهیه شده از آلو قطره طلا و شابلون',
        imageUrl: 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=800&q=80',
        displayOrder: 3,
        isActive: true,
      },
      {
        id: 'cat-majlesi',
        name: 'لواشک مجلسی و پذیرایی',
        slug: 'party-rolls',
        description: 'برش‌های رولی شیک، بسته‌بندی تک‌نفره و سینی‌های میکس مخصوص مهمانی‌ها',
        imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
        displayOrder: 4,
        isActive: true,
      },
      {
        id: 'cat-gift',
        name: 'پک‌های کادویی و اقتصادی',
        slug: 'gift-packs',
        description: 'بسته‌های هدیه نفیس و پک‌های خانوادگی چند طعم با تخفیف ویژه',
        imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&q=80',
        displayOrder: 5,
        isActive: true,
      },
      {
        id: 'cat-wholesale',
        name: 'فروش ویژه عمده',
        slug: 'wholesale-bulk',
        description: 'کارتن‌های ۲۰ کیلویی، رول‌های عریض و سلفون‌پیچ بهداشتی ویژه همکاران',
        imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&q=80',
        displayOrder: 6,
        isActive: true,
      },
    ];

    const products: Product[] = [
      {
        id: 'prod-01',
        name: 'لواشک انار دانه سرخ ساوه (ملس اعلا)',
        slug: 'lavashak-anar-saveh',
        sku: 'MLB-ANR-350',
        categoryId: 'cat-anar',
        categoryName: 'لواشک انار',
        shortDescription: 'تهیه شده از پوره خالص انار ملس ساوه با ترشی ملایم و رنگ یاقوتی طبیعی.',
        description:
          'لواشک انار ساوه ملس‌بان از مرغوب‌ترین انارهای دست‌چین باغ‌های ساوه پخته شده است. در فرایند تولید این محصول از هیچ‌گونه اسید سیتریک یا اسانس شیمیایی استفاده نشده و طعم ترش و ملس آن کاملاً برآمده از میوه ارگانیک است. بافتی نرم و منعطف با ماندگاری بالا دارد.',
        price: 85000,
        discountPrice: 72000,
        stockQuantity: 120,
        weightGrams: 350,
        piecesPerPack: 1,
        mainImage: 'https://images.unsplash.com/photo-1541344999736-83eca872f242?w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1541344999736-83eca872f242?w=800&q=80',
          'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=800&q=80',
        ],
        sournessLevel: 'SweetSour',
        ingredients: ['پوره انار طبیعی ساوه', 'رب انار خانگی', 'نمک دریا بسیار کم'],
        nutritionalFacts: {
          caloriesPer100g: 245,
          sugarGrams: 38,
          fiberGrams: 4.2,
          vitaminCPercent: 35,
          fatGrams: 0.3,
          saltGrams: 0.4,
        },
        rating: 4.9,
        reviewCount: 48,
        isFeatured: true,
        isBestSeller: true,
        isNew: false,
        isWholesaleAvailable: true,
        minWholesaleQty: 10,
        wholesaleUnitPrice: 52000,
        isActive: true,
        createdAt: '2026-01-10T12:00:00.000Z',
        updatedAt: '2026-03-01T14:20:00.000Z',
      },
      {
        id: 'prod-02',
        name: 'لواشک آلبالو جنگلی ترشِ ناب',
        slug: 'lavashak-albaloo-jangali',
        sku: 'MLB-ALB-300',
        categoryId: 'cat-albaloo',
        categoryName: 'لواشک آلبالو و زرشک',
        shortDescription: 'ترش، پرطراوت و برانگیزاننده اشتها؛ فرآوری شده از آلبالوی دست‌چین کوهستان.',
        description:
          'اگر عاشق طعم‌های ترش واقعی هستید، لواشک آلبالو جنگلی ملس‌بان انتخابی بی‌همتاست. عطر تند آلبالوی تازه هنگام باز کردن سلفون به مشام می‌رسد و قرمزی چشم‌نواز آن حاصل میوه خالص بدون رنگ مصنوعی است.',
        price: 92000,
        discountPrice: 84000,
        stockQuantity: 95,
        weightGrams: 300,
        piecesPerPack: 1,
        mainImage: 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=800&q=80',
          'https://images.unsplash.com/photo-1541344999736-83eca872f242?w=800&q=80',
        ],
        sournessLevel: 'Sour',
        ingredients: ['پوره آلبالو کوهی', 'عصاره زرشک کوهی', 'نمک تصفیه شده'],
        nutritionalFacts: {
          caloriesPer100g: 220,
          sugarGrams: 32,
          fiberGrams: 5.1,
          vitaminCPercent: 42,
          fatGrams: 0.2,
          saltGrams: 0.5,
        },
        rating: 4.8,
        reviewCount: 36,
        isFeatured: true,
        isBestSeller: true,
        isNew: false,
        isWholesaleAvailable: true,
        minWholesaleQty: 10,
        wholesaleUnitPrice: 61000,
        isActive: true,
        createdAt: '2026-01-12T11:00:00.000Z',
        updatedAt: '2026-03-05T10:00:00.000Z',
      },
      {
        id: 'prod-03',
        name: 'لواشک زرشک اعلای قائنات (خیلی ترش)',
        slug: 'lavashak-zereshk-qaenat',
        sku: 'MLB-ZRK-250',
        categoryId: 'cat-albaloo',
        categoryName: 'لواشک آلبالو و زرشک',
        shortDescription: 'ترش‌ترین لواشک ملس‌بان با عصاره زرشک تازه دانه اناری خراسان جنوبی.',
        description:
          'تجربه بی‌همتای ترشی پرقدرت و خالص! زرشک تازه قائنات سرشار از بربرین و آنتی‌اکسیدان بوده و مصرف این لواشک علاوه بر لذت فراوان، برای تصفیه کبد و نشاط بدن توصیه می‌شود.',
        price: 98000,
        discountPrice: 89000,
        stockQuantity: 45,
        weightGrams: 250,
        piecesPerPack: 1,
        mainImage: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&q=80'],
        sournessLevel: 'ExtraSour',
        ingredients: ['عصاره زرشک تازه قائنات', 'پوره آلوچه ترش جنگلی', 'نمک کم'],
        nutritionalFacts: {
          caloriesPer100g: 215,
          sugarGrams: 28,
          fiberGrams: 5.8,
          vitaminCPercent: 55,
          fatGrams: 0.1,
          saltGrams: 0.4,
        },
        rating: 4.9,
        reviewCount: 29,
        isFeatured: true,
        isBestSeller: false,
        isNew: true,
        isWholesaleAvailable: true,
        minWholesaleQty: 15,
        wholesaleUnitPrice: 68000,
        isActive: true,
        createdAt: '2026-02-01T09:00:00.000Z',
        updatedAt: '2026-03-08T09:00:00.000Z',
      },
      {
        id: 'prod-04',
        name: 'لواشک آلو بخارا و قطره‌طلا ملس',
        slug: 'lavashak-aloo-ghatre-tala',
        sku: 'MLB-ALO-400',
        categoryId: 'cat-alou',
        categoryName: 'لواشک آلو و زردآلو',
        shortDescription: 'بافت پرگوشت، طعم ملس اعجاب‌انگیز و تسکین‌دهنده دستگاه گوارش.',
        description:
          'این لواشک با آلوهای زرد آبدار و شیرین قطره‌طلا ترکیب شده با آلو سیاه شابلون تهیه می‌شود. تعادل دلپذیر بین ترشی و شیرینی، آن را به انتخاب اول دوستداران طعم‌های ملایم تبدیل کرده است.',
        price: 78000,
        discountPrice: 69000,
        stockQuantity: 150,
        weightGrams: 400,
        piecesPerPack: 1,
        mainImage: 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=800&q=80'],
        sournessLevel: 'SweetSour',
        ingredients: ['پوره آلو قطره‌طلا', 'پوره آلو شابلون', 'عصاره لیمو ترش طبیعی'],
        nutritionalFacts: {
          caloriesPer100g: 250,
          sugarGrams: 42,
          fiberGrams: 6.0,
          vitaminCPercent: 28,
          fatGrams: 0.2,
          saltGrams: 0.3,
        },
        rating: 4.7,
        reviewCount: 41,
        isFeatured: false,
        isBestSeller: true,
        isNew: false,
        isWholesaleAvailable: true,
        minWholesaleQty: 10,
        wholesaleUnitPrice: 51000,
        isActive: true,
        createdAt: '2026-01-05T14:00:00.000Z',
        updatedAt: '2026-02-20T11:00:00.000Z',
      },
      {
        id: 'prod-05',
        name: 'لواشک زردآلو کوهپایه (ملس و شیرین)',
        slug: 'lavashak-zardaloo',
        sku: 'MLB-ZRD-350',
        categoryId: 'cat-alou',
        categoryName: 'لواشک آلو و زردآلو',
        shortDescription: 'طعم لطیف، عطر خاطره‌انگیز زردآلو قیسی و رنگ طلایی چشم‌نواز.',
        description:
          'برگرفته از زردآلوهای آفتاب‌خورده باغات شاهرود، این لواشک با کمترین میزان ترشی و شیرینی طبیعی میوه، گزینه بسیار محبوب برای کودکان و سالمندان است.',
        price: 89000,
        discountPrice: undefined,
        stockQuantity: 80,
        weightGrams: 350,
        piecesPerPack: 1,
        mainImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80'],
        sournessLevel: 'Sweet',
        ingredients: ['پوره خالص زردآلو قیسی', 'آب لیموی تازه'],
        nutritionalFacts: {
          caloriesPer100g: 260,
          sugarGrams: 48,
          fiberGrams: 4.8,
          vitaminCPercent: 30,
          fatGrams: 0.2,
          saltGrams: 0.2,
        },
        rating: 4.6,
        reviewCount: 22,
        isFeatured: false,
        isBestSeller: false,
        isNew: true,
        isWholesaleAvailable: true,
        minWholesaleQty: 10,
        wholesaleUnitPrice: 64000,
        isActive: true,
        createdAt: '2026-02-10T15:00:00.000Z',
        updatedAt: '2026-03-01T10:00:00.000Z',
      },
      {
        id: 'prod-06',
        name: 'سینی لواشک رولی مجلسی پذیرایی (میکس ۸ طعم)',
        slug: 'lavashak-party-tray-rolls',
        sku: 'MLB-TRY-650',
        categoryId: 'cat-majlesi',
        categoryName: 'لواشک مجلسی و پذیرایی',
        shortDescription: 'چیدمان هندسی لوکس، مناسب جشن‌ها، پذیرایی اداری و هدیه با ۸ طعم متفاوت.',
        description:
          'سینی کریستالی پذیرایی شامل رول‌های منظم لواشک انار، زرشک، آلبالو، کیوی، تمشک، زردآلو، گوجه‌سبز و انبه. بسته‌بندی پلمپ وکیوم بهداشتی جهت حفظ طراوت و زیبایی میز پذیرایی شما.',
        price: 195000,
        discountPrice: 175000,
        stockQuantity: 60,
        weightGrams: 650,
        piecesPerPack: 24,
        mainImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
          'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&q=80',
        ],
        sournessLevel: 'SweetSour',
        ingredients: ['انواع پوره میوه‌های طبیعی فصلی', 'عصاره ترشک جنگلی', 'نمک دریا'],
        nutritionalFacts: {
          caloriesPer100g: 235,
          sugarGrams: 36,
          fiberGrams: 5.0,
          vitaminCPercent: 40,
          fatGrams: 0.2,
          saltGrams: 0.4,
        },
        rating: 5.0,
        reviewCount: 53,
        isFeatured: true,
        isBestSeller: true,
        isNew: false,
        isWholesaleAvailable: true,
        minWholesaleQty: 5,
        wholesaleUnitPrice: 135000,
        isActive: true,
        createdAt: '2026-01-15T16:00:00.000Z',
        updatedAt: '2026-03-07T12:00:00.000Z',
      },
      {
        id: 'prod-07',
        name: 'پک کادویی چوبی نفیس ملس‌بان (شاه‌ترش)',
        slug: 'luxury-wooden-gift-box',
        sku: 'MLB-GFT-900',
        categoryId: 'cat-gift',
        categoryName: 'پک‌های کادویی و اقتصادی',
        shortDescription: 'جعبه خاتم و چوبی اختصاصی ملس‌بان با ۴ مدل کیک لواشکی و سس انار ترش.',
        description:
          'یک هدیه اصیل و ماندگار برای عزیزانی که عاشق ترشیجات هستند! این پک مجلل شامل ۴ لایه لواشک ضخیم دست‌ساز، یک شیشه سس انار غلیظ ارگانیک و آلبالو خشک ممتاز در جعبه چوبی حکاکی شده می‌باشد.',
        price: 340000,
        discountPrice: 298000,
        stockQuantity: 30,
        weightGrams: 900,
        piecesPerPack: 4,
        mainImage: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&q=80'],
        sournessLevel: 'Sour',
        ingredients: ['پوره انار ساوه', 'پوره آلبالو کوهی', 'رب انار دبش', 'آلبالو خشک سنتی'],
        nutritionalFacts: {
          caloriesPer100g: 240,
          sugarGrams: 35,
          fiberGrams: 5.5,
          vitaminCPercent: 45,
          fatGrams: 0.3,
          saltGrams: 0.3,
        },
        rating: 4.9,
        reviewCount: 18,
        isFeatured: true,
        isBestSeller: false,
        isNew: true,
        isWholesaleAvailable: true,
        minWholesaleQty: 5,
        wholesaleUnitPrice: 230000,
        isActive: true,
        createdAt: '2026-02-18T10:00:00.000Z',
        updatedAt: '2026-03-06T14:00:00.000Z',
      },
      {
        id: 'prod-08',
        name: 'کارتن عمده ۲۰ کیلوگرمی لواشک ورقه‌ای انار و آلبالو',
        slug: 'wholesale-20kg-carton',
        sku: 'MLB-WHL-20K',
        categoryId: 'cat-wholesale',
        categoryName: 'فروش ویژه عمده',
        shortDescription: 'مخصوص فروشگاه‌های زنجیره‌ای، هایپرمارکت‌ها، قنادی‌ها و صادرکنندگان.',
        description:
          'کارتن استاندارد ۵ لایه شامل ورقه‌های لواشک بهداشتی سلفون‌پیچ شده با تاریخ تولید روز و برچسب سیب سلامت سازمان غذا و دارو. امکان سفارش با لوگوی اختصاصی برای خریدهای بالای ۱۰۰ کارتن.',
        price: 2600000,
        discountPrice: 2350000,
        stockQuantity: 40,
        weightGrams: 20000,
        piecesPerPack: 40,
        mainImage: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&q=80'],
        sournessLevel: 'SweetSour',
        ingredients: ['پوره انار ساوه و آلبالوی کوهستان', 'نمک مجاز خوراکی'],
        rating: 4.9,
        reviewCount: 15,
        isFeatured: true,
        isBestSeller: true,
        isNew: false,
        isWholesaleAvailable: true,
        minWholesaleQty: 1,
        wholesaleUnitPrice: 2350000,
        isActive: true,
        createdAt: '2026-01-01T08:00:00.000Z',
        updatedAt: '2026-03-02T16:00:00.000Z',
      },
      {
        id: 'prod-09',
        name: 'لواشک کیوی ترش شمال (مملو از ویتامین ث)',
        slug: 'lavashak-kiwi-shomal',
        sku: 'MLB-KIW-300',
        categoryId: 'cat-albaloo',
        categoryName: 'لواشک آلبالو و زرشک',
        shortDescription: 'رنگ زمردی طبیعی، بافت لطیف دانه ریز و ترشی فرح‌بخش کیوی تالش.',
        description:
          'کیوی سرشار از فیبر و ویتامین C بوده و ترکیب پوره کیوی طبیعی همراه با عصاره لیمو ترش سنگی، طعمی بدیع و بسیار خنک و دلچسب به این لواشک بخشیده است.',
        price: 88000,
        discountPrice: 79000,
        stockQuantity: 70,
        weightGrams: 300,
        piecesPerPack: 1,
        mainImage: 'https://images.unsplash.com/photo-1618897996318-5a901fa6ca71?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1618897996318-5a901fa6ca71?w=800&q=80'],
        sournessLevel: 'Sour',
        ingredients: ['پوره کیوی ارگانیک تالش', 'آب لیموی طبیعی', 'نمک کم'],
        nutritionalFacts: {
          caloriesPer100g: 210,
          sugarGrams: 30,
          fiberGrams: 6.5,
          vitaminCPercent: 75,
          fatGrams: 0.2,
          saltGrams: 0.3,
        },
        rating: 4.7,
        reviewCount: 20,
        isFeatured: false,
        isBestSeller: false,
        isNew: true,
        isWholesaleAvailable: true,
        minWholesaleQty: 10,
        wholesaleUnitPrice: 59000,
        isActive: true,
        createdAt: '2026-02-22T11:00:00.000Z',
        updatedAt: '2026-03-08T15:00:00.000Z',
      },
      {
        id: 'prod-10',
        name: 'لواشک هفت‌میوه جنگلی کوهستان (ملس)',
        slug: 'lavashak-haft-miveh',
        sku: 'MLB-HFT-450',
        categoryId: 'cat-anar',
        categoryName: 'لواشک انار',
        shortDescription: 'میکس هیجان‌انگیز انار، آلو سیاه، زرشک، شاتوت، آلوچه، زردآلو و سیب ترش.',
        description:
          'شاهکار طعم‌شناسی ملس‌بان! نسبت دقیق ۷ نوع میوه مرغوب پخته شده باعث شده در هر گاز، رگه‌هایی از ترشی زرشک، نرمی آلو و عطر زردآلو را همزمان مزمزه کنید.',
        price: 99000,
        discountPrice: 87000,
        stockQuantity: 110,
        weightGrams: 450,
        piecesPerPack: 1,
        mainImage: 'https://images.unsplash.com/photo-1541344999736-83eca872f242?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1541344999736-83eca872f242?w=800&q=80'],
        sournessLevel: 'SweetSour',
        ingredients: ['پوره انار', 'آلو شابلون', 'زرشک تازه', 'تمشک کوهی', 'آلوچه ترش'],
        nutritionalFacts: {
          caloriesPer100g: 238,
          sugarGrams: 36,
          fiberGrams: 5.2,
          vitaminCPercent: 48,
          fatGrams: 0.2,
          saltGrams: 0.4,
        },
        rating: 4.9,
        reviewCount: 64,
        isFeatured: true,
        isBestSeller: true,
        isNew: false,
        isWholesaleAvailable: true,
        minWholesaleQty: 10,
        wholesaleUnitPrice: 62000,
        isActive: true,
        createdAt: '2026-01-08T09:00:00.000Z',
        updatedAt: '2026-03-04T13:00:00.000Z',
      },
      {
        id: 'prod-11',
        name: 'لواشک نواری تک‌نفره پذیرایی (بسته ۵۰ عددی)',
        slug: 'lavashak-single-pack-50',
        sku: 'MLB-SNG-50',
        categoryId: 'cat-majlesi',
        categoryName: 'لواشک مجلسی و پذیرایی',
        shortDescription: 'بسته‌بندی آلومینیومی شیک و بهداشتی، ایده‌آل برای تغذیه مدارس و دورهمی‌ها.',
        description:
          'هر نوار لواشک در فویل استاندارد بهداشتی پرس شده و بدون چسبندگی به راحتی باز و مصرف می‌شود. شامل میکس طعم‌های پرطرفدار انار، آلبالو و کیوی.',
        price: 165000,
        discountPrice: 149000,
        stockQuantity: 85,
        weightGrams: 750,
        piecesPerPack: 50,
        mainImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80'],
        sournessLevel: 'SweetSour',
        ingredients: ['پوره میوه‌های طبیعی درجه یک', 'اسیدهای آلی طبیعی میوه'],
        rating: 4.8,
        reviewCount: 31,
        isFeatured: false,
        isBestSeller: false,
        isNew: true,
        isWholesaleAvailable: true,
        minWholesaleQty: 5,
        wholesaleUnitPrice: 110000,
        isActive: true,
        createdAt: '2026-02-14T13:00:00.000Z',
        updatedAt: '2026-03-07T11:00:00.000Z',
      },
      {
        id: 'prod-12',
        name: 'پک اقتصادی خانواده (۴ کیلوگرم لواشک میکس)',
        slug: 'family-economy-pack-4kg',
        sku: 'MLB-FAM-4K',
        categoryId: 'cat-gift',
        categoryName: 'پک‌های کادویی و اقتصادی',
        shortDescription: 'خرید اقتصادی با بیشترین تنوع؛ ۴ کیلوگرم ورقه لواشک تازه در ۸ طعم مختلف.',
        description:
          'اگر مصرف لواشک در منزل شما بالاست، این پک به صرفه‌ترین گزینه است. ۸ طعم مختلف ۵۰۰ گرمی در بسته‌های نایلونی سلفونی ضخیم و بهداشتی.',
        price: 520000,
        discountPrice: 460000,
        stockQuantity: 50,
        weightGrams: 4000,
        piecesPerPack: 8,
        mainImage: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&q=80',
        images: ['https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&q=80'],
        sournessLevel: 'SweetSour',
        ingredients: ['پوره طبیعی انار، آلبالو، زرشک، زردآلو، آلو، کیوی و تمشک'],
        rating: 4.9,
        reviewCount: 42,
        isFeatured: true,
        isBestSeller: true,
        isNew: false,
        isWholesaleAvailable: true,
        minWholesaleQty: 3,
        wholesaleUnitPrice: 390000,
        isActive: true,
        createdAt: '2026-01-20T10:00:00.000Z',
        updatedAt: '2026-03-03T15:00:00.000Z',
      },
    ];

    const coupons: Coupon[] = [
      {
        id: 'cpn-01',
        code: 'MELAS20',
        type: 'Percent',
        value: 20,
        minOrderAmount: 150000,
        maxDiscountAmount: 60000,
        usageLimit: 500,
        usedCount: 84,
        startDate: '2026-01-01',
        endDate: '2026-12-29',
        isActive: true,
        firstOrderOnly: false,
      },
      {
        id: 'cpn-02',
        code: 'NOROOZ50',
        type: 'FixedAmount',
        value: 50000,
        minOrderAmount: 300000,
        usageLimit: 300,
        usedCount: 42,
        startDate: '2026-01-01',
        endDate: '2026-12-29',
        isActive: true,
        firstOrderOnly: false,
      },
      {
        id: 'cpn-03',
        code: 'OMDEH10',
        type: 'Percent',
        value: 10,
        minOrderAmount: 1000000,
        maxDiscountAmount: 250000,
        usageLimit: 100,
        usedCount: 12,
        startDate: '2026-01-01',
        endDate: '2026-12-29',
        isActive: true,
        firstOrderOnly: false,
      },
      {
        id: 'cpn-04',
        code: 'FIRSTBUY',
        type: 'Percent',
        value: 25,
        minOrderAmount: 100000,
        maxDiscountAmount: 80000,
        usageLimit: 1000,
        usedCount: 0,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        isActive: true,
        firstOrderOnly: true,
      },
    ];

    const wholesaleRequests: WholesaleRequest[] = [
      {
        id: 'whl-01',
        trackingCode: 'WHL-1403-901',
        applicantName: 'آقای علیرضا کاظمی',
        companyName: 'سوپرمارکت‌های زنجیره‌ای مهدوی',
        mobile: '09121112233',
        email: 'kazemi@mahdavi-markets.ir',
        province: 'اصفهان',
        city: 'اصفهان',
        businessType: 'فروشگاه زنجیره‌ای',
        requestedProducts: 'کارتن ۲۰ کیلویی انار و آلبالو، سینی‌های پذیرایی رولی',
        estimatedQuantityKg: 150,
        description: 'نیازمند استعلام قیمت برای تأمین هفتگی ۵ شعبه در اصفهان هستیم.',
        status: 'Contacted',
        adminNotes: 'با ایشان تماس گرفته شد و کاتالوگ قیمت همکار به همراه نمونه ارسال شد.',
        createdAt: '2026-03-01T10:00:00.000Z',
        updatedAt: '2026-03-02T11:00:00.000Z',
      },
      {
        id: 'whl-02',
        trackingCode: 'WHL-1403-902',
        applicantName: 'خانم مهسا یزدانی',
        companyName: 'قنادی و خشکبار لاله',
        mobile: '09359876543',
        province: 'فارس',
        city: 'شیراز',
        businessType: 'قنادی و خشکبار',
        requestedProducts: 'لواشک‌های مجلسی، پک‌های هدیه چوبی',
        estimatedQuantityKg: 50,
        description: 'جهت فروش ویژه شب عید و عید نوروز نیازمند بار باکیفیت و تضمینی هستیم.',
        status: 'Approved',
        adminNotes: 'سفارش اولیه با هماهنگی حسابداری ثبت و ارسال گردید.',
        createdAt: '2026-03-04T14:30:00.000Z',
        updatedAt: '2026-03-05T09:20:00.000Z',
      },
            {
        id: 'whl-03',
        trackingCode: 'WHL-1403-903',
        applicantName: 'خانم مهسا یزدانی',
        companyName: 'قنادی و خشکبار لاله',
        mobile: '09359876543',
        province: 'فارس',
        city: 'شیراز',
        businessType: 'قنادی و خشکبار',
        requestedProducts: 'لواشک‌های مجلسی، پک‌های هدیه چوبی',
        estimatedQuantityKg: 50,
        description: 'جهت فروش ویژه شب عید و عید نوروز نیازمند بار باکیفیت و تضمینی هستیم.',
        status: 'Approved',
        adminNotes: 'سفارش اولیه با هماهنگی حسابداری ثبت و ارسال گردید.',
        createdAt: '2026-03-04T14:30:00.000Z',
        updatedAt: '2026-03-05T09:20:00.000Z',
      },
            {
        id: 'whl-04',
        trackingCode: 'WHL-1403-904',
        applicantName: 'خانم مهسا یزدانی',
        companyName: 'قنادی و خشکبار لاله',
        mobile: '09359876543',
        province: 'فارس',
        city: 'شیراز',
        businessType: 'قنادی و خشکبار',
        requestedProducts: 'لواشک‌های مجلسی، پک‌های هدیه چوبی',
        estimatedQuantityKg: 50,
        description: 'جهت فروش ویژه شب عید و عید نوروز نیازمند بار باکیفیت و تضمینی هستیم.',
        status: 'Approved',
        adminNotes: 'سفارش اولیه با هماهنگی حسابداری ثبت و ارسال گردید.',
        createdAt: '2026-03-04T14:30:00.000Z',
        updatedAt: '2026-03-05T09:20:00.000Z',
      },
            {
        id: 'whl-05',
        trackingCode: 'WHL-1403-905',
        applicantName: 'خانم مهسا یزدانی',
        companyName: 'قنادی و خشکبار لاله',
        mobile: '09359876543',
        province: 'فارس',
        city: 'شیراز',
        businessType: 'قنادی و خشکبار',
        requestedProducts: 'لواشک‌های مجلسی، پک‌های هدیه چوبی',
        estimatedQuantityKg: 50,
        description: 'جهت فروش ویژه شب عید و عید نوروز نیازمند بار باکیفیت و تضمینی هستیم.',
        status: 'Approved',
        adminNotes: 'سفارش اولیه با هماهنگی حسابداری ثبت و ارسال گردید.',
        createdAt: '2026-03-04T14:30:00.000Z',
        updatedAt: '2026-03-05T09:20:00.000Z',
      },
            {
        id: 'whl-06',
        trackingCode: 'WHL-1403-906',
        applicantName: 'خانم مهسا یزدانی',
        companyName: 'قنادی و خشکبار لاله',
        mobile: '09359876543',
        province: 'فارس',
        city: 'شیراز',
        businessType: 'قنادی و خشکبار',
        requestedProducts: 'لواشک‌های مجلسی، پک‌های هدیه چوبی',
        estimatedQuantityKg: 50,
        description: 'جهت فروش ویژه شب عید و عید نوروز نیازمند بار باکیفیت و تضمینی هستیم.',
        status: 'Approved',
        adminNotes: 'سفارش اولیه با هماهنگی حسابداری ثبت و ارسال گردید.',
        createdAt: '2026-03-04T14:30:00.000Z',
        updatedAt: '2026-03-05T09:20:00.000Z',
      },
    ];

    const orders: Order[] = [
      {
        id: 'ord-01',
        orderNumber: 'MLB-1403-1024',
        userId: demoUser.id,
        customerName: 'سهراب سپهری',
        customerMobile: '09123456789',
        customerEmail: 'user@malasban.ir',
        shippingAddress: demoUser.addresses[0],
        shippingMethod: 'پست پیشتاز',
        shippingFee: 45000,
        items: [
          {
            id: 'item-01',
            productId: 'prod-01',
            productName: 'لواشک انار دانه سرخ ساوه (ملس اعلا)',
            productImage: 'https://images.unsplash.com/photo-1541344999736-83eca872f242?w=800&q=80',
            weightGrams: 350,
            unitPrice: 72000,
            quantity: 2,
            totalPrice: 144000,
          },
          {
            id: 'item-02',
            productId: 'prod-06',
            productName: 'سینی لواشک رولی مجلسی پذیرایی (میکس ۸ طعم)',
            productImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
            weightGrams: 650,
            unitPrice: 175000,
            quantity: 1,
            totalPrice: 175000,
          },
        ],
        subtotal: 319000,
        discountAmount: 20000,
        couponCode: 'MELAS20',
        totalAmount: 344000,
        status: 'Delivered',
        paymentStatus: 'Successful',
        paymentMethod: 'درگاه بانکی شاپرک',
        paymentRefId: 'ZP-89234177',
        customerNotes: 'لطفاً عصر بعد از ساعت ۱۶ تحویل شود.',
        createdAt: '2026-02-28T16:20:00.000Z',
        updatedAt: '2026-03-02T18:00:00.000Z',
      },
      {
        id: 'ord-02',
        orderNumber: 'MLB-1403-1025',
        customerName: 'فاطمه رضایی',
        customerMobile: '09197778899',
        shippingAddress: {
          id: 'addr-guest-01',
          title: 'آدرس ثبت شده',
          receiverName: 'فاطمه رضایی',
          receiverMobile: '09197778899',
          province: 'خراسان رضوی',
          city: 'مشهد',
          fullAddress: 'بلوار وکیل‌آباد، نبش صیاد شیرازی، پلاک ۳',
          postalCode: '9188765432',
          isDefault: true,
        },
        shippingMethod: 'تیپاکس',
        shippingFee: 55000,
        items: [
          {
            id: 'item-03',
            productId: 'prod-02',
            productName: 'لواشک آلبالو جنگلی ترشِ ناب',
            productImage: 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=800&q=80',
            weightGrams: 300,
            unitPrice: 84000,
            quantity: 3,
            totalPrice: 252000,
          },
        ],
        subtotal: 252000,
        discountAmount: 0,
        totalAmount: 307000,
        status: 'Processing',
        paymentStatus: 'Successful',
        paymentMethod: 'درگاه بانکی شاپرک',
        paymentRefId: 'ZP-99432104',
        createdAt: '2026-03-07T11:15:00.000Z',
        updatedAt: '2026-03-07T11:20:00.000Z',
      },
    ];

    const reviews: Review[] = [
      {
        id: 'rev-01',
        productId: 'prod-01',
        productName: 'لواشک انار دانه سرخ ساوه (ملس اعلا)',
        userName: 'نیما ارجمند',
        rating: 5,
        comment:
          'واقعاً طعم اصیل انار داره! کاملاً معلومه شکر یا جوهرلیمو نزدن. نرمی بافتش عالی بود و بسته‌بندیش خیلی بهداشتیه.',
        isApproved: true,
        createdAt: '2026-02-14T09:30:00.000Z',
      },
      {
        id: 'rev-02',
        productId: 'prod-02',
        productName: 'لواشک آلبالو جنگلی ترشِ ناب',
        userName: 'سارا تهرانی',
        rating: 5,
        comment:
          'دقیقاً همون ترشی تیزی رو داره که آدم دهنش آب میفته! عاشق رنگ طبیعیش شدم. دوباره حتماً سفارش میدم.',
        isApproved: true,
        createdAt: '2026-02-20T14:10:00.000Z',
      },
      {
        id: 'rev-03',
        productId: 'prod-06',
        productName: 'سینی لواشک رولی مجلسی پذیرایی (میکس ۸ طعم)',
        userName: 'مریم کمالی',
        rating: 5,
        comment:
          'برای تولد همسرم گرفتم، تمام مهمان‌ها از چیدمان و طعم رول‌ها شگفت‌زده شدند. طعم کیوی و تمشکش عالی بود.',
        isApproved: true,
        createdAt: '2026-03-02T19:00:00.000Z',
      },
      {
        id: 'rev-04',
        productId: 'prod-01',
        productName: 'لواشک انار دانه سرخ ساوه (ملس اعلا)',
        userName: 'محمدرضا خلیلی',
        rating: 4,
        comment:
          'ارسال خیلی سریع بود و بسته‌بندی عالی بود. فقط کمی ترش‌تر از انتظارم بود اما کیفیت میوه کاملاً مشخصه و راضی هستم.',
        isApproved: false,
        createdAt: '2026-03-08T10:15:00.000Z',
      },
      {
        id: 'rev-05',
        productId: 'prod-08',
        productName: 'کارتن عمده ۲۰ کیلوگرمی لواشک ورقه‌ای انار و آلبالو',
        userName: 'حسین پناهی (خشکبار)',
        rating: 5,
        comment:
          'بار عمده ۲۰ کیلویی رسید؛ کیفیت ورقه‌ها و بسته‌بندی سلفون بدون نقصه. تاریخ تولید تازه است و مشتریان ما خیلی استقبال کردند.',
        isApproved: true,
        createdAt: '2026-03-05T16:45:00.000Z',
      },
      {
        id: 'rev-06',
        productId: 'prod-03',
        productName: 'لواشک آلو قطره طلا ملس و گوشتی',
        userName: 'فرهاد نادری',
        rating: 3,
        comment:
          'طعم خوبی داره ولی بافتش نسبت به آلبالو سفت‌تر بود. اگه نرم‌تر بشه فوق‌العاده است.',
        isApproved: false,
        createdAt: '2026-03-09T08:20:00.000Z',
      },
    ];

    const blogPosts: BlogPost[] = [
      {
        id: 'blg-01',
        title: 'چگونه لواشک طبیعی و بدون اسید سیتریک را تشخیص دهیم؟',
        slug: 'how-to-spot-natural-lavashak',
        summary:
          'راهنمای کامل شناخت لواشک‌های اصیل میوه‌ای از محصولات غیربهداشتی و حاوی اسانس و جوهرلیمو شیمیایی.',
        content: `لواشک یکی از قدیمی‌ترین و محبوب‌ترین تنقلات سنتی ایرانی است. اما با ورود تولیدات صنعتی بی‌کیفیت، دغدغه بسیاری از خانواده‌ها تشخیص لواشک طبیعی از صنعتی است.

### ۱. عطر و بوی میوه
لواشک طبیعی بوی ملایم و مطبوع خود میوه را دارد. اگر بلافاصله بعد از باز کردن بسته بوی تند و آزاردهنده‌ای شبیه جوهر لیمو حس کردید، نشانگر استفاده از افزودنی‌های مصنوعی است.

### ۲. رنگ مات در برابر براقیت غیرعادی
میوه‌ها پس از پخت و خشک شدن کمی کدر و تیره می‌شوند. لواشک‌هایی که رنگ‌های شبرنگ و بسیار شفاف غیرواقعی دارند معمولاً حاوی رنگ‌های سنتتیک مانند تارترازین هستند.

### ۳. بافت و انعطاف‌پذیری
لواشک خالص بدون آرد و نشاسته بافتی نرم، کشسانی طبیعی و لایه‌پذیری بدون شکستگی دارد.`,
        featuredImage: 'https://images.unsplash.com/photo-1541344999736-83eca872f242?w=800&q=80',
        category: 'دانستنی‌ها و سلامت',
        tags: ['لواشک طبیعی', 'سلامت تغذیه', 'انار ساوه', 'تنقلات سالم'],
        author: 'تیم پژوهش ملس‌بان',
        readTimeMinutes: 4,
        isPublished: true,
        createdAt: '2026-02-10T09:00:00.000Z',
        updatedAt: '2026-02-10T09:00:00.000Z',
      },
      {
        id: 'blg-02',
        title: 'خواص شگفت‌انگیز لواشک انار و زرشک برای سلامت کبد و گوارش',
        slug: 'health-benefits-pomegranate-barberry-leather',
        summary:
          'بررسی علمی آنتی‌اکسیدان‌ها، پلی‌فنول‌ها و ویتامین‌های موجود در لواشک‌های ترش ارگانیک.',
        content: `انار و زرشک هر دو از سوپرفودهای سنتی اقلیم ایران هستند. زمانی که این میوه‌ها در دمای کنترل‌شده به لواشک تبدیل می‌شوند، بخش عمده‌ای از ویتامین C، پتاسیم و ترکیبات پلی‌فنولی آن‌ها حفظ می‌گردد.

- **پاکسازی و سم‌زدایی کبد چرب:** اسیدهای آلی طبیعی زرشک به ترشح صفرا و چربی‌سوزی کمک می‌کنند.
- **تقویت سیستم ایمنی:** مقادیر بالای ویتامین C باعث پیشگیری از سرماخوردگی و خستگی مفرط می‌شود.
- **کمک به هضم غذاهای سنگین:** مصرف یک تکه کوچک لواشک ترش بعد از غذاهای چرب محرک هضم مناسب است.`,
        featuredImage: 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=800&q=80',
        category: 'تغذیه و سلامت',
        tags: ['کبد چرب', 'زرشک', 'ویتامین C', 'سلامتی'],
        author: 'دکتر دارابی - مشاور تغذیه',
        readTimeMinutes: 5,
        isPublished: true,
        createdAt: '2026-02-25T11:00:00.000Z',
        updatedAt: '2026-02-25T11:00:00.000Z',
      },
      {
        id: 'blg-03',
        title: 'راهنمای سودآوری و خرید عمده لواشک برای فروشگاه‌ها و قنادی‌ها',
        slug: 'wholesale-lavashak-guide-retailers',
        summary:
          'چگونه اضافه کردن لاین لواشک و ترشک طبیعی می‌تواند حاشیه سود مغازه شما را تا ۴۰٪ افزایش دهد.',
        content: `در بازار امروز تقاضا برای تنقلات سالم و نوستالژیک رشد چشمگیری داشته است. قنادی‌ها و آجیل‌فروشی‌هایی که سینی‌های پذیرایی شیک و لواشک‌های فله باکیفیت را به ویترین خود افزوده‌اند، رشد فروش قابل توجهی را تجربه کرده‌اند.

در ملس‌بان کلیه سفارش‌های عمده با ضمانت ماندگاری، بسته‌بندی استاندارد صادراتی و قیمت رقابتی درب کارخانه در اختیار همکاران محترم در سراسر کشور قرار می‌گیرد.`,
        featuredImage: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&q=80',
        category: 'کسب‌وکار و فروش عمده',
        tags: ['خرید عمده', 'تأمین کالا', 'قنادی و آجیل', 'صادرات'],
        author: 'واحد بازرگانی ملس‌بان',
        readTimeMinutes: 6,
        isPublished: true,
        createdAt: '2026-03-01T08:30:00.000Z',
        updatedAt: '2026-03-01T08:30:00.000Z',
      },
    ];

    const settings: SiteSetting = {
      brandName: 'فروشگاه تخصصی لواشک ملس‌بان',
      tagline: 'طعم واقعی میوه، در هر تکه لواشک',
      supportPhone: '021-88992211',
      supportPhone2: '021-65220011',
      supportMobile: '09123456789',
      salesMobile: '09129876543',
      wholesalePhone: '021-88992211',
      supportEmail: 'info@malasban.ir',
      address: 'تهران، خیابان شریعتی، بعد از پل رومی، پلاک ۴۲، مجموعه کارگاهی ملس‌بان',
      factoryAddress: 'تهران، جاده شهریار، شهرک صنعتی نور، بلوار کارآفرینان، پلاک ۱۴، مجتمع کارگاهی ملس‌بان',
      workingHours: 'شنبه تا پنج‌شنبه از ساعت ۹:۰۰ الی ۲۱:۰۰',
      instagram: 'https://instagram.com/malasban_official',
      telegram: 'https://t.me/malasban_ir',
      whatsapp: 'https://wa.me/989123456789',
      announcementBarText: '🎉 ارسال رایگان سفارش‌های بالای ۴۰۰ هزار تومان | ضمانت اصالت ۱۰۰٪ پوره طبیعی میوه',
      announcementBarLink: '/shop',
      isAnnouncementActive: true,
      heroTitle: 'طعم واقعی میوه، در هر تکه لواشک',
      heroSubtitle: 'ملس‌بان، طعم‌های خاطره‌انگیز و اصیل ایرانی را با خالص‌ترین پوره‌های انار، زرشک، آلبالو و زردآلو به خانه‌های شما می‌آورد. ۱۰۰٪ طبیعی، سرشار از ویتامین، با بسته‌بندی بهداشتی تک‌نفره و مجلسی.',
      heroBadge: 'فرآوری سنتی با بالاترین استانداردهای بهداشتی روز',
      heroImageUrl: 'https://images.unsplash.com/photo-1541344999736-83eca872f242?w=900&q=80',
      promoBannerTitle: 'جشنواره ترش و شیرین ملس‌بان',
      promoBannerText: 'تخفیف‌های هیجان‌انگیز روی سینی‌های پذیرایی و بسته‌های هدیه مخلوط ترشک و لواشک ارگانیک',
      promoBannerDiscount: 'تا ۳۰٪ تخفیف ویژه',
      promoBannerImageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=900&q=80',
      freeShippingThreshold: 400000,
      standardShippingFee: 45000,
      wholesaleMinOrderKg: 20,
      wholesaleTiers: [
        {
          id: 'tier-1',
          tierName: 'برنزی (فروشگاهی)',
          minQuantityKg: 20,
          maxQuantityKg: 50,
          discountPercent: 15,
          packaging: 'کارتن‌های ۵ و ۱۰ کیلویی',
          shippingCondition: 'تیپاکس یا باربری',
          description: 'مناسب برای سوپرمارکت‌ها، لبنیاتی‌ها و فروشگاه‌های محلی',
        },
        {
          id: 'tier-2',
          tierName: 'نقره‌ای (قنادی‌ها و پخش استانی)',
          minQuantityKg: 50,
          maxQuantityKg: 200,
          discountPercent: 25,
          packaging: 'کارتن‌های مادر وکیوم',
          shippingCondition: 'ارسال رایگان به باربری',
          description: 'ویژه قنادی‌ها، خشکبارفروشان و شبکه‌های توزیع استانی',
        },
        {
          id: 'tier-3',
          tierName: 'طلایی (صادراتی و تناژ بالا)',
          minQuantityKg: 200,
          maxQuantityKg: null,
          discountPercent: 35,
          packaging: 'پالت و وکیوم صادراتی استاندارد',
          shippingCondition: 'تحویل درب انبار خریدار یا گمرک',
          description: 'بهترین قیمت رقابتی برای بازرگانان، شرکت‌های صادراتی و خریداران عمده کشوری',
        },
      ],
      faqs: [
        {
          id: 'faq-1',
          q: 'آیا در تهیه لواشک‌های ملس‌بان از شکر یا جوهر لیمو استفاده می‌شود؟',
          a: 'خیر، به هیچ وجه! تمام محصولات ملس‌بان از ۱۰۰٪ پوره میوه طبیعی تهیه شده و ترشی آن کاملاً حاصل اسیدهای ارگانیک میوه (مانند اسید مالیک و اسید تارتاریک طبیعی) است و هیچ‌گونه شکر مصنوعی یا افزودنی سنتتیک به آن اضافه نمی‌شود.',
          category: 'کیفیت و سلامت',
        },
        {
          id: 'faq-2',
          q: 'حداقل میزان سفارش در بخش فروش عمده چقدر است؟',
          a: 'حداقل سفارش عمده ۲۰ کیلوگرم یا یک کارتن مادر استاندارد است. برای سفارش‌های بالای ۱۰۰ کیلوگرم تخفیف‌های پلکانی ویژه همکاران در نظر گرفته شده است.',
          category: 'فروش عمده',
        },
        {
          id: 'faq-3',
          q: 'سفارش‌ها چگونه ارسال می‌شوند و چند روزه به دست ما می‌رسند؟',
          a: 'سفارش‌های تهران با پیک سریع و سفارش‌های شهرستان با پست پیشتاز یا تیپاکس ارسال می‌گردد. زمان تحویل در تهران همان روز یا حداکثر ۲۴ ساعت و برای شهرستان‌ها بین ۲ الی ۳ روز کاری است.',
          category: 'ارسال و پیگیری',
        },
        {
          id: 'faq-4',
          q: 'شرایط نگهداری لواشک‌ها برای ماندگاری بیشتر چیست؟',
          a: 'از آنجایی که مواد نگهدارنده شیمیایی در محصولات وجود ندارد، بهتر است لواشک‌ها در جای خشک، خنک و دور از نور مستقیم خورشید (یا داخل یخچال) نگهداری شوند. در این شرایط تا ۶ ماه طراوت اولیه خود را حفظ می‌کنند.',
          category: 'نگهداری و مصرف',
        },
      ],
    };

    const chatSettings: ChatSettings = {
      isOnline: true,
      workingHoursStart: '08:30',
      workingHoursEnd: '22:30',
      autoWelcomeMessage: 'سلام و وقت بخیر به پشتیبانی ملس‌بان خوش آمدید! 👋 چطور می‌تونیم کمکتون کنیم؟ برای دریافت راهنمایی فوری می‌توانید از گزینه‌های زیر استفاده کنید یا پیام خود را تایپ فرمایید.',
      offlineMessage: 'در حال حاضر در ساعات استراحت کارشناسان ملس‌بان هستیم (ساعات پاسخگویی: ۸:۳۰ تا ۲۲:۳۰). پیام و شماره همراه خود را بگذارید تا صبح در اولین فرصت بررسی و خدمتتان تماس بگیریم.',
      exitIntentMessage: 'قبل از خروج! ۲۵٪ تخفیف ویژه خرید اول شما فعال است (کد: FIRSTBUY) 🎁 اگر در انتخاب طعم یا نحوه ارسال سوالی دارید همین الان از ما بپرسید!',
      enableSoundNotifications: true,
      enableAiAssistant: true,
      operatorName: 'خانم رضایی',
      operatorTitle: 'کارشناس ارشد مشاوره و پشتیبانی فروش',
    };

    const cannedResponses: CannedResponse[] = [
      {
        id: 'cn-1',
        shortcut: '/hello',
        title: 'خوش‌آمدگویی صمیمانه',
        content: 'سلام و درود خدمت شما دوست گرامی! امیدوارم روزتون پر از انرژی باشه. بفرمایید چطور می‌تونم راهنماییتون کنم؟ 😊',
        category: 'عمومی',
      },
      {
        id: 'cn-2',
        shortcut: '/shipping',
        title: 'نحوه و زمان ارسال سفارشات',
        content: 'سفارش‌های تهران با پیک سریع اختصاصی ارسال می‌شوند. سفارش‌های سایر استان‌ها از طریق پست پیشتاز و تیپاکس با بسته‌بندی کاملاً ضربه‌گیر و بهداشتی ظرف ۲ الی ۳ روز کاری تحویل می‌گردند. برای خریدهای بالای ۶۰۰ هزار تومان ارسال رایگان است! 🚚',
        category: 'ارسال',
      },
      {
        id: 'cn-3',
        shortcut: '/taste',
        title: 'راهنمای انتخاب ترشی و طعم‌ها',
        content: 'محصولات ملس‌بان از نظر ترشی در ۴ دسته هستند: خیلی ترش (انار وحشی ساوه و آلبالو کوهی)، ملس متمایل به ترش (آلو قرمز جنگلی و کیک‌های مجلسی)، ملس شیرین (زردآلو و سیب باغی). شما به کدام سطح ترشی علاقه‌مندید تا دقیق راهنمایی کنم؟ 🍒',
        category: 'محصولات',
      },
      {
        id: 'cn-4',
        shortcut: '/wholesale',
        title: 'اطلاعات سفارش عمده و همکار',
        content: 'برای سفارش‌های عمده قنادی‌ها، کافی‌شاپ‌ها و فروشگاه‌های ارگانیک، تخفیف‌های ویژه ۱۵٪ الی ۳۵٪ اعمال می‌شود. حداقل تیراژ سفارش عمده ۲۰ کیلوگرم بوده و با باربری به تمام نقاط کشور ارسال می‌شود. 💼',
        category: 'فروش عمده',
      },
      {
        id: 'cn-5',
        shortcut: '/card',
        title: 'اطلاعات حساب کارت به کارت',
        content: 'شماره کارت جهت واریز وجه سفارش:\n۶۰۳۷-۹۹۷۵-۱۱۲۲-۳۳۴۴\nبانک ملی ایران - به نام فروشگاه ارگانیک ملس‌بان\nلطفاً پس از پرداخت، تصویر فیش و ۴ رقم آخر شماره کارت را در چت ارسال فرمایید. 💳',
        category: 'مالی',
      },
      {
        id: 'cn-6',
        shortcut: '/thanks',
        title: 'تشکر و آرزوی سلامتی',
        content: 'از اعتماد و همراهی صمیمانه شما با خانواده ملس‌بان بی‌نهایت سپاسگزاریم! لحظات شاد و طعم‌های دلپذیری برای شما آرزومندیم. هر زمان سوال یا راهنمایی لازم بود مجدداً در خدمتتون هستیم. ❤️',
        category: 'عمومی',
      },
    ];

    const conv1Id = 'conv-sample-01';
    const conv2Id = 'conv-sample-02';
    const conv3Id = 'conv-sample-03';

    const chatConversations: ChatConversation[] = [
      {
        id: conv1Id,
        customerId: 'usr-customer-01',
        customerName: 'فاطمه موسوی',
        customerMobile: '09123456789',
        customerEmail: 'fatemeh@example.com',
        assignedAgentId: 'usr-admin-01',
        assignedAgentName: 'خانم رضایی',
        status: 'active',
        priority: 'urgent',
        tags: ['مشاوره خرید', 'پیگیری مرسوله'],
        unreadCustomerCount: 0,
        unreadAgentCount: 1,
        lastMessageText: 'سلام، می‌خواستم بدونم سفارش من کی به دستم می‌رسه؟',
        lastMessageTime: new Date(Date.now() - 15 * 60000).toISOString(),
        lastSender: 'customer',
        summary: 'مشتری درباره زمان تحویل سفارش MLB-1403-1024 سوال کرد و راهنمایی کد پیگیری تیپاکس به ایشان ارائه شد.',
        contextProduct: {
          id: 'prod-01',
          name: 'لواشک انار ترش ساوه',
          price: 98000,
          discountPrice: 85000,
          image: 'https://images.unsplash.com/photo-1541256942802-7b29965b77c4?w=600&auto=format&fit=crop&q=80',
          inStock: true,
          slug: 'saveh-sour-pomegranate-lavashak',
        },
        createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 15 * 60000).toISOString(),
      },
      {
        id: conv2Id,
        customerName: 'مهرداد کاظمی (کافه ترنج)',
        customerMobile: '09355554433',
        assignedAgentId: 'usr-staff-01',
        assignedAgentName: 'علیرضا صادقی',
        status: 'active',
        priority: 'normal',
        tags: ['خرید عمده', 'تخفیف همکاری'],
        unreadCustomerCount: 0,
        unreadAgentCount: 0,
        lastMessageText: 'پیشنهاد قیمت برای ۵۰ کیلوگرم کیک و پک لواشکی پذیرفته شد.',
        lastMessageTime: new Date(Date.now() - 3 * 3600000).toISOString(),
        lastSender: 'agent',
        summary: 'مذاکره برای خرید عمده ۵۰ کیلوگرم لواشک جهت سرو در کافه، توافق روی تخفیف ۲۵٪ همکاری.',
        createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
      },
      {
        id: conv3Id,
        customerName: 'سارا امینی',
        customerMobile: '09128887766',
        status: 'closed',
        priority: 'low',
        tags: ['مشاوره طعم', 'رضایت عالی'],
        unreadCustomerCount: 0,
        unreadAgentCount: 0,
        lastMessageText: 'خیلی ممنون از راهنمایی عالی و ارسال سریع‌تون!',
        lastMessageTime: new Date(Date.now() - 48 * 3600000).toISOString(),
        lastSender: 'customer',
        rating: 5,
        feedback: 'پاسخگویی بسیار صبورانه و ارسال فوق‌العاده با بسته‌بندی تمیز.',
        summary: 'راهنمایی انتخاب هدیه پک چوبی برای تولد و ارسال به موقع با پیک تهران.',
        createdAt: new Date(Date.now() - 52 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 48 * 3600000).toISOString(),
      },
    ];

    const chatMessages: ChatMessage[] = [
      {
        id: 'msg-01',
        conversationId: conv1Id,
        sender: 'system',
        senderName: 'سیستم ملس‌بان',
        text: 'گفتگو با واحد پشتیبانی و مشاوره تخصصی ملس‌بان آغاز شد.',
        createdAt: new Date(Date.now() - 110 * 60000).toISOString(),
      },
      {
        id: 'msg-02',
        conversationId: conv1Id,
        sender: 'bot',
        senderName: 'دستیار هوشمند ملس‌بان',
        text: 'سلام فاطمه عزیز! خوشحالیم که همراه ملس‌بان هستید. چطور می‌تونم بهتون کمک کنم؟ 😊',
        createdAt: new Date(Date.now() - 105 * 60000).toISOString(),
        quickReplies: ['پیگیری سفارش من', 'مشاوره درجه ترشی طعم‌ها', 'اتصال به اپراتور انسانی'],
      },
      {
        id: 'msg-03',
        conversationId: conv1Id,
        sender: 'customer',
        senderName: 'فاطمه موسوی',
        text: 'سلام وقت بخیر، سفارشم با شماره MLB-1403-1024 در چه وضعیتی قرار داره؟',
        createdAt: new Date(Date.now() - 90 * 60000).toISOString(),
        status: 'read',
      },
      {
        id: 'msg-04',
        conversationId: conv1Id,
        sender: 'bot',
        senderName: 'دستیار هوشمند ملس‌بان',
        text: 'اطلاعات سفارش شما با موفقیت پیدا شد:',
        order: {
          id: 'ord-1001',
          orderNumber: 'MLB-1403-1024',
          status: 'Shipped',
          paymentStatus: 'Successful',
          totalAmount: 325000,
          createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
          itemsCount: 3,
          customerName: 'فاطمه موسوی',
        },
        createdAt: new Date(Date.now() - 88 * 60000).toISOString(),
      },
      {
        id: 'msg-05',
        conversationId: conv1Id,
        sender: 'agent',
        senderName: 'خانم رضایی',
        text: 'سلام فاطمه عزیز! مرسوله شما دیروز تحویل تیپاکس شده و کد رهگیری آن به شماره همراهتون پیامک شد. طبق پیگیری ما فردا قبل از ظهر به دستتون می‌رسه. اگر محصول دیگری هم مایل بودید اضافه کنید بفرمایید.',
        product: {
          id: 'prod-02',
          name: 'لواشک آلبالو کوهی دست‌چین',
          price: 98000,
          discountPrice: 85000,
          image: 'https://images.unsplash.com/photo-1541256942802-7b29965b77c4?w=600&auto=format&fit=crop&q=80',
          inStock: true,
          slug: 'mountain-cherry-sour-lavashak',
        },
        createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
        status: 'read',
      },
      {
        id: 'msg-06',
        conversationId: conv1Id,
        sender: 'customer',
        senderName: 'فاطمه موسوی',
        text: 'بسیار عالی، خیلی ممنونم از پیگیری دقیقتون! آلبالو کوهی رو هم به سبد خریدم اضافه کردم. 🙏',
        createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
        status: 'delivered',
      },
      // Thread for Mehrdad Kazemi (Cafe Toranj)
      {
        id: 'msg-k01',
        conversationId: conv2Id,
        sender: 'system',
        senderName: 'سیستم ملس‌بان',
        text: 'گفتگو جهت استعلام و ثبت سفارش عمده کافه ترنج شیراز آغاز شد.',
        createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
      },
      {
        id: 'msg-k02',
        conversationId: conv2Id,
        sender: 'customer',
        senderName: 'مهرداد کاظمی (کافه ترنج)',
        text: 'سلام و وقت بخیر، ما برای کافه ترنج در شیراز می‌خواستیم ماهانه حداقل ۵۰ کیلوگرم لواشک ورقه‌ای و پک پذیرایی تهیه کنیم. شرایط همکاری عمده و درصد تخفیف چطور است؟',
        createdAt: new Date(Date.now() - 23 * 3600000).toISOString(),
        status: 'read',
      },
      {
        id: 'msg-k03',
        conversationId: conv2Id,
        sender: 'agent',
        senderName: 'علیرضا صادقی',
        text: 'درود جناب کاظمی عزیز! برای سفارش‌های بالای ۳۰ کیلوگرم، تخفیف همکاری ۲۵ درصدی به همراه ارسال رایگان با باربری لحاظ می‌گردد. همچنین امکان بسته‌بندی با لوگوی کافه نیز مهیا است.',
        createdAt: new Date(Date.now() - 20 * 3600000).toISOString(),
        status: 'read',
      },
      {
        id: 'msg-k04',
        conversationId: conv2Id,
        sender: 'customer',
        senderName: 'مهرداد کاظمی (کافه ترنج)',
        text: 'عالیه، کیفیت طعم‌های ترش و ملس به ویژه لواشک انار ساوه و زرشک کوهی برای ما اولویت داره. آیا امکان ارسال سمپل تست وجود داره؟',
        createdAt: new Date(Date.now() - 16 * 3600000).toISOString(),
        status: 'read',
      },
      {
        id: 'msg-k05',
        conversationId: conv2Id,
        sender: 'agent',
        senderName: 'علیرضا صادقی',
        text: 'بله حتماً، یک پک سمپل تست شامل ۶ طعم محبوب با تیپاکس ارسال شد. کد پیگیری: TP-99882211.',
        createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
        status: 'read',
      },
      {
        id: 'msg-k06',
        conversationId: conv2Id,
        sender: 'customer',
        senderName: 'مهرداد کاظمی (کافه ترنج)',
        text: 'سمپل‌ها به دستمون رسید، طعم انار و آلو جنگلی فوق‌العاده باکیفیت بود. تاییدیه نهایی برای ۵۰ کیلوگرم را خدمت شما اعلام می‌کنم.',
        createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
        status: 'read',
      },
      {
        id: 'msg-k07',
        conversationId: conv2Id,
        sender: 'agent',
        senderName: 'علیرضا صادقی',
        text: 'پیشنهاد قیمت برای ۵۰ کیلوگرم کیک و پک لواشکی پذیرفته شد. پیش‌فاکتور رسمی در سامانه صادر شد و فردا بارگیری انجام می‌شود.',
        createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
        status: 'read',
      },
      // Thread for Sara Amini
      {
        id: 'msg-s01',
        conversationId: conv3Id,
        sender: 'system',
        senderName: 'سیستم ملس‌بان',
        text: 'گفتگو درباره انتخاب پک کادویی و مشاوره درجه ترشی آغاز شد.',
        createdAt: new Date(Date.now() - 52 * 3600000).toISOString(),
      },
      {
        id: 'msg-s02',
        conversationId: conv3Id,
        sender: 'customer',
        senderName: 'سارا امینی',
        text: 'سلام وقت بخیر، من برای تولد دوستم می‌خواستم یک پک کادویی ترش و ملس بخرم، بین باکس چوبی لوکس و پک پذیرایی ملس‌بان کدوم رو پیشنهاد می‌کنید؟',
        createdAt: new Date(Date.now() - 51 * 3600000).toISOString(),
        status: 'read',
      },
      {
        id: 'msg-s03',
        conversationId: conv3Id,
        sender: 'bot',
        senderName: 'دستیار هوشمند ملس‌بان',
        text: 'سلام سارا عزیز! باکس چوبی لوکس ملس‌بان با ربان‌پیچی شیک و ترکیب ۸ طعم محلی دست‌چین، پرفروش‌ترین و محبوب‌ترین هدیه ماست.',
        createdAt: new Date(Date.now() - 50 * 3600000).toISOString(),
      },
      {
        id: 'msg-s04',
        conversationId: conv3Id,
        sender: 'agent',
        senderName: 'خانم رضایی',
        text: 'سلام خانم امینی عزیز، روزتون بخیر! علاوه بر زیبایی باکس چوبی، امکان درج کارت پستال تبریک اختصاصی با متن دلخواه شما هم رایگان انجام می‌شه و با پیک مستقیم به آدرس دوستتون ارسال می‌کنیم.',
        createdAt: new Date(Date.now() - 49 * 3600000).toISOString(),
        status: 'read',
      },
      {
        id: 'msg-s05',
        conversationId: conv3Id,
        sender: 'customer',
        senderName: 'سارا امینی',
        text: 'خیلی ممنون از راهنمایی عالی و ارسال سریع‌تون! بسته سر موقع و با تزئین بسیار زیبا تحویل شد، دوستم خیلی ذوق‌زده شد. 🌹',
        createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
        status: 'read',
      },
    ];

    return {
      users: [adminUser, demoUser],
      categories,
      products,
      orders,
      coupons,
      wholesaleRequests,
      reviews,
      blogPosts,
      settings,
      chatConversations,
      chatMessages,
      chatSettings,
      cannedResponses,
    };
  }
}

export const db = new DatabaseContext();
