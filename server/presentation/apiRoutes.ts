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
  generateToken,
  verifyToken,
  TokenPayload,
} from '../infrastructure/auth.js';
import { ZarinPalPaymentGateway } from '../infrastructure/paymentGateways.js';
import { IPaymentGateway } from '../domain/interfaces.js';

import { DbMigrator } from '../infrastructure/dbMigrator.js';
import { syncSchemaToPostgres, checkPgConnection } from '../infrastructure/pgSync.js';
import fs from 'fs';
import path from 'path';

export const apiRouter = Router();

// Payment gateway abstraction instance
const paymentGateway: IPaymentGateway = new ZarinPalPaymentGateway();

// Auth Middleware
export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'لطفاً ابتدا وارد حساب کاربری خود شوید.' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ message: 'توکن احراز هویت نامعتبر یا منقضی شده است.' });
  }

  req.user = payload;
  next();
}

export function adminGuard(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || (req.user.role !== 'Admin' && req.user.role !== 'SuperAdmin')) {
    return res.status(403).json({ message: 'دسترسی غیرمجاز. فقط مدیران سیستم مجاز هستند.' });
  }
  next();
}

// ----------------------------------------------------
// 1. Auth Routes
// ----------------------------------------------------
apiRouter.post('/auth/register', (req, res) => {
  try {
    const { name, family, email, mobile, password } = req.body;
    if (!name || !mobile || !password) {
      return res.status(400).json({ message: 'لطفاً نام، شماره موبایل و رمز عبور را وارد نمایید.' });
    }

    const existingUser = db.users.find(
      (u) => (email && u.email?.toLowerCase() === email.toLowerCase()) || u.mobile === mobile
    );
    if (existingUser) {
      return res.status(400).json({ message: 'کاربری با این شماره موبایل یا ایمیل قبلاً ثبت نام کرده است.' });
    }

    const auth = hashPassword(password);
    const newUser = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      family: (family || '').trim(),
      email: (email || '').trim().toLowerCase(),
      mobile: mobile.trim(),
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

    const token = generateToken(newUser);
    const { passwordHash, salt, ...safeUser } = newUser;

    res.status(201).json({ user: safeUser, token });
  } catch (err: any) {
    res.status(500).json({ message: err?.message || 'خطای سرور' });
  }
});

apiRouter.post('/auth/login', (req, res) => {
  try {
    const { identifier, password } = req.body; // mobile or email
    if (!identifier || !password) {
      return res.status(400).json({ message: 'لطفاً شماره موبایل/ایمیل و رمز عبور را وارد نمایید.' });
    }

    const cleanId = identifier.trim().toLowerCase();
    const user = db.users.find(
      (u) => u.mobile === cleanId || u.email.toLowerCase() === cleanId
    );

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'نام کاربری یا رمز عبور اشتباه است، یا حساب غیرفعال شده است.' });
    }

    const valid = verifyPassword(password, user.passwordHash, user.salt);
    if (!valid) {
      return res.status(401).json({ message: 'نام کاربری یا رمز عبور اشتباه است.' });
    }

    const token = generateToken(user);
    const { passwordHash, salt, ...safeUser } = user;

    res.json({ user: safeUser, token });
  } catch (err: any) {
    res.status(500).json({ message: err?.message || 'خطای سرور' });
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
    res.status(400).json({ message: err?.message || 'خطا در ثبت محصول' });
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
apiRouter.get('/categories', (req, res) => {
  if (req.query.all === 'true') {
    return res.json(CategoryService.getAllAdmin());
  }
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
    res.status(400).json({ message: err?.message || 'خطا در ثبت دسته‌بندی' });
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
apiRouter.post('/orders', (req, res) => {
  try {
    const {
      userId,
      customerName,
      customerMobile,
      customerEmail,
      shippingAddress,
      shippingMethod,
      shippingFee,
      items,
      subtotal,
      discountAmount,
      couponCode,
      totalAmount,
      paymentMethod,
      customerNotes,
    } = req.body;

    if (!customerName || !customerMobile || !shippingAddress || !items || items.length === 0) {
      return res.status(400).json({ message: 'اطلاعات سفارش یا سبد خرید ناقص است.' });
    }

    // Verify firstOrderOnly coupon constraint if coupon applied
    if (couponCode) {
      const cleanCode = couponCode.trim().toUpperCase();
      const coupon = db.coupons.find((c) => c.code.toUpperCase() === cleanCode);
      if (coupon && coupon.firstOrderOnly) {
        const cleanMobile = customerMobile.replace(/[^0-9]/g, '');
        const hasExistingOrder = db.orders.some((o) => {
          if (o.status === 'Cancelled') return false;
          if (userId && o.userId === userId) return true;
          if (cleanMobile && o.customerMobile.replace(/[^0-9]/g, '') === cleanMobile) return true;
          return false;
        });

        if (hasExistingOrder) {
          return res.status(400).json({
            message: 'کد تخفیف استفاده شده فقط برای اولین خرید مجاز است و برای این شماره یا حساب کاربری قبلاً سفارشی ثبت شده است.',
          });
        }
      }
    }

    const order = OrderService.create({
      userId,
      customerName,
      customerMobile,
      customerEmail,
      shippingAddress,
      shippingMethod: shippingMethod || 'پست پیشتاز',
      shippingFee: shippingFee ?? 45000,
      items,
      subtotal,
      discountAmount: discountAmount || 0,
      couponCode,
      totalAmount,
      paymentMethod: paymentMethod || 'درگاه بانکی شاپرک',
      customerNotes,
    });

    res.status(201).json(order);
  } catch (err: any) {
    res.status(500).json({ message: err?.message || 'خطا در ثبت سفارش' });
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

apiRouter.get('/orders/:id', (req, res) => {
  const order = OrderService.getById(req.params.id);
  if (!order) return res.status(404).json({ message: 'سفارش یافت نشد.' });
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
apiRouter.post('/payment/request', async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = OrderService.getById(orderId);
    if (!order) return res.status(404).json({ message: 'سفارش یافت نشد.' });

    const appUrl = process.env.APP_URL || `http://${req.headers.host}`;
    const result = await paymentGateway.requestPayment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amountTomans: order.totalAmount,
      description: `خرید از فروشگاه لواشک ملس‌بان - سفارش ${order.orderNumber}`,
      customerMobile: order.customerMobile,
      customerEmail: order.customerEmail,
      callbackUrl: `${appUrl}/checkout/payment-verify`,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err?.message || 'خطا در اتصال به درگاه پرداخت' });
  }
});

apiRouter.post('/payment/verify', async (req, res) => {
  try {
    const { authority, orderId } = req.body;
    const order = OrderService.getById(orderId);
    if (!order) return res.status(404).json({ message: 'سفارش یافت نشد.' });

    const result = await paymentGateway.verifyPayment({
      authority,
      amountTomans: order.totalAmount,
    });

    if (result.isSuccess) {
      order.paymentStatus = 'Successful';
      order.status = 'Paid';
      order.paymentRefId = result.refId;
      order.updatedAt = new Date().toISOString();
      db.persist();
    } else {
      order.paymentStatus = 'Failed';
      order.updatedAt = new Date().toISOString();
      db.persist();
    }

    res.json({ ...result, order });
  } catch (err: any) {
    res.status(500).json({ message: err?.message || 'خطا در تأیید تراکنش' });
  }
});

// ----------------------------------------------------
// 6. Coupons
// ----------------------------------------------------
apiRouter.post('/coupons/validate', (req, res) => {
  const { code, cartTotal, mobile, userId } = req.body;
  if (!code) return res.status(400).json({ valid: false, message: 'کد تخفیف را وارد کنید.' });

  let effectiveUserId = userId;
  let effectiveMobile = mobile;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (payload?.userId) {
      effectiveUserId = payload.userId;
      const user = db.users.find((u) => u.id === payload.userId);
      if (user?.mobile) effectiveMobile = user.mobile;
    }
  }

  const result = CouponService.validate(code, cartTotal || 0, {
    userId: effectiveUserId,
    mobile: effectiveMobile,
  });
  res.json(result);
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
    res.status(500).json({ message: err?.message || 'خطا در ثبت درخواست عمده' });
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
  const { productId, productSlug, all } = req.query;
  const includeAll = all === 'true';
  if (productId) {
    return res.json(ReviewService.getForProduct(String(productId), includeAll));
  }
  if (productSlug) {
    const prod = ProductService.getByIdOrSlug(String(productSlug));
    if (prod) {
      return res.json(ReviewService.getForProduct(prod.id, includeAll));
    }
    return res.json([]);
  }
  res.json(ReviewService.getAll());
});

apiRouter.get('/admin/reviews', authMiddleware, adminGuard, (req, res) => {
  res.json(ReviewService.getAll());
});

apiRouter.get('/reviews/product/:productId', (req, res) => {
  const includeAll = req.query.all === 'true';
  res.json(ReviewService.getForProduct(req.params.productId, includeAll));
});

apiRouter.post('/reviews', (req, res) => {
  const { productId, userName, rating, comment, userId, isOfficialStaff, isApproved, adminReply } = req.body;
  if (!productId || rating === undefined || !comment) {
    return res.status(400).json({ message: 'لطفاً امتیاز و نظر خود را وارد نمایید.' });
  }

  const numRating = Number(rating);
  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    return res.status(400).json({ message: 'امتیاز باید عددی بین ۱ تا ۵ باشد.' });
  }

  // Security: only authenticated Admin/SuperAdmin can set isOfficialStaff or pre-approve reviews
  let staff = false;
  let approved = false;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (payload && (payload.role === 'Admin' || payload.role === 'SuperAdmin')) {
      staff = Boolean(isOfficialStaff);
      approved = isApproved !== undefined ? Boolean(isApproved) : true;
    }
  }

  const review = ReviewService.submit({
    productId,
    userName: userName || 'کاربر مهمان',
    rating: numRating,
    comment: String(comment).trim(),
    userId,
    isOfficialStaff: staff,
    isApproved: approved,
    adminReply: staff ? adminReply : undefined,
  });
  res.status(201).json({ success: true, review, ...review });
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
    res.status(500).json({ message: err?.message || 'خطا در ذخیره تنظیمات در پایگاه داده' });
  }
});

apiRouter.put('/admin/settings', authMiddleware, adminGuard, (req: AuthRequest, res: Response) => {
  try {
    const updated = db.updateSettings(req.body);
    res.json(updated);
  } catch (err: any) {
    console.error('Admin settings update error in server:', err);
    res.status(500).json({ message: err?.message || 'خطا در ذخیره تنظیمات' });
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
    if (!name || !mobile || !password) {
      return res.status(400).json({ message: 'نام، شماره موبایل و رمز عبور الزامی هستند.' });
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
      mobile: mobile.trim(),
      email: (email || '').trim().toLowerCase(),
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
    res.status(500).json({ message: err?.message || 'خطا در ایجاد کاربر' });
  }
});

apiRouter.put('/admin/users/:id', authMiddleware, adminGuard, (req: AuthRequest, res) => {
  try {
    const user = db.users.find((u) => u.id === req.params.id);
    if (!user) return res.status(404).json({ message: 'کاربر یافت نشد.' });

    const { name, family, mobile, email, password, role, permissions, isActive } = req.body;
    const isCallerSuperAdmin = req.user?.role === 'SuperAdmin';

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

    if (password && password.trim().length >= 6) {
      const auth = hashPassword(password);
      user.passwordHash = auth.hash;
      user.salt = auth.salt;
    }

    user.updatedAt = new Date().toISOString();
    db.persist();

    const { passwordHash, salt, ...safeUser } = user;
    res.json(safeUser);
  } catch (err: any) {
    res.status(500).json({ message: err?.message || 'خطا در ویرایش کاربر' });
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

