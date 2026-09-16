-- Remove the product classification added by 0002 without changing product rows.
-- D1 uses a modern SQLite version whose DROP COLUMN implementation preserves the
-- remaining table data, constraints, indexes, and referencing transaction rows.
ALTER TABLE products DROP COLUMN product_type;
