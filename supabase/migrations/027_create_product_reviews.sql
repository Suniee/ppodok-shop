-- 상품 리뷰 테이블 생성
-- 작성일: 2026-05-15
CREATE TABLE product_reviews (
    id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id  text        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name   text        NOT NULL DEFAULT '익명',
    rating      smallint    NOT NULL CHECK (rating BETWEEN 1 AND 5),
    content     text        NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_reviews_product_id ON product_reviews(product_id);

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- 누구나 조회 가능
CREATE POLICY "reviews_select" ON product_reviews
    FOR SELECT USING (true);

-- 로그인 사용자 본인 ID로만 작성
CREATE POLICY "reviews_insert" ON product_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 본인 리뷰만 삭제
CREATE POLICY "reviews_delete" ON product_reviews
    FOR DELETE USING (auth.uid() = user_id);
