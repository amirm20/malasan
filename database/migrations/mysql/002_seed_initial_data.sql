SET FOREIGN_KEY_CHECKS = 0;

-- ====================================================================
-- Malasban Lavashak Platform - PostgreSQL Initial Seed Data Migration
-- Migration: 002_seed_initial_data.sql
-- ====================================================================

-- 1. Seed Categories
INSERT INTO categories (id, name, slug, description, image_url, display_order, is_active)
VALUES ('cat-anar', 'لواشک انار', 'pomegranate', 'تهیه شده از دانه‌های انار درجه یک ملس و ترش ساوه بدون هیچ‌گونه ماده افزودنی', 'https://images.unsplash.com/photo-1541344999736-83eca872f242?w=800&q=80', 1, TRUE)
ON DUPLICATE KEY UPDATE
  name = VALUES(),
  slug = VALUES(),
  description = VALUES(),
  image_url = VALUES(),
  display_order = VALUES(),
  is_active = VALUES();

INSERT INTO categories (id, name, slug, description, image_url, display_order, is_active)
VALUES ('cat-albaloo', 'لواشک آلبالو و زرشک', 'sour-cherry-barberry', 'نهایت ترشی طبیعی با عطر بی‌نظیر آلبالوی کوهی و زرشک تازه قائنات', 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=800&q=80', 2, TRUE)
ON DUPLICATE KEY UPDATE
  name = VALUES(),
  slug = VALUES(),
  description = VALUES(),
  image_url = VALUES(),
  display_order = VALUES(),
  is_active = VALUES();

INSERT INTO categories (id, name, slug, description, image_url, display_order, is_active)
VALUES ('cat-alou', 'لواشک آلو و زردآلو', 'plum-apricot', 'بافت گوشتی، طعم ملس و سرشار از فیبر طبیعی تهیه شده از آلو قطره طلا و شابلون', 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=800&q=80', 3, TRUE)
ON DUPLICATE KEY UPDATE
  name = VALUES(),
  slug = VALUES(),
  description = VALUES(),
  image_url = VALUES(),
  display_order = VALUES(),
  is_active = VALUES();

INSERT INTO categories (id, name, slug, description, image_url, display_order, is_active)
VALUES ('cat-majlesi', 'لواشک مجلسی و پذیرایی', 'party-rolls', 'برش‌های رولی شیک، بسته‌بندی تک‌نفره و سینی‌های میکس مخصوص مهمانی‌ها', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80', 4, TRUE)
ON DUPLICATE KEY UPDATE
  name = VALUES(),
  slug = VALUES(),
  description = VALUES(),
  image_url = VALUES(),
  display_order = VALUES(),
  is_active = VALUES();

INSERT INTO categories (id, name, slug, description, image_url, display_order, is_active)
VALUES ('cat-gift', 'پک‌های کادویی و اقتصادی', 'gift-packs', 'بسته‌های هدیه نفیس و پک‌های خانوادگی چند طعم با تخفیف ویژه', 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&q=80', 5, TRUE)
ON DUPLICATE KEY UPDATE
  name = VALUES(),
  slug = VALUES(),
  description = VALUES(),
  image_url = VALUES(),
  display_order = VALUES(),
  is_active = VALUES();

INSERT INTO categories (id, name, slug, description, image_url, display_order, is_active)
VALUES ('cat-wholesale', 'فروش ویژه عمده', 'wholesale-bulk', 'کارتن‌های ۲۰ کیلویی، رول‌های عریض و سلفون‌پیچ بهداشتی ویژه همکاران', 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&q=80', 6, TRUE)
ON DUPLICATE KEY UPDATE
  name = VALUES(),
  slug = VALUES(),
  description = VALUES(),
  image_url = VALUES(),
  display_order = VALUES(),
  is_active = VALUES();

-- 2. Seed Users (Single Source of Truth: role)
INSERT INTO users (id, name, family, email, mobile, password_hash, salt, role, permissions, is_active, created_at, updated_at)
VALUES ('usr-admin-01', 'مدیر', 'سیستم ملس‌بان', 'admin@malasban.ir', '09120000000', 'ef96a059b67e06017c7d02354adb04d054a3ec7bd77fdeea733b3c7ff47d3c583f552b2cf803523f40f0dfb782b782a313c0d18c975331aa30b0d9e986578769', 'f72faa39602db30068053a3481405e4d', 'SuperAdmin', '["overview","products","orders","wholesale","reviews","categories","coupons","customers","staff","blog","settings","chat"]', FALSE, '2026-01-01T08:00:00.000Z', '2026-01-01T08:00:00.000Z')
ON DUPLICATE KEY UPDATE
  name = VALUES(),
  family = VALUES(),
  email = VALUES(),
  mobile = VALUES(),
  password_hash = VALUES(),
  salt = VALUES(),
  role = VALUES(),
  permissions = VALUES(),
  is_active = VALUES();

INSERT INTO users (id, name, family, email, mobile, password_hash, salt, role, permissions, is_active, created_at, updated_at)
VALUES ('usr-demo-02', 'سهراب', 'سپهری', 'user@malasban.ir', '09123456789', 'd0b73997434b77b613c6525234fdc1c54a12e5cd8540205e8d05fd1c6627dd5826dddbe951a9eee126c0d61b25e39ec239c652d0225c0403e69ef782347f24e6', 'f685cfc63148532f59bcc34d6c34df6a', 'Customer', '[]', FALSE, '2026-02-15T10:30:00.000Z', '2026-02-15T10:30:00.000Z')
ON DUPLICATE KEY UPDATE
  name = VALUES(),
  family = VALUES(),
  email = VALUES(),
  mobile = VALUES(),
  password_hash = VALUES(),
  salt = VALUES(),
  role = VALUES(),
  permissions = VALUES(),
  is_active = VALUES();

INSERT INTO users (id, name, family, email, mobile, password_hash, salt, role, permissions, is_active, created_at, updated_at)
VALUES ('usr-staff-01', 'علیرضا', 'صادقی (کارشناس فروش و انبار)', 'staff@malasban.ir', '09121112233', '0391ce35c7fcdf3c4e3c19615a9b096dbc07cd1a56185b5ffc46cfefb5fc8d9e16a3af60447aa9edd0c3b1ee1299d97f3cc69b5e7e0eb7318724fdb655d45a1a', 'ffbd6ae189da7769d6cc371cbc6002ed', 'Admin', '["overview","products","orders","wholesale","reviews"]', FALSE, '2026-02-01T09:00:00.000Z', '2026-02-01T09:00:00.000Z')
ON DUPLICATE KEY UPDATE
  name = VALUES(),
  family = VALUES(),
  email = VALUES(),
  mobile = VALUES(),
  password_hash = VALUES(),
  salt = VALUES(),
  role = VALUES(),
  permissions = VALUES(),
  is_active = VALUES();

INSERT INTO users (id, name, family, email, mobile, password_hash, salt, role, permissions, is_active, created_at, updated_at)
VALUES ('usr-customer-01', 'فاطمه', 'موسوی', 'fatemeh@example.com', '09123456780', 'd0b73997434b77b613c6525234fdc1c54a12e5cd8540205e8d05fd1c6627dd5826dddbe951a9eee126c0d61b25e39ec239c652d0225c0403e69ef782347f24e6', 'f685cfc63148532f59bcc34d6c34df6a', 'Customer', '[]', FALSE, '2026-02-20T11:00:00.000Z', '2026-02-20T11:00:00.000Z')
ON DUPLICATE KEY UPDATE
  name = VALUES(),
  family = VALUES(),
  email = VALUES(),
  mobile = VALUES(),
  password_hash = VALUES(),
  salt = VALUES(),
  role = VALUES(),
  permissions = VALUES(),
  is_active = VALUES();

-- 3. Seed Normalized Addresses
INSERT INTO addresses (id, user_id, title, recipient_name, mobile, province, city, address, postal_code, plaque, unit, is_default, created_at, updated_at)
VALUES ('addr-01', 'usr-demo-02', 'منزل تهران', 'سهراب سپهری', '09123456789', 'تهران', 'تهران', 'خیابان ولیعصر، بالاتر از پارک ساعی، کوچه گلستان، پلاک ۱۲، واحد ۴', '1511874521', '۱۲', '۴', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE
  title = VALUES(),
  recipient_name = VALUES(),
  mobile = VALUES(),
  province = VALUES(),
  city = VALUES(),
  address = VALUES(),
  postal_code = VALUES(),
  is_default = VALUES();

-- 4. Seed Products (Normalized)
INSERT INTO products (id, name, slug, sku, category_id, short_description, description, price, discount_price, stock_quantity, weight_grams, pieces_per_pack, images, main_image, sourness_level, ingredients, nutritional_facts, rating, review_count, is_featured, is_best_seller, is_new, is_wholesale_available, min_wholesale_qty, wholesale_unit_price, is_active, created_at, updated_at)
VALUES ('prod-01', 'لواشک انار دانه سرخ ساوه (ملس اعلا)', 'lavashak-anar-saveh', 'MLB-ANR-350', 'cat-anar', 'تهیه شده از پوره خالص انار ملس ساوه با ترشی ملایم و رنگ یاقوتی طبیعی.', 'لواشک انار ساوه ملس‌بان از مرغوب‌ترین انارهای دست‌چین باغ‌های ساوه پخته شده است. در فرایند تولید این محصول از هیچ‌گونه اسید سیتریک یا اسانس شیمیایی استفاده نشده و طعم ترش و ملس آن کاملاً برآمده از میوه ارگانیک است. بافتی نرم و منعطف با ماندگاری بالا دارد.', 85000, 72000, 120, 350, 1, '["https://images.unsplash.com/photo-1541344999736-83eca872f242?w=800&q=80","https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=800&q=80"]', 'https://images.unsplash.com/photo-1541344999736-83eca872f242?w=800&q=80', 'SweetSour', '["پوره انار طبیعی ساوه","رب انار خانگی","نمک دریا بسیار کم"]', '{"caloriesPer100g":245,"sugarGrams":38,"fiberGrams":4.2,"vitaminCPercent":35,"fatGrams":0.3,"saltGrams":0.4}', 4.9, 48, TRUE, TRUE, FALSE, TRUE, 10, 52000, TRUE, '2026-01-10T12:00:00.000Z', '2026-03-01T14:20:00.000Z')
ON DUPLICATE KEY UPDATE
  name = VALUES(),
  slug = VALUES(),
  price = VALUES(),
  discount_price = VALUES(),
  stock_quantity = VALUES(),
  is_active = VALUES();

INSERT INTO products (id, name, slug, sku, category_id, short_description, description, price, discount_price, stock_quantity, weight_grams, pieces_per_pack, images, main_image, sourness_level, ingredients, nutritional_facts, rating, review_count, is_featured, is_best_seller, is_new, is_wholesale_available, min_wholesale_qty, wholesale_unit_price, is_active, created_at, updated_at)
VALUES ('prod-02', 'لواشک آلبالو جنگلی ترشِ ناب', 'lavashak-albaloo-jangali', 'MLB-ALB-300', 'cat-albaloo', 'ترش، پرطراوت و برانگیزاننده اشتها؛ فرآوری شده از آلبالوی دست‌چین کوهستان.', 'اگر عاشق طعم‌های ترش واقعی هستید، لواشک آلبالو جنگلی ملس‌بان انتخابی بی‌همتاست. عطر تند آلبالوی تازه هنگام باز کردن سلفون به مشام می‌رسد و قرمزی چشم‌نواز آن حاصل میوه خالص بدون رنگ مصنوعی است.', 92000, 84000, 95, 300, 1, '["https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=800&q=80","https://images.unsplash.com/photo-1541344999736-83eca872f242?w=800&q=80"]', 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=800&q=80', 'Sour', '["پوره آلبالو کوهی","عصاره زرشک کوهی","نمک تصفیه شده"]', '{"caloriesPer100g":220,"sugarGrams":32,"fiberGrams":5.1,"vitaminCPercent":42,"fatGrams":0.2,"saltGrams":0.5}', 4.8, 36, TRUE, TRUE, FALSE, TRUE, 10, 61000, TRUE, '2026-01-12T11:00:00.000Z', '2026-03-05T10:00:00.000Z')
ON DUPLICATE KEY UPDATE
  name = VALUES(),
  slug = VALUES(),
  price = VALUES(),
  discount_price = VALUES(),
  stock_quantity = VALUES(),
  is_active = VALUES();

INSERT INTO products (id, name, slug, sku, category_id, short_description, description, price, discount_price, stock_quantity, weight_grams, pieces_per_pack, images, main_image, sourness_level, ingredients, nutritional_facts, rating, review_count, is_featured, is_best_seller, is_new, is_wholesale_available, min_wholesale_qty, wholesale_unit_price, is_active, created_at, updated_at)
VALUES ('prod-03', 'لواشک زرشک اعلای قائنات (خیلی ترش)', 'lavashak-zereshk-qaenat', 'MLB-ZRK-250', 'cat-albaloo', 'ترش‌ترین لواشک ملس‌بان با عصاره زرشک تازه دانه اناری خراسان جنوبی.', 'تجربه بی‌همتای ترشی پرقدرت و خالص! زرشک تازه قائنات سرشار از بربرین و آنتی‌اکسیدان بوده و مصرف این لواشک علاوه بر لذت فراوان، برای تصفیه کبد و نشاط بدن توصیه می‌شود.', 98000, 89000, 45, 250, 1, '["https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&q=80"]', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&q=80', 'ExtraSour', '["عصاره زرشک تازه قائنات","پوره آلوچه ترش جنگلی","نمک کم"]', '{"caloriesPer100g":215,"sugarGrams":28,"fiberGrams":5.8,"vitaminCPercent":55,"fatGrams":0.1,"saltGrams":0.4}', 4.9, 29, TRUE, FALSE, TRUE, TRUE, 15, 68000, TRUE, '2026-02-01T09:00:00.000Z', '2026-03-08T09:00:00.000Z')
ON DUPLICATE KEY UPDATE
  name = VALUES(),
  slug = VALUES(),
  price = VALUES(),
  discount_price = VALUES(),
  stock_quantity = VALUES(),
  is_active = VALUES();

INSERT INTO products (id, name, slug, sku, category_id, short_description, description, price, discount_price, stock_quantity, weight_grams, pieces_per_pack, images, main_image, sourness_level, ingredients, nutritional_facts, rating, review_count, is_featured, is_best_seller, is_new, is_wholesale_available, min_wholesale_qty, wholesale_unit_price, is_active, created_at, updated_at)
VALUES ('prod-04', 'لواشک آلو بخارا و قطره‌طلا ملس', 'lavashak-aloo-ghatre-tala', 'MLB-ALO-400', 'cat-alou', 'بافت پرگوشت، طعم ملس اعجاب‌انگیز و تسکین‌دهنده دستگاه گوارش.', 'این لواشک با آلوهای زرد آبدار و شیرین قطره‌طلا ترکیب شده با آلو سیاه شابلون تهیه می‌شود. تعادل دلپذیر بین ترشی و شیرینی، آن را به انتخاب اول دوستداران طعم‌های ملایم تبدیل کرده است.', 78000, 69000, 150, 400, 1, '["https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=800&q=80"]', 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=800&q=80', 'SweetSour', '["پوره آلو قطره‌طلا","پوره آلو شابلون","عصاره لیمو ترش طبیعی"]', '{"caloriesPer100g":250,"sugarGrams":42,"fiberGrams":6,"vitaminCPercent":28,"fatGrams":0.2,"saltGrams":0.3}', 4.7, 41, FALSE, TRUE, FALSE, TRUE, 10, 51000, TRUE, '2026-01-05T14:00:00.000Z', '2026-02-20T11:00:00.000Z')
ON DUPLICATE KEY UPDATE
  name = VALUES(),
  slug = VALUES(),
  price = VALUES(),
  discount_price = VALUES(),
  stock_quantity = VALUES(),
  is_active = VALUES();

INSERT INTO products (id, name, slug, sku, category_id, short_description, description, price, discount_price, stock_quantity, weight_grams, pieces_per_pack, images, main_image, sourness_level, ingredients, nutritional_facts, rating, review_count, is_featured, is_best_seller, is_new, is_wholesale_available, min_wholesale_qty, wholesale_unit_price, is_active, created_at, updated_at)
VALUES ('prod-05', 'لواشک زردآلو کوهپایه (ملس و شیرین)', 'lavashak-zardaloo', 'MLB-ZRD-350', 'cat-alou', 'طعم لطیف، عطر خاطره‌انگیز زردآلو قیسی و رنگ طلایی چشم‌نواز.', 'برگرفته از زردآلوهای آفتاب‌خورده باغات شاهرود، این لواشک با کمترین میزان ترشی و شیرینی طبیعی میوه، گزینه بسیار محبوب برای کودکان و سالمندان است.', 89000, NULL, 80, 350, 1, '["https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80"]', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80', 'Sweet', '["پوره خالص زردآلو قیسی","آب لیموی تازه"]', '{"caloriesPer100g":260,"sugarGrams":48,"fiberGrams":4.8,"vitaminCPercent":30,"fatGrams":0.2,"saltGrams":0.2}', 4.6, 22, FALSE, FALSE, TRUE, TRUE, 10, 64000, TRUE, '2026-02-10T15:00:00.000Z', '2026-03-01T10:00:00.000Z')
ON DUPLICATE KEY UPDATE
  name = VALUES(),
  slug = VALUES(),
  price = VALUES(),
  discount_price = VALUES(),
  stock_quantity = VALUES(),
  is_active = VALUES();

INSERT INTO products (id, name, slug, sku, category_id, short_description, description, price, discount_price, stock_quantity, weight_grams, pieces_per_pack, images, main_image, sourness_level, ingredients, nutritional_facts, rating, review_count, is_featured, is_best_seller, is_new, is_wholesale_available, min_wholesale_qty, wholesale_unit_price, is_active, created_at, updated_at)
VALUES ('prod-06', 'سینی لواشک رولی مجلسی پذیرایی (میکس ۸ طعم)', 'lavashak-party-tray-rolls', 'MLB-TRY-650', 'cat-majlesi', 'چیدمان هندسی لوکس، مناسب جشن‌ها، پذیرایی اداری و هدیه با ۸ طعم متفاوت.', 'سینی کریستالی پذیرایی شامل رول‌های منظم لواشک انار، زرشک، آلبالو، کیوی، تمشک، زردآلو، گوجه‌سبز و انبه. بسته‌بندی پلمپ وکیوم بهداشتی جهت حفظ طراوت و زیبایی میز پذیرایی شما.', 195000, 175000, 60, 650, 24, '["https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80","https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&q=80"]', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80', 'SweetSour', '["انواع پوره میوه‌های طبیعی فصلی","عصاره ترشک جنگلی","نمک دریا"]', '{"caloriesPer100g":235,"sugarGrams":36,"fiberGrams":5,"vitaminCPercent":40,"fatGrams":0.2,"saltGrams":0.4}', 5, 53, TRUE, TRUE, FALSE, TRUE, 5, 135000, TRUE, '2026-01-15T16:00:00.000Z', '2026-03-07T12:00:00.000Z')
ON DUPLICATE KEY UPDATE
  name = VALUES(),
  slug = VALUES(),
  price = VALUES(),
  discount_price = VALUES(),
  stock_quantity = VALUES(),
  is_active = VALUES();

INSERT INTO products (id, name, slug, sku, category_id, short_description, description, price, discount_price, stock_quantity, weight_grams, pieces_per_pack, images, main_image, sourness_level, ingredients, nutritional_facts, rating, review_count, is_featured, is_best_seller, is_new, is_wholesale_available, min_wholesale_qty, wholesale_unit_price, is_active, created_at, updated_at)
VALUES ('prod-07', 'پک کادویی چوبی نفیس ملس‌بان (شاه‌ترش)', 'luxury-wooden-gift-box', 'MLB-GFT-900', 'cat-gift', 'جعبه خاتم و چوبی اختصاصی ملس‌بان با ۴ مدل کیک لواشکی و سس انار ترش.', 'یک هدیه اصیل و ماندگار برای عزیزانی که عاشق ترشیجات هستند! این پک مجلل شامل ۴ لایه لواشک ضخیم دست‌ساز، یک شیشه سس انار غلیظ ارگانیک و آلبالو خشک ممتاز در جعبه چوبی حکاکی شده می‌باشد.', 340000, 298000, 30, 900, 4, '["https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&q=80"]', 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&q=80', 'Sour', '["پوره انار ساوه","پوره آلبالو کوهی","رب انار دبش","آلبالو خشک سنتی"]', '{"caloriesPer100g":240,"sugarGrams":35,"fiberGrams":5.5,"vitaminCPercent":45,"fatGrams":0.3,"saltGrams":0.3}', 4.9, 18, TRUE, FALSE, TRUE, TRUE, 5, 230000, TRUE, '2026-02-18T10:00:00.000Z', '2026-03-06T14:00:00.000Z')
ON DUPLICATE KEY UPDATE
  name = VALUES(),
  slug = VALUES(),
  price = VALUES(),
  discount_price = VALUES(),
  stock_quantity = VALUES(),
  is_active = VALUES();

INSERT INTO products (id, name, slug, sku, category_id, short_description, description, price, discount_price, stock_quantity, weight_grams, pieces_per_pack, images, main_image, sourness_level, ingredients, nutritional_facts, rating, review_count, is_featured, is_best_seller, is_new, is_wholesale_available, min_wholesale_qty, wholesale_unit_price, is_active, created_at, updated_at)
VALUES ('prod-08', 'کارتن عمده ۲۰ کیلوگرمی لواشک ورقه‌ای انار و آلبالو', 'wholesale-20kg-carton', 'MLB-WHL-20K', 'cat-wholesale', 'مخصوص فروشگاه‌های زنجیره‌ای، هایپرمارکت‌ها، قنادی‌ها و صادرکنندگان.', 'کارتن استاندارد ۵ لایه شامل ورقه‌های لواشک بهداشتی سلفون‌پیچ شده با تاریخ تولید روز و برچسب سیب سلامت سازمان غذا و دارو. امکان سفارش با لوگوی اختصاصی برای خریدهای بالای ۱۰۰ کارتن.', 2600000, 2350000, 40, 20000, 40, '["https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&q=80"]', 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&q=80', 'SweetSour', '["پوره انار ساوه و آلبالوی کوهستان","نمک مجاز خوراکی"]', '{}', 4.9, 15, TRUE, TRUE, FALSE, TRUE, 1, 2350000, TRUE, '2026-01-01T08:00:00.000Z', '2026-03-02T16:00:00.000Z')
ON DUPLICATE KEY UPDATE
  name = VALUES(),
  slug = VALUES(),
  price = VALUES(),
  discount_price = VALUES(),
  stock_quantity = VALUES(),
  is_active = VALUES();

INSERT INTO products (id, name, slug, sku, category_id, short_description, description, price, discount_price, stock_quantity, weight_grams, pieces_per_pack, images, main_image, sourness_level, ingredients, nutritional_facts, rating, review_count, is_featured, is_best_seller, is_new, is_wholesale_available, min_wholesale_qty, wholesale_unit_price, is_active, created_at, updated_at)
VALUES ('prod-09', 'لواشک کیوی ترش شمال (مملو از ویتامین ث)', 'lavashak-kiwi-shomal', 'MLB-KIW-300', 'cat-albaloo', 'رنگ زمردی طبیعی، بافت لطیف دانه ریز و ترشی فرح‌بخش کیوی تالش.', 'کیوی سرشار از فیبر و ویتامین C بوده و ترکیب پوره کیوی طبیعی همراه با عصاره لیمو ترش سنگی، طعمی بدیع و بسیار خنک و دلچسب به این لواشک بخشیده است.', 88000, 79000, 70, 300, 1, '["https://images.unsplash.com/photo-1618897996318-5a901fa6ca71?w=800&q=80"]', 'https://images.unsplash.com/photo-1618897996318-5a901fa6ca71?w=800&q=80', 'Sour', '["پوره کیوی ارگانیک تالش","آب لیموی طبیعی","نمک کم"]', '{"caloriesPer100g":210,"sugarGrams":30,"fiberGrams":6.5,"vitaminCPercent":75,"fatGrams":0.2,"saltGrams":0.3}', 4.7, 20, FALSE, FALSE, TRUE, TRUE, 10, 59000, TRUE, '2026-02-22T11:00:00.000Z', '2026-03-08T15:00:00.000Z')
ON DUPLICATE KEY UPDATE
  name = VALUES(),
  slug = VALUES(),
  price = VALUES(),
  discount_price = VALUES(),
  stock_quantity = VALUES(),
  is_active = VALUES();

INSERT INTO products (id, name, slug, sku, category_id, short_description, description, price, discount_price, stock_quantity, weight_grams, pieces_per_pack, images, main_image, sourness_level, ingredients, nutritional_facts, rating, review_count, is_featured, is_best_seller, is_new, is_wholesale_available, min_wholesale_qty, wholesale_unit_price, is_active, created_at, updated_at)
VALUES ('prod-10', 'لواشک هفت‌میوه جنگلی کوهستان (ملس)', 'lavashak-haft-miveh', 'MLB-HFT-450', 'cat-anar', 'میکس هیجان‌انگیز انار، آلو سیاه، زرشک، شاتوت، آلوچه، زردآلو و سیب ترش.', 'شاهکار طعم‌شناسی ملس‌بان! نسبت دقیق ۷ نوع میوه مرغوب پخته شده باعث شده در هر گاز، رگه‌هایی از ترشی زرشک، نرمی آلو و عطر زردآلو را همزمان مزمزه کنید.', 99000, 87000, 110, 450, 1, '["https://images.unsplash.com/photo-1541344999736-83eca872f242?w=800&q=80"]', 'https://images.unsplash.com/photo-1541344999736-83eca872f242?w=800&q=80', 'SweetSour', '["پوره انار","آلو شابلون","زرشک تازه","تمشک کوهی","آلوچه ترش"]', '{"caloriesPer100g":238,"sugarGrams":36,"fiberGrams":5.2,"vitaminCPercent":48,"fatGrams":0.2,"saltGrams":0.4}', 4.9, 64, TRUE, TRUE, FALSE, TRUE, 10, 62000, TRUE, '2026-01-08T09:00:00.000Z', '2026-03-04T13:00:00.000Z')
ON DUPLICATE KEY UPDATE
  name = VALUES(),
  slug = VALUES(),
  price = VALUES(),
  discount_price = VALUES(),
  stock_quantity = VALUES(),
  is_active = VALUES();

INSERT INTO products (id, name, slug, sku, category_id, short_description, description, price, discount_price, stock_quantity, weight_grams, pieces_per_pack, images, main_image, sourness_level, ingredients, nutritional_facts, rating, review_count, is_featured, is_best_seller, is_new, is_wholesale_available, min_wholesale_qty, wholesale_unit_price, is_active, created_at, updated_at)
VALUES ('prod-11', 'لواشک نواری تک‌نفره پذیرایی (بسته ۵۰ عددی)', 'lavashak-single-pack-50', 'MLB-SNG-50', 'cat-majlesi', 'بسته‌بندی آلومینیومی شیک و بهداشتی، ایده‌آل برای تغذیه مدارس و دورهمی‌ها.', 'هر نوار لواشک در فویل استاندارد بهداشتی پرس شده و بدون چسبندگی به راحتی باز و مصرف می‌شود. شامل میکس طعم‌های پرطرفدار انار، آلبالو و کیوی.', 165000, 149000, 85, 750, 50, '["https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80"]', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80', 'SweetSour', '["پوره میوه‌های طبیعی درجه یک","اسیدهای آلی طبیعی میوه"]', '{}', 4.8, 31, FALSE, FALSE, TRUE, TRUE, 5, 110000, TRUE, '2026-02-14T13:00:00.000Z', '2026-03-07T11:00:00.000Z')
ON DUPLICATE KEY UPDATE
  name = VALUES(),
  slug = VALUES(),
  price = VALUES(),
  discount_price = VALUES(),
  stock_quantity = VALUES(),
  is_active = VALUES();

INSERT INTO products (id, name, slug, sku, category_id, short_description, description, price, discount_price, stock_quantity, weight_grams, pieces_per_pack, images, main_image, sourness_level, ingredients, nutritional_facts, rating, review_count, is_featured, is_best_seller, is_new, is_wholesale_available, min_wholesale_qty, wholesale_unit_price, is_active, created_at, updated_at)
VALUES ('prod-12', 'پک اقتصادی خانواده (۴ کیلوگرم لواشک میکس)', 'family-economy-pack-4kg', 'MLB-FAM-4K', 'cat-gift', 'خرید اقتصادی با بیشترین تنوع؛ ۴ کیلوگرم ورقه لواشک تازه در ۸ طعم مختلف.', 'اگر مصرف لواشک در منزل شما بالاست، این پک به صرفه‌ترین گزینه است. ۸ طعم مختلف ۵۰۰ گرمی در بسته‌های نایلونی سلفونی ضخیم و بهداشتی.', 520000, 460000, 50, 4000, 8, '["https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&q=80"]', 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&q=80', 'SweetSour', '["پوره طبیعی انار، آلبالو، زرشک، زردآلو، آلو، کیوی و تمشک"]', '{}', 4.9, 42, TRUE, TRUE, FALSE, TRUE, 3, 390000, TRUE, '2026-01-20T10:00:00.000Z', '2026-03-03T15:00:00.000Z')
ON DUPLICATE KEY UPDATE
  name = VALUES(),
  slug = VALUES(),
  price = VALUES(),
  discount_price = VALUES(),
  stock_quantity = VALUES(),
  is_active = VALUES();

-- 5. Seed Coupons
INSERT INTO coupons (id, code, type, value, min_order_amount, max_discount_amount, usage_limit, used_count, start_date, end_date, is_active, first_order_only)
VALUES ('cpn-01', 'MELAS20', 'Percent', 20, 150000, 60000, 500, 84, '2026-01-01', '2026-12-29', TRUE, FALSE)
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO coupons (id, code, type, value, min_order_amount, max_discount_amount, usage_limit, used_count, start_date, end_date, is_active, first_order_only)
VALUES ('cpn-02', 'NOROOZ50', 'FixedAmount', 50000, 300000, NULL, 300, 42, '2026-01-01', '2026-12-29', TRUE, FALSE)
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO coupons (id, code, type, value, min_order_amount, max_discount_amount, usage_limit, used_count, start_date, end_date, is_active, first_order_only)
VALUES ('cpn-03', 'OMDEH10', 'Percent', 10, 1000000, 250000, 100, 12, '2026-01-01', '2026-12-29', TRUE, FALSE)
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO coupons (id, code, type, value, min_order_amount, max_discount_amount, usage_limit, used_count, start_date, end_date, is_active, first_order_only)
VALUES ('cpn-04', 'FIRSTBUY', 'Percent', 25, 100000, 80000, 1000, 0, '2026-01-01', '2026-12-31', TRUE, TRUE)
ON DUPLICATE KEY UPDATE id=id;

-- 6. Seed Orders (with coupon_id FK)
INSERT INTO orders (id, order_number, user_id, customer_name, customer_mobile, customer_email, shipping_address, shipping_method, shipping_fee, subtotal, discount_amount, coupon_id, coupon_code, total_amount, status, payment_status, payment_method, payment_ref_id, customer_notes, admin_notes, created_at, updated_at)
VALUES ('ord-01', 'MLB-1403-1024', 'usr-demo-02', 'سهراب سپهری', '09123456789', 'user@malasban.ir', '{"id":"addr-01","title":"منزل تهران","receiverName":"سهراب سپهری","receiverMobile":"09123456789","province":"تهران","city":"تهران","fullAddress":"خیابان ولیعصر، بالاتر از پارک ساعی، کوچه گلستان، پلاک ۱۲، واحد ۴","postalCode":"1511874521","isDefault":true}', 'پست پیشتاز', 45000, 319000, 20000, 'cpn-01', 'MELAS20', 344000, 'Delivered', 'Successful', 'درگاه بانکی شاپرک', 'ZP-89234177', 'لطفاً عصر بعد از ساعت ۱۶ تحویل شود.', NULL, '2026-02-28T16:20:00.000Z', '2026-03-02T18:00:00.000Z')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO orders (id, order_number, user_id, customer_name, customer_mobile, customer_email, shipping_address, shipping_method, shipping_fee, subtotal, discount_amount, coupon_id, coupon_code, total_amount, status, payment_status, payment_method, payment_ref_id, customer_notes, admin_notes, created_at, updated_at)
VALUES ('ord-02', 'MLB-1403-1025', NULL, 'فاطمه رضایی', '09197778899', NULL, '{"id":"addr-guest-01","title":"آدرس ثبت شده","receiverName":"فاطمه رضایی","receiverMobile":"09197778899","province":"خراسان رضوی","city":"مشهد","fullAddress":"بلوار وکیل‌آباد، نبش صیاد شیرازی، پلاک ۳","postalCode":"9188765432","isDefault":true}', 'تیپاکس', 55000, 252000, 0, NULL, NULL, 307000, 'Processing', 'Successful', 'درگاه بانکی شاپرک', 'ZP-99432104', NULL, NULL, '2026-03-07T11:15:00.000Z', '2026-09-26T17:41:34.326Z')
ON DUPLICATE KEY UPDATE id=id;

-- 7. Seed Order Items (Historical Snapshot)
INSERT INTO order_items (id, order_id, product_id, product_name, sku, product_image, weight_grams, quantity, unit_price, discount_amount, total_price)
VALUES ('item-01', 'ord-01', 'prod-01', 'لواشک انار دانه سرخ ساوه (ملس اعلا)', 'MLB-ANR-350', 'https://images.unsplash.com/photo-1541344999736-83eca872f242?w=800&q=80', 350, 2, 72000, 0, 144000)
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO order_items (id, order_id, product_id, product_name, sku, product_image, weight_grams, quantity, unit_price, discount_amount, total_price)
VALUES ('item-02', 'ord-01', 'prod-06', 'سینی لواشک رولی مجلسی پذیرایی (میکس ۸ طعم)', 'MLB-TRY-650', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80', 650, 1, 175000, 0, 175000)
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO order_items (id, order_id, product_id, product_name, sku, product_image, weight_grams, quantity, unit_price, discount_amount, total_price)
VALUES ('item-03', 'ord-02', 'prod-02', 'لواشک آلبالو جنگلی ترشِ ناب', 'MLB-ALB-300', 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=800&q=80', 300, 3, 84000, 0, 252000)
ON DUPLICATE KEY UPDATE id=id;

-- 8. Seed Wholesale Requests
INSERT INTO wholesale_requests (id, tracking_code, applicant_name, company_name, mobile, email, province, city, business_type, requested_products, estimated_quantity_kg, description, status, admin_notes, offered_price_per_kg, quotation_sent, created_at, updated_at)
VALUES ('whl-01', 'WHL-1403-901', 'آقای علیرضا کاظمی', 'سوپرمارکت‌های زنجیره‌ای مهدوی', '09121112233', 'kazemi@mahdavi-markets.ir', 'اصفهان', 'اصفهان', 'فروشگاه زنجیره‌ای', 'کارتن ۲۰ کیلویی انار و آلبالو، سینی‌های پذیرایی رولی', 150, 'نیازمند استعلام قیمت برای تأمین هفتگی ۵ شعبه در اصفهان هستیم.', 'Contacted', 'با ایشان تماس گرفته شد و کاتالوگ قیمت همکار به همراه نمونه ارسال شد.', NULL, FALSE, '2026-03-01T10:00:00.000Z', '2026-03-02T11:00:00.000Z')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO wholesale_requests (id, tracking_code, applicant_name, company_name, mobile, email, province, city, business_type, requested_products, estimated_quantity_kg, description, status, admin_notes, offered_price_per_kg, quotation_sent, created_at, updated_at)
VALUES ('whl-02', 'WHL-1403-902', 'خانم مهسا یزدانی', 'قنادی و خشکبار لاله', '09359876543', NULL, 'فارس', 'شیراز', 'قنادی و خشکبار', 'لواشک‌های مجلسی، پک‌های هدیه چوبی', 50, 'جهت فروش ویژه شب عید و عید نوروز نیازمند بار باکیفیت و تضمینی هستیم.', 'Approved', 'سفارش اولیه با هماهنگی حسابداری ثبت و ارسال گردید.', NULL, FALSE, '2026-03-04T14:30:00.000Z', '2026-03-05T09:20:00.000Z')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO wholesale_requests (id, tracking_code, applicant_name, company_name, mobile, email, province, city, business_type, requested_products, estimated_quantity_kg, description, status, admin_notes, offered_price_per_kg, quotation_sent, created_at, updated_at)
VALUES ('whl-03', 'WHL-1403-903', 'خانم مهسا یزدانی', 'قنادی و خشکبار لاله', '09359876543', NULL, 'فارس', 'شیراز', 'قنادی و خشکبار', 'لواشک‌های مجلسی، پک‌های هدیه چوبی', 50, 'جهت فروش ویژه شب عید و عید نوروز نیازمند بار باکیفیت و تضمینی هستیم.', 'Approved', 'سفارش اولیه با هماهنگی حسابداری ثبت و ارسال گردید.', NULL, FALSE, '2026-03-04T14:30:00.000Z', '2026-03-05T09:20:00.000Z')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO wholesale_requests (id, tracking_code, applicant_name, company_name, mobile, email, province, city, business_type, requested_products, estimated_quantity_kg, description, status, admin_notes, offered_price_per_kg, quotation_sent, created_at, updated_at)
VALUES ('whl-04', 'WHL-1403-904', 'خانم مهسا یزدانی', 'قنادی و خشکبار لاله', '09359876543', NULL, 'فارس', 'شیراز', 'قنادی و خشکبار', 'لواشک‌های مجلسی، پک‌های هدیه چوبی', 50, 'جهت فروش ویژه شب عید و عید نوروز نیازمند بار باکیفیت و تضمینی هستیم.', 'Rejected', 'سفارش اولیه با هماهنگی حسابداری ثبت و ارسال گردید.', NULL, FALSE, '2026-03-04T14:30:00.000Z', '2026-09-26T17:41:07.072Z')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO wholesale_requests (id, tracking_code, applicant_name, company_name, mobile, email, province, city, business_type, requested_products, estimated_quantity_kg, description, status, admin_notes, offered_price_per_kg, quotation_sent, created_at, updated_at)
VALUES ('whl-05', 'WHL-1403-905', 'خانم مهسا یزدانی', 'قنادی و خشکبار لاله', '09359876543', NULL, 'فارس', 'شیراز', 'قنادی و خشکبار', 'لواشک‌های مجلسی، پک‌های هدیه چوبی', 50, 'جهت فروش ویژه شب عید و عید نوروز نیازمند بار باکیفیت و تضمینی هستیم.', 'Approved', 'سفارش اولیه با هماهنگی حسابداری ثبت و ارسال گردید.', NULL, FALSE, '2026-03-04T14:30:00.000Z', '2026-03-05T09:20:00.000Z')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO wholesale_requests (id, tracking_code, applicant_name, company_name, mobile, email, province, city, business_type, requested_products, estimated_quantity_kg, description, status, admin_notes, offered_price_per_kg, quotation_sent, created_at, updated_at)
VALUES ('whl-06', 'WHL-1403-906', 'خانم مهسا یزدانی', 'قنادی و خشکبار لاله', '09359876543', NULL, 'فارس', 'شیراز', 'قنادی و خشکبار', 'لواشک‌های مجلسی، پک‌های هدیه چوبی', 50, 'جهت فروش ویژه شب عید و عید نوروز نیازمند بار باکیفیت و تضمینی هستیم.', 'Approved', 'سفارش اولیه با هماهنگی حسابداری ثبت و ارسال گردید.', NULL, FALSE, '2026-03-04T14:30:00.000Z', '2026-03-05T09:20:00.000Z')
ON DUPLICATE KEY UPDATE id=id;

-- 9. Seed Reviews (Normalized)
INSERT INTO reviews (id, product_id, user_id, rating, comment, is_approved, is_official_staff, admin_reply, created_at)
VALUES ('rev-01', 'prod-01', 'usr-demo-02', 5, 'واقعاً طعم اصیل انار داره! کاملاً معلومه شکر یا جوهرلیمو نزدن. نرمی بافتش عالی بود و بسته‌بندیش خیلی بهداشتیه.', TRUE, FALSE, NULL, '2026-02-14T09:30:00.000Z')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO reviews (id, product_id, user_id, rating, comment, is_approved, is_official_staff, admin_reply, created_at)
VALUES ('rev-02', 'prod-02', 'usr-demo-02', 5, 'دقیقاً همون ترشی تیزی رو داره که آدم دهنش آب میفته! عاشق رنگ طبیعیش شدم. دوباره حتماً سفارش میدم.', TRUE, FALSE, NULL, '2026-02-20T14:10:00.000Z')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO reviews (id, product_id, user_id, rating, comment, is_approved, is_official_staff, admin_reply, created_at)
VALUES ('rev-03', 'prod-06', 'usr-demo-02', 5, 'برای تولد همسرم گرفتم، تمام مهمان‌ها از چیدمان و طعم رول‌ها شگفت‌زده شدند. طعم کیوی و تمشکش عالی بود.', TRUE, FALSE, NULL, '2026-03-02T19:00:00.000Z')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO reviews (id, product_id, user_id, rating, comment, is_approved, is_official_staff, admin_reply, created_at)
VALUES ('rev-04', 'prod-01', 'usr-demo-02', 4, 'ارسال خیلی سریع بود و بسته‌بندی عالی بود. فقط کمی ترش‌تر از انتظارم بود اما کیفیت میوه کاملاً مشخصه و راضی هستم.', FALSE, FALSE, NULL, '2026-03-08T10:15:00.000Z')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO reviews (id, product_id, user_id, rating, comment, is_approved, is_official_staff, admin_reply, created_at)
VALUES ('rev-05', 'prod-08', 'usr-demo-02', 5, 'بار عمده ۲۰ کیلویی رسید؛ کیفیت ورقه‌ها و بسته‌بندی سلفون بدون نقصه. تاریخ تولید تازه است و مشتریان ما خیلی استقبال کردند.', TRUE, FALSE, NULL, '2026-03-05T16:45:00.000Z')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO reviews (id, product_id, user_id, rating, comment, is_approved, is_official_staff, admin_reply, created_at)
VALUES ('rev-06', 'prod-03', 'usr-demo-02', 3, 'طعم خوبی داره ولی بافتش نسبت به آلبالو سفت‌تر بود. اگه نرم‌تر بشه فوق‌العاده است.', FALSE, FALSE, NULL, '2026-03-09T08:20:00.000Z')
ON DUPLICATE KEY UPDATE id=id;

-- 10. Seed Blog Posts
INSERT INTO blog_posts (id, title, slug, summary, content, featured_image, category, tags, author, read_time_minutes, is_published, created_at, updated_at)
VALUES ('blg-01', 'چگونه لواشک طبیعی و بدون اسید سیتریک را تشخیص دهیم؟', 'how-to-spot-natural-lavashak', 'راهنمای کامل شناخت لواشک‌های اصیل میوه‌ای از محصولات غیربهداشتی و حاوی اسانس و جوهرلیمو شیمیایی.', 'لواشک یکی از قدیمی‌ترین و محبوب‌ترین تنقلات سنتی ایرانی است. اما با ورود تولیدات صنعتی بی‌کیفیت، دغدغه بسیاری از خانواده‌ها تشخیص لواشک طبیعی از صنعتی است.

### ۱. عطر و بوی میوه
لواشک طبیعی بوی ملایم و مطبوع خود میوه را دارد. اگر بلافاصله بعد از باز کردن بسته بوی تند و آزاردهنده‌ای شبیه جوهر لیمو حس کردید، نشانگر استفاده از افزودنی‌های مصنوعی است.

### ۲. رنگ مات در برابر براقیت غیرعادی
میوه‌ها پس از پخت و خشک شدن کمی کدر و تیره می‌شوند. لواشک‌هایی که رنگ‌های شبرنگ و بسیار شفاف غیرواقعی دارند معمولاً حاوی رنگ‌های سنتتیک مانند تارترازین هستند.

### ۳. بافت و انعطاف‌پذیری
لواشک خالص بدون آرد و نشاسته بافتی نرم، کشسانی طبیعی و لایه‌پذیری بدون شکستگی دارد.', 'https://images.unsplash.com/photo-1541344999736-83eca872f242?w=800&q=80', 'دانستنی‌ها و سلامت', '["لواشک طبیعی","سلامت تغذیه","انار ساوه","تنقلات سالم"]', 'تیم پژوهش ملس‌بان', 4, TRUE, '2026-02-10T09:00:00.000Z', '2026-02-10T09:00:00.000Z')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO blog_posts (id, title, slug, summary, content, featured_image, category, tags, author, read_time_minutes, is_published, created_at, updated_at)
VALUES ('blg-02', 'خواص شگفت‌انگیز لواشک انار و زرشک برای سلامت کبد و گوارش', 'health-benefits-pomegranate-barberry-leather', 'بررسی علمی آنتی‌اکسیدان‌ها، پلی‌فنول‌ها و ویتامین‌های موجود در لواشک‌های ترش ارگانیک.', 'انار و زرشک هر دو از سوپرفودهای سنتی اقلیم ایران هستند. زمانی که این میوه‌ها در دمای کنترل‌شده به لواشک تبدیل می‌شوند، بخش عمده‌ای از ویتامین C، پتاسیم و ترکیبات پلی‌فنولی آن‌ها حفظ می‌گردد.

- **پاکسازی و سم‌زدایی کبد چرب:** اسیدهای آلی طبیعی زرشک به ترشح صفرا و چربی‌سوزی کمک می‌کنند.
- **تقویت سیستم ایمنی:** مقادیر بالای ویتامین C باعث پیشگیری از سرماخوردگی و خستگی مفرط می‌شود.
- **کمک به هضم غذاهای سنگین:** مصرف یک تکه کوچک لواشک ترش بعد از غذاهای چرب محرک هضم مناسب است.', 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=800&q=80', 'تغذیه و سلامت', '["کبد چرب","زرشک","ویتامین C","سلامتی"]', 'دکتر دارابی - مشاور تغذیه', 5, TRUE, '2026-02-25T11:00:00.000Z', '2026-02-25T11:00:00.000Z')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO blog_posts (id, title, slug, summary, content, featured_image, category, tags, author, read_time_minutes, is_published, created_at, updated_at)
VALUES ('blg-03', 'راهنمای سودآوری و خرید عمده لواشک برای فروشگاه‌ها و قنادی‌ها', 'wholesale-lavashak-guide-retailers', 'چگونه اضافه کردن لاین لواشک و ترشک طبیعی می‌تواند حاشیه سود مغازه شما را تا ۴۰٪ افزایش دهد.', 'در بازار امروز تقاضا برای تنقلات سالم و نوستالژیک رشد چشمگیری داشته است. قنادی‌ها و آجیل‌فروشی‌هایی که سینی‌های پذیرایی شیک و لواشک‌های فله باکیفیت را به ویترین خود افزوده‌اند، رشد فروش قابل توجهی را تجربه کرده‌اند.

در ملس‌بان کلیه سفارش‌های عمده با ضمانت ماندگاری، بسته‌بندی استاندارد صادراتی و قیمت رقابتی درب کارخانه در اختیار همکاران محترم در سراسر کشور قرار می‌گیرد.', 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&q=80', 'کسب‌وکار و فروش عمده', '["خرید عمده","تأمین کالا","قنادی و آجیل","صادرات"]', 'واحد بازرگانی ملس‌بان', 6, TRUE, '2026-03-01T08:30:00.000Z', '2026-03-01T08:30:00.000Z')
ON DUPLICATE KEY UPDATE id=id;

-- 11. Seed Site Settings
INSERT INTO site_settings (id, brand_name, tagline, support_phone, support_phone2, support_mobile, sales_mobile, wholesale_phone, support_email, address, factory_address, working_hours, instagram, telegram, whatsapp, announcement_bar_text, announcement_bar_link, is_announcement_active, hero_title, hero_subtitle, hero_badge, hero_image_url, promo_banner_title, promo_banner_text, promo_banner_discount, promo_banner_image_url, free_shipping_threshold, standard_shipping_fee, wholesale_min_order_kg, wholesale_tiers, faqs, updated_at)
VALUES ('default', 'فروشگاه تخصصی لواشک ملس‌بان', 'طعم واقعی میوه، در هر تکه لواشک', '021-88992211', '021-65220011', '09123456789', '09129876543', '021-88992211', 'info@malasban.ir', 'تهران، خیابان شریعتی، بعد از پل رومی، پلاک ۴۲، مجموعه کارگاهی ملس‌بان', 'تهران، جاده شهریار، شهرک صنعتی نور، بلوار کارآفرینان، پلاک ۱۴، مجتمع کارگاهی ملس‌بان', 'شنبه تا پنج‌شنبه از ساعت ۹:۰۰ الی ۲۱:۰۰', 'https://instagram.com/malasban_official', 'https://t.me/malasban_ir', 'https://wa.me/989123456789', '🎉 ارسال رایگان سفارش‌های بالای ۴۰۰ هزار تومان | ضمانت اصالت ۱۰۰٪ پوره طبیعی میوه', '/shop', TRUE, 'طعم واقعی میوه، در هر تکه لواشک', 'ملس‌بان، طعم‌های خاطره‌انگیز و اصیل ایرانی را با خالص‌ترین پوره‌های انار، زرشک، آلبالو و زردآلو به خانه‌های شما می‌آورد. ۱۰۰٪ طبیعی، سرشار از ویتامین، با بسته‌بندی بهداشتی تک‌نفره و مجلسی.', 'فرآوری سنتی با بالاترین استانداردهای بهداشتی روز', 'https://images.unsplash.com/photo-1541344999736-83eca872f242?w=900&q=80', 'جشنواره ترش و شیرین ملس‌بان', 'تخفیف‌های هیجان‌انگیز روی سینی‌های پذیرایی و بسته‌های هدیه مخلوط ترشک و لواشک ارگانیک', 'تا ۳۰٪ تخفیف ویژه', 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=900&q=80', 400000, 45000, 20, '[{"id":"tier-1","tierName":"برنزی (فروشگاهی)","minQuantityKg":20,"maxQuantityKg":50,"discountPercent":15,"packaging":"کارتن‌های ۵ و ۱۰ کیلویی","shippingCondition":"تیپاکس یا باربری","description":"مناسب برای سوپرمارکت‌ها، لبنیاتی‌ها و فروشگاه‌های محلی"},{"id":"tier-2","tierName":"نقره‌ای (قنادی‌ها و پخش استانی)","minQuantityKg":50,"maxQuantityKg":200,"discountPercent":25,"packaging":"کارتن‌های مادر وکیوم","shippingCondition":"ارسال رایگان به باربری","description":"ویژه قنادی‌ها، خشکبارفروشان و شبکه‌های توزیع استانی"},{"id":"tier-3","tierName":"طلایی (صادراتی و تناژ بالا)","minQuantityKg":200,"maxQuantityKg":null,"discountPercent":35,"packaging":"پالت و وکیوم صادراتی استاندارد","shippingCondition":"تحویل درب انبار خریدار یا گمرک","description":"بهترین قیمت رقابتی برای بازرگانان، شرکت‌های صادراتی و خریداران عمده کشوری"}]', '[{"id":"faq-1","q":"آیا در تهیه لواشک‌های ملس‌بان از شکر یا جوهر لیمو استفاده می‌شود؟","a":"خیر، به هیچ وجه! تمام محصولات ملس‌بان از ۱۰۰٪ پوره میوه طبیعی تهیه شده و ترشی آن کاملاً حاصل اسیدهای ارگانیک میوه (مانند اسید مالیک و اسید تارتاریک طبیعی) است و هیچ‌گونه شکر مصنوعی یا افزودنی سنتتیک به آن اضافه نمی‌شود.","category":"کیفیت و سلامت"},{"id":"faq-2","q":"حداقل میزان سفارش در بخش فروش عمده چقدر است؟","a":"حداقل سفارش عمده ۲۰ کیلوگرم یا یک کارتن مادر استاندارد است. برای سفارش‌های بالای ۱۰۰ کیلوگرم تخفیف‌های پلکانی ویژه همکاران در نظر گرفته شده است.","category":"فروش عمده"},{"id":"faq-3","q":"سفارش‌ها چگونه ارسال می‌شوند و چند روزه به دست ما می‌رسند؟","a":"سفارش‌های تهران با پیک سریع و سفارش‌های شهرستان با پست پیشتاز یا تیپاکس ارسال می‌گردد. زمان تحویل در تهران همان روز یا حداکثر ۲۴ ساعت و برای شهرستان‌ها بین ۲ الی ۳ روز کاری است.","category":"ارسال و پیگیری"},{"id":"faq-4","q":"شرایط نگهداری لواشک‌ها برای ماندگاری بیشتر چیست؟","a":"از آنجایی که مواد نگهدارنده شیمیایی در محصولات وجود ندارد، بهتر است لواشک‌ها در جای خشک، خنک و دور از نور مستقیم خورشید (یا داخل یخچال) نگهداری شوند. در این شرایط تا ۶ ماه طراوت اولیه خود را حفظ می‌کنند.","category":"نگهداری و مصرف"}]', CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE
  brand_name = VALUES(),
  tagline = VALUES(),
  support_phone = VALUES(),
  support_mobile = VALUES(),
  support_email = VALUES(),
  free_shipping_threshold = VALUES(),
  standard_shipping_fee = VALUES();

-- 12. Seed Chat Conversations
INSERT INTO chat_conversations (id, customer_id, guest_id, customer_name, customer_mobile, customer_email, assigned_agent_id, assigned_agent_name, status, priority, tags, unread_customer_count, unread_agent_count, last_message_text, last_message_time, last_sender, rating, feedback, summary, context_product, internal_notes, created_at, updated_at)
VALUES ('conv-1791304323216-205', 'usr-admin-01', NULL, 'مدیر سیستم ملس‌بان', '09120000000', 'admin@malasban.ir', NULL, NULL, 'active', 'normal', '["گفتگوی عمومی"]', 0, 0, 'شروع گفتگوی جدید', '2026-10-06T16:32:03.216Z', 'system', NULL, NULL, NULL, NULL, NULL, '2026-10-06T16:32:03.216Z', '2026-10-06T16:32:03.216Z')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO chat_conversations (id, customer_id, guest_id, customer_name, customer_mobile, customer_email, assigned_agent_id, assigned_agent_name, status, priority, tags, unread_customer_count, unread_agent_count, last_message_text, last_message_time, last_sender, rating, feedback, summary, context_product, internal_notes, created_at, updated_at)
VALUES ('conv-1790534055798-859', NULL, NULL, 'تست کاربر', NULL, NULL, NULL, NULL, 'active', 'normal', '["گفتگوی عمومی"]', 0, 0, 'طعم و محصول پیشنهادی ما با توجه به درخواست شما:
«لواشک انار دانه سرخ ساوه (ملس اعلا)» با ۱۰۰٪ پوره خالص میوه و طعم بی‌نظیر طبیعی. شما می‌توانید مستقیماً از دکمه زیر آن را به سبد خریدتان اضافه بفرمایید! 🍒', '2026-09-27T18:34:19.141Z', 'bot', NULL, NULL, NULL, NULL, NULL, '2026-09-27T18:34:15.798Z', '2026-09-27T18:34:19.141Z')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO chat_conversations (id, customer_id, guest_id, customer_name, customer_mobile, customer_email, assigned_agent_id, assigned_agent_name, status, priority, tags, unread_customer_count, unread_agent_count, last_message_text, last_message_time, last_sender, rating, feedback, summary, context_product, internal_notes, created_at, updated_at)
VALUES ('conv-sample-01', 'usr-customer-01', NULL, 'فاطمه موسوی', '09123456789', 'fatemeh@example.com', 'usr-admin-01', 'خانم رضایی', 'active', 'urgent', '["مشاوره خرید","پیگیری مرسوله"]', 0, 0, 'سلام، می‌خواستم بدونم سفارش من کی به دستم می‌رسه؟', '2026-09-27T18:19:10.628Z', 'customer', NULL, NULL, 'مشتری درباره زمان تحویل سفارش MLB-1403-1024 سوال کرد و راهنمایی کد پیگیری تیپاکس به ایشان ارائه شد.', '{"id":"prod-01","name":"لواشک انار ترش ساوه","price":98000,"discountPrice":85000,"image":"https://images.unsplash.com/photo-1541256942802-7b29965b77c4?w=600&auto=format&fit=crop&q=80","inStock":true,"slug":"saveh-sour-pomegranate-lavashak"}', NULL, '2026-09-27T16:34:10.628Z', '2026-09-27T18:19:10.628Z')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO chat_conversations (id, customer_id, guest_id, customer_name, customer_mobile, customer_email, assigned_agent_id, assigned_agent_name, status, priority, tags, unread_customer_count, unread_agent_count, last_message_text, last_message_time, last_sender, rating, feedback, summary, context_product, internal_notes, created_at, updated_at)
VALUES ('conv-sample-02', NULL, NULL, 'مهرداد کاظمی (کافه ترنج)', '09355554433', NULL, 'usr-staff-01', 'علیرضا صادقی', 'active', 'normal', '["خرید عمده","تخفیف همکاری"]', 0, 0, 'پیشنهاد قیمت برای ۵۰ کیلوگرم کیک و پک لواشکی پذیرفته شد.', '2026-09-27T15:34:10.628Z', 'agent', NULL, NULL, 'مذاکره برای خرید عمده ۵۰ کیلوگرم لواشک جهت سرو در کافه، توافق روی تخفیف ۲۵٪ همکاری.', NULL, NULL, '2026-09-26T18:34:10.628Z', '2026-09-27T15:34:10.628Z')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO chat_conversations (id, customer_id, guest_id, customer_name, customer_mobile, customer_email, assigned_agent_id, assigned_agent_name, status, priority, tags, unread_customer_count, unread_agent_count, last_message_text, last_message_time, last_sender, rating, feedback, summary, context_product, internal_notes, created_at, updated_at)
VALUES ('conv-sample-03', NULL, NULL, 'سارا امینی', '09128887766', NULL, NULL, NULL, 'closed', 'low', '["مشاوره طعم","رضایت عالی"]', 0, 0, 'خیلی ممنون از راهنمایی عالی و ارسال سریع‌تون!', '2026-09-25T18:34:10.628Z', 'customer', 5, 'پاسخگویی بسیار صبورانه و ارسال فوق‌العاده با بسته‌بندی تمیز.', 'راهنمایی انتخاب هدیه پک چوبی برای تولد و ارسال به موقع با پیک تهران.', NULL, NULL, '2026-09-25T14:34:10.628Z', '2026-09-25T18:34:10.628Z')
ON DUPLICATE KEY UPDATE id=id;

-- 13. Seed Chat Messages
INSERT INTO chat_messages (id, conversation_id, sender, sender_name, sender_avatar, text, created_at, status, attachment_url, attachment_type, attachment_name, product, order_attachment, quick_replies)
VALUES ('msg-01', 'conv-sample-01', 'system', 'سیستم ملس‌بان', NULL, 'گفتگو با واحد پشتیبانی و مشاوره تخصصی ملس‌بان آغاز شد.', '2026-09-27T16:44:10.628Z', 'sent', NULL, NULL, NULL, NULL, NULL, '[]')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO chat_messages (id, conversation_id, sender, sender_name, sender_avatar, text, created_at, status, attachment_url, attachment_type, attachment_name, product, order_attachment, quick_replies)
VALUES ('msg-02', 'conv-sample-01', 'bot', 'دستیار هوشمند ملس‌بان', NULL, 'سلام فاطمه عزیز! خوشحالیم که همراه ملس‌بان هستید. چطور می‌تونم بهتون کمک کنم؟ 😊', '2026-09-27T16:49:10.628Z', 'sent', NULL, NULL, NULL, NULL, NULL, '["پیگیری سفارش من","مشاوره درجه ترشی طعم‌ها","اتصال به اپراتور انسانی"]')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO chat_messages (id, conversation_id, sender, sender_name, sender_avatar, text, created_at, status, attachment_url, attachment_type, attachment_name, product, order_attachment, quick_replies)
VALUES ('msg-03', 'conv-sample-01', 'customer', 'فاطمه موسوی', NULL, 'سلام وقت بخیر، سفارشم با شماره MLB-1403-1024 در چه وضعیتی قرار داره؟', '2026-09-27T17:04:10.628Z', 'read', NULL, NULL, NULL, NULL, NULL, '[]')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO chat_messages (id, conversation_id, sender, sender_name, sender_avatar, text, created_at, status, attachment_url, attachment_type, attachment_name, product, order_attachment, quick_replies)
VALUES ('msg-04', 'conv-sample-01', 'bot', 'دستیار هوشمند ملس‌بان', NULL, 'اطلاعات سفارش شما با موفقیت پیدا شد:', '2026-09-27T17:06:10.628Z', 'sent', NULL, NULL, NULL, NULL, '{"id":"ord-1001","orderNumber":"MLB-1403-1024","status":"Shipped","paymentStatus":"Successful","totalAmount":325000,"createdAt":"2026-09-26T18:34:10.628Z","itemsCount":3,"customerName":"فاطمه موسوی"}', '[]')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO chat_messages (id, conversation_id, sender, sender_name, sender_avatar, text, created_at, status, attachment_url, attachment_type, attachment_name, product, order_attachment, quick_replies)
VALUES ('msg-05', 'conv-sample-01', 'agent', 'خانم رضایی', NULL, 'سلام فاطمه عزیز! مرسوله شما دیروز تحویل تیپاکس شده و کد رهگیری آن به شماره همراهتون پیامک شد. طبق پیگیری ما فردا قبل از ظهر به دستتون می‌رسه. اگر محصول دیگری هم مایل بودید اضافه کنید بفرمایید.', '2026-09-27T17:34:10.628Z', 'read', NULL, NULL, NULL, '{"id":"prod-02","name":"لواشک آلبالو کوهی دست‌چین","price":98000,"discountPrice":85000,"image":"https://images.unsplash.com/photo-1541256942802-7b29965b77c4?w=600&auto=format&fit=crop&q=80","inStock":true,"slug":"mountain-cherry-sour-lavashak"}', NULL, '[]')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO chat_messages (id, conversation_id, sender, sender_name, sender_avatar, text, created_at, status, attachment_url, attachment_type, attachment_name, product, order_attachment, quick_replies)
VALUES ('msg-06', 'conv-sample-01', 'customer', 'فاطمه موسوی', NULL, 'بسیار عالی، خیلی ممنونم از پیگیری دقیقتون! آلبالو کوهی رو هم به سبد خریدم اضافه کردم. 🙏', '2026-09-27T18:19:10.628Z', 'delivered', NULL, NULL, NULL, NULL, NULL, '[]')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO chat_messages (id, conversation_id, sender, sender_name, sender_avatar, text, created_at, status, attachment_url, attachment_type, attachment_name, product, order_attachment, quick_replies)
VALUES ('msg-1790534055798-1', 'conv-1790534055798-859', 'system', 'سیستم ملس‌بان', NULL, 'به گفتگوی زنده ملس‌بان خوش آمدید. دستیار هوشمند و کارشناسان پشتیبانی آماده راهنمایی شما هستند.', '2026-09-27T18:34:15.798Z', 'sent', NULL, NULL, NULL, NULL, NULL, '[]')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO chat_messages (id, conversation_id, sender, sender_name, sender_avatar, text, created_at, status, attachment_url, attachment_type, attachment_name, product, order_attachment, quick_replies)
VALUES ('msg-1790534055798-2', 'conv-1790534055798-859', 'bot', 'دستیار هوشمند ملس‌بان', NULL, 'سلام و وقت بخیر به پشتیبانی ملس‌بان خوش آمدید! 👋 چطور می‌تونیم کمکتون کنیم؟ برای دریافت راهنمایی فوری می‌توانید از گزینه‌های زیر استفاده کنید یا پیام خود را تایپ فرمایید.', '2026-09-27T18:34:16.298Z', 'sent', NULL, NULL, NULL, NULL, NULL, '["📦 پیگیری وضعیت سفارش","🍒 راهنمای انتخاب درجه ترشی","🚚 هزینه و زمان ارسال","💼 شرایط خرید عمده","👩‍💼 اتصال به اپراتور انسانی"]')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO chat_messages (id, conversation_id, sender, sender_name, sender_avatar, text, created_at, status, attachment_url, attachment_type, attachment_name, product, order_attachment, quick_replies)
VALUES ('msg-1790534059140-545', 'conv-1790534055798-859', 'customer', 'تست کاربر', NULL, 'لواشک ترش انار چی داری؟', '2026-09-27T18:34:19.140Z', 'delivered', NULL, NULL, NULL, NULL, NULL, '[]')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO chat_messages (id, conversation_id, sender, sender_name, sender_avatar, text, created_at, status, attachment_url, attachment_type, attachment_name, product, order_attachment, quick_replies)
VALUES ('msg-1790534059141-722', 'conv-1790534055798-859', 'bot', 'دستیار هوشمند ملس‌بان', NULL, 'طعم و محصول پیشنهادی ما با توجه به درخواست شما:
«لواشک انار دانه سرخ ساوه (ملس اعلا)» با ۱۰۰٪ پوره خالص میوه و طعم بی‌نظیر طبیعی. شما می‌توانید مستقیماً از دکمه زیر آن را به سبد خریدتان اضافه بفرمایید! 🍒', '2026-09-27T18:34:19.141Z', 'delivered', NULL, NULL, NULL, '{"id":"prod-01","name":"لواشک انار دانه سرخ ساوه (ملس اعلا)","price":85000,"discountPrice":72000,"image":"https://images.unsplash.com/photo-1541344999736-83eca872f242?w=800&q=80","inStock":true,"slug":"lavashak-anar-saveh","weightGrams":350}', NULL, '["افزودن به سبد خرید","طعم‌های ترش‌تر داری؟","نحوه ارسال چطوره؟","اتصال به اپراتور"]')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO chat_messages (id, conversation_id, sender, sender_name, sender_avatar, text, created_at, status, attachment_url, attachment_type, attachment_name, product, order_attachment, quick_replies)
VALUES ('msg-k01', 'conv-sample-02', 'system', 'سیستم ملس‌بان', NULL, 'گفتگو جهت استعلام و ثبت سفارش عمده کافه ترنج شیراز آغاز شد.', '2026-10-01T10:09:32.447Z', 'sent', NULL, NULL, NULL, NULL, NULL, '[]')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO chat_messages (id, conversation_id, sender, sender_name, sender_avatar, text, created_at, status, attachment_url, attachment_type, attachment_name, product, order_attachment, quick_replies)
VALUES ('msg-k02', 'conv-sample-02', 'customer', 'مهرداد کاظمی (کافه ترنج)', NULL, 'سلام و وقت بخیر، ما برای کافه ترنج در شیراز می‌خواستیم ماهانه حداقل ۵۰ کیلوگرم لواشک ورقه‌ای و پک پذیرایی تهیه کنیم. شرایط همکاری عمده و درصد تخفیف چطور است؟', '2026-10-01T11:09:32.448Z', 'read', NULL, NULL, NULL, NULL, NULL, '[]')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO chat_messages (id, conversation_id, sender, sender_name, sender_avatar, text, created_at, status, attachment_url, attachment_type, attachment_name, product, order_attachment, quick_replies)
VALUES ('msg-k03', 'conv-sample-02', 'agent', 'علیرضا صادقی', NULL, 'درود جناب کاظمی عزیز! برای سفارش‌های بالای ۳۰ کیلوگرم، تخفیف همکاری ۲۵ درصدی به همراه ارسال رایگان با باربری لحاظ می‌گردد. همچنین امکان بسته‌بندی با لوگوی کافه نیز مهیا است.', '2026-10-01T14:09:32.448Z', 'read', NULL, NULL, NULL, NULL, NULL, '[]')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO chat_messages (id, conversation_id, sender, sender_name, sender_avatar, text, created_at, status, attachment_url, attachment_type, attachment_name, product, order_attachment, quick_replies)
VALUES ('msg-k04', 'conv-sample-02', 'customer', 'مهرداد کاظمی (کافه ترنج)', NULL, 'عالیه، کیفیت طعم‌های ترش و ملس به ویژه لواشک انار ساوه و زرشک کوهی برای ما اولویت داره. آیا امکان ارسال سمپل تست وجود داره؟', '2026-10-01T18:09:32.448Z', 'read', NULL, NULL, NULL, NULL, NULL, '[]')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO chat_messages (id, conversation_id, sender, sender_name, sender_avatar, text, created_at, status, attachment_url, attachment_type, attachment_name, product, order_attachment, quick_replies)
VALUES ('msg-k05', 'conv-sample-02', 'agent', 'علیرضا صادقی', NULL, 'بله حتماً، یک پک سمپل تست شامل ۶ طعم محبوب با تیپاکس ارسال شد. کد پیگیری: TP-99882211.', '2026-10-01T22:09:32.448Z', 'read', NULL, NULL, NULL, NULL, NULL, '[]')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO chat_messages (id, conversation_id, sender, sender_name, sender_avatar, text, created_at, status, attachment_url, attachment_type, attachment_name, product, order_attachment, quick_replies)
VALUES ('msg-k06', 'conv-sample-02', 'customer', 'مهرداد کاظمی (کافه ترنج)', NULL, 'سمپل‌ها به دستمون رسید، طعم انار و آلو جنگلی فوق‌العاده باکیفیت بود. تاییدیه نهایی برای ۵۰ کیلوگرم را خدمت شما اعلام می‌کنم.', '2026-10-02T05:09:32.448Z', 'read', NULL, NULL, NULL, NULL, NULL, '[]')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO chat_messages (id, conversation_id, sender, sender_name, sender_avatar, text, created_at, status, attachment_url, attachment_type, attachment_name, product, order_attachment, quick_replies)
VALUES ('msg-k07', 'conv-sample-02', 'agent', 'علیرضا صادقی', NULL, 'پیشنهاد قیمت برای ۵۰ کیلوگرم کیک و پک لواشکی پذیرفته شد. پیش‌فاکتور رسمی در سامانه صادر شد و فردا بارگیری انجام می‌شود.', '2026-10-02T07:09:32.448Z', 'read', NULL, NULL, NULL, NULL, NULL, '[]')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO chat_messages (id, conversation_id, sender, sender_name, sender_avatar, text, created_at, status, attachment_url, attachment_type, attachment_name, product, order_attachment, quick_replies)
VALUES ('msg-s01', 'conv-sample-03', 'system', 'سیستم ملس‌بان', NULL, 'گفتگو درباره انتخاب پک کادویی و مشاوره درجه ترشی آغاز شد.', '2026-09-30T06:09:32.448Z', 'sent', NULL, NULL, NULL, NULL, NULL, '[]')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO chat_messages (id, conversation_id, sender, sender_name, sender_avatar, text, created_at, status, attachment_url, attachment_type, attachment_name, product, order_attachment, quick_replies)
VALUES ('msg-s02', 'conv-sample-03', 'customer', 'سارا امینی', NULL, 'سلام وقت بخیر، من برای تولد دوستم می‌خواستم یک پک کادویی ترش و ملس بخرم، بین باکس چوبی لوکس و پک پذیرایی ملس‌بان کدوم رو پیشنهاد می‌کنید؟', '2026-09-30T07:09:32.448Z', 'read', NULL, NULL, NULL, NULL, NULL, '[]')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO chat_messages (id, conversation_id, sender, sender_name, sender_avatar, text, created_at, status, attachment_url, attachment_type, attachment_name, product, order_attachment, quick_replies)
VALUES ('msg-s03', 'conv-sample-03', 'bot', 'دستیار هوشمند ملس‌بان', NULL, 'سلام سارا عزیز! باکس چوبی لوکس ملس‌بان با ربان‌پیچی شیک و ترکیب ۸ طعم محلی دست‌چین، پرفروش‌ترین و محبوب‌ترین هدیه ماست.', '2026-09-30T08:09:32.448Z', 'sent', NULL, NULL, NULL, NULL, NULL, '[]')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO chat_messages (id, conversation_id, sender, sender_name, sender_avatar, text, created_at, status, attachment_url, attachment_type, attachment_name, product, order_attachment, quick_replies)
VALUES ('msg-s04', 'conv-sample-03', 'agent', 'خانم رضایی', NULL, 'سلام خانم امینی عزیز، روزتون بخیر! علاوه بر زیبایی باکس چوبی، امکان درج کارت پستال تبریک اختصاصی با متن دلخواه شما هم رایگان انجام می‌شه و با پیک مستقیم به آدرس دوستتون ارسال می‌کنیم.', '2026-09-30T09:09:32.448Z', 'read', NULL, NULL, NULL, NULL, NULL, '[]')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO chat_messages (id, conversation_id, sender, sender_name, sender_avatar, text, created_at, status, attachment_url, attachment_type, attachment_name, product, order_attachment, quick_replies)
VALUES ('msg-s05', 'conv-sample-03', 'customer', 'سارا امینی', NULL, 'خیلی ممنون از راهنمایی عالی و ارسال سریع‌تون! بسته سر موقع و با تزئین بسیار زیبا تحویل شد، دوستم خیلی ذوق‌زده شد. 🌹', '2026-09-30T10:09:32.448Z', 'read', NULL, NULL, NULL, NULL, NULL, '[]')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO chat_messages (id, conversation_id, sender, sender_name, sender_avatar, text, created_at, status, attachment_url, attachment_type, attachment_name, product, order_attachment, quick_replies)
VALUES ('msg-1791304323216-1', 'conv-1791304323216-205', 'system', 'سیستم ملس‌بان', NULL, 'به گفتگوی زنده ملس‌بان خوش آمدید. دستیار هوشمند و کارشناسان پشتیبانی آماده راهنمایی شما هستند.', '2026-10-06T16:32:03.216Z', 'sent', NULL, NULL, NULL, NULL, NULL, '[]')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO chat_messages (id, conversation_id, sender, sender_name, sender_avatar, text, created_at, status, attachment_url, attachment_type, attachment_name, product, order_attachment, quick_replies)
VALUES ('msg-1791304323216-2', 'conv-1791304323216-205', 'bot', 'دستیار هوشمند ملس‌بان', NULL, 'سلام و وقت بخیر به پشتیبانی ملس‌بان خوش آمدید! 👋 چطور می‌تونیم کمکتون کنیم؟ برای دریافت راهنمایی فوری می‌توانید از گزینه‌های زیر استفاده کنید یا پیام خود را تایپ فرمایید.', '2026-10-06T16:32:03.716Z', 'sent', NULL, NULL, NULL, NULL, NULL, '["📦 پیگیری وضعیت سفارش","🍒 راهنمای انتخاب درجه ترشی","🚚 هزینه و زمان ارسال","💼 شرایط خرید عمده","👩‍💼 اتصال به اپراتور انسانی"]')
ON DUPLICATE KEY UPDATE id=id;

-- 14. Seed Chat Settings
INSERT INTO chat_settings (id, is_online, working_hours_start, working_hours_end, auto_welcome_message, offline_message, exit_intent_message, enable_sound_notifications, enable_ai_assistant, operator_name, operator_title)
VALUES ('default', TRUE, '08:30', '22:30', 'سلام و وقت بخیر به پشتیبانی ملس‌بان خوش آمدید! 👋 چطور می‌تونیم کمکتون کنیم؟ برای دریافت راهنمایی فوری می‌توانید از گزینه‌های زیر استفاده کنید یا پیام خود را تایپ فرمایید.', 'در حال حاضر در ساعات استراحت کارشناسان ملس‌بان هستیم (ساعات پاسخگویی: ۸:۳۰ تا ۲۲:۳۰). پیام و شماره همراه خود را بگذارید تا صبح در اولین فرصت بررسی و خدمتتان تماس بگیریم.', 'قبل از خروج! ۲۵٪ تخفیف ویژه خرید اول شما فعال است (کد: FIRSTBUY) 🎁 اگر در انتخاب طعم یا نحوه ارسال سوالی دارید همین الان از ما بپرسید!', TRUE, TRUE, 'خانم رضایی', 'کارشناس ارشد مشاوره و پشتیبانی فروش')
ON DUPLICATE KEY UPDATE
  is_online = VALUES(),
  auto_welcome_message = VALUES(),
  offline_message = VALUES();

-- 15. Seed Canned Responses
INSERT INTO canned_responses (id, shortcut, title, content, category)
VALUES ('cn-1', '/hello', 'خوش‌آمدگویی صمیمانه', 'سلام و درود خدمت شما دوست گرامی! امیدوارم روزتون پر از انرژی باشه. بفرمایید چطور می‌تونم راهنماییتون کنم؟ 😊', 'عمومی')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO canned_responses (id, shortcut, title, content, category)
VALUES ('cn-2', '/shipping', 'نحوه و زمان ارسال سفارشات', 'سفارش‌های تهران با پیک سریع اختصاصی ارسال می‌شوند. سفارش‌های سایر استان‌ها از طریق پست پیشتاز و تیپاکس با بسته‌بندی کاملاً ضربه‌گیر و بهداشتی ظرف ۲ الی ۳ روز کاری تحویل می‌گردند. برای خریدهای بالای ۶۰۰ هزار تومان ارسال رایگان است! 🚚', 'ارسال')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO canned_responses (id, shortcut, title, content, category)
VALUES ('cn-3', '/taste', 'راهنمای انتخاب ترشی و طعم‌ها', 'محصولات ملس‌بان از نظر ترشی در ۴ دسته هستند: خیلی ترش (انار وحشی ساوه و آلبالو کوهی)، ملس متمایل به ترش (آلو قرمز جنگلی و کیک‌های مجلسی)، ملس شیرین (زردآلو و سیب باغی). شما به کدام سطح ترشی علاقه‌مندید تا دقیق راهنمایی کنم؟ 🍒', 'محصولات')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO canned_responses (id, shortcut, title, content, category)
VALUES ('cn-4', '/wholesale', 'اطلاعات سفارش عمده و همکار', 'برای سفارش‌های عمده قنادی‌ها، کافی‌شاپ‌ها و فروشگاه‌های ارگانیک، تخفیف‌های ویژه ۱۵٪ الی ۳۵٪ اعمال می‌شود. حداقل تیراژ سفارش عمده ۲۰ کیلوگرم بوده و با باربری به تمام نقاط کشور ارسال می‌شود. 💼', 'فروش عمده')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO canned_responses (id, shortcut, title, content, category)
VALUES ('cn-5', '/card', 'اطلاعات حساب کارت به کارت', 'شماره کارت جهت واریز وجه سفارش:
۶۰۳۷-۰۰۰۰-۰۰۰۰-۰۰۰۰
بانک ملی ایران - به نام فروشگاه ارگانیک ملس‌بان
لطفاً پس از پرداخت، تصویر فیش و ۴ رقم آخر شماره کارت را در چت ارسال فرمایید. 💳', 'مالی')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO canned_responses (id, shortcut, title, content, category)
VALUES ('cn-6', '/thanks', 'تشکر و آرزوی سلامتی', 'از اعتماد و همراهی صمیمانه شما با خانواده ملس‌بان بی‌نهایت سپاسگزاریم! لحظات شاد و طعم‌های دلپذیری برای شما آرزومندیم. هر زمان سوال یا راهنمایی لازم بود مجدداً در خدمتتون هستیم. ❤️', 'عمومی')
ON DUPLICATE KEY UPDATE id=id;

-- Record migration 002
INSERT INTO schema_migrations (version, name)
VALUES ('002', '002_seed_initial_data')
ON DUPLICATE KEY UPDATE version=version;


SET FOREIGN_KEY_CHECKS = 1;
