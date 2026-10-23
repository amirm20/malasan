-- ====================================================================
-- Malasban Lavashak Platform - Production Hardened PostgreSQL Schema
-- Migration: 001_initial_schema.sql
-- ====================================================================

-- 1. Migration History Tracker
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table (role is the single source of truth; redundant is_super_admin removed)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  family VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  mobile VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  salt VARCHAR(64) NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'Customer'
    CHECK (role IN ('SuperAdmin', 'Admin', 'Customer')),
  permissions JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 3. Normalized User Addresses Table (1:N with users)
CREATE TABLE IF NOT EXISTS addresses (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);

-- Enforce exactly one default address per user using partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_default_address_per_user
ON addresses(user_id)
WHERE is_default = TRUE;

-- 4. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- 5. Normalized Products Table
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  sku VARCHAR(50) UNIQUE NOT NULL,
  category_id VARCHAR(50) NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  short_description TEXT,
  description TEXT,
  price NUMERIC(12, 0) NOT NULL CHECK (price >= 0),
  discount_price NUMERIC(12, 0) CHECK (discount_price IS NULL OR discount_price >= 0),
  stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  weight_grams INT NOT NULL CHECK (weight_grams >= 0),
  pieces_per_pack INT NOT NULL DEFAULT 1 CHECK (pieces_per_pack >= 0),
  images JSONB NOT NULL DEFAULT '[]',
  main_image TEXT,
  sourness_level VARCHAR(30) NOT NULL DEFAULT 'Sour'
    CHECK (sourness_level IN ('Sweet', 'SweetSour', 'Sour', 'ExtraSour')),
  ingredients JSONB NOT NULL DEFAULT '[]',
  nutritional_facts JSONB NOT NULL DEFAULT '{}',
  rating NUMERIC(3, 2) NOT NULL DEFAULT 5.0 CHECK (rating >= 0.0 AND rating <= 5.0),
  review_count INT NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_best_seller BOOLEAN NOT NULL DEFAULT FALSE,
  is_new BOOLEAN NOT NULL DEFAULT FALSE,
  is_wholesale_available BOOLEAN NOT NULL DEFAULT FALSE,
  min_wholesale_qty INT CHECK (min_wholesale_qty IS NULL OR min_wholesale_qty > 0),
  wholesale_unit_price NUMERIC(12, 0) CHECK (wholesale_unit_price IS NULL OR wholesale_unit_price >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);

-- 6. Coupons Table (must precede orders due to FK)
CREATE TABLE IF NOT EXISTS coupons (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(30) NOT NULL CHECK (type IN ('Percent', 'FixedAmount')),
  value NUMERIC(12, 0) NOT NULL CHECK (value >= 0),
  min_order_amount NUMERIC(12, 0) NOT NULL DEFAULT 0 CHECK (min_order_amount >= 0),
  max_discount_amount NUMERIC(12, 0) CHECK (max_discount_amount IS NULL OR max_discount_amount >= 0),
  usage_limit INT NOT NULL DEFAULT 100 CHECK (usage_limit > 0),
  used_count INT NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  first_order_only BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

-- 7. Normalized Orders Table (with coupon_id FK, coupon_code snapshot, and enhanced statuses)
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(50) PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
  customer_name VARCHAR(150) NOT NULL,
  customer_mobile VARCHAR(20) NOT NULL,
  customer_email VARCHAR(150),
  shipping_address JSONB NOT NULL,
  shipping_method VARCHAR(100) NOT NULL,
  shipping_fee NUMERIC(12, 0) NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  subtotal NUMERIC(12, 0) NOT NULL CHECK (subtotal >= 0),
  discount_amount NUMERIC(12, 0) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  coupon_id VARCHAR(50) REFERENCES coupons(id) ON DELETE SET NULL,
  coupon_code VARCHAR(50),
  total_amount NUMERIC(12, 0) NOT NULL CHECK (total_amount >= 0),
  status VARCHAR(30) NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned')),
  payment_status VARCHAR(30) NOT NULL DEFAULT 'Pending'
    CHECK (payment_status IN ('Pending', 'Successful', 'Failed', 'Refunded', 'PartiallyRefunded')),
  payment_method VARCHAR(100) NOT NULL,
  payment_ref_id VARCHAR(100),
  customer_notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_coupon_id ON orders(coupon_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- 8. Order Items Table (Historical Snapshot)
CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(50) PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id VARCHAR(50) REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(200) NOT NULL,
  sku VARCHAR(50),
  product_image TEXT,
  weight_grams INT CHECK (weight_grams IS NULL OR weight_grams >= 0),
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12, 0) NOT NULL CHECK (unit_price >= 0),
  discount_amount NUMERIC(12, 0) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  total_price NUMERIC(12, 0) NOT NULL CHECK (total_price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

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
  estimated_quantity_kg NUMERIC(10, 2) NOT NULL CHECK (estimated_quantity_kg > 0),
  description TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'New'
    CHECK (status IN ('New', 'Reviewing', 'Contacted', 'Approved', 'Rejected')),
  admin_notes TEXT,
  offered_price_per_kg NUMERIC(12, 0) CHECK (offered_price_per_kg IS NULL OR offered_price_per_kg >= 0),
  quotation_sent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wholesale_tracking ON wholesale_requests(tracking_code);
CREATE INDEX IF NOT EXISTS idx_wholesale_status ON wholesale_requests(status);

-- 10. Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(50) PRIMARY KEY,
  product_id VARCHAR(50) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
  rating NUMERIC(3, 1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
  comment TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  is_official_staff BOOLEAN NOT NULL DEFAULT FALSE,
  admin_reply TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(is_approved);

-- 11. Blog Posts Table
CREATE TABLE IF NOT EXISTS blog_posts (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  featured_image TEXT,
  category VARCHAR(100) NOT NULL,
  tags JSONB NOT NULL DEFAULT '[]',
  author VARCHAR(100) NOT NULL,
  read_time_minutes INT NOT NULL DEFAULT 5 CHECK (read_time_minutes > 0),
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_blog_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_published ON blog_posts(is_published);

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
  free_shipping_threshold NUMERIC(12, 0) NOT NULL DEFAULT 400000 CHECK (free_shipping_threshold >= 0),
  standard_shipping_fee NUMERIC(12, 0) NOT NULL DEFAULT 45000 CHECK (standard_shipping_fee >= 0),
  wholesale_min_order_kg NUMERIC(10, 2) NOT NULL DEFAULT 25 CHECK (wholesale_min_order_kg > 0),
  wholesale_tiers JSONB NOT NULL DEFAULT '[]',
  faqs JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 13. Chat Conversations Table
CREATE TABLE IF NOT EXISTS chat_conversations (
  id VARCHAR(50) PRIMARY KEY,
  customer_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
  guest_id VARCHAR(100),
  customer_name VARCHAR(150) NOT NULL,
  customer_mobile VARCHAR(50),
  customer_email VARCHAR(150),
  assigned_agent_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
  assigned_agent_name VARCHAR(150),
  status VARCHAR(30) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'waiting', 'closed')),
  priority VARCHAR(30) NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'urgent')),
  tags JSONB NOT NULL DEFAULT '[]',
  unread_customer_count INT NOT NULL DEFAULT 0 CHECK (unread_customer_count >= 0),
  unread_agent_count INT NOT NULL DEFAULT 0 CHECK (unread_agent_count >= 0),
  last_message_text TEXT,
  last_message_time TIMESTAMP WITH TIME ZONE,
  last_sender VARCHAR(30) NOT NULL DEFAULT 'customer'
    CHECK (last_sender IN ('customer', 'agent', 'bot', 'system')),
  rating NUMERIC(3, 1) CHECK (rating IS NULL OR (rating >= 1.0 AND rating <= 5.0)),
  feedback TEXT,
  summary TEXT,
  context_product JSONB,
  internal_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_guest ON chat_conversations(guest_id);
CREATE INDEX IF NOT EXISTS idx_chat_status ON chat_conversations(status);
CREATE INDEX IF NOT EXISTS idx_chat_last_time ON chat_conversations(last_message_time);
CREATE INDEX IF NOT EXISTS idx_chat_customer_id ON chat_conversations(customer_id);

-- 14. Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id VARCHAR(50) PRIMARY KEY,
  conversation_id VARCHAR(50) NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender VARCHAR(30) NOT NULL
    CHECK (sender IN ('customer', 'agent', 'bot', 'system')),
  sender_name VARCHAR(150) NOT NULL,
  sender_avatar TEXT,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(30) NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sending', 'sent', 'delivered', 'read')),
  attachment_url TEXT,
  attachment_type VARCHAR(30),
  attachment_name VARCHAR(255),
  product JSONB,
  order_attachment JSONB,
  quick_replies JSONB NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_chat_msg_conv ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_msg_created ON chat_messages(created_at);

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
);

-- 16. Canned Responses Table (with unique shortcut)
CREATE TABLE IF NOT EXISTS canned_responses (
  id VARCHAR(50) PRIMARY KEY,
  shortcut VARCHAR(50) NOT NULL CONSTRAINT uq_canned_responses_shortcut UNIQUE,
  title VARCHAR(150) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100) NOT NULL
);

-- Record migration 001
INSERT INTO schema_migrations (version, name)
VALUES ('001', '001_initial_schema')
ON CONFLICT (version) DO NOTHING;
