ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_authority VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_orders_payment_authority ON orders(payment_authority);
