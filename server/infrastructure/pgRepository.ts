import pg from 'pg';
import {
  User,
  Address,
  Product,
  Category,
  Order,
  OrderItem,
  Coupon,
  WholesaleRequest,
  Review,
  BlogPost,
  SiteSetting,
  ChatConversation,
  ChatMessage,
  ChatSettings,
  CannedResponse,
  OrderStatus,
  PaymentStatus,
  WholesaleStatus,
  SournessLevel,
} from '../domain/models.js';
import { createPgPool } from './dbMigrator.js';
import { DatabaseSchema } from './db.js';

let pool: pg.Pool | null = null;
let pgConnected = false;
let lastCheckTime = 0;

export function getPgPool(): pg.Pool {
  if (!pool) {
    pool = createPgPool();
    pool.on('error', (err) => {
      console.warn('[PostgreSQL Pool Warning]:', err.message);
      pgConnected = false;
    });
  }
  return pool;
}

/**
 * Check if PostgreSQL database is reachable
 */
export async function checkPgConnection(): Promise<boolean> {
  const now = Date.now();
  // Cache check for 10 seconds to avoid ping storm
  if (now - lastCheckTime < 10000 && pgConnected) {
    return true;
  }
  lastCheckTime = now;

  try {
    const p = getPgPool();
    const client = await p.connect();
    try {
      await client.query('SELECT 1');
      pgConnected = true;
      return true;
    } finally {
      client.release();
    }
  } catch (err: any) {
    pgConnected = false;
    return false;
  }
}

export function isPgConnected(): boolean {
  return pgConnected;
}

export function setPgConnected(val: boolean) {
  pgConnected = val;
}

// ============================================================================
// 1. USERS & ADDRESSES REPOSITORY
// ============================================================================
export const pgUsersRepository = {
  async getAll(): Promise<User[]> {
    const p = getPgPool();
    const usersRes = await p.query(
      `SELECT id, name, family, email, mobile, password_hash, salt, role, permissions, is_active, created_at, updated_at
       FROM users ORDER BY created_at DESC`
    );

    const addressesRes = await p.query(
      `SELECT id, user_id, title, recipient_name, mobile, province, city, address, postal_code, plaque, unit, is_default
       FROM addresses ORDER BY is_default DESC, created_at ASC`
    );

    const addressMap = new Map<string, Address[]>();
    for (const a of addressesRes.rows) {
      const addrList = addressMap.get(a.user_id) || [];
      addrList.push({
        id: a.id,
        title: a.title,
        receiverName: a.recipient_name,
        receiverMobile: a.mobile,
        province: a.province,
        city: a.city,
        fullAddress: a.address,
        postalCode: a.postal_code,
        plaque: a.plaque,
        unit: a.unit,
        isDefault: Boolean(a.is_default),
      });
      addressMap.set(a.user_id, addrList);
    }

    return usersRes.rows.map((row) => ({
      id: row.id,
      name: row.name,
      family: row.family,
      email: row.email,
      mobile: row.mobile,
      passwordHash: row.password_hash,
      salt: row.salt,
      role: row.role,
      isSuperAdmin: row.role === 'SuperAdmin',
      permissions: typeof row.permissions === 'string' ? JSON.parse(row.permissions) : row.permissions || [],
      isActive: Boolean(row.is_active),
      createdAt: row.created_at?.toISOString ? row.created_at.toISOString() : String(row.created_at),
      updatedAt: row.updated_at?.toISOString ? row.updated_at.toISOString() : String(row.updated_at),
      addresses: addressMap.get(row.id) || [],
    }));
  },

  async getById(id: string): Promise<User | null> {
    const p = getPgPool();
    const res = await p.query(
      `SELECT id, name, family, email, mobile, password_hash, salt, role, permissions, is_active, created_at, updated_at
       FROM users WHERE id = $1`,
      [id]
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];

    const addrRes = await p.query(
      `SELECT id, user_id, title, recipient_name, mobile, province, city, address, postal_code, plaque, unit, is_default
       FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at ASC`,
      [id]
    );

    const addresses: Address[] = addrRes.rows.map((a) => ({
      id: a.id,
      title: a.title,
      receiverName: a.recipient_name,
      receiverMobile: a.mobile,
      province: a.province,
      city: a.city,
      fullAddress: a.address,
      postalCode: a.postal_code,
      plaque: a.plaque,
      unit: a.unit,
      isDefault: Boolean(a.is_default),
    }));

    return {
      id: row.id,
      name: row.name,
      family: row.family,
      email: row.email,
      mobile: row.mobile,
      passwordHash: row.password_hash,
      salt: row.salt,
      role: row.role,
      isSuperAdmin: row.role === 'SuperAdmin',
      permissions: typeof row.permissions === 'string' ? JSON.parse(row.permissions) : row.permissions || [],
      isActive: Boolean(row.is_active),
      createdAt: row.created_at?.toISOString ? row.created_at.toISOString() : String(row.created_at),
      updatedAt: row.updated_at?.toISOString ? row.updated_at.toISOString() : String(row.updated_at),
      addresses,
    };
  },

  async findByEmailOrMobile(identifier: string): Promise<User | null> {
    const clean = identifier.trim().toLowerCase();
    const p = getPgPool();
    const res = await p.query(
      `SELECT id, name, family, email, mobile, password_hash, salt, role, permissions, is_active, created_at, updated_at
       FROM users WHERE LOWER(email) = $1 OR mobile = $1`,
      [clean]
    );
    if (res.rows.length === 0) return null;
    return this.getById(res.rows[0].id);
  },

  async create(user: User): Promise<User> {
    const p = getPgPool();
    const client = await p.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO users (id, name, family, email, mobile, password_hash, salt, role, permissions, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          user.id,
          user.name,
          user.family || '',
          user.email || null,
          user.mobile,
          user.passwordHash,
          user.salt,
          user.role || 'Customer',
          JSON.stringify(user.permissions || []),
          user.isActive !== false,
          user.createdAt || new Date().toISOString(),
          user.updatedAt || new Date().toISOString(),
        ]
      );

      if (Array.isArray(user.addresses)) {
        for (const addr of user.addresses) {
          await client.query(
            `INSERT INTO addresses (id, user_id, title, recipient_name, mobile, province, city, address, postal_code, plaque, unit, is_default)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              addr.id,
              user.id,
              addr.title || 'خانه',
              addr.receiverName || `${user.name} ${user.family || ''}`.trim(),
              addr.receiverMobile || user.mobile,
              addr.province,
              addr.city,
              addr.fullAddress,
              addr.postalCode,
              addr.plaque || '۱',
              addr.unit || '۱',
              Boolean(addr.isDefault),
            ]
          );
        }
      }
      await client.query('COMMIT');
      return user;
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  },

  async update(id: string, updates: Partial<User>): Promise<boolean> {
    const p = getPgPool();
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(updates.name);
    }
    if (updates.family !== undefined) {
      fields.push(`family = $${idx++}`);
      values.push(updates.family);
    }
    if (updates.email !== undefined) {
      fields.push(`email = $${idx++}`);
      values.push(updates.email);
    }
    if (updates.mobile !== undefined) {
      fields.push(`mobile = $${idx++}`);
      values.push(updates.mobile);
    }
    if (updates.passwordHash !== undefined) {
      fields.push(`password_hash = $${idx++}`);
      values.push(updates.passwordHash);
    }
    if (updates.salt !== undefined) {
      fields.push(`salt = $${idx++}`);
      values.push(updates.salt);
    }
    if (updates.role !== undefined) {
      fields.push(`role = $${idx++}`);
      values.push(updates.role);
    }
    if (updates.permissions !== undefined) {
      fields.push(`permissions = $${idx++}`);
      values.push(JSON.stringify(updates.permissions));
    }
    if (updates.isActive !== undefined) {
      fields.push(`is_active = $${idx++}`);
      values.push(updates.isActive);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}`;
    const res = await p.query(query, values);
    return (res.rowCount || 0) > 0;
  },

  async delete(id: string): Promise<boolean> {
    const p = getPgPool();
    const res = await p.query(`DELETE FROM users WHERE id = $1`, [id]);
    return (res.rowCount || 0) > 0;
  },

  async addAddress(userId: string, address: Address): Promise<Address> {
    const p = getPgPool();
    if (address.isDefault) {
      await p.query(`UPDATE addresses SET is_default = FALSE WHERE user_id = $1`, [userId]);
    }
    await p.query(
      `INSERT INTO addresses (id, user_id, title, recipient_name, mobile, province, city, address, postal_code, plaque, unit, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        address.id,
        userId,
        address.title,
        address.receiverName,
        address.receiverMobile,
        address.province,
        address.city,
        address.fullAddress,
        address.postalCode,
        address.plaque || '۱',
        address.unit || '۱',
        Boolean(address.isDefault),
      ]
    );
    return address;
  },

  async setDefaultAddress(userId: string, addressId: string): Promise<boolean> {
    const p = getPgPool();
    const client = await p.connect();
    try {
      await client.query('BEGIN');
      await client.query(`UPDATE addresses SET is_default = FALSE WHERE user_id = $1`, [userId]);
      await client.query(`UPDATE addresses SET is_default = TRUE WHERE id = $1 AND user_id = $2`, [addressId, userId]);
      await client.query('COMMIT');
      return true;
    } catch (e) {
      await client.query('ROLLBACK').catch(() => {});
      return false;
    } finally {
      client.release();
    }
  },

  async deleteAddress(addressId: string): Promise<boolean> {
    const p = getPgPool();
    const res = await p.query(`DELETE FROM addresses WHERE id = $1`, [addressId]);
    return (res.rowCount || 0) > 0;
  },
};

// ============================================================================
// 2. CATEGORIES REPOSITORY
// ============================================================================
export const pgCategoriesRepository = {
  async getAll(activeOnly = false): Promise<Category[]> {
    const p = getPgPool();
    const query = activeOnly
      ? `SELECT id, name, slug, description, image_url, display_order, is_active FROM categories WHERE is_active = TRUE ORDER BY display_order ASC`
      : `SELECT id, name, slug, description, image_url, display_order, is_active FROM categories ORDER BY display_order ASC`;
    const res = await p.query(query);
    return res.rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description || '',
      imageUrl: row.image_url || undefined,
      displayOrder: row.display_order || 0,
      isActive: Boolean(row.is_active),
    }));
  },

  async getById(id: string): Promise<Category | null> {
    const p = getPgPool();
    const res = await p.query(
      `SELECT id, name, slug, description, image_url, display_order, is_active FROM categories WHERE id = $1`,
      [id]
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description || '',
      imageUrl: row.image_url || undefined,
      displayOrder: row.display_order || 0,
      isActive: Boolean(row.is_active),
    };
  },

  async getBySlug(slug: string): Promise<Category | null> {
    const p = getPgPool();
    const res = await p.query(
      `SELECT id, name, slug, description, image_url, display_order, is_active FROM categories WHERE slug = $1`,
      [slug]
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description || '',
      imageUrl: row.image_url || undefined,
      displayOrder: row.display_order || 0,
      isActive: Boolean(row.is_active),
    };
  },

  async create(cat: Category): Promise<Category> {
    const p = getPgPool();
    await p.query(
      `INSERT INTO categories (id, name, slug, description, image_url, display_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [cat.id, cat.name, cat.slug, cat.description || '', cat.imageUrl || null, cat.displayOrder || 0, cat.isActive !== false]
    );
    return cat;
  },

  async update(id: string, updates: Partial<Category>): Promise<boolean> {
    const p = getPgPool();
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(updates.name);
    }
    if (updates.slug !== undefined) {
      fields.push(`slug = $${idx++}`);
      values.push(updates.slug);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(updates.description);
    }
    if (updates.imageUrl !== undefined) {
      fields.push(`image_url = $${idx++}`);
      values.push(updates.imageUrl);
    }
    if (updates.displayOrder !== undefined) {
      fields.push(`display_order = $${idx++}`);
      values.push(updates.displayOrder);
    }
    if (updates.isActive !== undefined) {
      fields.push(`is_active = $${idx++}`);
      values.push(updates.isActive);
    }

    if (fields.length === 0) return false;
    values.push(id);
    const res = await p.query(`UPDATE categories SET ${fields.join(', ')} WHERE id = $${idx}`, values);
    return (res.rowCount || 0) > 0;
  },

  async delete(id: string): Promise<boolean> {
    const p = getPgPool();
    const res = await p.query(`DELETE FROM categories WHERE id = $1`, [id]);
    return (res.rowCount || 0) > 0;
  },
};

// ============================================================================
// 3. PRODUCTS REPOSITORY
// ============================================================================
export const pgProductsRepository = {
  async getAll(filters?: { categoryId?: string; isWholesale?: boolean; activeOnly?: boolean; search?: string }): Promise<Product[]> {
    const p = getPgPool();
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (filters?.activeOnly !== false) {
      conditions.push(`p.is_active = TRUE`);
    }
    if (filters?.categoryId) {
      conditions.push(`p.category_id = $${idx++}`);
      values.push(filters.categoryId);
    }
    if (filters?.isWholesale !== undefined) {
      conditions.push(`p.is_wholesale = $${idx++}`);
      values.push(filters.isWholesale);
    }
    if (filters?.search) {
      conditions.push(`(p.name ILIKE $${idx} OR p.description ILIKE $${idx} OR p.slug ILIKE $${idx})`);
      values.push(`%${filters.search}%`);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY c.display_order ASC, p.created_at DESC
    `;

    const res = await p.query(query, values);
    return res.rows.map((r) => this.mapRowToProduct(r));
  },

  async getById(id: string): Promise<Product | null> {
    const p = getPgPool();
    const res = await p.query(
      `SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = $1`,
      [id]
    );
    if (res.rows.length === 0) return null;
    return this.mapRowToProduct(res.rows[0]);
  },

  async getBySlug(slug: string): Promise<Product | null> {
    const p = getPgPool();
    const res = await p.query(
      `SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.slug = $1`,
      [slug]
    );
    if (res.rows.length === 0) return null;
    return this.mapRowToProduct(res.rows[0]);
  },

  async create(prod: Product): Promise<Product> {
    const p = getPgPool();
    await p.query(
      `INSERT INTO products (
        id, name, slug, category_id, price, discount_price, stock_quantity,
        weight_grams, sourness_level, short_description, description,
        main_image, gallery_images, is_wholesale, is_featured, is_active, display_order, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
      [
        prod.id,
        prod.name,
        prod.slug,
        prod.categoryId,
        prod.price,
        prod.discountPrice || null,
        prod.stockQuantity || 0,
        prod.weightGrams || 100,
        prod.sournessLevel || 'SweetSour',
        prod.shortDescription || '',
        prod.description || '',
        prod.mainImage || '',
        JSON.stringify(prod.images || [prod.mainImage]),
        prod.isWholesaleAvailable !== false,
        Boolean(prod.isFeatured),
        prod.isActive !== false,
        0,
        prod.createdAt || new Date().toISOString(),
        prod.updatedAt || new Date().toISOString(),
      ]
    );
    return prod;
  },

  async update(id: string, updates: Partial<Product>): Promise<boolean> {
    const p = getPgPool();
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (updates.name !== undefined) { fields.push(`name = $${idx++}`); values.push(updates.name); }
    if (updates.slug !== undefined) { fields.push(`slug = $${idx++}`); values.push(updates.slug); }
    if (updates.categoryId !== undefined) { fields.push(`category_id = $${idx++}`); values.push(updates.categoryId); }
    if (updates.price !== undefined) { fields.push(`price = $${idx++}`); values.push(updates.price); }
    if (updates.discountPrice !== undefined) { fields.push(`discount_price = $${idx++}`); values.push(updates.discountPrice); }
    if (updates.stockQuantity !== undefined) { fields.push(`stock_quantity = $${idx++}`); values.push(updates.stockQuantity); }
    if (updates.weightGrams !== undefined) { fields.push(`weight_grams = $${idx++}`); values.push(updates.weightGrams); }
    if (updates.sournessLevel !== undefined) { fields.push(`sourness_level = $${idx++}`); values.push(updates.sournessLevel); }
    if (updates.shortDescription !== undefined) { fields.push(`short_description = $${idx++}`); values.push(updates.shortDescription); }
    if (updates.description !== undefined) { fields.push(`description = $${idx++}`); values.push(updates.description); }
    if (updates.mainImage !== undefined) { fields.push(`main_image = $${idx++}`); values.push(updates.mainImage); }
    if (updates.images !== undefined) { fields.push(`gallery_images = $${idx++}`); values.push(JSON.stringify(updates.images)); }
    if (updates.isWholesaleAvailable !== undefined) { fields.push(`is_wholesale = $${idx++}`); values.push(updates.isWholesaleAvailable); }
    if (updates.isFeatured !== undefined) { fields.push(`is_featured = $${idx++}`); values.push(updates.isFeatured); }
    if (updates.isActive !== undefined) { fields.push(`is_active = $${idx++}`); values.push(updates.isActive); }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const res = await p.query(`UPDATE products SET ${fields.join(', ')} WHERE id = $${idx}`, values);
    return (res.rowCount || 0) > 0;
  },

  async updateStock(id: string, change: number): Promise<boolean> {
    const p = getPgPool();
    const res = await p.query(
      `UPDATE products SET stock_quantity = GREATEST(0, stock_quantity + $1), updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [change, id]
    );
    return (res.rowCount || 0) > 0;
  },

  async delete(id: string): Promise<boolean> {
    const p = getPgPool();
    const res = await p.query(`DELETE FROM products WHERE id = $1`, [id]);
    return (res.rowCount || 0) > 0;
  },

  mapRowToProduct(r: any): Product {
    const images = typeof r.gallery_images === 'string' ? JSON.parse(r.gallery_images) : r.gallery_images || [r.main_image];
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      sku: `MLB-${r.id}`,
      categoryId: r.category_id,
      categoryName: r.category_name,
      shortDescription: r.short_description || '',
      description: r.description || '',
      price: Number(r.price),
      discountPrice: r.discount_price ? Number(r.discount_price) : undefined,
      stockQuantity: Number(r.stock_quantity),
      weightGrams: Number(r.weight_grams),
      images: Array.isArray(images) ? images : [r.main_image],
      mainImage: r.main_image,
      sournessLevel: (r.sourness_level || 'SweetSour') as SournessLevel,
      ingredients: ['میوه خالص', 'نمک مجاز'],
      rating: 4.8,
      reviewCount: 12,
      isFeatured: Boolean(r.is_featured),
      isBestSeller: true,
      isNew: false,
      isWholesaleAvailable: Boolean(r.is_wholesale),
      isActive: Boolean(r.is_active),
      createdAt: r.created_at?.toISOString ? r.created_at.toISOString() : String(r.created_at),
      updatedAt: r.updated_at?.toISOString ? r.updated_at.toISOString() : String(r.updated_at),
    };
  },
};

// ============================================================================
// 4. ORDERS & ORDER ITEMS REPOSITORY
// ============================================================================
export const pgOrdersRepository = {
  async getAll(filters?: { userId?: string; status?: string; paymentStatus?: string }): Promise<Order[]> {
    const p = getPgPool();
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (filters?.userId) {
      conditions.push(`user_id = $${idx++}`);
      values.push(filters.userId);
    }
    if (filters?.status && filters.status !== 'all') {
      conditions.push(`status = $${idx++}`);
      values.push(filters.status);
    }
    if (filters?.paymentStatus && filters.paymentStatus !== 'all') {
      conditions.push(`payment_status = $${idx++}`);
      values.push(filters.paymentStatus);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const ordersRes = await p.query(`SELECT * FROM orders ${where} ORDER BY created_at DESC`, values);

    if (ordersRes.rows.length === 0) return [];

    const orderIds = ordersRes.rows.map((o) => o.id);
    const itemsRes = await p.query(
      `SELECT * FROM order_items WHERE order_id = ANY($1::varchar[]) ORDER BY id ASC`,
      [orderIds]
    );

    const itemsMap = new Map<string, OrderItem[]>();
    for (const item of itemsRes.rows) {
      const list = itemsMap.get(item.order_id) || [];
      list.push({
        id: item.id,
        productId: item.product_id,
        productName: item.product_name,
        sku: item.sku || undefined,
        unitPrice: Number(item.unit_price),
        quantity: Number(item.quantity),
        totalPrice: Number(item.total_price),
        productImage: item.product_image || '',
        weightGrams: Number(item.weight_grams || 0),
      });
      itemsMap.set(item.order_id, list);
    }

    return ordersRes.rows.map((o) => this.mapRowToOrder(o, itemsMap.get(o.id) || []));
  },

  async getById(id: string): Promise<Order | null> {
    const p = getPgPool();
    const res = await p.query(`SELECT * FROM orders WHERE id = $1`, [id]);
    if (res.rows.length === 0) return null;

    const itemsRes = await p.query(`SELECT * FROM order_items WHERE order_id = $1`, [id]);
    const items: OrderItem[] = itemsRes.rows.map((item) => ({
      id: item.id,
      productId: item.product_id,
      productName: item.product_name,
      unitPrice: Number(item.unit_price),
      quantity: Number(item.quantity),
      totalPrice: Number(item.total_price),
      productImage: item.product_image || '',
      weightGrams: 300,
    }));

    return this.mapRowToOrder(res.rows[0], items);
  },

  async create(order: Order, items: OrderItem[]): Promise<Order> {
    const p = getPgPool();
    const client = await p.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO orders (
          id, order_number, user_id, customer_name, customer_mobile, customer_email,
          shipping_address, shipping_method, shipping_fee, subtotal, discount_amount,
          coupon_id, coupon_code, total_amount, status, payment_status, payment_method,
          payment_ref_id, payment_authority, customer_notes, admin_notes, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
        )`,
        [
          order.id,
          order.orderNumber,
          order.userId || null,
          order.customerName,
          order.customerMobile,
          order.customerEmail || null,
          JSON.stringify(order.shippingAddress),
          order.shippingMethod,
          order.shippingFee || 0,
          order.subtotal,
          order.discountAmount || 0,
          order.couponId || null,
          order.couponCode || null,
          order.totalAmount,
          order.status || 'Pending',
          order.paymentStatus || 'Pending',
          order.paymentMethod,
          order.paymentRefId || null,
          order.paymentAuthority || null,
          order.customerNotes || null,
          order.adminNotes || null,
          order.createdAt || new Date().toISOString(),
          order.updatedAt || new Date().toISOString(),
        ]
      );
      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (id, order_id, product_id, product_name, sku, product_image, weight_grams, quantity, unit_price, discount_amount, total_price)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            item.id,
            order.id,
            item.productId,
            item.productName,
            item.sku || null,
            item.productImage || null,
            item.weightGrams || null,
            item.quantity,
            item.unitPrice,
            item.discountAmount || 0,
            item.totalPrice,
          ]
        );

        // Deduct product stock
        await client.query(
          `UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - $1) WHERE id = $2`,
          [item.quantity, item.productId]
        );
      }

      // If coupon used, increment coupon usage
      if (order.couponId) {
        await client.query(
          `UPDATE coupons SET used_count = used_count + 1 WHERE id = $1`,
          [order.couponId]
        );
      }

      await client.query('COMMIT');
      return order;
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  },

  async updateStatus(id: string, status: OrderStatus, adminNotes?: string): Promise<boolean> {
    const p = getPgPool();
    const query = adminNotes !== undefined
      ? `UPDATE orders SET status = $1, admin_notes = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`
      : `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`;
    const params = adminNotes !== undefined ? [status, adminNotes, id] : [status, id];
    const res = await p.query(query, params);
    return (res.rowCount || 0) > 0;
  },

  async updatePayment(id: string, paymentStatus: PaymentStatus, refId?: string): Promise<boolean> {
    const p = getPgPool();
    const res = await p.query(
      `UPDATE orders SET payment_status = $1, payment_ref_id = COALESCE($2, payment_ref_id), updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
      [paymentStatus, refId || null, id]
    );
    return (res.rowCount || 0) > 0;
  },

  async delete(id: string): Promise<boolean> {
    const p = getPgPool();
    const res = await p.query(`DELETE FROM orders WHERE id = $1`, [id]);
    return (res.rowCount || 0) > 0;
  },

  mapRowToOrder(o: any, items: OrderItem[]): Order {
    const address = typeof o.shipping_address === 'string'
      ? JSON.parse(o.shipping_address)
      : (o.shipping_address || {});
    return {
      id: o.id,
      orderNumber: o.order_number,
      userId: o.user_id || undefined,
      customerName: o.customer_name,
      customerMobile: o.customer_mobile,
      customerEmail: o.customer_email || undefined,
      shippingAddress: {
        id: address.id || `addr-${o.id}`,
        title: address.title || 'آدرس ثبت شده سفارش',
        receiverName: address.receiverName || address.receiver_name || o.customer_name,
        receiverMobile: address.receiverMobile || address.receiver_mobile || o.customer_mobile,
        province: address.province || 'تهران',
        city: address.city || 'تهران',
        fullAddress: address.fullAddress || address.address || '',
        postalCode: address.postalCode || address.postal_code || '',
        isDefault: Boolean(address.isDefault ?? address.is_default),
      },
      shippingMethod: o.shipping_method || 'پست پیشتاز',
      shippingFee: Number(o.shipping_fee || 0),
      items,
      subtotal: Number(o.subtotal ?? (Number(o.total_amount) + Number(o.discount_amount || 0) - Number(o.shipping_fee || 0))),
      discountAmount: Number(o.discount_amount || 0),
      couponId: o.coupon_id || undefined,
      couponCode: o.coupon_code || undefined,
      totalAmount: Number(o.total_amount),
      status: o.status as OrderStatus,
      paymentStatus: o.payment_status as PaymentStatus,
      paymentMethod: 'درگاه بانکی شاپرک',
      paymentRefId: o.payment_ref_id || undefined,
      paymentAuthority: o.payment_authority || undefined,
      customerNotes: o.notes || undefined,
      createdAt: o.created_at?.toISOString ? o.created_at.toISOString() : String(o.created_at),
      updatedAt: o.updated_at?.toISOString ? o.updated_at.toISOString() : String(o.updated_at),
    };
  },
};

// ============================================================================
// 5. COUPONS REPOSITORY
// ============================================================================
export const pgCouponsRepository = {
  async getAll(activeOnly = false): Promise<Coupon[]> {
    const p = getPgPool();
    const query = activeOnly
      ? `SELECT * FROM coupons WHERE is_active = TRUE ORDER BY created_at DESC`
      : `SELECT * FROM coupons ORDER BY created_at DESC`;
    const res = await p.query(query);
    return res.rows.map((r) => this.mapRow(r));
  },

  async getByCode(code: string): Promise<Coupon | null> {
    const p = getPgPool();
    const res = await p.query(`SELECT * FROM coupons WHERE UPPER(code) = UPPER($1)`, [code.trim()]);
    if (res.rows.length === 0) return null;
    return this.mapRow(res.rows[0]);
  },

  async getById(id: string): Promise<Coupon | null> {
    const p = getPgPool();
    const res = await p.query(`SELECT * FROM coupons WHERE id = $1`, [id]);
    if (res.rows.length === 0) return null;
    return this.mapRow(res.rows[0]);
  },

  async create(c: Coupon): Promise<Coupon> {
    const p = getPgPool();
    await p.query(
      `INSERT INTO coupons (id, code, discount_type, discount_value, min_order_amount, max_discount_amount, is_active, expires_at, max_uses, used_count, first_order_only)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        c.id,
        c.code.toUpperCase(),
        c.type,
        c.value,
        c.minOrderAmount || 0,
        c.maxDiscountAmount || null,
        c.isActive !== false,
        c.endDate || '2030-01-01',
        c.usageLimit || 1000,
        c.usedCount || 0,
        Boolean(c.firstOrderOnly),
      ]
    );
    return c;
  },

  async update(id: string, updates: Partial<Coupon>): Promise<boolean> {
    const p = getPgPool();
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (updates.code !== undefined) { fields.push(`code = $${idx++}`); values.push(updates.code.toUpperCase()); }
    if (updates.type !== undefined) { fields.push(`discount_type = $${idx++}`); values.push(updates.type); }
    if (updates.value !== undefined) { fields.push(`discount_value = $${idx++}`); values.push(updates.value); }
    if (updates.minOrderAmount !== undefined) { fields.push(`min_order_amount = $${idx++}`); values.push(updates.minOrderAmount); }
    if (updates.maxDiscountAmount !== undefined) { fields.push(`max_discount_amount = $${idx++}`); values.push(updates.maxDiscountAmount); }
    if (updates.isActive !== undefined) { fields.push(`is_active = $${idx++}`); values.push(updates.isActive); }
    if (updates.usageLimit !== undefined) { fields.push(`max_uses = $${idx++}`); values.push(updates.usageLimit); }
    if (updates.firstOrderOnly !== undefined) { fields.push(`first_order_only = $${idx++}`); values.push(updates.firstOrderOnly); }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const res = await p.query(`UPDATE coupons SET ${fields.join(', ')} WHERE id = $${idx}`, values);
    return (res.rowCount || 0) > 0;
  },

  async delete(id: string): Promise<boolean> {
    const p = getPgPool();
    const res = await p.query(`DELETE FROM coupons WHERE id = $1`, [id]);
    return (res.rowCount || 0) > 0;
  },

  mapRow(r: any): Coupon {
    return {
      id: r.id,
      code: r.code,
      type: r.discount_type,
      value: Number(r.discount_value),
      minOrderAmount: Number(r.min_order_amount),
      maxDiscountAmount: r.max_discount_amount ? Number(r.max_discount_amount) : undefined,
      usageLimit: Number(r.max_uses || 1000),
      usedCount: Number(r.used_count || 0),
      startDate: '2026-01-01',
      endDate: r.expires_at?.toISOString ? r.expires_at.toISOString() : String(r.expires_at),
      isActive: Boolean(r.is_active),
      firstOrderOnly: Boolean(r.first_order_only),
    };
  },
};

// ============================================================================
// 6. WHOLESALE REQUESTS REPOSITORY
// ============================================================================
export const pgWholesaleRepository = {
  async getAll(): Promise<WholesaleRequest[]> {
    const p = getPgPool();
    const res = await p.query(`SELECT * FROM wholesale_requests ORDER BY created_at DESC`);
    return res.rows.map((r) => this.mapRow(r));
  },

  async getById(id: string): Promise<WholesaleRequest | null> {
    const p = getPgPool();
    const res = await p.query(`SELECT * FROM wholesale_requests WHERE id = $1`, [id]);
    if (res.rows.length === 0) return null;
    return this.mapRow(res.rows[0]);
  },

  async create(req: WholesaleRequest): Promise<WholesaleRequest> {
    const p = getPgPool();
    await p.query(
      `INSERT INTO wholesale_requests (
        id, user_id, company_name, contact_person, mobile, email, city,
        requested_volume, description, quotation_sent, quotation_details, status, admin_notes, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        req.id,
        null,
        req.companyName,
        req.applicantName,
        req.mobile,
        req.email || null,
        req.city,
        `${req.estimatedQuantityKg || 50} کیلوگرم`,
        req.description || '',
        Boolean(req.quotationSent),
        req.offeredPricePerKg ? `قیمت توافقی هر کیلو: ${req.offeredPricePerKg}` : null,
        req.status || 'New',
        req.adminNotes || null,
        req.createdAt || new Date().toISOString(),
        req.updatedAt || new Date().toISOString(),
      ]
    );
    return req;
  },

  async updateStatus(id: string, status: WholesaleStatus, notes?: string, quotationSent?: boolean): Promise<boolean> {
    const p = getPgPool();
    const res = await p.query(
      `UPDATE wholesale_requests
       SET status = $1,
           admin_notes = COALESCE($2, admin_notes),
           quotation_sent = COALESCE($3, quotation_sent),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [status, notes || null, quotationSent !== undefined ? quotationSent : null, id]
    );
    return (res.rowCount || 0) > 0;
  },

  async delete(id: string): Promise<boolean> {
    const p = getPgPool();
    const res = await p.query(`DELETE FROM wholesale_requests WHERE id = $1`, [id]);
    return (res.rowCount || 0) > 0;
  },

  mapRow(r: any): WholesaleRequest {
    return {
      id: r.id,
      trackingCode: `WS-${r.id.replace(/[^0-9]/g, '').slice(-6) || '1001'}`,
      applicantName: r.contact_person,
      companyName: r.company_name,
      mobile: r.mobile,
      email: r.email || undefined,
      province: 'مرکزی',
      city: r.city,
      businessType: 'پخش و توزیع',
      requestedProducts: r.requested_volume || 'سفارش ۵۰ کیلوگرم لواشک ملس ساوه',
      estimatedQuantityKg: 50,
      description: r.description || undefined,
      status: r.status as WholesaleStatus,
      adminNotes: r.admin_notes || undefined,
      quotationSent: Boolean(r.quotation_sent),
      createdAt: r.created_at?.toISOString ? r.created_at.toISOString() : String(r.created_at),
      updatedAt: r.updated_at?.toISOString ? r.updated_at.toISOString() : String(r.updated_at),
    };
  },
};

// ============================================================================
// 7. REVIEWS REPOSITORY
// ============================================================================
export const pgReviewsRepository = {
  async getByProductId(productId: string): Promise<Review[]> {
    const p = getPgPool();
    const res = await p.query(
      `SELECT * FROM reviews WHERE product_id = $1 AND is_approved = TRUE ORDER BY created_at DESC`,
      [productId]
    );
    return res.rows.map((r) => this.mapRow(r));
  },

  async getAll(): Promise<Review[]> {
    const p = getPgPool();
    const res = await p.query(
      `SELECT r.*, p.name as product_name
       FROM reviews r
       LEFT JOIN products p ON r.product_id = p.id
       ORDER BY r.created_at DESC`
    );
    return res.rows.map((r) => ({
      ...this.mapRow(r),
      productName: r.product_name,
    }));
  },

  async create(rev: Review): Promise<Review> {
    const p = getPgPool();
    await p.query(
      `INSERT INTO reviews (id, product_id, user_id, author_name, rating, comment, is_approved, is_buyer, is_official_staff, admin_reply, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        rev.id,
        rev.productId,
        rev.userId || null,
        rev.userName,
        rev.rating,
        rev.comment,
        Boolean(rev.isApproved),
        true,
        Boolean(rev.isOfficialStaff),
        rev.adminReply || null,
        rev.createdAt || new Date().toISOString(),
      ]
    );
    return rev;
  },

  async toggleApprove(id: string, isApproved: boolean): Promise<boolean> {
    const p = getPgPool();
    const res = await p.query(`UPDATE reviews SET is_approved = $1 WHERE id = $2`, [isApproved, id]);
    return (res.rowCount || 0) > 0;
  },

  async reply(id: string, replyText: string): Promise<boolean> {
    const p = getPgPool();
    const res = await p.query(
      `UPDATE reviews SET admin_reply = $1, admin_reply_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [replyText, id]
    );
    return (res.rowCount || 0) > 0;
  },

  async delete(id: string): Promise<boolean> {
    const p = getPgPool();
    const res = await p.query(`DELETE FROM reviews WHERE id = $1`, [id]);
    return (res.rowCount || 0) > 0;
  },

  mapRow(r: any): Review {
    return {
      id: r.id,
      productId: r.product_id,
      userId: r.user_id || undefined,
      userName: r.author_name,
      rating: Number(r.rating),
      comment: r.comment,
      isApproved: Boolean(r.is_approved),
      isOfficialStaff: Boolean(r.is_official_staff),
      adminReply: r.admin_reply || undefined,
      createdAt: r.created_at?.toISOString ? r.created_at.toISOString() : String(r.created_at),
    };
  },
};

// ============================================================================
// 8. BLOG POSTS REPOSITORY
// ============================================================================
export const pgBlogRepository = {
  async getAll(publishedOnly = false): Promise<BlogPost[]> {
    const p = getPgPool();
    const query = publishedOnly
      ? `SELECT * FROM blog_posts WHERE is_published = TRUE ORDER BY created_at DESC`
      : `SELECT * FROM blog_posts ORDER BY created_at DESC`;
    const res = await p.query(query);
    return res.rows.map((r) => this.mapRow(r));
  },

  async getBySlug(slug: string): Promise<BlogPost | null> {
    const p = getPgPool();
    const res = await p.query(`SELECT * FROM blog_posts WHERE slug = $1`, [slug]);
    if (res.rows.length === 0) return null;
    return this.mapRow(res.rows[0]);
  },

  async create(post: BlogPost): Promise<BlogPost> {
    const p = getPgPool();
    await p.query(
      `INSERT INTO blog_posts (id, title, slug, excerpt, content, cover_image, author, reading_time_minutes, is_published, tags, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        post.id,
        post.title,
        post.slug,
        post.summary || '',
        post.content || '',
        post.featuredImage || '',
        post.author || 'مدیر ملس‌بان',
        post.readTimeMinutes || 5,
        post.isPublished !== false,
        JSON.stringify(post.tags || []),
        post.createdAt || new Date().toISOString(),
        post.updatedAt || new Date().toISOString(),
      ]
    );
    return post;
  },

  async update(id: string, updates: Partial<BlogPost>): Promise<boolean> {
    const p = getPgPool();
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (updates.title !== undefined) { fields.push(`title = $${idx++}`); values.push(updates.title); }
    if (updates.slug !== undefined) { fields.push(`slug = $${idx++}`); values.push(updates.slug); }
    if (updates.summary !== undefined) { fields.push(`excerpt = $${idx++}`); values.push(updates.summary); }
    if (updates.content !== undefined) { fields.push(`content = $${idx++}`); values.push(updates.content); }
    if (updates.featuredImage !== undefined) { fields.push(`cover_image = $${idx++}`); values.push(updates.featuredImage); }
    if (updates.isPublished !== undefined) { fields.push(`is_published = $${idx++}`); values.push(updates.isPublished); }
    if (updates.tags !== undefined) { fields.push(`tags = $${idx++}`); values.push(JSON.stringify(updates.tags)); }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const res = await p.query(`UPDATE blog_posts SET ${fields.join(', ')} WHERE id = $${idx}`, values);
    return (res.rowCount || 0) > 0;
  },

  async delete(id: string): Promise<boolean> {
    const p = getPgPool();
    const res = await p.query(`DELETE FROM blog_posts WHERE id = $1`, [id]);
    return (res.rowCount || 0) > 0;
  },

  mapRow(r: any): BlogPost {
    const tags = typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags || [];
    return {
      id: r.id,
      title: r.title,
      slug: r.slug,
      summary: r.excerpt || '',
      content: r.content || '',
      featuredImage: r.cover_image || '',
      category: 'دانستنی‌ها',
      tags: Array.isArray(tags) ? tags : [],
      author: r.author || 'تیم تولید ملس‌بان',
      readTimeMinutes: Number(r.reading_time_minutes || 5),
      isPublished: Boolean(r.is_published),
      createdAt: r.created_at?.toISOString ? r.created_at.toISOString() : String(r.created_at),
      updatedAt: r.updated_at?.toISOString ? r.updated_at.toISOString() : String(r.updated_at),
    };
  },
};

// ============================================================================
// 9. SITE SETTINGS REPOSITORY
// ============================================================================
export const pgSettingsRepository = {
  async getSettings(): Promise<SiteSetting | null> {
    const p = getPgPool();
    const res = await p.query(`SELECT * FROM site_settings WHERE id = 'default' LIMIT 1`);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      brandName: r.site_title || 'ملس‌بان',
      tagline: r.site_description || 'تولید و عرضه مستقیم لواشک اصیل ساوه',
      supportPhone: r.contact_phone || '۰۲۱-۸۸۸۸۹۹۹۹',
      supportMobile: '۰۹۱۲۰۰۰۰۰۰۰',
      supportEmail: r.contact_email || 'info@malasban.ir',
      address: r.address || 'تهران، بازار بزرگ، سرای امید',
      workingHours: 'همه‌روزه از ۸:۳۰ تا ۲۲:۳۰',
      instagram: 'https://instagram.com/malasban',
      telegram: 'https://t.me/malasban',
      whatsapp: '۰۹۱۲۰۰۰۰۰۰۰',
      freeShippingThreshold: 500000,
      standardShippingFee: 45000,
      wholesaleMinOrderKg: 20,
      wholesaleTiers: typeof r.wholesale_tiers === 'string' ? JSON.parse(r.wholesale_tiers) : r.wholesale_tiers || [],
      faqs: typeof r.faqs === 'string' ? JSON.parse(r.faqs) : r.faqs || [],
    };
  },

  async updateSettings(settings: Partial<SiteSetting>): Promise<boolean> {
    const p = getPgPool();
    await p.query(
      `INSERT INTO site_settings (id, site_title, site_description, contact_phone, contact_email, address, wholesale_tiers, faqs, updated_at)
       VALUES ('default', $1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET
         site_title = COALESCE(EXCLUDED.site_title, site_settings.site_title),
         site_description = COALESCE(EXCLUDED.site_description, site_settings.site_description),
         contact_phone = COALESCE(EXCLUDED.contact_phone, site_settings.contact_phone),
         contact_email = COALESCE(EXCLUDED.contact_email, site_settings.contact_email),
         address = COALESCE(EXCLUDED.address, site_settings.address),
         wholesale_tiers = COALESCE(EXCLUDED.wholesale_tiers, site_settings.wholesale_tiers),
         faqs = COALESCE(EXCLUDED.faqs, site_settings.faqs),
         updated_at = CURRENT_TIMESTAMP`,
      [
        settings.brandName || 'ملس‌بان',
        settings.tagline || 'تولید و عرضه مستقیم لواشک اصیل ساوه',
        settings.supportPhone || '۰۲۱-۸۸۸۸۹۹۹۹',
        settings.supportEmail || 'info@malasban.ir',
        settings.address || 'تهران، بازار بزرگ، سرای امید',
        JSON.stringify(settings.wholesaleTiers || []),
        JSON.stringify(settings.faqs || []),
      ]
    );
    return true;
  },
};

// ============================================================================
// 10. CHAT SYSTEM REPOSITORY
// ============================================================================
export const pgChatRepository = {
  async getConversations(filters?: { status?: string; priority?: string; search?: string; assignedAgentId?: string }): Promise<ChatConversation[]> {
    const p = getPgPool();
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (filters?.status && filters.status !== 'all') {
      conditions.push(`status = $${idx++}`);
      values.push(filters.status);
    }
    if (filters?.priority && filters.priority !== 'all') {
      conditions.push(`priority = $${idx++}`);
      values.push(filters.priority);
    }
    if (filters?.assignedAgentId && filters.assignedAgentId !== 'all') {
      conditions.push(`assigned_agent_id = $${idx++}`);
      values.push(filters.assignedAgentId);
    }
    if (filters?.search) {
      conditions.push(`(customer_name ILIKE $${idx} OR customer_mobile ILIKE $${idx} OR last_message_text ILIKE $${idx})`);
      values.push(`%${filters.search}%`);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const res = await p.query(`SELECT * FROM chat_conversations ${where} ORDER BY last_message_time DESC NULLS LAST, created_at DESC`, values);
    return res.rows.map((r) => this.mapConvRow(r));
  },

  async getConversationById(id: string): Promise<ChatConversation | null> {
    const p = getPgPool();
    const res = await p.query(`SELECT * FROM chat_conversations WHERE id = $1`, [id]);
    if (res.rows.length === 0) return null;
    return this.mapConvRow(res.rows[0]);
  },

  async getConversationByGuestId(guestId: string): Promise<ChatConversation | null> {
    const p = getPgPool();
    const res = await p.query(
      `SELECT * FROM chat_conversations WHERE guest_id = $1 AND customer_id IS NULL AND status != 'closed' ORDER BY created_at DESC LIMIT 1`,
      [guestId]
    );
    if (res.rows.length === 0) return null;
    return this.mapConvRow(res.rows[0]);
  },

  async createConversation(conv: ChatConversation): Promise<ChatConversation> {
    const p = getPgPool();
    await p.query(
      `INSERT INTO chat_conversations (
        id, customer_id, guest_id, customer_name, customer_mobile, customer_email,
        assigned_agent_id, assigned_agent_name, status, priority, tags,
        unread_customer_count, unread_agent_count, last_message_text, last_message_time,
        last_sender, summary, context_product, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
      [
        conv.id,
        conv.customerId || null,
        conv.guestId || null,
        conv.customerName || 'کاربر مهمان',
        conv.customerMobile || null,
        conv.customerEmail || null,
        conv.assignedAgentId || null,
        conv.assignedAgentName || null,
        conv.status || 'active',
        conv.priority || 'normal',
        JSON.stringify(conv.tags || []),
        conv.unreadCustomerCount || 0,
        conv.unreadAgentCount || 0,
        conv.lastMessageText || null,
        conv.lastMessageTime || new Date().toISOString(),
        conv.lastSender || 'customer',
        conv.summary || null,
        conv.contextProduct ? JSON.stringify(conv.contextProduct) : null,
        conv.createdAt || new Date().toISOString(),
        conv.updatedAt || new Date().toISOString(),
      ]
    );
    return conv;
  },

  async updateConversation(id: string, updates: Partial<ChatConversation>): Promise<boolean> {
    const p = getPgPool();
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (updates.status !== undefined) { fields.push(`status = $${idx++}`); values.push(updates.status); }
    if (updates.priority !== undefined) { fields.push(`priority = $${idx++}`); values.push(updates.priority); }
    if (updates.assignedAgentId !== undefined) { fields.push(`assigned_agent_id = $${idx++}`); values.push(updates.assignedAgentId); }
    if (updates.assignedAgentName !== undefined) { fields.push(`assigned_agent_name = $${idx++}`); values.push(updates.assignedAgentName); }
    if (updates.tags !== undefined) { fields.push(`tags = $${idx++}`); values.push(JSON.stringify(updates.tags)); }
    if (updates.summary !== undefined) { fields.push(`summary = $${idx++}`); values.push(updates.summary); }
    if (updates.lastMessageText !== undefined) { fields.push(`last_message_text = $${idx++}`); values.push(updates.lastMessageText); }
    if (updates.lastMessageTime !== undefined) { fields.push(`last_message_time = $${idx++}`); values.push(updates.lastMessageTime); }
    if (updates.lastSender !== undefined) { fields.push(`last_sender = $${idx++}`); values.push(updates.lastSender); }
    if (updates.unreadAgentCount !== undefined) { fields.push(`unread_agent_count = $${idx++}`); values.push(updates.unreadAgentCount); }
    if (updates.unreadCustomerCount !== undefined) { fields.push(`unread_customer_count = $${idx++}`); values.push(updates.unreadCustomerCount); }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const res = await p.query(`UPDATE chat_conversations SET ${fields.join(', ')} WHERE id = $${idx}`, values);
    return (res.rowCount || 0) > 0;
  },

  async markAsRead(conversationId: string, role: 'customer' | 'agent'): Promise<boolean> {
    const p = getPgPool();
    const col = role === 'agent' ? 'unread_agent_count' : 'unread_customer_count';
    const res = await p.query(
      `UPDATE chat_conversations SET ${col} = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND ${col} > 0`,
      [conversationId]
    );
    return (res.rowCount || 0) > 0;
  },

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const p = getPgPool();
    const res = await p.query(
      `SELECT * FROM chat_messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
      [conversationId]
    );
    return res.rows.map((r) => this.mapMsgRow(r));
  },

  async addMessage(msg: ChatMessage): Promise<ChatMessage> {
    const p = getPgPool();
    await p.query(
      `INSERT INTO chat_messages (
        id, conversation_id, sender, sender_name, sender_avatar, text,
        created_at, status, attachment_url, attachment_type, attachment_name, product, order_attachment, quick_replies
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        msg.id,
        msg.conversationId,
        msg.sender,
        msg.senderName,
        msg.senderAvatar || null,
        msg.text || '',
        msg.createdAt || new Date().toISOString(),
        msg.status || 'delivered',
        msg.attachmentUrl || null,
        msg.attachmentType || null,
        msg.attachmentName || null,
        msg.product ? JSON.stringify(msg.product) : null,
        msg.order ? JSON.stringify(msg.order) : null,
        JSON.stringify(msg.quickReplies || []),
      ]
    );

    // Update parent conversation last message
    await p.query(
      `UPDATE chat_conversations
       SET last_message_text = $1,
           last_message_time = $2,
           last_sender = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [msg.text || '[فایل یا محصول]', msg.createdAt, msg.sender, msg.conversationId]
    );

    return msg;
  },

  async getCannedResponses(): Promise<CannedResponse[]> {
    const p = getPgPool();
    const res = await p.query(`SELECT * FROM canned_responses ORDER BY shortcut ASC`);
    return res.rows.map((r) => ({
      id: r.id,
      shortcut: r.shortcut,
      title: r.title,
      content: r.content,
      category: r.category || 'عمومی',
    }));
  },

  async createCannedResponse(cr: CannedResponse): Promise<CannedResponse> {
    const p = getPgPool();
    await p.query(
      `INSERT INTO canned_responses (id, shortcut, title, content, category)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         shortcut = EXCLUDED.shortcut,
         title = EXCLUDED.title,
         content = EXCLUDED.content,
         category = EXCLUDED.category`,
      [cr.id, cr.shortcut, cr.title, cr.content, cr.category || 'عمومی']
    );
    return cr;
  },

  async deleteCannedResponse(id: string): Promise<boolean> {
    const p = getPgPool();
    const res = await p.query(`DELETE FROM canned_responses WHERE id = $1`, [id]);
    return (res.rowCount || 0) > 0;
  },

  async getChatSettings(): Promise<ChatSettings | null> {
    const p = getPgPool();
    const res = await p.query(`SELECT * FROM chat_settings WHERE id = 'default' LIMIT 1`);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      isOnline: Boolean(r.is_online),
      workingHoursStart: r.working_hours_start || '08:30',
      workingHoursEnd: r.working_hours_end || '22:30',
      autoWelcomeMessage: r.auto_welcome_message || '',
      offlineMessage: r.offline_message || '',
      exitIntentMessage: r.exit_intent_message || '',
      enableSoundNotifications: Boolean(r.enable_sound_notifications),
      enableAiAssistant: Boolean(r.enable_ai_assistant),
      operatorName: r.operator_name || 'پشتیبان ملس‌بان',
      operatorTitle: r.operator_title || 'مشاور فروش',
    };
  },

  async updateChatSettings(cs: Partial<ChatSettings>): Promise<boolean> {
    const p = getPgPool();
    await p.query(
      `INSERT INTO chat_settings (id, is_online, working_hours_start, working_hours_end, auto_welcome_message, offline_message, exit_intent_message, enable_sound_notifications, enable_ai_assistant, operator_name, operator_title)
       VALUES ('default', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET
         is_online = COALESCE(EXCLUDED.is_online, chat_settings.is_online),
         working_hours_start = COALESCE(EXCLUDED.working_hours_start, chat_settings.working_hours_start),
         working_hours_end = COALESCE(EXCLUDED.working_hours_end, chat_settings.working_hours_end),
         auto_welcome_message = COALESCE(EXCLUDED.auto_welcome_message, chat_settings.auto_welcome_message),
         offline_message = COALESCE(EXCLUDED.offline_message, chat_settings.offline_message),
         exit_intent_message = COALESCE(EXCLUDED.exit_intent_message, chat_settings.exit_intent_message),
         enable_sound_notifications = COALESCE(EXCLUDED.enable_sound_notifications, chat_settings.enable_sound_notifications),
         enable_ai_assistant = COALESCE(EXCLUDED.enable_ai_assistant, chat_settings.enable_ai_assistant),
         operator_name = COALESCE(EXCLUDED.operator_name, chat_settings.operator_name),
         operator_title = COALESCE(EXCLUDED.operator_title, chat_settings.operator_title)`,
      [
        cs.isOnline !== false,
        cs.workingHoursStart || '08:30',
        cs.workingHoursEnd || '22:30',
        cs.autoWelcomeMessage || '',
        cs.offlineMessage || '',
        cs.exitIntentMessage || '',
        cs.enableSoundNotifications !== false,
        cs.enableAiAssistant !== false,
        cs.operatorName || 'پشتیبان ملس‌بان',
        cs.operatorTitle || 'مشاور فروش',
      ]
    );
    return true;
  },

  mapConvRow(r: any): ChatConversation {
    const tags = typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags || [];
    const contextProduct = typeof r.context_product === 'string' ? JSON.parse(r.context_product) : r.context_product || undefined;
    return {
      id: r.id,
      customerId: r.customer_id || undefined,
      guestId: r.guest_id || undefined,
      customerName: r.customer_name || 'کاربر مهمان',
      customerMobile: r.customer_mobile || undefined,
      customerEmail: r.customer_email || undefined,
      assignedAgentId: r.assigned_agent_id || undefined,
      assignedAgentName: r.assigned_agent_name || undefined,
      status: r.status,
      priority: r.priority,
      tags: Array.isArray(tags) ? tags : [],
      unreadCustomerCount: Number(r.unread_customer_count || 0),
      unreadAgentCount: Number(r.unread_agent_count || 0),
      lastMessageText: r.last_message_text || '',
      lastMessageTime: r.last_message_time?.toISOString ? r.last_message_time.toISOString() : (r.last_message_time ? String(r.last_message_time) : r.created_at?.toISOString ? r.created_at.toISOString() : new Date().toISOString()),
      lastSender: r.last_sender,
      rating: r.rating ? Number(r.rating) : undefined,
      feedback: r.feedback || undefined,
      summary: r.summary || undefined,
      contextProduct,
      createdAt: r.created_at?.toISOString ? r.created_at.toISOString() : String(r.created_at),
      updatedAt: r.updated_at?.toISOString ? r.updated_at.toISOString() : String(r.updated_at),
    };
  },

  mapMsgRow(r: any): ChatMessage {
    const product = typeof r.product === 'string' ? JSON.parse(r.product) : r.product || undefined;
    const order = typeof r.order_attachment === 'string' ? JSON.parse(r.order_attachment) : r.order_attachment || undefined;
    const quickReplies = typeof r.quick_replies === 'string' ? JSON.parse(r.quick_replies) : r.quick_replies || undefined;
    return {
      id: r.id,
      conversationId: r.conversation_id,
      sender: r.sender,
      senderName: r.sender_name,
      senderAvatar: r.sender_avatar || undefined,
      text: r.text || '',
      createdAt: r.created_at?.toISOString ? r.created_at.toISOString() : String(r.created_at),
      status: r.status,
      attachmentUrl: r.attachment_url || undefined,
      attachmentType: r.attachment_type || undefined,
      attachmentName: r.attachment_name || undefined,
      product,
      order,
      quickReplies,
    };
  },
};

/**
 * Load full schema from normalized PostgreSQL tables into memory
 */
export async function loadFullDatabaseFromPostgres(): Promise<DatabaseSchema | null> {
  const isAvailable = await checkPgConnection();
  if (!isAvailable) return null;

  try {
    const [
      users,
      categories,
      products,
      orders,
      coupons,
      wholesaleRequests,
      reviews,
      blogPosts,
      settings,
      chatConversations,
      chatSettings,
      cannedResponses,
    ] = await Promise.all([
      pgUsersRepository.getAll(),
      pgCategoriesRepository.getAll(false),
      pgProductsRepository.getAll({ activeOnly: false }),
      pgOrdersRepository.getAll(),
      pgCouponsRepository.getAll(false),
      pgWholesaleRepository.getAll(),
      pgReviewsRepository.getAll(),
      pgBlogRepository.getAll(false),
      pgSettingsRepository.getSettings(),
      pgChatRepository.getConversations(),
      pgChatRepository.getChatSettings(),
      pgChatRepository.getCannedResponses(),
    ]);

    // Also get all chat messages for active conversations
    const p = getPgPool();
    const msgsRes = await p.query(`SELECT * FROM chat_messages ORDER BY created_at ASC`);
    const chatMessages = msgsRes.rows.map((r) => pgChatRepository.mapMsgRow(r));

    if (users.length === 0 && products.length === 0) {
      // Database is fresh/empty
      return null;
    }

    return {
      users,
      categories,
      products,
      orders,
      coupons,
      wholesaleRequests,
      reviews,
      blogPosts,
      settings: settings || {
        brandName: 'ملس‌بان',
        tagline: 'تولید و عرضه مستقیم لواشک اصیل ساوه',
        supportPhone: '۰۲۱-۸۸۸۸۹۹۹۹',
        supportMobile: '۰۹۱۲۰۰۰۰۰۰۰',
        supportEmail: 'info@malasban.ir',
        address: 'تهران، بازار بزرگ، سرای امید',
        workingHours: 'همه‌روزه از ۸:۳۰ تا ۲۲:۳۰',
        instagram: 'https://instagram.com/malasban',
        telegram: 'https://t.me/malasban',
        whatsapp: '۰۹۱۲۰۰۰۰۰۰۰',
        freeShippingThreshold: 500000,
        standardShippingFee: 45000,
        wholesaleMinOrderKg: 20,
        wholesaleTiers: [],
        faqs: [],
      },
      chatConversations,
      chatMessages,
      chatSettings: chatSettings || {
        isOnline: true,
        workingHoursStart: '08:30',
        workingHoursEnd: '22:30',
        autoWelcomeMessage: '',
        offlineMessage: '',
        exitIntentMessage: '',
        enableSoundNotifications: true,
        enableAiAssistant: true,
        operatorName: 'پشتیبان ملس‌بان',
        operatorTitle: 'مشاور فروش',
      },
      cannedResponses,
    };
  } catch (err: any) {
    console.warn('[PostgreSQL Loader Warning]: Could not load full schema from tables:', err.message);
    return null;
  }
}
