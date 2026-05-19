-- customer_profiles에 약관 동의 정보 컬럼 추가
-- 작성일: 2026-05-19

ALTER TABLE commerce.customer_profiles
    ADD COLUMN IF NOT EXISTS terms_agreed_at     TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS privacy_agreed_at   TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS marketing_agreed    BOOLEAN     NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS marketing_agreed_at TIMESTAMPTZ;
