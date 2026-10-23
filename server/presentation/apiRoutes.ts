import { Router, Request, Response, NextFunction } from 'express';
import {
  ProductService,
  CategoryService,
  OrderService,
  CouponService,
  WholesaleService,
  ReviewService,
  BlogService,
  DashboardService,
  ChatService,
  AiChatBotService,
} from '../application/services.js';
import { db } from '../infrastructure/db.js';
import {
  hashPassword,
  verifyPassword,
  AuthenticatedUser,
} from '../infrastructure/auth.js';
import { SESSION_COOKIE, createSession, getSessionUserId, revokeSession } from '../infrastructure/sessions.js';
import { getPgPool } from '../infrastructure/pgRepository.js';
import { ZarinPalPaymentGateway } from '../infrastructure/paymentGateways.js';
import { IPaymentGateway } from '../domain/interfaces.js';

import { DbMigrator } from '../infrastructure/dbMigrator.js';
import { syncSchemaToPostgres, checkPgConnection } from '../infrastructure/pgSync.js';
import fs from 'fs';
import path from 'path';

export const apiRouter = Router();

// Basic per-process rate limit for credential endpoints. Use a shared store (e.g.
// Redis) if deploying multiple instances.
const authAttempts = new Map<string, { count: number; resetAt: number }>();
function authRateLimit(req: Request, res: Response, next: NextFunction) {
  const key = `${req.ip || 'unknown'}:${req.path}`;
  const now = Date.now();
  if (authAttempts.size > 10_000) {
    for (const [storedKey, value] of authAttempts) {
      if (value.resetAt <= now) authAttempts.delete(storedKey);
    }
  }
  const current = authAttempts.get(key);
  if (!current || current.resetAt <= now) {
    authAttempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return next();
  }
  current.count += 1;
  if (current.count > 10) {
    res.setHeader('Retry-After', String(Math.ceil((current.resetAt - now) / 1000)));
    return res.status(429).json({ message: 'تعداد تلاش‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.' });
  }
  next();
}

// Payment gateway abstraction instance
const paymentGateway: IPaymentGateway = new ZarinPalPaymentGateway(undefined, process.env.NODE_ENV !== 'production');

// Auth Middleware
export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

const isProduction = process.env.NODE_ENV === 'production';

function setAuthCookie(res: Response, token: string) {
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=28800',
  ];
  if (isProduction) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearAuthCookie(res: Response) {
  const parts = [`${SESSION_COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (isProduction) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

function readCookie(req: Request, name: string): string | null {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index < 0) continue;
    if (part.slice(0, index).trim() === name) {
      try { return decodeURIComponent(part.slice(index + 1).trim()); } catch { return null; }
    }
  }
  return null;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const sessionId = readCookie(req, SESSION_COOKIE);
    if (!sessionId) {
      return res.status(401).json({ message: 'لطفاً ابتدا وارد حساب کاربری خود شوید.' });
    }
    const userId = await getSessionUserId(sessionId);
    if (!userId) {
      clearAuthCookie(res);
      return res.status(401).json({ message: 'نشست شما منقضی شده است. دوباره وارد شوید.' });
    }
    const currentUser = db.users.find((user) => user.id === userId);
    if (!currentUser || !currentUser.isActive) {
      await revokeSession(sessionId);
      clearAuthCookie(res);
      return res.status(401).json({ message: 'حساب کاربری غیرفعال است یا وجود ندارد.' });
    }
    req.user = {
      userId: currentUser.id,
      email: currentUser.email,
      role: currentUser.role,
      isSuperAdmin: currentUser.role === 'SuperAdmin',
      permissions: currentUser.permissions || [],
      name: `${currentUser.name} ${currentUser.family}`.trim(),
    };
    next();
  } catch (err) {
    next(err);
  }
}

export function adminGuard(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || (req.user.role !== 'Admin' && req.user.role !== 'SuperAdmin')) {
    return res.status(403).json({ message: 'دسترسی غیرمجاز. فقط مدیران سیستم مجاز هستند.' });
  }
  if (req.user.role === 'SuperAdmin') return next();

  const route = req.path.toLowerCase();
  let required: string | null = null;
  if (route.includes('/admin/database')) {
    return res.status(403).json({ message: 'عملیات پایگاه داده فقط برای مدیر ارشد مجاز است.' });
  } else if (route.includes('/product')) required = 'products';
  else if (route.includes('/categor')) required = 'categories';
  else if (route.includes('/order')) required = 'orders';
  else if (route.includes('/coupon')) required = 'coupons';
  else if (route.includes('/wholesale')) required = 'wholesale';
  else if (route.includes('/review')) required = 'reviews';
  else if (route.includes('/blog')) required = 'blog';
  else if (route.includes('/setting')) required = 'settings';
  else if (route.includes('/user')) {
    if (req.method === 'GET' && req.query.role === 'Customer') required = 'customers';
    else if (req.method === 'POST' && req.body?.role !== 'Admin' && req.body?.role !== 'SuperAdmin') required = 'customers';
    else if (req.params.id && db.users.find((u) => u.id === req.params.id)?.role === 'Customer') required = 'customers';
    else required = 'staff';
  }
  else if (route.includes('/chat')) required = 'chat';
  else if (route.includes('/dashboard') || route.includes('/stats') || route.includes('/analytics')) required = 'overview';

  if (!required || !req.user.permissions?.includes(required)) {
    return res.status(403).json({ message: 'برای این عملیات مجوز کافی ندارید.' });
  }
  next();
}

// ----------------------------------------------------
// 1. Auth Routes
// ----------------------------------------------------
apiRouter.post('/auth/register', authRateLimit, async (req, res) => {
  try {
    const { name, family, email, mobile, password } = req.body;
    if (typeof name !== 'string' || !name.trim() || typeof mobile !== 'string' || !mobile.trim() || typeof password !== 'string') {
      return res.status(400).json({ message: 'لطفاً نام، شماره موبایل و رمز عبور را وارد نمایید.' });
    }
    if (typeof password !== 'string' || password.length < 12 || password.length > 128) {
      return res.status(400).json({ message: 'رمز عبور باید حداقل ۱۲ و حداکثر ۱۲۸ نویسه باشد.' });
    }

    const normalizedMobile = String(mobile).trim();
    const normalizedEmail = typeof email === 'string' && email.trim()
      ? email.trim().toLowerCase()
      : `${normalizedMobile}@no-email.malasban.invalid`;
    const existingUser = db.users.find(
      (u) => u.mobile === normalizedMobile || (typeof email === 'string' && Boolean(email.trim()) && u.email?.toLowerCase() === normalizedEmail)
    );
    if (existingUser) {
      return res.status(400).json({ message: 'کاربری با این شماره موبایل یا ایمیل قبلاً ثبت نام کرده است.' });
    }

    const auth = hashPassword(password);
    const newUser = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      family: (family || '').trim(),
      email: normalizedEmail,
      mobile: normalizedMobile,
      passwordHash: auth.hash,
      salt: auth.salt,
      role: 'Customer' as const,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      addresses: [],
    };

    db.users.push(newUser);
    db.persist();

    const sessionId = await createSession(newUser.id);
    const { passwordHash, salt, ...safeUser } = newUser;

    setAuthCookie(res, sessionId);
    res.status(201).json({ user: safeUser });
  } catch (err: any) {
    res.status(500).json({ message: (process.env.NODE_ENV === 'production' ? 'خطای غیرمنتظره در سرور' : err?.message || 'خطای سرور') });
  }
});

apiRouter.post('/auth/login', authRateLimit, async (req, res) => {
  try {
    const { identifier, password } = req.body; // mobile or email
    if (typeof identifier !== 'string' || typeof password !== 'string' || !identifier.trim() || !password || password.length > 128) {
      return res.status(400).json({ message: 'لطفاً شماره موبایل/ایمیل و رمز عبور معتبر را وارد نمایید.' });
    }

    const cleanId = identifier.trim().toLowerCase();
    const user = db.users.find(
      (u) => u.mobile === cleanId || u.email?.toLowerCase() === cleanId
    );

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'نام کاربری یا رمز عبور اشتباه است، یا حساب غیرفعال شده است.' });
    }

    const valid = verifyPassword(password, user.passwordHash, user.salt);
    if (!valid) {
      return res.status(401).json({ message: 'نام کاربری یا رمز عبور اشتباه است.' });
    }

    const sessionId = await createSession(user.id);
    const { passwordHash, salt, ...safeUser } = user;

    setAuthCookie(res, sessionId);
    res.json({ user: safeUser });
  } catch (err: any) {
    res.status(500).json({ message: (process.env.NODE_ENV === 'production' ? 'خطای غیرمنتظره در سرور' : err?.message || 'خطای سرور') });
  }
});

apiRouter.post('/auth/logout', async (req, res, next) => {
  try {
    const sessionId = readCookie(req, SESSION_COOKIE);
    if (sessionId) await revokeSession(sessionId);
    clearAuthCookie(res);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

apiRouter.get('/auth/me', authMiddleware, (req: AuthRequest, res) => {
  const user = db.users.find((u) => u.id === req.user?.userId);
  if (!user) return res.status(404).json({ message: 'کاربر یافت نشد.' });
  const { passwordHash, salt, ...safeUser } = user;
  res.json({ user: safeUser });
});

apiRouter.put('/auth/profile', authMiddleware, (req: AuthRequest, res) => {
  const user = db.users.find((u) => u.id === req.user?.userId);
  if (!user) return res.status(404).json({ message: 'کاربر یافت نشد.' });

  const { name, family, addresses } = req.body;
  if (name) user.name = name.trim();
  if (family !== undefined) user.family = family.trim();
  if (Array.isArray(addresses)) {
    // Enforce business & database rule: exactly or at most one default address per user
    let defaultAssigned = false;
    user.addresses = addresses.map((addr) => {
      const isDefault = Boolean(addr.isDefault);
      if (isDefault) {
        if (!defaultAssigned) {
          defaultAssigned = true;
          return { ...addr, isDefault: true };
        }
        return { ...addr, isDefault: false };
      }
      return { ...addr, isDefault: false };
    });
  }

  user.updatedAt = new Date().toISOString();
  db.persist();

  const { passwordHash, salt, ...safeUser } = user;
  res.json({ user: safeUser, message: 'پروفایل با موفقیت بروزرسانی شد.' });
});

// ----------------------------------------------------
// 2. Products
// ----------------------------------------------------
apiRouter.get('/products', (req, res) => {
  const {
    categoryId,
    category,
    search,
    minPrice,
    maxPrice,
    sourness,
    inStockOnly,
    inStock,
    sort,
    sortBy,
    featured,
    bestSeller,
    isNew,
  } = req.query;

  const actualCategory = (categoryId || category) as string | undefined;
  const actualSort = (sort || sortBy) as string | undefined;
  const actualInStock = inStockOnly === 'true' || inStock === 'true';

  const products = ProductService.getAll({
    categoryId: actualCategory,
    search: search as string,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    sourness: sourness as string,
    inStockOnly: actualInStock,
    sort: actualSort,
    featured: featured === 'true',
    bestSeller: bestSeller === 'true',
    isNew: isNew === 'true',
  });

  res.json(products);
});

apiRouter.get('/products/:idOrSlug', (req, res) => {
  const product = ProductService.getByIdOrSlug(req.params.idOrSlug);
  if (!product) {
    return res.status(404).json({ message: 'محصول مورد نظر یافت نشد.' });
  }
  const related = ProductService.getRelated(product.id);
  res.json({ product, related });
});

apiRouter.post('/products', authMiddleware, adminGuard, (req, res) => {
  try {
    const newProduct = ProductService.create(req.body);
    res.status(201).json(newProduct);
  } catch (err: any) {
    res.status(400).json({ message: (process.env.NODE_ENV === 'production' ? 'خطای غیرمنتظره در سرور' : err?.message || 'خطا در ثبت محصول') });
  }
});

apiRouter.put('/products/:id', authMiddleware, adminGuard, (req, res) => {
  const updated = ProductService.update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ message: 'محصول یافت نشد.' });
  res.json(updated);
});

apiRouter.delete('/products/:id', authMiddleware, adminGuard, (req, res) => {
  const ok = ProductService.delete(req.params.id);
  if (!ok) return res.status(404).json({ message: 'محصول یافت نشد.' });
  res.json({ success: true, message: 'محصول با موفقیت حذف شد.' });
});

// ----------------------------------------------------
// 3. Categories
// ----------------------------------------------------
apiRouter.get('/categories', (_req, res) => {
  res.json(CategoryService.getAll());
});

apiRouter.get('/admin/categories', authMiddleware, adminGuard, (req, res) => {
  res.json(CategoryService.getAllAdmin());
});

apiRouter.post('/categories', authMiddleware, adminGuard, (req, res) => {
  try {
    const cat = CategoryService.create(req.body);
    res.status(201).json(cat);
  } catch (err: any) {
    res.status(400).json({ message: (process.env.NODE_ENV === 'production' ? 'خطای غیرمنتظره در سرور' : err?.message || 'خطا در ثبت دسته‌بندی') });
  }
});

apiRouter.put('/categories/:id', authMiddleware, adminGuard, (req, res) => {
  const updated = CategoryService.update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ message: 'دسته‌بندی یافت نشد.' });
  res.json(updated);
});

apiRouter.delete('/categories/:id', authMiddleware, adminGuard, (req, res) => {
  const result = CategoryService.delete(req.params.id);
  if (!result.success) {
    return res.status(400).json({ message: result.message || 'خطا در حذف دسته‌بندی' });
  }
  res.json({ success: true, message: 'دسته‌بندی با موفقیت حذف شد.' });
});

// ----------------------------------------------------
// 4. Orders & Checkout
// ----------------------------------------------------
apiRouter.post('/orders', authRateLimit, authMiddleware, (req: AuthRequest, res) => {
  try {
    const {
      customerName,
      customerMobile,
      customerEmail,
      shippingAddress,
      shippingMethod,
      items: requestedItems,
      couponCode,
      paymentMethod,
      customerNotes,
    } = req.body;

    if (!customerName || !customerMobile || !shippingAddress || !Array.isArray(requestedItems) || requestedItems.length === 0 || requestedItems.length > 50) {
      return res.status(400).json({ message: 'اطلاعات سفارش یا سبد خرید ناقص است.' });
    }
    if (typeof shippingAddress !== 'object' || !shippingAddress.fullAddress || !shippingAddress.city || !shippingAddress.province) {
      return res.status(400).json({ message: 'نشانی ارسال معتبر نیست.' });
    }

    // Never trust prices, totals, stock, or shipping fees supplied by the browser.
    const items = [];
    for (let i = 0; i < requestedItems.length; i++) {
      const requested = requestedItems[i];
      const quantity = Number(requested?.quantity);
      if (!requested?.productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
        return res.status(400).json({ message: 'تعداد یا شناسه یکی از محصولات نامعتبر است.' });
      }
      const product = db.products.find((p) => p.id === requested.productId && p.isActive);
      if (!product) return res.status(400).json({ message: 'یکی از محصولات دیگر در دسترس نیست.' });
      if (product.stockQuantity < quantity) return res.status(409).json({ message: `موجودی محصول «${product.name}» کافی نیست.` });
      const unitPrice = product.discountPrice ?? product.price;
      items.push({
        id: `item-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        productImage: product.mainImage || product.images?.[0] || '',
        weightGrams: product.weightGrams,
        quantity,
        unitPrice,
        discountAmount: 0,
        totalPrice: unitPrice * quantity,
      });
    }

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    let discountAmount = 0;
    let appliedCouponCode: string | undefined;
    if (couponCode) {
      const validation = CouponService.validate(String(couponCode), subtotal, {
        userId: req.user?.userId,
        mobile: String(customerMobile),
      });
      if (!validation.valid) return res.status(400).json({ message: validation.message });
      discountAmount = Math.min(subtotal, validation.discount);
      appliedCouponCode = validation.coupon?.code;
    }
    const shippingFee = subtotal >= db.settings.freeShippingThreshold
      ? 0
      : db.settings.standardShippingFee;
    const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

    const order = OrderService.create({
      userId: req.user?.userId,
      customerName: String(customerName).trim(),
      customerMobile: String(customerMobile).trim(),
      customerEmail: customerEmail ? String(customerEmail).trim() : undefined,
      shippingAddress,
      shippingMethod: shippingMethod || 'پست پیشتاز',
      shippingFee,
      items,
      subtotal,
      discountAmount,
      couponCode: appliedCouponCode,
      totalAmount,
      paymentMethod: paymentMethod || 'درگاه بانکی شاپرک',
      customerNotes: customerNotes ? String(customerNotes).slice(0, 1000) : undefined,
    });

    res.status(201).json({ order });
  } catch (err: any) {
    res.status(500).json({ message: (process.env.NODE_ENV === 'production' ? 'خطای غیرمنتظره در سرور' : err?.message || 'خطا در ثبت سفارش') });
  }
});

apiRouter.get('/orders', authMiddleware, (req: AuthRequest, res) => {
  if (req.user?.role === 'Admin' || req.user?.role === 'SuperAdmin') {
    const { status, search } = req.query;
    return res.json(OrderService.getAll({ status: status as any, search: search as string }));
  }
  // Regular customer: only own orders
  const orders = OrderService.getByUserId(req.user!.userId);
  res.json(orders);
});

apiRouter.get('/orders/:id', authMiddleware, (req: AuthRequest, res) => {
  const order = OrderService.getById(req.params.id);
  if (!order) return res.status(404).json({ message: 'سفارش یافت نشد.' });
  const isAdmin = req.user?.role === 'Admin' || req.user?.role === 'SuperAdmin';
  if (!isAdmin && order.userId !== req.user?.userId) {
    return res.status(403).json({ message: 'دسترسی به این سفارش مجاز نیست.' });
  }
  res.json(order);
});

apiRouter.patch('/orders/:id/status', authMiddleware, adminGuard, (req, res) => {
  const { status, paymentStatus, adminNotes } = req.body;
  const allowedOrderStatuses = ['Pending', 'Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];
  const allowedPaymentStatuses = ['Pending', 'Successful', 'Failed', 'Refunded', 'PartiallyRefunded'];

  if (status && !allowedOrderStatuses.includes(status)) {
    return res.status(400).json({ message: 'وضعیت سفارش نامعتبر است.' });
  }
  if (paymentStatus && !allowedPaymentStatuses.includes(paymentStatus)) {
    return res.status(400).json({ message: 'وضعیت پرداخت نامعتبر است.' });
  }

  const updated = OrderService.updateStatus(req.params.id, status, paymentStatus, adminNotes);
  if (!updated) return res.status(404).json({ message: 'سفارش یافت نشد.' });
  res.json(updated);
});

// ----------------------------------------------------
// 5. Payment Gateway (Abstract IPaymentGateway)
// ----------------------------------------------------
apiRouter.post('/payment/request', authRateLimit, authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { orderId } = req.body;
    const order = OrderService.getById(orderId);
    if (!order) return res.status(404).json({ message: 'سفارش یافت نشد.' });
    const isAdmin = req.user?.role === 'Admin' || req.user?.role === 'SuperAdmin';
    if (!isAdmin && order.userId !== req.user?.userId) return res.status(403).json({ message: 'دسترسی به این سفارش مجاز نیست.' });
    if (order.paymentStatus === 'Successful') return res.status(409).json({ message: 'این سفارش قبلاً پرداخت شده است.' });

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const result = await paymentGateway.requestPayment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amountTomans: order.totalAmount,
      description: `خرید از فروشگاه لواشک ملس‌بان - سفارش ${order.orderNumber}`,
      customerMobile: order.customerMobile,
      customerEmail: order.customerEmail,
      callbackUrl: `${appUrl}/checkout/payment-verify`,
    });

    if (result.isSuccess && result.authority) {
      order.paymentAuthority = result.authority;
      let saved = await getPgPool().query(
        `UPDATE orders SET payment_authority = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND payment_status <> 'Successful'`,
        [result.authority, order.id]
      );
      if (!saved.rowCount) {
        const synced = await syncSchemaToPostgres(db.getFullSchema());
        if (!synced.success) throw new Error(synced.error || 'Could not persist the order before payment.');
        saved = await getPgPool().query(
          `UPDATE orders SET payment_authority = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND payment_status <> 'Successful'`,
          [result.authority, order.id]
        );
      }
      if (!saved.rowCount) throw new Error('Could not persist payment authority for the order.');
      db.persist();
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: (process.env.NODE_ENV === 'production' ? 'خطای غیرمنتظره در سرور' : err?.message || 'خطا در اتصال به درگاه پرداخت') });
  }
});

apiRouter.post('/payment/verify', authRateLimit, authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { authority, orderId, status } = req.body;
    if (typeof authority !== 'string' || !authority.trim()) return res.status(400).json({ message: 'شناسه پرداخت نامعتبر است.' });
    const order = orderId
      ? OrderService.getById(String(orderId))
      : db.orders.find((candidate) => candidate.paymentAuthority === authority);
    if (!order) return res.status(404).json({ message: 'سفارش یا درخواست پرداخت یافت نشد.' });
    const isAdmin = req.user?.role === 'Admin' || req.user?.role === 'SuperAdmin';
    if (!isAdmin && order.userId !== req.user?.userId) return res.status(403).json({ message: 'دسترسی به این سفارش مجاز نیست.' });
    if (order.paymentStatus === 'Successful') return res.status(409).json({ message: 'این سفارش قبلاً پرداخت شده است.' });
    if (!order.paymentAuthority || order.paymentAuthority !== authority) {
      return res.status(400).json({ message: 'شناسه پرداخت به این سفارش تعلق ندارد یا منقضی شده است.' });
    }

    const result = await paymentGateway.verifyPayment({
      authority,
      amountTomans: order.totalAmount,
      status: status === 'NOK' ? 'NOK' : 'OK',
    });

    if (result.isSuccess) {
      const updated = await getPgPool().query(
        `UPDATE orders SET payment_status = 'Successful', status = 'Paid',
          payment_ref_id = $1, payment_authority = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND payment_authority = $3 AND payment_status <> 'Successful' RETURNING id`,
        [result.refId, order.id, authority]
      );
      if (!updated.rowCount) return res.status(409).json({ message: 'درخواست پرداخت قبلاً پردازش شده است.' });
      order.paymentStatus = 'Successful';
      order.status = 'Paid';
      order.paymentRefId = result.refId;
    } else {
      await getPgPool().query(
        `UPDATE orders SET payment_status = 'Failed', payment_authority = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND payment_authority = $2 AND payment_status <> 'Successful'`,
        [order.id, authority]
      );
      order.paymentStatus = 'Failed';
    }
    order.paymentAuthority = undefined;
    order.updatedAt = new Date().toISOString();
    db.persist();

    res.json({ success: result.isSuccess, orderId: order.id, ...result, order });
  } catch (err: any) {
    res.status(500).json({ message: (process.env.NODE_ENV === 'production' ? 'خطای غیرمنتظره در سرور' : err?.message || 'خطا در تأیید تراکنش') });
  }
});

// ----------------------------------------------------
// 6. Coupons
// ----------------------------------------------------
apiRouter.post('/coupons/validate', authRateLimit, async (req, res, next) => {
  const { code, cartTotal, mobile, userId } = req.body;
  if (!code) return res.status(400).json({ valid: false, message: 'کد تخفیف را وارد کنید.' });

  try {
    const sessionId = readCookie(req, SESSION_COOKIE);
    const sessionUserId = sessionId ? await getSessionUserId(sessionId) : null;
    const user = sessionUserId ? db.users.find((u) => u.id === sessionUserId && u.isActive) : undefined;
    const result = CouponService.validate(String(code), Number(cartTotal) || 0, {
      userId: user?.id,
      mobile: user?.mobile || (typeof mobile === 'string' ? mobile : undefined),
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

apiRouter.get('/coupons', authMiddleware, adminGuard, (req, res) => {
  res.json(CouponService.getAll());
});

apiRouter.post('/coupons', authMiddleware, adminGuard, (req, res) => {
  const newCoupon = CouponService.create(req.body);
  res.status(201).json(newCoupon);
});

apiRouter.put('/coupons/:id', authMiddleware, adminGuard, (req, res) => {
  const updated = CouponService.update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ message: 'کد تخفیف یافت نشد.' });
  res.json(updated);
});

apiRouter.patch('/coupons/:id/toggle', authMiddleware, adminGuard, (req, res) => {
  const updated = CouponService.toggle(req.params.id);
  if (!updated) return res.status(404).json({ message: 'کد تخفیف یافت نشد.' });
  res.json(updated);
});

apiRouter.delete('/coupons/:id', authMiddleware, adminGuard, (req, res) => {
  const ok = CouponService.delete(req.params.id);
  if (!ok) return res.status(404).json({ message: 'کد تخفیف یافت نشد.' });
  res.json({ success: true });
});

// ----------------------------------------------------
// 7. Wholesale Requests
// ----------------------------------------------------
apiRouter.post('/wholesale', (req, res) => {
  try {
    const {
      applicantName,
      companyName,
      mobile,
      email,
      province,
      city,
      businessType,
      requestedProducts,
      estimatedQuantityKg,
      description,
    } = req.body;

    if (!applicantName || !mobile || !companyName || !requestedProducts) {
      return res.status(400).json({ message: 'لطفاً تمام فیلدهای الزامی فرم همکاری را تکمیل کنید.' });
    }

    const created = WholesaleService.submit({
      applicantName,
      companyName,
      mobile,
      email,
      province: province || 'تهران',
      city: city || 'تهران',
      businessType: businessType || 'فروشگاه',
      requestedProducts,
      estimatedQuantityKg: Number(estimatedQuantityKg) || 20,
      description,
    });

    res.status(201).json({
      success: true,
      trackingCode: created.trackingCode,
      message: 'درخواست همکاری عمده شما با موفقیت ثبت شد. کارشناسان ما ظرف ۲۴ ساعت آینده با شما تماس خواهند گرفت.',
    });
  } catch (err: any) {
    res.status(500).json({ message: (process.env.NODE_ENV === 'production' ? 'خطای غیرمنتظره در سرور' : err?.message || 'خطا در ثبت درخواست عمده') });
  }
});

apiRouter.get('/wholesale', authMiddleware, adminGuard, (req, res) => {
  res.json(WholesaleService.getAll());
});

apiRouter.get('/admin/wholesale', authMiddleware, adminGuard, (req, res) => {
  res.json(WholesaleService.getAll());
});

apiRouter.patch('/wholesale/:id/status', authMiddleware, adminGuard, (req, res) => {
  const { status, adminNotes, offeredPricePerKg, quotationSent } = req.body;
  const allowedWholesaleStatuses = ['New', 'Reviewing', 'Contacted', 'Approved', 'Rejected'];
  if (status && !allowedWholesaleStatuses.includes(status)) {
    return res.status(400).json({ message: 'وضعیت درخواست عمده نامعتبر است.' });
  }
  const updated = WholesaleService.update(req.params.id, {
    ...(status ? { status } : {}),
    ...(adminNotes !== undefined ? { adminNotes } : {}),
    ...(offeredPricePerKg !== undefined ? { offeredPricePerKg: Number(offeredPricePerKg) } : {}),
    ...(quotationSent !== undefined ? { quotationSent: Boolean(quotationSent) } : {}),
  });
  if (!updated) return res.status(404).json({ message: 'درخواست یافت نشد.' });
  res.json(updated);
});

apiRouter.put('/admin/wholesale/:id/status', authMiddleware, adminGuard, (req, res) => {
  const { status, adminNotes, offeredPricePerKg, quotationSent } = req.body;
  const allowedWholesaleStatuses = ['New', 'Reviewing', 'Contacted', 'Approved', 'Rejected'];
  if (status && !allowedWholesaleStatuses.includes(status)) {
    return res.status(400).json({ message: 'وضعیت درخواست عمده نامعتبر است.' });
  }
  const updated = WholesaleService.update(req.params.id, {
    ...(status ? { status } : {}),
    ...(adminNotes !== undefined ? { adminNotes } : {}),
    ...(offeredPricePerKg !== undefined ? { offeredPricePerKg: Number(offeredPricePerKg) } : {}),
    ...(quotationSent !== undefined ? { quotationSent: Boolean(quotationSent) } : {}),
  });
  if (!updated) return res.status(404).json({ message: 'درخواست یافت نشد.' });
  res.json(updated);
});

apiRouter.put('/admin/wholesale/:id', authMiddleware, adminGuard, (req, res) => {
  const updated = WholesaleService.update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ message: 'درخواست یافت نشد.' });
  res.json(updated);
});

apiRouter.delete('/admin/wholesale/:id', authMiddleware, adminGuard, (req, res) => {
  const ok = WholesaleService.delete(req.params.id);
  res.json({ success: ok });
});

// ----------------------------------------------------
// 8. Reviews
// ----------------------------------------------------
apiRouter.get('/reviews', (req, res) => {
  const { productId, productSlug } = req.query;
  if (productId) return res.json(ReviewService.getForProduct(String(productId), false));
  if (productSlug) {
    const prod = ProductService.getByIdOrSlug(String(productSlug));
    return res.json(prod ? ReviewService.getForProduct(prod.id, false) : []);
  }
  res.json(ReviewService.getAll().filter((review) => review.isApproved));
});

apiRouter.get('/admin/reviews', authMiddleware, adminGuard, (req, res) => {
  res.json(ReviewService.getAll());
});

apiRouter.get('/reviews/product/:productId', (req, res) => {
  res.json(ReviewService.getForProduct(req.params.productId, false));
});

apiRouter.post('/reviews', authRateLimit, async (req, res, next) => {
  const { productId, userName, rating, comment, isOfficialStaff, isApproved, adminReply } = req.body;
  if (!productId || rating === undefined || !comment) {
    return res.status(400).json({ message: 'لطفاً امتیاز و نظر خود را وارد نمایید.' });
  }

  const numRating = Number(rating);
  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    return res.status(400).json({ message: 'امتیاز باید عددی بین ۱ تا ۵ باشد.' });
  }

  try {
    const sessionId = readCookie(req, SESSION_COOKIE);
    const sessionUserId = sessionId ? await getSessionUserId(sessionId) : null;
    const currentUser = sessionUserId ? db.users.find((u) => u.id === sessionUserId && u.isActive) : undefined;
    const staff = Boolean(currentUser && (currentUser.role === 'SuperAdmin' || (currentUser.role === 'Admin' && currentUser.permissions?.includes('reviews'))));
    const approved = staff && isApproved !== undefined ? Boolean(isApproved) : false;
    const review = ReviewService.submit({
      productId,
      userName: currentUser ? `${currentUser.name} ${currentUser.family}`.trim() : (userName || 'کاربر مهمان'),
      rating: numRating,
      comment: String(comment).trim().slice(0, 5000),
      userId: currentUser?.id,
      isOfficialStaff: staff && Boolean(isOfficialStaff),
      isApproved: approved,
      adminReply: staff ? adminReply : undefined,
    });
    res.status(201).json({ success: true, review, ...review });
  } catch (err) {
    next(err);
  }
});

apiRouter.get('/reviews/admin', authMiddleware, adminGuard, (req, res) => {
  res.json(ReviewService.getAll());
});

apiRouter.patch('/reviews/:id/toggle', authMiddleware, adminGuard, (req, res) => {
  const updated = ReviewService.toggleApproval(req.params.id);
  if (!updated) return res.status(404).json({ message: 'نظر یافت نشد.' });
  res.json(updated);
});

apiRouter.post('/reviews/:id/reply', authMiddleware, adminGuard, (req, res) => {
  const { reply } = req.body;
  if (!reply) return res.status(400).json({ message: 'متن پاسخ نمی‌تواند خالی باشد.' });
  const updated = ReviewService.reply(req.params.id, reply);
  if (!updated) return res.status(404).json({ message: 'نظر یافت نشد.' });
  res.json(updated);
});

apiRouter.delete('/reviews/:id/reply', authMiddleware, adminGuard, (req, res) => {
  const updated = ReviewService.deleteReply(req.params.id);
  if (!updated) return res.status(404).json({ message: 'نظر یا پاسخ یافت نشد.' });
  res.json({ success: true, review: updated });
});

apiRouter.delete('/reviews/:id', authMiddleware, adminGuard, (req, res) => {
  const ok = ReviewService.delete(req.params.id);
  res.json({ success: ok });
});

// ----------------------------------------------------
// 9. Blog
// ----------------------------------------------------
apiRouter.get('/blog', (req, res) => {
  res.json(BlogService.getPublished());
});

apiRouter.get('/blog/:slug', (req, res) => {
  const post = BlogService.getBySlug(req.params.slug);
  if (!post) return res.status(404).json({ message: 'مقاله یافت نشد.' });
  res.json(post);
});

apiRouter.get('/admin/blog', authMiddleware, adminGuard, (req, res) => {
  res.json(BlogService.getAll());
});

apiRouter.post('/blog', authMiddleware, adminGuard, (req, res) => {
  const post = BlogService.create(req.body);
  res.status(201).json(post);
});

apiRouter.put('/blog/:id', authMiddleware, adminGuard, (req, res) => {
  const updated = BlogService.update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ message: 'مقاله یافت نشد.' });
  res.json(updated);
});

apiRouter.delete('/blog/:id', authMiddleware, adminGuard, (req, res) => {
  const ok = BlogService.delete(req.params.id);
  res.json({ success: ok });
});

// ----------------------------------------------------
// 10. Site Settings & Admin Dashboard
// ----------------------------------------------------
apiRouter.get('/settings', (req, res) => {
  res.json(db.settings);
});

apiRouter.get('/admin/settings', authMiddleware, adminGuard, (req, res) => {
  res.json(db.settings);
});

apiRouter.put('/settings', authMiddleware, adminGuard, (req: AuthRequest, res: Response) => {
  try {
    const updated = db.updateSettings(req.body);
    res.json(updated);
  } catch (err: any) {
    console.error('Settings update error in server:', err);
    res.status(500).json({ message: (process.env.NODE_ENV === 'production' ? 'خطای غیرمنتظره در سرور' : err?.message || 'خطا در ذخیره تنظیمات در پایگاه داده') });
  }
});

apiRouter.put('/admin/settings', authMiddleware, adminGuard, (req: AuthRequest, res: Response) => {
  try {
    const updated = db.updateSettings(req.body);
    res.json(updated);
  } catch (err: any) {
    console.error('Admin settings update error in server:', err);
    res.status(500).json({ message: (process.env.NODE_ENV === 'production' ? 'خطای غیرمنتظره در سرور' : err?.message || 'خطا در ذخیره تنظیمات') });
  }
});

apiRouter.get('/admin/dashboard', authMiddleware, adminGuard, (req, res) => {
  res.json(DashboardService.getStats());
});

apiRouter.get('/admin/stats', authMiddleware, adminGuard, (req, res) => {
  res.json(DashboardService.getStats());
});

apiRouter.get('/admin/orders', authMiddleware, adminGuard, (req, res) => {
  const { status, search } = req.query;
  res.json(OrderService.getAll({ status: status as any, search: search as string }));
});

apiRouter.put('/admin/orders/:id/status', authMiddleware, adminGuard, (req, res) => {
  const { status, paymentStatus, adminNotes } = req.body;
  const allowedOrderStatuses = ['Pending', 'Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];
  const allowedPaymentStatuses = ['Pending', 'Successful', 'Failed', 'Refunded', 'PartiallyRefunded'];

  if (status && !allowedOrderStatuses.includes(status)) {
    return res.status(400).json({ message: 'وضعیت سفارش نامعتبر است.' });
  }
  if (paymentStatus && !allowedPaymentStatuses.includes(paymentStatus)) {
    return res.status(400).json({ message: 'وضعیت پرداخت نامعتبر است.' });
  }

  const updated = OrderService.updateStatus(req.params.id, status, paymentStatus, adminNotes);
  if (!updated) return res.status(404).json({ message: 'سفارش یافت نشد.' });
  res.json(updated);
});

apiRouter.get('/admin/users', authMiddleware, adminGuard, (req, res) => {
  const { type, search } = req.query;
  let list = db.users;

  if (type === 'staff') {
    list = list.filter((u) => u.role === 'Admin' || u.role === 'SuperAdmin');
  } else if (type === 'customer') {
    list = list.filter((u) => u.role === 'Customer');
  }

  if (search && typeof search === 'string') {
    const q = search.trim().toLowerCase();
    list = list.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.family.toLowerCase().includes(q) ||
        u.mobile.includes(q) ||
        (u.email && u.email.toLowerCase().includes(q))
    );
  }

  const safeUsers = list.map(({ passwordHash, salt, ...u }) => {
    // Enrich customer with orders metrics
    const userOrders = db.orders.filter(
      (o) => o.userId === u.id || (o.customerMobile && o.customerMobile === u.mobile)
    );
    const totalSpent = userOrders
      .filter((o) => o.paymentStatus === 'Successful' || o.status === 'Delivered' || o.status === 'Paid')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      ...u,
      ordersCount: userOrders.length,
      totalSpent,
      lastOrderDate: userOrders[0]?.createdAt,
      permissions: u.permissions || (u.role === 'SuperAdmin' ? [
        'overview', 'products', 'orders', 'wholesale', 'reviews', 'categories', 'coupons', 'customers', 'staff', 'blog', 'settings', 'chat'
      ] : []),
      isSuperAdmin: u.role === 'SuperAdmin',
    };
  });

  res.json(safeUsers);
});

apiRouter.post('/admin/users', authMiddleware, adminGuard, (req: AuthRequest, res) => {
  try {
    const { name, family, mobile, email, password, role, permissions, isActive } = req.body;
    if (typeof name !== 'string' || !name.trim() || typeof mobile !== 'string' || !mobile.trim() || typeof password !== 'string') {
      return res.status(400).json({ message: 'نام، شماره موبایل و رمز عبور الزامی هستند.' });
    }
    if (typeof password !== 'string' || password.length < 12 || password.length > 128) {
      return res.status(400).json({ message: 'رمز عبور باید حداقل ۱۲ و حداکثر ۱۲۸ نویسه باشد.' });
    }

    // Role-based permission check: only SuperAdmin can create Staff/Admins
    const targetRole = role === 'SuperAdmin' || role === 'Admin' ? role : 'Customer';
    if (targetRole !== 'Customer') {
      const isCallerSuperAdmin = req.user?.role === 'SuperAdmin';
      if (!isCallerSuperAdmin) {
        return res.status(403).json({ message: 'فقط مدیر ارشد مجاز به ایجاد پرسنل و تعیین دسترسی است.' });
      }
    }

    const existing = db.users.find(
      (u) => u.mobile === mobile || (email && u.email && u.email.toLowerCase() === email.trim().toLowerCase())
    );
    if (existing) {
      return res.status(400).json({ message: 'کاربری با این شماره موبایل یا ایمیل قبلاً وجود دارد.' });
    }

    const auth = hashPassword(password);
    const defaultPermissions = targetRole === 'SuperAdmin'
      ? ['overview', 'products', 'orders', 'wholesale', 'reviews', 'categories', 'coupons', 'customers', 'staff', 'blog', 'settings', 'chat']
      : Array.isArray(permissions) ? permissions : ['overview', 'products', 'orders'];

    const newUser = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      family: (family || '').trim(),
      mobile: String(mobile).trim(),
      email: typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : `${String(mobile).trim()}@no-email.malasban.invalid`,
      passwordHash: auth.hash,
      salt: auth.salt,
      role: targetRole,
      isSuperAdmin: targetRole === 'SuperAdmin',
      permissions: targetRole === 'Customer' ? [] : defaultPermissions,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      addresses: [],
    };

    db.users.push(newUser);
    db.persist();

    const { passwordHash, salt, ...safeUser } = newUser;
    res.status(201).json(safeUser);
  } catch (err: any) {
    res.status(500).json({ message: (process.env.NODE_ENV === 'production' ? 'خطای غیرمنتظره در سرور' : err?.message || 'خطا در ایجاد کاربر') });
  }
});

apiRouter.put('/admin/users/:id', authMiddleware, adminGuard, (req: AuthRequest, res) => {
  try {
    const user = db.users.find((u) => u.id === req.params.id);
    if (!user) return res.status(404).json({ message: 'کاربر یافت نشد.' });

    const { name, family, mobile, email, password, role, permissions, isActive } = req.body;
    const isCallerSuperAdmin = req.user?.role === 'SuperAdmin';
    if (role !== undefined && !['SuperAdmin', 'Admin', 'Customer'].includes(role)) {
      return res.status(400).json({ message: 'نقش کاربری نامعتبر است.' });
    }
    const allowedPermissions = ['overview','products','orders','wholesale','reviews','categories','coupons','customers','staff','blog','settings','chat'];
    if (permissions !== undefined && (!Array.isArray(permissions) || permissions.some((perm: unknown) => typeof perm !== 'string' || !allowedPermissions.includes(perm)))) {
      return res.status(400).json({ message: 'فهرست مجوزهای کاربری نامعتبر است.' });
    }
    if (password !== undefined && (typeof password !== 'string' || password.length < 12 || password.length > 128)) {
      return res.status(400).json({ message: 'رمز عبور جدید باید حداقل ۱۲ و حداکثر ۱۲۸ نویسه باشد.' });
    }

    // If altering roles or permissions or editing another admin, ensure caller is SuperAdmin
    if (role !== undefined || permissions !== undefined) {
      if (!isCallerSuperAdmin) {
        return res.status(403).json({ message: 'فقط مدیر ارشد مجاز به تغییر نقش و مجوزهای کاربری است.' });
      }
    }

    if (name) user.name = name.trim();
    if (family !== undefined) user.family = family.trim();
    if (mobile) user.mobile = mobile.trim();
    if (email !== undefined) user.email = email.trim().toLowerCase();
    if (isActive !== undefined && user.id !== 'usr-admin-01') {
      user.isActive = Boolean(isActive);
    }

    if (role && isCallerSuperAdmin) {
      user.role = role;
    }

    if (permissions && Array.isArray(permissions) && isCallerSuperAdmin) {
      user.permissions = permissions;
    }

    if (typeof password === 'string' && password.length >= 12) {
      const auth = hashPassword(password);
      user.passwordHash = auth.hash;
      user.salt = auth.salt;
    }

    user.updatedAt = new Date().toISOString();
    db.persist();

    const { passwordHash, salt, ...safeUser } = user;
    res.json(safeUser);
  } catch (err: any) {
    res.status(500).json({ message: (process.env.NODE_ENV === 'production' ? 'خطای غیرمنتظره در سرور' : err?.message || 'خطا در ویرایش کاربر') });
  }
});

apiRouter.delete('/admin/users/:id', authMiddleware, adminGuard, (req: AuthRequest, res) => {
  const targetId = req.params.id;
  if (targetId === 'usr-admin-01') {
    return res.status(400).json({ message: 'حساب مدیر کل سامانه قابل حذف نیست.' });
  }
  if (req.user?.userId === targetId) {
    return res.status(400).json({ message: 'نمی‌توانید حساب کاربری فعلی خود را حذف نمایید.' });
  }

  const idx = db.users.findIndex((u) => u.id === targetId);
  if (idx === -1) return res.status(404).json({ message: 'کاربر یافت نشد.' });

  const target = db.users[idx];
  const isCallerSuperAdmin = req.user?.role === 'SuperAdmin';
  if ((target.role === 'Admin' || target.role === 'SuperAdmin') && !isCallerSuperAdmin) {
    return res.status(403).json({ message: 'فقط مدیر ارشد مجاز به حذف حساب مدیران است.' });
  }

  db.users.splice(idx, 1);
  db.persist();

  res.json({ success: true, message: 'کاربر با موفقیت حذف شد.' });
});

apiRouter.patch('/admin/users/:id/toggle', authMiddleware, adminGuard, (req: AuthRequest, res) => {
  const targetId = req.params.id;
  if (targetId === 'usr-admin-01') {
    return res.status(400).json({ message: 'حساب مدیر کل سامانه همواره فعال است.' });
  }
  if (req.user?.userId === targetId) {
    return res.status(400).json({ message: 'نمی‌توانید حساب خود را غیرفعال کنید.' });
  }

  const user = db.users.find((u) => u.id === targetId);
  if (!user) return res.status(404).json({ message: 'کاربر یافت نشد.' });

  user.isActive = !user.isActive;
  user.updatedAt = new Date().toISOString();
  db.persist();

  const { passwordHash, salt, ...safeUser } = user;
  res.json(safeUser);
});

// ----------------------------------------------------
// 12. Chat Endpoints (Customer & Support)
// ----------------------------------------------------
apiRouter.get('/chat/settings', (req, res) => {
  try {
    const settings = ChatService.getSettings();
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در دریافت تنظیمات چت' });
  }
});

apiRouter.get('/chat/unanswered-count', (req, res) => {
  try {
    const unanswered = db.chatConversations.filter(
      (c) => c.status !== 'closed' && (c.unreadAgentCount > 0 || c.status === 'waiting')
    ).length;
    const active = db.chatConversations.filter((c) => c.status === 'active').length;
    res.json({ unansweredCount: unanswered, activeCount: active });
  } catch (err: any) {
    res.status(500).json({ unansweredCount: 0, activeCount: 0 });
  }
});

apiRouter.post('/chat/init', (req, res) => {
  try {
    const { customerId, guestId, customerName, customerMobile, customerEmail, initialProduct, contextOrder } = req.body;
    const result = ChatService.createOrGetConversation({
      customerId,
      guestId,
      customerName: customerName || (customerId ? 'مشتری عزیز' : 'کاربر مهمان'),
      customerMobile,
      customerEmail,
      initialProduct,
      contextOrder,
    });
    const messages = ChatService.getMessages(result.conversation.id);
    res.json({
      conversation: result.conversation,
      isNew: result.isNew,
      messages,
    });
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در آغاز گفتگو' });
  }
});

apiRouter.get('/chat/guest/:guestId', (req, res) => {
  try {
    const conv = ChatService.getConversationByGuestId(req.params.guestId);
    if (!conv) {
      return res.json({ conversation: null, messages: [] });
    }
    const messages = ChatService.getMessages(conv.id);
    res.json({ conversation: conv, messages });
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در بازیابی گفتگوی مهمان' });
  }
});

apiRouter.get('/chat/conversations/:id/messages', (req, res) => {
  try {
    const messages = ChatService.getMessages(req.params.id);
    res.json(messages);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در دریافت پیام‌ها' });
  }
});

apiRouter.post('/chat/conversations/:id/messages', async (req, res) => {
  try {
    const conversationId = req.params.id;
    const {
      sender,
      senderName,
      senderAvatar,
      text,
      attachmentUrl,
      attachmentType,
      attachmentName,
      product,
      order,
      quickReplies,
    } = req.body;

    const message = ChatService.sendMessage({
      conversationId,
      sender: sender || 'customer',
      senderName: senderName || (sender === 'agent' ? 'پشتیبان ملس‌بان' : 'مشتری'),
      senderAvatar,
      text: text || '',
      attachmentUrl,
      attachmentType,
      attachmentName,
      product,
      order,
      quickReplies,
    });

    let botMessage = null;
    const settings = ChatService.getSettings();

    // If customer sent text and AI is enabled, check if bot should reply
    if (sender === 'customer' && text && settings.enableAiAssistant) {
      const conv = ChatService.getConversationById(conversationId);
      if (conv && conv.status !== 'closed') {
        botMessage = await AiChatBotService.processCustomerMessage(conversationId, text);
      }
    }

    res.json({ message, botMessage });
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در ارسال پیام' });
  }
});

apiRouter.post('/chat/conversations/:id/rate', (req, res) => {
  try {
    const { rating, feedback } = req.body;
    const ok = ChatService.rateConversation(req.params.id, Number(rating) || 5, feedback);
    if (!ok) return res.status(404).json({ message: 'گفتگو یافت نشد' });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در ثبت نظر' });
  }
});

apiRouter.post('/chat/conversations/:id/read', (req, res) => {
  try {
    const { role } = req.body;
    ChatService.markMessagesAsRead(req.params.id, role === 'agent' ? 'agent' : 'customer');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در ثبت وضعیت خوانده شدن' });
  }
});

apiRouter.post('/chat/offline-lead', (req, res) => {
  try {
    const { name, mobile, email, message, product } = req.body;
    if (!name || (!mobile && !email)) {
      return res.status(400).json({ message: 'لطفاً نام و حداقل یکی از موارد شماره همراه یا ایمیل را وارد فرمایید.' });
    }

    const { conversation } = ChatService.createOrGetConversation({
      customerName: name,
      customerMobile: mobile,
      customerEmail: email,
      initialProduct: product,
    });

    conversation.status = 'waiting';
    conversation.priority = 'normal';
    if (!conversation.tags.includes('پیام آفلاین')) {
      conversation.tags.push('پیام آفلاین');
    }
    db.persist();

    if (message) {
      ChatService.sendMessage({
        conversationId: conversation.id,
        sender: 'customer',
        senderName: name,
        text: `[پیام فرم آفلاین]: ${message}`,
      });
    }

    ChatService.sendMessage({
      conversationId: conversation.id,
      sender: 'system',
      senderName: 'سیستم ملس‌بان',
      text: 'پیام و اطلاعات تماس شما با موفقیت ثبت شد. کارشناسان ما به محض آغاز ساعات کاری با شما تماس می‌گیرند.',
    });

    res.json({ success: true, conversationId: conversation.id });
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در ثبت پیام آفلاین' });
  }
});

// Admin Chat Endpoints
apiRouter.get('/admin/chat/conversations', authMiddleware, adminGuard, (req: AuthRequest, res) => {
  try {
    const { status, priority, search, assignedAgentId, tag } = req.query;
    const conversations = ChatService.getConversations({
      status: status as string,
      priority: priority as string,
      search: search as string,
      assignedAgentId: assignedAgentId as string,
      tag: tag as string,
    });
    res.json(conversations);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در دریافت گفتگوها' });
  }
});

apiRouter.get('/admin/chat/conversations/:id', authMiddleware, adminGuard, (req: AuthRequest, res) => {
  try {
    const conv = ChatService.getConversationById(req.params.id);
    if (!conv) return res.status(404).json({ message: 'گفتگو یافت نشد' });

    // Mark as read immediately when admin opens conversation
    if (conv.unreadAgentCount > 0) {
      ChatService.markMessagesAsRead(conv.id, 'agent');
      conv.unreadAgentCount = 0;
    }

    let customerOrders: any[] = [];
    if (conv.customerId) {
      customerOrders = db.orders.filter((o) => o.userId === conv.customerId);
    } else if (conv.customerMobile) {
      const cleanMobile = conv.customerMobile.replace(/[^0-9]/g, '');
      customerOrders = db.orders.filter(
        (o) => o.customerMobile && o.customerMobile.replace(/[^0-9]/g, '') === cleanMobile
      );
    }

    const messages = ChatService.getMessages(conv.id);
    res.json({ conversation: conv, messages, customerOrders });
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در دریافت جزئیات گفتگو' });
  }
});

apiRouter.put('/admin/chat/conversations/:id', authMiddleware, adminGuard, (req: AuthRequest, res) => {
  try {
    const updated = ChatService.updateConversation(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'گفتگو یافت نشد' });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در ویرایش گفتگو' });
  }
});

apiRouter.post('/admin/chat/conversations/:id/summary', authMiddleware, adminGuard, (req: AuthRequest, res) => {
  try {
    const summary = ChatService.generateSummary(req.params.id);
    res.json({ summary });
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در ساخت خلاصه‌سازی' });
  }
});

apiRouter.get('/admin/chat/analytics', authMiddleware, adminGuard, (req: AuthRequest, res) => {
  try {
    const analytics = ChatService.getAnalytics();
    res.json(analytics);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در دریافت آمار چت' });
  }
});

apiRouter.get('/admin/chat/canned-responses', authMiddleware, adminGuard, (req: AuthRequest, res) => {
  try {
    const list = ChatService.getCannedResponses();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در دریافت پاسخ‌های آماده' });
  }
});

apiRouter.post('/admin/chat/canned-responses', authMiddleware, adminGuard, (req: AuthRequest, res) => {
  try {
    const { shortcut, title, content, category } = req.body;
    if (!shortcut || !title || !content) {
      return res.status(400).json({ message: 'میانبر، عنوان و متن پاسخ الزامی است.' });
    }
    const created = ChatService.createCannedResponse({ shortcut, title, content, category: category || 'عمومی' });
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در ایجاد پاسخ آماده' });
  }
});

apiRouter.delete('/admin/chat/canned-responses/:id', authMiddleware, adminGuard, (req: AuthRequest, res) => {
  try {
    const ok = ChatService.deleteCannedResponse(req.params.id);
    if (!ok) return res.status(404).json({ message: 'پاسخ آماده یافت نشد' });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در حذف پاسخ آماده' });
  }
});

apiRouter.put('/admin/chat/settings', authMiddleware, adminGuard, (req: AuthRequest, res) => {
  try {
    const updated = ChatService.updateSettings(req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در بروزرسانی تنظیمات چت' });
  }
});

// ====================================================================
// Database Management & Migrations (PostgreSQL / MySQL)
// ====================================================================

apiRouter.get('/admin/database/status', authMiddleware, adminGuard, async (req: AuthRequest, res) => {
  try {
    const migrator = new DbMigrator();
    const status = await migrator.getStatus();
    const pgDir = path.resolve(process.cwd(), 'database/migrations/postgres');
    const myDir = path.resolve(process.cwd(), 'database/migrations/mysql');

    const pgFiles = fs.existsSync(pgDir) ? fs.readdirSync(pgDir).filter((f) => f.endsWith('.sql')) : [];
    const myFiles = fs.existsSync(myDir) ? fs.readdirSync(myDir).filter((f) => f.endsWith('.sql')) : [];

    res.json({
      connected: status.connected,
      error: status.error,
      databaseType: 'PostgreSQL / MySQL Compatible',
      activeProvider: status.connected ? 'PostgreSQL (Active)' : 'Local File Context (Active Fallback)',
      envConfigured: Boolean(process.env.DATABASE_URL || process.env.PGHOST || process.env.SQL_HOST),
      migrations: {
        postgres: pgFiles,
        mysql: myFiles,
        applied: status.applied,
        pending: status.pending,
      },
      counts: {
        categories: db.categories.length,
        products: db.products.length,
        users: db.users.length,
        addresses: db.users.reduce((acc, u) => acc + (Array.isArray(u.addresses) ? u.addresses.length : 0), 0),
        orders: db.orders.length,
        orderItems: db.orders.reduce((acc, o) => acc + (Array.isArray(o.items) ? o.items.length : 0), 0),
        coupons: db.coupons.length,
        wholesaleRequests: db.wholesaleRequests.length,
        reviews: db.reviews.length,
        blogPosts: db.blogPosts.length,
        chatConversations: db.chatConversations.length,
        chatMessages: db.chatMessages.length,
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در بررسی وضعیت دیتابیس', error: err.message });
  }
});

apiRouter.post('/admin/database/migrate', authMiddleware, adminGuard, async (req: AuthRequest, res) => {
  try {
    const migrator = new DbMigrator();
    const result = await migrator.runMigrations();
    res.json({
      success: true,
      message: 'مهاجرت دیتابیس با موفقیت اعمال شد',
      applied: result.applied,
      alreadyApplied: result.alreadyApplied,
    });
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در اعمال مایگریشن دیتابیس', error: err.message });
  }
});

apiRouter.post('/admin/database/seed', authMiddleware, adminGuard, async (req: AuthRequest, res) => {
  try {
    const migrator = new DbMigrator();
    await migrator.runSeed();
    res.json({
      success: true,
      message: 'داده‌های اولیه (Init Seed) با موفقیت در دیتابیس ذخیره شدند',
    });
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در درج داده‌های اولیه', error: err.message });
  }
});

apiRouter.post('/admin/database/sync', authMiddleware, adminGuard, async (req: AuthRequest, res) => {
  try {
    const isConn = await checkPgConnection();
    if (!isConn) {
      return res.status(503).json({
        success: false,
        message: 'اتصال به پایگاه داده PostgreSQL برقرار نیست. لطفاً متغیر DATABASE_URL را در محیط سرور تنظیم فرمایید.',
      });
    }

    const result = await syncSchemaToPostgres(db.getFullSchema());
    if (result.success) {
      res.json({
        success: true,
        message: 'تمام داده‌های سیستم با موفقیت به جداول PostgreSQL منتقل و همگام‌سازی شدند.',
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'خطا در همگام‌سازی داده‌ها با PostgreSQL',
        error: result.error,
      });
    }
  } catch (err: any) {
    res.status(500).json({ message: 'خطای سرور در همگام‌سازی دیتابیس', error: err.message });
  }
});

apiRouter.get('/admin/database/sql-schema', authMiddleware, adminGuard, (req: AuthRequest, res) => {
  try {
    const dialect = req.query.dialect === 'mysql' ? 'mysql' : 'postgres';
    const filePath = path.resolve(process.cwd(), `database/migrations/${dialect}/001_initial_schema.sql`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'فایل اسکیما یافت نشد' });
    }
    const sql = fs.readFileSync(filePath, 'utf-8');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=malasban_${dialect}_schema.sql`);
    res.send(sql);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در خواندن فایل اسکیما', error: err.message });
  }
});

apiRouter.get('/admin/database/sql-seed', authMiddleware, adminGuard, (req: AuthRequest, res) => {
  try {
    const dialect = req.query.dialect === 'mysql' ? 'mysql' : 'postgres';
    const filePath = path.resolve(process.cwd(), `database/migrations/${dialect}/002_seed_initial_data.sql`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'فایل داده‌های اولیه یافت نشد' });
    }
    const sql = fs.readFileSync(filePath, 'utf-8');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=malasban_${dialect}_seed.sql`);
    res.send(sql);
  } catch (err: any) {
    res.status(500).json({ message: 'خطا در خواندن فایل دیتای اولیه', error: err.message });
  }
});

