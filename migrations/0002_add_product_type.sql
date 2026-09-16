-- Add a product classification and populate the existing demonstration products.
ALTER TABLE products
  ADD COLUMN product_type TEXT NOT NULL DEFAULT 'その他'
  CHECK (product_type IN ('文具', '電子機器', '日用品', '消耗品', '備品', '食品', 'その他'));

UPDATE products
SET product_type = CASE
  WHEN id BETWEEN 1 AND 20 THEN '文具'
  WHEN id BETWEEN 21 AND 24 THEN '備品'
  WHEN id BETWEEN 25 AND 30 THEN '電子機器'
  WHEN id BETWEEN 31 AND 32 THEN '消耗品'
  WHEN id BETWEEN 33 AND 34 THEN '電子機器'
  WHEN id BETWEEN 35 AND 45 THEN '日用品'
  WHEN id = 46 THEN '消耗品'
  WHEN id BETWEEN 47 AND 49 THEN '食品'
  WHEN id = 50 THEN '備品'
  ELSE 'その他'
END;
