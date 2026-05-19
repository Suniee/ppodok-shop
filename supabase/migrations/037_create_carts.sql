-- 장바구니 테이블 생성
-- 작성일: 2026-05-19
-- 로그인 사용자의 장바구니를 DB에 저장한다. 비로그인은 localStorage 유지.

CREATE TABLE IF NOT EXISTS commerce.carts (
    id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id  TEXT        NOT NULL REFERENCES commerce.products(id) ON DELETE CASCADE,
    quantity    INT         NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, product_id)
);

-- 본인 장바구니만 접근 가능
ALTER TABLE commerce.carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "carts_select_own" ON commerce.carts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "carts_insert_own" ON commerce.carts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "carts_update_own" ON commerce.carts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "carts_delete_own" ON commerce.carts
    FOR DELETE USING (auth.uid() = user_id);
