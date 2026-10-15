-- ====================================================================
-- Malasban Lavashak Platform - Production Hardening Migration
-- Migration: 003_production_hardening.sql
-- ====================================================================

-- 1. Orders: Ensure coupon_id column exists with VARCHAR(50) FK to coupons(id) ON DELETE SET NULL and index
DO $$
DECLARE
  v_fk_valid BOOLEAN := FALSE;
  v_r RECORD;
  v_orphan_count INT := 0;
  v_index_exists BOOLEAN := FALSE;
BEGIN
  -- Add column if missing in current_schema()
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'orders'
      AND column_name = 'coupon_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN coupon_id VARCHAR(50);
    RAISE NOTICE 'Added column orders.coupon_id (VARCHAR(50)).';
  END IF;

  -- Verify whether an exact valid foreign key constraint exists:
  -- Must reference coupons(id) with ON DELETE SET NULL (confdeltype = 'n') in current_schema()
  SELECT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_class ft ON ft.oid = c.confrelid
    JOIN pg_namespace fn ON fn.oid = ft.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE t.relname = 'orders'
      AND n.nspname = current_schema()
      AND ft.relname = 'coupons'
      AND fn.nspname = current_schema()
      AND c.contype = 'f'
      AND a.attname = 'coupon_id'
      AND c.confdeltype = 'n'
  ) INTO v_fk_valid;

  -- Drop any obsolete/incorrect foreign key constraints specifically on orders.coupon_id
  IF NOT v_fk_valid THEN
    FOR v_r IN (
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
      WHERE t.relname = 'orders'
        AND n.nspname = current_schema()
        AND c.contype = 'f'
        AND a.attname = 'coupon_id'
    ) LOOP
      EXECUTE 'ALTER TABLE orders DROP CONSTRAINT ' || quote_ident(v_r.conname);
      RAISE NOTICE 'Dropped obsolete foreign key constraint % on orders.coupon_id.', v_r.conname;
    END LOOP;

    -- Safely resolve any orphaned coupon_id references before adding foreign key
    WITH orphans AS (
      SELECT id FROM orders
      WHERE coupon_id IS NOT NULL
        AND coupon_id NOT IN (SELECT id FROM coupons)
    )
    UPDATE orders
    SET coupon_id = NULL
    WHERE id IN (SELECT id FROM orphans);
    GET DIAGNOSTICS v_orphan_count = ROW_COUNT;
    IF v_orphan_count > 0 THEN
      RAISE NOTICE 'Resolved % orphaned coupon_id references to NULL in orders table.', v_orphan_count;
    END IF;

    -- Ensure constraint fk_orders_coupon_id is cleanly dropped if already present by name
    IF EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE t.relname = 'orders'
        AND n.nspname = current_schema()
        AND c.conname = 'fk_orders_coupon_id'
    ) THEN
      ALTER TABLE orders DROP CONSTRAINT fk_orders_coupon_id;
    END IF;

    -- Add the correct foreign key constraint
    ALTER TABLE orders
      ADD CONSTRAINT fk_orders_coupon_id
      FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added foreign key fk_orders_coupon_id referencing coupons(id) ON DELETE SET NULL.';
  END IF;

  -- Verify existing index coverage on orders(coupon_id)
  SELECT EXISTS (
    SELECT 1
    FROM pg_index i
    JOIN pg_class c ON c.oid = i.indrelid
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(i.indkey)
    WHERE c.relname = 'orders'
      AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = current_schema())
      AND a.attname = 'coupon_id'
      AND array_length(i.indkey, 1) = 1
  ) INTO v_index_exists;

  IF NOT v_index_exists THEN
    CREATE INDEX idx_orders_coupon_id ON orders(coupon_id);
    RAISE NOTICE 'Created index idx_orders_coupon_id on orders(coupon_id).';
  END IF;
END $$;

-- Safely and unambiguously backfill coupon_id from coupon_code
-- Match only when coupon_code uniquely identifies exactly one coupon
WITH unambiguous_coupons AS (
  SELECT code, MIN(id) AS single_coupon_id
  FROM coupons
  GROUP BY code
  HAVING COUNT(*) = 1
)
UPDATE orders o
SET coupon_id = uc.single_coupon_id
FROM unambiguous_coupons uc
WHERE o.coupon_code = uc.code
  AND o.coupon_id IS NULL;


-- 2. Addresses: Enforce Partial Unique Index for One Default Address Per User
-- Deduplicate: keep the most recently updated, then most recently created, with id as deterministic tie-breaker
DO $$
DECLARE
  v_dedup_count INT := 0;
  v_idx_correct BOOLEAN := FALSE;
  v_r RECORD;
BEGIN
  WITH ranked_defaults AS (
    SELECT id, user_id,
           ROW_NUMBER() OVER (
             PARTITION BY user_id
             ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id ASC
           ) AS rn
    FROM addresses
    WHERE is_default = TRUE
  )
  UPDATE addresses
  SET is_default = FALSE
  WHERE id IN (
    SELECT id FROM ranked_defaults WHERE rn > 1
  );
  GET DIAGNOSTICS v_dedup_count = ROW_COUNT;
  IF v_dedup_count > 0 THEN
    RAISE NOTICE 'Deduplicated default addresses: unset is_default on % secondary address(es).', v_dedup_count;
  END IF;

  -- Inspect whether a partial unique index already covers (user_id) WHERE is_default = TRUE
  FOR v_r IN (
    SELECT c.relname AS indexname, pg_get_indexdef(c.oid) AS indexdef, i.indisunique, i.indpred
    FROM pg_index i
    JOIN pg_class c ON c.oid = i.indexrelid
    JOIN pg_class t ON t.oid = i.indrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE t.relname = 'addresses'
      AND n.nspname = current_schema()
  ) LOOP
    IF v_r.indisunique = TRUE AND v_r.indpred IS NOT NULL AND v_r.indexdef ILIKE '%(user_id)%' AND v_r.indexdef ILIKE '%is_default%true%' THEN
      v_idx_correct := TRUE;
    ELSEIF v_r.indexname = 'idx_one_default_address_per_user' THEN
      -- Existing index with expected name has an incorrect definition; replace it safely
      EXECUTE 'DROP INDEX ' || quote_ident(v_r.indexname);
      RAISE NOTICE 'Dropped index % due to incorrect definition.', v_r.indexname;
    END IF;
  END LOOP;

  -- Drop legacy non-partial idx_addresses_default if present
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = current_schema()
      AND tablename = 'addresses'
      AND indexname = 'idx_addresses_default'
  ) THEN
    DROP INDEX idx_addresses_default;
    RAISE NOTICE 'Dropped legacy index idx_addresses_default.';
  END IF;

  IF NOT v_idx_correct THEN
    CREATE UNIQUE INDEX idx_one_default_address_per_user
    ON addresses(user_id)
    WHERE is_default = TRUE;
    RAISE NOTICE 'Created partial unique index idx_one_default_address_per_user on addresses(user_id) WHERE is_default = TRUE.';
  END IF;
END $$;


-- 3. Users: Safely migrate legacy is_super_admin authorization data if present
-- No hard-coded user IDs, emails, or automatic elevation.
-- If any user with role = 'Customer' has is_super_admin = TRUE, halt with a clear exception.
-- Promote legitimate staff accounts (role IN ('Admin', 'SuperAdmin')) to 'SuperAdmin'.
DO $$
DECLARE
  v_customer_flagged_count INT := 0;
  v_sample_ids TEXT;
  v_promoted_count INT := 0;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'users'
      AND column_name = 'is_super_admin'
  ) THEN
    -- Safety check: verify no non-administrative accounts (Customer) are flagged
    EXECUTE 'SELECT COUNT(*), string_agg(id, '', '') FROM users WHERE is_super_admin = TRUE AND role = ''Customer'''
    INTO v_customer_flagged_count, v_sample_ids;

    IF v_customer_flagged_count > 0 THEN
      RAISE EXCEPTION 'Safety check failed: found % user(s) with is_super_admin=TRUE but role=''Customer'' (User IDs: %). Manual verification required before removing is_super_admin column.',
        v_customer_flagged_count, v_sample_ids;
    END IF;

    -- Migrate legitimate administrator accounts (role IN ('Admin', 'SuperAdmin'))
    EXECUTE 'UPDATE users SET role = ''SuperAdmin'' WHERE is_super_admin = TRUE AND role != ''SuperAdmin''';
    GET DIAGNOSTICS v_promoted_count = ROW_COUNT;
    IF v_promoted_count > 0 THEN
      RAISE NOTICE 'Migrated % administrator account(s) with is_super_admin=TRUE to role=''SuperAdmin''.', v_promoted_count;
    END IF;

    -- Drop legacy column only after all records have been verified and handled
    ALTER TABLE users DROP COLUMN is_super_admin;
    RAISE NOTICE 'Dropped legacy column users.is_super_admin.';
  END IF;
END $$;


-- 4. Orders: Ensure Payment Status CHECK constraint supports Refunded & PartiallyRefunded
DO $$
DECLARE
  v_r RECORD;
  v_needs_replacement BOOLEAN := FALSE;
  v_invalid_count INT := 0;
BEGIN
  -- Inspect existing check constraints on orders.payment_status in current_schema()
  FOR v_r IN (
    SELECT c.conname, pg_get_constraintdef(c.oid) AS condef
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE t.relname = 'orders'
      AND n.nspname = current_schema()
      AND c.contype = 'c'
      AND a.attname = 'payment_status'
  ) LOOP
    -- If existing constraint already supports Refunded and PartiallyRefunded, keep it
    IF v_r.condef ILIKE '%Refunded%' AND v_r.condef ILIKE '%PartiallyRefunded%' THEN
      RAISE NOTICE 'Constraint % on orders.payment_status is already up to date.', v_r.conname;
    ELSE
      -- Only drop obsolete constraints that restrict payment_status
      EXECUTE 'ALTER TABLE orders DROP CONSTRAINT ' || quote_ident(v_r.conname);
      RAISE NOTICE 'Dropped obsolete constraint % on orders.payment_status.', v_r.conname;
      v_needs_replacement := TRUE;
    END IF;
  END LOOP;

  -- Also check if no payment_status check constraint exists at all
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE t.relname = 'orders'
      AND n.nspname = current_schema()
      AND c.contype = 'c'
      AND a.attname = 'payment_status'
  ) THEN
    v_needs_replacement := TRUE;
  END IF;

  IF v_needs_replacement THEN
    -- Verify no invalid payment_status values exist
    SELECT COUNT(*) INTO v_invalid_count
    FROM orders
    WHERE payment_status NOT IN ('Pending', 'Successful', 'Failed', 'Refunded', 'PartiallyRefunded');

    IF v_invalid_count > 0 THEN
      RAISE EXCEPTION 'Cannot add payment_status constraint: found % order(s) with invalid payment_status values.', v_invalid_count;
    END IF;

    -- Drop constraint orders_payment_status_check if already present by name
    IF EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE t.relname = 'orders'
        AND n.nspname = current_schema()
        AND c.conname = 'orders_payment_status_check'
    ) THEN
      ALTER TABLE orders DROP CONSTRAINT orders_payment_status_check;
    END IF;

    ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check
      CHECK (payment_status IN ('Pending', 'Successful', 'Failed', 'Refunded', 'PartiallyRefunded'));
    RAISE NOTICE 'Added updated check constraint orders_payment_status_check.';
  END IF;
END $$;


-- 5. Orders: Ensure Order Status CHECK constraint supports Returned
DO $$
DECLARE
  v_r RECORD;
  v_needs_replacement BOOLEAN := FALSE;
  v_invalid_count INT := 0;
BEGIN
  -- Inspect existing check constraints on orders.status in current_schema()
  FOR v_r IN (
    SELECT c.conname, pg_get_constraintdef(c.oid) AS condef
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE t.relname = 'orders'
      AND n.nspname = current_schema()
      AND c.contype = 'c'
      AND a.attname = 'status'
  ) LOOP
    -- If existing constraint already supports Returned, keep it
    IF v_r.condef ILIKE '%Returned%' THEN
      RAISE NOTICE 'Constraint % on orders.status is already up to date.', v_r.conname;
    ELSE
      -- Only drop obsolete constraints that restrict status
      EXECUTE 'ALTER TABLE orders DROP CONSTRAINT ' || quote_ident(v_r.conname);
      RAISE NOTICE 'Dropped obsolete constraint % on orders.status.', v_r.conname;
      v_needs_replacement := TRUE;
    END IF;
  END LOOP;

  -- Also check if no status check constraint exists at all
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE t.relname = 'orders'
      AND n.nspname = current_schema()
      AND c.contype = 'c'
      AND a.attname = 'status'
  ) THEN
    v_needs_replacement := TRUE;
  END IF;

  IF v_needs_replacement THEN
    -- Verify no invalid status values exist
    SELECT COUNT(*) INTO v_invalid_count
    FROM orders
    WHERE status NOT IN ('Pending', 'Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned');

    IF v_invalid_count > 0 THEN
      RAISE EXCEPTION 'Cannot add status constraint: found % order(s) with invalid status values.', v_invalid_count;
    END IF;

    -- Drop constraint orders_status_check if already present by name
    IF EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE t.relname = 'orders'
        AND n.nspname = current_schema()
        AND c.conname = 'orders_status_check'
    ) THEN
      ALTER TABLE orders DROP CONSTRAINT orders_status_check;
    END IF;

    ALTER TABLE orders ADD CONSTRAINT orders_status_check
      CHECK (status IN ('Pending', 'Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'));
    RAISE NOTICE 'Added updated check constraint orders_status_check.';
  END IF;
END $$;


-- 6. Canned Responses: Harden unique constraint on shortcut
DO $$
DECLARE
  v_dup_count INT;
  v_dup_shortcuts TEXT;
  v_has_unique BOOLEAN := FALSE;
BEGIN
  -- Check if ANY unique constraint or index already covers canned_responses(shortcut) in current_schema()
  SELECT EXISTS (
    SELECT 1
    FROM pg_index i
    JOIN pg_class c ON c.oid = i.indrelid
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(i.indkey)
    WHERE c.relname = 'canned_responses'
      AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = current_schema())
      AND i.indisunique = TRUE
      AND a.attname = 'shortcut'
      AND array_length(i.indkey, 1) = 1
  ) INTO v_has_unique;

  IF NOT v_has_unique THEN
    -- Check for existing duplicate non-null shortcuts before creating constraint
    SELECT COUNT(*), string_agg(shortcut || ' (' || cnt || ' times)', ', ')
    INTO v_dup_count, v_dup_shortcuts
    FROM (
      SELECT shortcut, COUNT(*) AS cnt
      FROM canned_responses
      WHERE shortcut IS NOT NULL
      GROUP BY shortcut
      HAVING COUNT(*) > 1
    ) dups;

    IF v_dup_count > 0 THEN
      RAISE EXCEPTION 'Cannot create unique constraint: duplicate shortcuts found in canned_responses: %', v_dup_shortcuts;
    END IF;

    -- Drop constraint uq_canned_responses_shortcut if already present by name
    IF EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE t.relname = 'canned_responses'
        AND n.nspname = current_schema()
        AND c.conname = 'uq_canned_responses_shortcut'
    ) THEN
      ALTER TABLE canned_responses DROP CONSTRAINT uq_canned_responses_shortcut;
    END IF;

    -- Add unique constraint
    ALTER TABLE canned_responses ADD CONSTRAINT uq_canned_responses_shortcut UNIQUE (shortcut);
    RAISE NOTICE 'Added unique constraint uq_canned_responses_shortcut on canned_responses(shortcut).';
  ELSE
    RAISE NOTICE 'Unique constraint/index on canned_responses(shortcut) already exists.';
  END IF;
END $$;


-- 7. Record migration in schema_migrations
INSERT INTO schema_migrations (version, name)
VALUES ('003', '003_production_hardening')
ON CONFLICT (version) DO NOTHING;
