-- RLS 정책 재설정: anon은 읽기만, 쓰기는 service_role(서버)만 가능
-- 작성일: 2026-05-11
-- service_role은 RLS를 자동 우회하므로 쓰기 정책은 별도로 만들지 않는다.
-- 001_add_rls_policies.sql에서 만들어진 기존 정책이 있을 수 있으므로 먼저 제거한다.

-- ── categories ─────────────────────────────────────────────────────────────
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select"       ON categories;
DROP POLICY IF EXISTS "categories_insert"       ON categories;
DROP POLICY IF EXISTS "categories_update"       ON categories;
DROP POLICY IF EXISTS "categories_delete"       ON categories;
DROP POLICY IF EXISTS "categories_anon_select"  ON categories;

-- anon 포함 모든 사용자가 읽기 가능 (프론트 카테고리 목록에 필요)
CREATE POLICY "categories_anon_select" ON categories
    FOR SELECT USING (true);

-- ── products ────────────────────────────────────────────────────────────────
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_select"         ON products;
DROP POLICY IF EXISTS "products_insert"         ON products;
DROP POLICY IF EXISTS "products_update"         ON products;
DROP POLICY IF EXISTS "products_delete"         ON products;
DROP POLICY IF EXISTS "products_anon_select"    ON products;

CREATE POLICY "products_anon_select" ON products
    FOR SELECT USING (true);

-- ── product_categories ──────────────────────────────────────────────────────
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_categories_select"       ON product_categories;
DROP POLICY IF EXISTS "product_categories_insert"       ON product_categories;
DROP POLICY IF EXISTS "product_categories_update"       ON product_categories;
DROP POLICY IF EXISTS "product_categories_delete"       ON product_categories;
DROP POLICY IF EXISTS "product_categories_anon_select"  ON product_categories;

CREATE POLICY "product_categories_anon_select" ON product_categories
    FOR SELECT USING (true);
