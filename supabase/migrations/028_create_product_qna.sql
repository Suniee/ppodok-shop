-- 상품 Q&A 테이블 생성
-- 작성일: 2026-05-15
CREATE TABLE product_qna (
    id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id  text        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name   text        NOT NULL DEFAULT '익명',
    question    text        NOT NULL,
    answer      text,
    answered_at timestamptz,
    is_secret   boolean     NOT NULL DEFAULT false,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_qna_product_id ON product_qna(product_id);

ALTER TABLE product_qna ENABLE ROW LEVEL SECURITY;

-- 비밀글은 작성자만, 일반글은 누구나 조회
CREATE POLICY "qna_select" ON product_qna
    FOR SELECT USING (NOT is_secret OR auth.uid() = user_id);

-- 로그인 사용자 본인 ID로만 작성
CREATE POLICY "qna_insert" ON product_qna
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 본인 Q&A만 삭제
CREATE POLICY "qna_delete" ON product_qna
    FOR DELETE USING (auth.uid() = user_id);
