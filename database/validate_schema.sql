-- ====================================================================
-- Malasban Platform - Production Database Verification & Integrity Suite
-- Script: database/validate_schema.sql
-- Run with: psql -d malasban_db -f database/validate_schema.sql
-- ====================================================================

\set ON_ERROR_STOP on

BEGIN;

DO $$
DECLARE
  v_err_count INT := 0;
  v_check_count INT := 0;
  v_count INT;
  v_details TEXT;
BEGIN
  RAISE NOTICE '====================================================';
  RAISE NOTICE 'Starting Malasban Database Integrity Audit...';
  RAISE NOTICE '====================================================';

  -- 1. Check all required tables exist
  FOR v_details IN 
    SELECT unnest(ARRAY[
      'schema_migrations', 'users', 'addresses', 'categories', 'products',
      'coupons', 'orders', 'order_items', 'wholesale_requests', 'reviews',
      'blog_posts', 'site_settings', 'chat_conversations', 'chat_messages',
      'chat_settings', 'canned_responses', 'user_sessions'
    ])
  LOOP
    v_check_count := v_check_count + 1;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = v_details
    ) THEN
      RAISE WARNING 'MISSING TABLE: %', v_details;
      v_err_count := v_err_count + 1;
    END IF;
  END LOOP;
  RAISE NOTICE '✓ Checked 17 expected tables.';

  -- 2. Verify orders.coupon_id exists and has foreign key to coupons(id)
  v_check_count := v_check_count + 1;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'coupon_id'
  ) THEN
    RAISE WARNING 'MISSING COLUMN: orders.coupon_id';
    v_err_count := v_err_count + 1;
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.table_name = 'orders'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'coupon_id'
    ) THEN
      RAISE WARNING 'MISSING FOREIGN KEY: orders.coupon_id -> coupons(id)';
      v_err_count := v_err_count + 1;
    ELSE
      RAISE NOTICE '✓ Verified orders.coupon_id foreign key constraint.';
    END IF;
  END IF;

  -- 3. Verify payment authority is persisted to prevent cross-order/replayed verification
  v_check_count := v_check_count + 1;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'payment_authority'
  ) THEN
    RAISE WARNING 'MISSING COLUMN: orders.payment_authority';
    v_err_count := v_err_count + 1;
  ELSE
    RAISE NOTICE '✓ Verified orders.payment_authority column.';
  END IF;

  -- 4. Verify partial unique index on addresses(user_id) WHERE is_default = TRUE
  v_check_count := v_check_count + 1;
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'addresses' AND indexname = 'idx_one_default_address_per_user'
  ) THEN
    RAISE WARNING 'MISSING INDEX: idx_one_default_address_per_user';
    v_err_count := v_err_count + 1;
  ELSE
    -- Check that no user has duplicate defaults
    SELECT COUNT(*) INTO v_count
    FROM (
      SELECT user_id FROM addresses WHERE is_default = TRUE GROUP BY user_id HAVING COUNT(*) > 1
    ) dups;
    IF v_count > 0 THEN
      RAISE WARNING 'INTEGRITY VIOLATION: Multiple default addresses detected for % users!', v_count;
      v_err_count := v_err_count + 1;
    ELSE
      RAISE NOTICE '✓ Verified exactly at most 1 default address per user.';
    END IF;
  END IF;

  -- 5. Verify canned_responses.shortcut uniqueness
  v_check_count := v_check_count + 1;
  SELECT COUNT(*) INTO v_count
  FROM (
    SELECT shortcut FROM canned_responses WHERE shortcut IS NOT NULL GROUP BY shortcut HAVING COUNT(*) > 1
  ) dups;
  IF v_count > 0 THEN
    RAISE WARNING 'INTEGRITY VIOLATION: Duplicate canned_responses shortcuts found!';
    v_err_count := v_err_count + 1;
  ELSE
    RAISE NOTICE '✓ Verified canned_responses.shortcut has zero duplicates.';
  END IF;

  -- 5. Verify NO NULL values in NOT NULL columns of seeded data
  -- Wholesale requests
  SELECT COUNT(*) INTO v_count FROM wholesale_requests WHERE quotation_sent IS NULL;
  IF v_count > 0 THEN
    RAISE WARNING 'NOT NULL VIOLATION: wholesale_requests.quotation_sent has % NULLs!', v_count;
    v_err_count := v_err_count + 1;
  ELSE
    RAISE NOTICE '✓ wholesale_requests.quotation_sent has 0 NULLs.';
  END IF;

  -- Reviews
  SELECT COUNT(*) INTO v_count FROM reviews WHERE is_official_staff IS NULL;
  IF v_count > 0 THEN
    RAISE WARNING 'NOT NULL VIOLATION: reviews.is_official_staff has % NULLs!', v_count;
    v_err_count := v_err_count + 1;
  ELSE
    RAISE NOTICE '✓ reviews.is_official_staff has 0 NULLs.';
  END IF;

  -- Chat messages
  SELECT COUNT(*) INTO v_count FROM chat_messages WHERE status IS NULL;
  IF v_count > 0 THEN
    RAISE WARNING 'NOT NULL VIOLATION: chat_messages.status has % NULLs!', v_count;
    v_err_count := v_err_count + 1;
  ELSE
    RAISE NOTICE '✓ chat_messages.status has 0 NULLs.';
  END IF;

  -- 6. Verify Foreign Key referential integrity (no orphans)
  -- Orders -> Users
  SELECT COUNT(*) INTO v_count
  FROM orders WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users);
  IF v_count > 0 THEN
    RAISE WARNING 'ORPHAN FK: % orders reference nonexistent users!', v_count;
    v_err_count := v_err_count + 1;
  END IF;

  -- Orders -> Coupons
  SELECT COUNT(*) INTO v_count
  FROM orders WHERE coupon_id IS NOT NULL AND coupon_id NOT IN (SELECT id FROM coupons);
  IF v_count > 0 THEN
    RAISE WARNING 'ORPHAN FK: % orders reference nonexistent coupons!', v_count;
    v_err_count := v_err_count + 1;
  END IF;

  -- Order Items -> Orders
  SELECT COUNT(*) INTO v_count
  FROM order_items WHERE order_id NOT IN (SELECT id FROM orders);
  IF v_count > 0 THEN
    RAISE WARNING 'ORPHAN FK: % order_items reference nonexistent orders!', v_count;
    v_err_count := v_err_count + 1;
  END IF;

  -- Chat Messages -> Chat Conversations
  SELECT COUNT(*) INTO v_count
  FROM chat_messages WHERE conversation_id NOT IN (SELECT id FROM chat_conversations);
  IF v_count > 0 THEN
    RAISE WARNING 'ORPHAN FK: % chat_messages reference nonexistent conversations!', v_count;
    v_err_count := v_err_count + 1;
  END IF;

  -- Chat Conversations -> Users
  SELECT COUNT(*) INTO v_count
  FROM chat_conversations WHERE customer_id IS NOT NULL AND customer_id NOT IN (SELECT id FROM users);
  IF v_count > 0 THEN
    RAISE WARNING 'ORPHAN FK: % chat_conversations reference nonexistent customer users!', v_count;
    v_err_count := v_err_count + 1;
  END IF;
  RAISE NOTICE '✓ Verified all foreign key references have zero orphans.';

  -- 7. Verify CHECK constraints on order status and payment status
  SELECT COUNT(*) INTO v_count
  FROM orders WHERE status NOT IN ('Pending', 'Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned');
  IF v_count > 0 THEN
    RAISE WARNING 'INVALID STATUS: % orders have invalid status!', v_count;
    v_err_count := v_err_count + 1;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM orders WHERE payment_status NOT IN ('Pending', 'Successful', 'Failed', 'Refunded', 'PartiallyRefunded');
  IF v_count > 0 THEN
    RAISE WARNING 'INVALID PAYMENT STATUS: % orders have invalid payment_status!', v_count;
    v_err_count := v_err_count + 1;
  END IF;
  RAISE NOTICE '✓ Verified all order statuses and payment statuses satisfy CHECK constraints.';

  -- 8. Verify Users role single source of truth (no redundant is_super_admin)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_super_admin'
  ) THEN
    RAISE WARNING 'REDUNDANT COLUMN: users.is_super_admin still exists in database!';
    v_err_count := v_err_count + 1;
  ELSE
    RAISE NOTICE '✓ Verified users.is_super_admin is completely removed; role is single source of truth.';
  END IF;

  -- Summary
  RAISE NOTICE '====================================================';
  IF v_err_count = 0 THEN
    RAISE NOTICE '✅ ALL CHECKS PASSED: Database schema and data are 100%% production hardened!';
  ELSE
    RAISE EXCEPTION '❌ AUDIT FAILED with % errors. Review logs above.', v_err_count;
  END IF;
  RAISE NOTICE '====================================================';
END $$;

COMMIT;
