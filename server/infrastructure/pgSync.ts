import { Pool, PoolClient } from 'pg';
import { DatabaseSchema } from './db.js';
import { createPgPool } from './dbMigrator.js';

let pool: Pool | null = null;
let isConnected = false;

export function getPgPool(): Pool {
  if (!pool) {
    pool = createPgPool();
  }
  return pool;
}

export async function checkPgConnection(): Promise<boolean> {
  const p = getPgPool();
  try {
    const client = await p.connect();
    try {
      await client.query('SELECT 1');
      isConnected = true;
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    isConnected = false;
    return false;
  }
}

/**
 * Synchronize full DatabaseSchema to Normalized PostgreSQL tables
 */
export async function syncSchemaToPostgres(data: DatabaseSchema): Promise<{ success: boolean; error?: string }> {
  const p = getPgPool();
  let client: PoolClient | null = null;
  try {
    client = await p.connect();
    await client.query('BEGIN');

    // 1. Categories
    for (const c of data.categories) {
      await client.query(
        `INSERT INTO categories (id, name, slug, description, image_url, display_order, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           slug = EXCLUDED.slug,
           description = EXCLUDED.description,
           image_url = EXCLUDED.image_url,
           display_order = EXCLUDED.display_order,
           is_active = EXCLUDED.is_active`,
        [c.id, c.name, c.slug, c.description, c.imageUrl || null, c.displayOrder, c.isActive]
      );
    }

    // 2. Users (Without addresses JSON and without redundant is_super_admin)
    for (const u of data.users) {
      const role = u.role || 'Customer';
      await client.query(
        `INSERT INTO users (id, name, family, email, mobile, password_hash, salt, role, permissions, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           family = EXCLUDED.family,
           email = EXCLUDED.email,
           mobile = EXCLUDED.mobile,
           password_hash = EXCLUDED.password_hash,
           salt = EXCLUDED.salt,
           role = EXCLUDED.role,
           permissions = EXCLUDED.permissions,
           is_active = EXCLUDED.is_active,
           updated_at = EXCLUDED.updated_at`,
        [
          u.id,
          u.name,
          u.family,
          u.email,
          u.mobile,
          u.passwordHash,
          u.salt,
          role,
          JSON.stringify(u.permissions || []),
          u.isActive,
          u.createdAt,
          u.updatedAt,
        ]
      );

      // 3. Normalized User Addresses
      if (Array.isArray(u.addresses)) {
        for (const a of u.addresses) {
          await client.query(
            `INSERT INTO addresses (id, user_id, title, recipient_name, mobile, province, city, address, postal_code, plaque, unit, is_default, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             ON CONFLICT (id) DO UPDATE SET
               title = EXCLUDED.title,
               recipient_name = EXCLUDED.recipient_name,
               mobile = EXCLUDED.mobile,
               province = EXCLUDED.province,
               city = EXCLUDED.city,
               address = EXCLUDED.address,
               postal_code = EXCLUDED.postal_code,
               is_default = EXCLUDED.is_default,
               updated_at = CURRENT_TIMESTAMP`,
            [
              a.id,
              u.id,
              a.title,
              a.receiverName,
              a.receiverMobile,
              a.province,
              a.city,
              a.fullAddress,
              a.postalCode,
              a.plaque || '۱۲',
              a.unit || '۴',
              a.isDefault || false,
            ]
          );
        }
      }
    }

    // 4. Products (Without redundant category_name)
    const productSkuMap: Record<string, string> = {};
    for (const prod of data.products) {
      productSkuMap[prod.id] = prod.sku;
      await client.query(
        `INSERT INTO products (id, name, slug, sku, category_id, short_description, description, price, discount_price, stock_quantity, weight_grams, pieces_per_pack, images, main_image, sourness_level, ingredients, nutritional_facts, rating, review_count, is_featured, is_best_seller, is_new, is_wholesale_available, min_wholesale_qty, wholesale_unit_price, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           slug = EXCLUDED.slug,
           price = EXCLUDED.price,
           discount_price = EXCLUDED.discount_price,
           stock_quantity = EXCLUDED.stock_quantity,
           is_active = EXCLUDED.is_active,
           updated_at = EXCLUDED.updated_at`,
        [
          prod.id,
          prod.name,
          prod.slug,
          prod.sku,
          prod.categoryId,
          prod.shortDescription,
          prod.description,
          prod.price,
          prod.discountPrice || null,
          prod.stockQuantity,
          prod.weightGrams,
          prod.piecesPerPack || 1,
          JSON.stringify(prod.images || []),
          prod.mainImage,
          prod.sournessLevel,
          JSON.stringify(prod.ingredients || []),
          JSON.stringify(prod.nutritionalFacts || {}),
          prod.rating,
          prod.reviewCount,
          prod.isFeatured,
          prod.isBestSeller,
          prod.isNew,
          prod.isWholesaleAvailable,
          prod.minWholesaleQty || null,
          prod.wholesaleUnitPrice || null,
          prod.isActive,
          prod.createdAt,
          prod.updatedAt,
        ]
      );
    }

    // 5. Coupons (Inserted before Orders to satisfy foreign key dependency)
    for (const c of data.coupons) {
      await client.query(
        `INSERT INTO coupons (id, code, type, value, min_order_amount, max_discount_amount, usage_limit, used_count, start_date, end_date, is_active, first_order_only)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO UPDATE SET
           value = EXCLUDED.value,
           usage_limit = EXCLUDED.usage_limit,
           used_count = EXCLUDED.used_count,
           is_active = EXCLUDED.is_active`,
        [
          c.id,
          c.code,
          c.type,
          c.value,
          c.minOrderAmount,
          c.maxDiscountAmount || null,
          c.usageLimit,
          c.usedCount,
          c.startDate,
          c.endDate,
          c.isActive,
          c.firstOrderOnly || false,
        ]
      );
    }

    // 6. Orders (Without items JSONB, with coupon_id FK)
    for (const o of data.orders) {
      await client.query(
        `INSERT INTO orders (id, order_number, user_id, customer_name, customer_mobile, customer_email, shipping_address, shipping_method, shipping_fee, subtotal, discount_amount, coupon_id, coupon_code, total_amount, status, payment_status, payment_method, payment_ref_id, customer_notes, admin_notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
         ON CONFLICT (id) DO UPDATE SET
           coupon_id = EXCLUDED.coupon_id,
           status = EXCLUDED.status,
           payment_status = EXCLUDED.payment_status,
           updated_at = EXCLUDED.updated_at`,
        [
          o.id,
          o.orderNumber,
          o.userId || null,
          o.customerName,
          o.customerMobile,
          o.customerEmail || null,
          JSON.stringify(o.shippingAddress),
          o.shippingMethod,
          o.shippingFee,
          o.subtotal,
          o.discountAmount,
          o.couponId || null,
          o.couponCode || null,
          o.totalAmount,
          o.status,
          o.paymentStatus,
          o.paymentMethod,
          o.paymentRefId || null,
          o.customerNotes || null,
          o.adminNotes || null,
          o.createdAt,
          o.updatedAt,
        ]
      );

      // 7. Normalized Order Items Table
      if (Array.isArray(o.items)) {
        for (const item of o.items) {
          const sku = productSkuMap[item.productId] || 'MLB-ITEM';
          await client.query(
            `INSERT INTO order_items (id, order_id, product_id, product_name, sku, product_image, weight_grams, quantity, unit_price, discount_amount, total_price)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             ON CONFLICT (id) DO UPDATE SET
               quantity = EXCLUDED.quantity,
               unit_price = EXCLUDED.unit_price,
               total_price = EXCLUDED.total_price`,
            [
              item.id,
              o.id,
              item.productId,
              item.productName,
              sku,
              item.productImage || null,
              item.weightGrams || null,
              item.quantity,
              item.unitPrice,
              0,
              item.totalPrice,
            ]
          );
        }
      }
    }

    // 8. Wholesale Requests
    if (Array.isArray(data.wholesaleRequests)) {
      for (const w of data.wholesaleRequests) {
        await client.query(
          `INSERT INTO wholesale_requests (id, tracking_code, applicant_name, company_name, mobile, email, province, city, business_type, requested_products, estimated_quantity_kg, description, status, admin_notes, offered_price_per_kg, quotation_sent, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
           ON CONFLICT (id) DO UPDATE SET
             tracking_code = EXCLUDED.tracking_code,
             applicant_name = EXCLUDED.applicant_name,
             company_name = EXCLUDED.company_name,
             mobile = EXCLUDED.mobile,
             email = EXCLUDED.email,
             province = EXCLUDED.province,
             city = EXCLUDED.city,
             business_type = EXCLUDED.business_type,
             requested_products = EXCLUDED.requested_products,
             estimated_quantity_kg = EXCLUDED.estimated_quantity_kg,
             description = EXCLUDED.description,
             status = EXCLUDED.status,
             admin_notes = EXCLUDED.admin_notes,
             offered_price_per_kg = EXCLUDED.offered_price_per_kg,
             quotation_sent = EXCLUDED.quotation_sent,
             updated_at = EXCLUDED.updated_at`,
          [
            w.id,
            w.trackingCode,
            w.applicantName,
            w.companyName,
            w.mobile,
            w.email || null,
            w.province,
            w.city,
            w.businessType,
            w.requestedProducts,
            w.estimatedQuantityKg,
            w.description || null,
            w.status,
            w.adminNotes || null,
            w.offeredPricePerKg || null,
            w.quotationSent ?? false,
            w.createdAt,
            w.updatedAt,
          ]
        );
      }
    }

    // 9. Reviews (Normalized: without product_name, user_name)
    for (const r of data.reviews) {
      const userId = r.userId || 'usr-demo-02';
      await client.query(
        `INSERT INTO reviews (id, product_id, user_id, rating, comment, is_approved, is_official_staff, admin_reply, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           rating = EXCLUDED.rating,
           comment = EXCLUDED.comment,
           is_approved = EXCLUDED.is_approved,
           admin_reply = EXCLUDED.admin_reply`,
        [
          r.id,
          r.productId,
          userId,
          r.rating,
          r.comment,
          r.isApproved,
          r.isOfficialStaff || false,
          r.adminReply || null,
          r.createdAt,
        ]
      );
    }

    // 10. Blog Posts
    if (Array.isArray(data.blogPosts)) {
      for (const b of data.blogPosts) {
        await client.query(
          `INSERT INTO blog_posts (id, title, slug, summary, content, featured_image, category, tags, author, read_time_minutes, is_published, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title,
             slug = EXCLUDED.slug,
             summary = EXCLUDED.summary,
             content = EXCLUDED.content,
             featured_image = EXCLUDED.featured_image,
             category = EXCLUDED.category,
             tags = EXCLUDED.tags,
             author = EXCLUDED.author,
             read_time_minutes = EXCLUDED.read_time_minutes,
             is_published = EXCLUDED.is_published,
             updated_at = EXCLUDED.updated_at`,
          [
            b.id,
            b.title,
            b.slug,
            b.summary,
            b.content,
            b.featuredImage || null,
            b.category,
            JSON.stringify(b.tags || []),
            b.author,
            b.readTimeMinutes || 5,
            b.isPublished ?? true,
            b.createdAt,
            b.updatedAt,
          ]
        );
      }
    }

    // 11. Site Settings
    const s = data.settings;
    await client.query(
      `INSERT INTO site_settings (id, brand_name, tagline, support_phone, support_phone2, support_mobile, sales_mobile, wholesale_phone, support_email, address, factory_address, working_hours, instagram, telegram, whatsapp, announcement_bar_text, announcement_bar_link, is_announcement_active, hero_title, hero_subtitle, hero_badge, hero_image_url, promo_banner_title, promo_banner_text, promo_banner_discount, promo_banner_image_url, free_shipping_threshold, standard_shipping_fee, wholesale_min_order_kg, wholesale_tiers, faqs, updated_at)
       VALUES ('default', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET
         brand_name = EXCLUDED.brand_name,
         tagline = EXCLUDED.tagline,
         support_phone = EXCLUDED.support_phone,
         support_mobile = EXCLUDED.support_mobile,
         support_email = EXCLUDED.support_email,
         free_shipping_threshold = EXCLUDED.free_shipping_threshold,
         standard_shipping_fee = EXCLUDED.standard_shipping_fee,
         updated_at = CURRENT_TIMESTAMP`,
      [
        s.brandName,
        s.tagline,
        s.supportPhone,
        s.supportPhone2 || null,
        s.supportMobile,
        s.salesMobile || null,
        s.wholesalePhone || null,
        s.supportEmail,
        s.address,
        s.factoryAddress || null,
        s.workingHours,
        s.instagram,
        s.telegram,
        s.whatsapp,
        s.announcementBarText || null,
        s.announcementBarLink || null,
        s.isAnnouncementActive ?? true,
        s.heroTitle || null,
        s.heroSubtitle || null,
        s.heroBadge || null,
        s.heroImageUrl || null,
        s.promoBannerTitle || null,
        s.promoBannerText || null,
        s.promoBannerDiscount || null,
        s.promoBannerImageUrl || null,
        s.freeShippingThreshold,
        s.standardShippingFee,
        s.wholesaleMinOrderKg,
        JSON.stringify(s.wholesaleTiers || []),
        JSON.stringify(s.faqs || []),
      ]
    );

    // 12. Chat Conversations
    if (Array.isArray(data.chatConversations)) {
      for (const conv of data.chatConversations) {
        await client.query(
          `INSERT INTO chat_conversations (id, customer_id, guest_id, customer_name, customer_mobile, customer_email, assigned_agent_id, assigned_agent_name, status, priority, tags, unread_customer_count, unread_agent_count, last_message_text, last_message_time, last_sender, rating, feedback, summary, context_product, internal_notes, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
           ON CONFLICT (id) DO UPDATE SET
             customer_id = EXCLUDED.customer_id,
             guest_id = EXCLUDED.guest_id,
             customer_name = EXCLUDED.customer_name,
             customer_mobile = EXCLUDED.customer_mobile,
             customer_email = EXCLUDED.customer_email,
             assigned_agent_id = EXCLUDED.assigned_agent_id,
             assigned_agent_name = EXCLUDED.assigned_agent_name,
             status = EXCLUDED.status,
             priority = EXCLUDED.priority,
             tags = EXCLUDED.tags,
             unread_customer_count = EXCLUDED.unread_customer_count,
             unread_agent_count = EXCLUDED.unread_agent_count,
             last_message_text = EXCLUDED.last_message_text,
             last_message_time = EXCLUDED.last_message_time,
             last_sender = EXCLUDED.last_sender,
             rating = EXCLUDED.rating,
             feedback = EXCLUDED.feedback,
             summary = EXCLUDED.summary,
             context_product = EXCLUDED.context_product,
             internal_notes = EXCLUDED.internal_notes,
             updated_at = EXCLUDED.updated_at`,
          [
            conv.id,
            conv.customerId || null,
            conv.guestId || null,
            conv.customerName,
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
            conv.lastMessageTime || null,
            conv.lastSender || 'customer',
            conv.rating || null,
            conv.feedback || null,
            conv.summary || null,
            conv.contextProduct ? JSON.stringify(conv.contextProduct) : null,
            conv.internalNotes || null,
            conv.createdAt,
            conv.updatedAt,
          ]
        );
      }
    }

    // 13. Chat Messages
    if (Array.isArray(data.chatMessages)) {
      for (const msg of data.chatMessages) {
        await client.query(
          `INSERT INTO chat_messages (id, conversation_id, sender, sender_name, sender_avatar, text, created_at, status, attachment_url, attachment_type, attachment_name, product, order_attachment, quick_replies)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           ON CONFLICT (id) DO UPDATE SET
             sender = EXCLUDED.sender,
             sender_name = EXCLUDED.sender_name,
             sender_avatar = EXCLUDED.sender_avatar,
             text = EXCLUDED.text,
             status = EXCLUDED.status,
             attachment_url = EXCLUDED.attachment_url,
             attachment_type = EXCLUDED.attachment_type,
             attachment_name = EXCLUDED.attachment_name,
             product = EXCLUDED.product,
             order_attachment = EXCLUDED.order_attachment,
             quick_replies = EXCLUDED.quick_replies`,
          [
            msg.id,
            msg.conversationId,
            msg.sender,
            msg.senderName,
            msg.senderAvatar || null,
            msg.text,
            msg.createdAt,
            msg.status || 'sent',
            msg.attachmentUrl || null,
            msg.attachmentType || null,
            msg.attachmentName || null,
            msg.product ? JSON.stringify(msg.product) : null,
            msg.order ? JSON.stringify(msg.order) : null,
            JSON.stringify(msg.quickReplies || []),
          ]
        );
      }
    }

    // 14. Chat Settings
    const cs = data.chatSettings;
    await client.query(
      `INSERT INTO chat_settings (id, is_online, working_hours_start, working_hours_end, auto_welcome_message, offline_message, exit_intent_message, enable_sound_notifications, enable_ai_assistant, operator_name, operator_title)
       VALUES ('default', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET
         is_online = EXCLUDED.is_online,
         auto_welcome_message = EXCLUDED.auto_welcome_message,
         offline_message = EXCLUDED.offline_message,
         working_hours_start = EXCLUDED.working_hours_start,
         working_hours_end = EXCLUDED.working_hours_end`,
      [
        cs.isOnline,
        cs.workingHoursStart,
        cs.workingHoursEnd,
        cs.autoWelcomeMessage,
        cs.offlineMessage,
        cs.exitIntentMessage,
        cs.enableSoundNotifications,
        cs.enableAiAssistant,
        cs.operatorName,
        cs.operatorTitle,
      ]
    );

    // 15. Canned Responses
    if (Array.isArray(data.cannedResponses)) {
      for (const cr of data.cannedResponses) {
        await client.query(
          `INSERT INTO canned_responses (id, shortcut, title, content, category)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO UPDATE SET
             shortcut = EXCLUDED.shortcut,
             title = EXCLUDED.title,
             content = EXCLUDED.content,
             category = EXCLUDED.category`,
          [cr.id, cr.shortcut, cr.title, cr.content, cr.category]
        );
      }
    }

    await client.query('COMMIT');
    return { success: true };
  } catch (err: any) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    return { success: false, error: err.message || String(err) };
  } finally {
    if (client) client.release();
  }
}
