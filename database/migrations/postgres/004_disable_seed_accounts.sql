-- Disable accounts created with public, fixed seed credentials.
-- Create/rotate the real administrator using `npm run db:bootstrap-admin`.
UPDATE users
SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
WHERE id IN ('usr-admin-01', 'usr-demo-02', 'usr-staff-01', 'usr-customer-01')
   OR email IN ('admin@malasban.ir', 'user@malasban.ir', 'staff@malasban.ir', 'fatemeh@example.com');
