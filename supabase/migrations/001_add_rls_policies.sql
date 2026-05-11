-- categories, products, product_categories 테이블 RLS 정책 추가
-- 작성일: 2026-05-11
-- 현재 Auth 미구현 상태이므로 anon 역할에 전체 CRUD 허용.
-- 추후 Auth 도입 시 정책을 역할 기반으로 교체한다.

-- ── categories ─────────────────────────────────────────────────────────────
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select" ON categories
  FOR SELECT USING (true);

CREATE POLICY "categories_insert" ON categories
  FOR INSERT WITH CHECK (true);

CREATE POLICY "categories_update" ON categories
  FOR UPDATE USING (true);

CREATE POLICY "categories_delete" ON categories
  FOR DELETE USING (true);

-- ── products ────────────────────────────────────────────────────────────────
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_select" ON products
  FOR SELECT USING (true);

CREATE POLICY "products_insert" ON products
  FOR INSERT WITH CHECK (true);

CREATE POLICY "products_update" ON products
  FOR UPDATE USING (true);

CREATE POLICY "products_delete" ON products
  FOR DELETE USING (true);

-- ── product_categories ──────────────────────────────────────────────────────
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_categories_select" ON product_categories
  FOR SELECT USING (true);

CREATE POLICY "product_categories_insert" ON product_categories
  FOR INSERT WITH CHECK (true);

CREATE POLICY "product_categories_update" ON product_categories
  FOR UPDATE USING (true);

CREATE POLICY "product_categories_delete" ON product_categories
  FOR DELETE USING (true);
