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

// Runtime cache hydrated from PostgreSQL before the HTTP server starts.
// JSON files are deliberately not read or written.
class DatabaseContext {
  private data: DatabaseSchema;

  constructor() {
    // Temporary seed-shaped structure is never served: server startup is blocked
    // until initFromPostgres successfully replaces it with database contents.
    this.data = {
      users: [],
      categories: [],
      products: [],
      orders: [],
      coupons: [],
      wholesaleRequests: [],
      reviews: [],
      blogPosts: [],
      settings: {} as SiteSetting,
      chatConversations: [],
      chatMessages: [],
      chatSettings: {} as ChatSettings,
      cannedResponses: [],
    };
  }

  private syncTimeout: NodeJS.Timeout | null = null;
  private triggerPgSync() {
    if (this.syncTimeout) return;
    this.syncTimeout = setTimeout(async () => {
      this.syncTimeout = null;
      try {
        const isPg = await checkPgConnection();
        if (!isPg) throw new Error('PostgreSQL connection is unavailable.');
        const result = await syncSchemaToPostgres(this.data);
        if (!result.success) throw new Error(result.error || 'PostgreSQL sync failed.');
      } catch (err) {
        console.error('[PostgreSQL persistence error]', err);
      }
    }, 500);
  }

  public persist() {
    // Legacy synchronous services mutate the cache; persist changes to PostgreSQL.
    // This is transitional: direct repository-based CRUD is required for safe
    // multi-instance/concurrent production use.
    this.triggerPgSync();
  }

  public async initFromPostgres(): Promise<boolean> {
    try {
      const isPg = await checkPgConnection();
      if (!isPg) throw new Error('PostgreSQL is unavailable. Refusing to start without the configured database.');
      const loaded = await loadFullDatabaseFromPostgres();
      if (!loaded) throw new Error('PostgreSQL has no initialized application data. Run database migrations and seed data before starting the server.');
      this.data = loaded;
      console.log(`[PostgreSQL Engine] Loaded ${loaded.products.length} products, ${loaded.orders.length} orders, and ${loaded.users.length} users.`);
      return true;
    } catch (e: any) {
      console.error('[PostgreSQL Engine] Required initialization failed:', e.message);
      throw e;
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


}

export const db = new DatabaseContext();
