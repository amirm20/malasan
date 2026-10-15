-- ====================================================================
-- Malasban Lavashak Platform - Production Hardened MySQL Schema
-- Migration: 001_initial_schema.sql
-- ====================================================================

-- 1. Migration History Tracker
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Users Table (role is the single source of truth; redundant is_super_admin removed)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  family VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  mobile VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  salt VARCHAR(64) NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'Customer',
  permissions JSON NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_mobile (mobile),
  INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Normalized User Addresses Table (1:N with users)
CREATE TABLE IF NOT EXISTS addresses (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  title VARCHAR(100) NOT NULL,
  recipient_name VARCHAR(150) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  province VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  plaque VARCHAR(50),
  unit VARCHAR(50),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_addresses_user_id (user_id),
  CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  INDEX idx_categories_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Normalized Products Table
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  sku VARCHAR(50) UNIQUE NOT NULL,
  category_id VARCHAR(50) NOT NULL,
  short_description TEXT,
  description TEXT,
  price DECIMAL(12, 0) NOT NULL,
  discount_price DECIMAL(12, 0),
  stock_quantity INT NOT NULL DEFAULT 0,
  weight_grams INT NOT NULL DEFAULT 250,
  pieces_per_pack INT NOT NULL DEFAULT 1,
  images JSON NOT NULL,
  main_image TEXT,
  sourness_level VARCHAR(30) NOT NULL DEFAULT 'Sour',
  ingredients JSON NOT NULL,
  nutritional_facts JSON NOT NULL,
  rating DECIMAL(3, 2) NOT NULL DEFAULT 5.0,
  review_count INT NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_best_seller BOOLEAN NOT NULL DEFAULT FALSE,
  is_new BOOLEAN NOT NULL DEFAULT FALSE,
  is_wholesale_available BOOLEAN NOT NULL DEFAULT FALSE,
  min_wholesale_qty INT,
  wholesale_unit_price DECIMAL(12, 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_products_slug (slug),
  INDEX idx_products_sku (sku),
  INDEX idx_products_category (category_id),
  INDEX idx_products_active (is_active),
  INDEX idx_products_featured (is_featured),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Coupons Table
CREATE TABLE IF NOT EXISTS coupons (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(30) NOT NULL,
  value DECIMAL(12, 0) NOT NULL,
  min_order_amount DECIMAL(12, 0) NOT NULL DEFAULT 0,
  max_discount_amount DECIMAL(12, 0),
  usage_limit INT NOT NULL DEFAULT 100,
  used_count INT NOT NULL DEFAULT 0,
  start_date DATETIME,
  end_date DATETIME,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  first_order_only BOOLEAN NOT NULL DEFAULT FALSE,
  INDEX idx_coupons_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Normalized Orders Table (with coupon_id FK, coupon_code snapshot, and enhanced statuses)
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(50) PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id VARCHAR(50),
  customer_name VARCHAR(150) NOT NULL,
  customer_mobile VARCHAR(20) NOT NULL,
  customer_email VARCHAR(150),
  shipping_address JSON NOT NULL,
  shipping_method VARCHAR(100) NOT NULL,
  shipping_fee DECIMAL(12, 0) NOT NULL DEFAULT 0,
  subtotal DECIMAL(12, 0) NOT NULL,
  discount_amount DECIMAL(12, 0) NOT NULL DEFAULT 0,
  coupon_id VARCHAR(50),
  coupon_code VARCHAR(50),
  total_amount DECIMAL(12, 0) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Pending',
  payment_status VARCHAR(30) NOT NULL DEFAULT 'Pending',
  payment_method VARCHAR(100) NOT NULL,
  payment_ref_id VARCHAR(100),
  customer_notes TEXT,
  admin_notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_orders_order_number (order_number),
  INDEX idx_orders_user_id (user_id),
  INDEX idx_orders_coupon_id (coupon_id),
  INDEX idx_orders_status (status),
  INDEX idx_orders_payment_status (payment_status),
  INDEX idx_orders_created_at (created_at),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_orders_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Order Items Table (Historical Snapshot)
CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(50) PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  product_id VARCHAR(50),
  product_name VARCHAR(200) NOT NULL,
  sku VARCHAR(50),
  product_image TEXT,
  weight_grams INT,
  quantity INT NOT NULL,
  unit_price DECIMAL(12, 0) NOT NULL,
  discount_amount DECIMAL(12, 0) NOT NULL DEFAULT 0,
  total_price DECIMAL(12, 0) NOT NULL,
  INDEX idx_order_items_order_id (order_id),
  INDEX idx_order_items_product_id (product_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Wholesale Requests Table
CREATE TABLE IF NOT EXISTS wholesale_requests (
  id VARCHAR(50) PRIMARY KEY,
  tracking_code VARCHAR(50) UNIQUE NOT NULL,
  applicant_name VARCHAR(150) NOT NULL,
  company_name VARCHAR(150) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  email VARCHAR(150),
  province VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  business_type VARCHAR(100) NOT NULL,
  requested_products TEXT NOT NULL,
  estimated_quantity_kg DECIMAL(10, 2) NOT NULL,
  description TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'New',
  admin_notes TEXT,
  offered_price_per_kg DECIMAL(12, 0),
  quotation_sent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_wholesale_tracking (tracking_code),
  INDEX idx_wholesale_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(50) PRIMARY KEY,
  product_id VARCHAR(50) NOT NULL,
  user_id VARCHAR(50),
  rating DECIMAL(3, 1) NOT NULL,
  comment TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  is_official_staff BOOLEAN NOT NULL DEFAULT FALSE,
  admin_reply TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_reviews_product_id (product_id),
  INDEX idx_reviews_user_id (user_id),
  INDEX idx_reviews_approved (is_approved),
  CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Blog Posts Table
CREATE TABLE IF NOT EXISTS blog_posts (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  featured_image TEXT,
  category VARCHAR(100) NOT NULL,
  tags JSON NOT NULL,
  author VARCHAR(100) NOT NULL,
  read_time_minutes INT NOT NULL DEFAULT 5,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_blog_slug (slug),
  INDEX idx_blog_published (is_published)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Site Settings Table
CREATE TABLE IF NOT EXISTS site_settings (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
  brand_name VARCHAR(100) NOT NULL,
  tagline VARCHAR(255) NOT NULL,
  support_phone VARCHAR(50),
  support_phone2 VARCHAR(50),
  support_mobile VARCHAR(50),
  sales_mobile VARCHAR(50),
  wholesale_phone VARCHAR(50),
  support_email VARCHAR(150),
  address TEXT,
  factory_address TEXT,
  working_hours VARCHAR(150),
  instagram VARCHAR(150),
  telegram VARCHAR(150),
  whatsapp VARCHAR(150),
  announcement_bar_text TEXT,
  announcement_bar_link VARCHAR(255),
  is_announcement_active BOOLEAN NOT NULL DEFAULT TRUE,
  hero_title TEXT,
  hero_subtitle TEXT,
  hero_badge VARCHAR(150),
  hero_image_url TEXT,
  promo_banner_title TEXT,
  promo_banner_text TEXT,
  promo_banner_discount VARCHAR(100),
  promo_banner_image_url TEXT,
  free_shipping_threshold DECIMAL(12, 0) NOT NULL DEFAULT 400000,
  standard_shipping_fee DECIMAL(12, 0) NOT NULL DEFAULT 45000,
  wholesale_min_order_kg DECIMAL(10, 2) NOT NULL DEFAULT 25,
  wholesale_tiers JSON NOT NULL,
  faqs JSON NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Chat Conversations Table
CREATE TABLE IF NOT EXISTS chat_conversations (
  id VARCHAR(50) PRIMARY KEY,
  customer_id VARCHAR(50),
  guest_id VARCHAR(100),
  customer_name VARCHAR(150) NOT NULL,
  customer_mobile VARCHAR(50),
  customer_email VARCHAR(150),
  assigned_agent_id VARCHAR(50),
  assigned_agent_name VARCHAR(150),
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  priority VARCHAR(30) NOT NULL DEFAULT 'normal',
  tags JSON NOT NULL,
  unread_customer_count INT NOT NULL DEFAULT 0,
  unread_agent_count INT NOT NULL DEFAULT 0,
  last_message_text TEXT,
  last_message_time DATETIME,
  last_sender VARCHAR(30) NOT NULL DEFAULT 'customer',
  rating DECIMAL(3, 1),
  feedback TEXT,
  summary TEXT,
  context_product JSON,
  internal_notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_chat_guest (guest_id),
  INDEX idx_chat_status (status),
  INDEX idx_chat_last_time (last_message_time),
  INDEX idx_chat_customer_id (customer_id),
  CONSTRAINT fk_chat_conv_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_chat_conv_agent FOREIGN KEY (assigned_agent_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id VARCHAR(50) PRIMARY KEY,
  conversation_id VARCHAR(50) NOT NULL,
  sender VARCHAR(30) NOT NULL,
  sender_name VARCHAR(150) NOT NULL,
  sender_avatar TEXT,
  text TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(30) NOT NULL DEFAULT 'sent',
  attachment_url TEXT,
  attachment_type VARCHAR(30),
  attachment_name VARCHAR(255),
  product JSON,
  order_attachment JSON,
  quick_replies JSON NOT NULL,
  INDEX idx_chat_msg_conv (conversation_id),
  INDEX idx_chat_msg_created (created_at),
  CONSTRAINT fk_chat_msg_conv FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Chat Settings Table
CREATE TABLE IF NOT EXISTS chat_settings (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
  is_online BOOLEAN NOT NULL DEFAULT TRUE,
  working_hours_start VARCHAR(10) NOT NULL DEFAULT '08:30',
  working_hours_end VARCHAR(10) NOT NULL DEFAULT '22:00',
  auto_welcome_message TEXT,
  offline_message TEXT,
  exit_intent_message TEXT,
  enable_sound_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  enable_ai_assistant BOOLEAN NOT NULL DEFAULT TRUE,
  operator_name VARCHAR(100),
  operator_title VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Canned Responses Table (with unique shortcut)
CREATE TABLE IF NOT EXISTS canned_responses (
  id VARCHAR(50) PRIMARY KEY,
  shortcut VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(150) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Record migration 001
INSERT INTO schema_migrations (version, name)
VALUES ('001', '001_initial_schema')
ON DUPLICATE KEY UPDATE name = VALUES(name);
