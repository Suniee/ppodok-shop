-- 쿠폰 마스터 테이블 및 사용자 발급 쿠폰 테이블 생성
-- 작성일: 2026-05-16

-- 쿠폰 마스터: 어드민이 생성하는 쿠폰 정의
CREATE TABLE commerce.coupons (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    code                TEXT        NOT NULL UNIQUE,
    name                TEXT        NOT NULL,
    -- type: product(단일 상품 적용), cart(주문 전체 적용)
    type                TEXT        NOT NULL CHECK (type IN ('product', 'cart')),
    -- discount_type: fixed(정액), rate(정률 %)
    discount_type       TEXT        NOT NULL CHECK (discount_type IN ('fixed', 'rate')),
    discount_value      INTEGER     NOT NULL CHECK (discount_value > 0),
    min_order_amount    INTEGER     NOT NULL DEFAULT 0,
    -- 정률 쿠폰의 최대 할인 상한액 (NULL = 제한 없음)
    max_discount_amount INTEGER,
    valid_from          TIMESTAMPTZ NOT NULL,
    valid_until         TIMESTAMPTZ NOT NULL,
    -- 전체 발급 가능 횟수 (NULL = 무제한)
    usage_limit         INTEGER,
    usage_count         INTEGER     NOT NULL DEFAULT 0,
    is_active           BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 사용자 발급 쿠폰: 어드민이 특정 고객에게 발급한 쿠폰 인스턴스
CREATE TABLE commerce.user_coupons (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES auth.users(id)       ON DELETE CASCADE,
    coupon_id   UUID        NOT NULL REFERENCES commerce.coupons(id) ON DELETE CASCADE,
    issued_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    used_at     TIMESTAMPTZ,
    -- 사용된 주문 (사용 후 연결)
    order_id    UUID        REFERENCES commerce.orders(id) ON DELETE SET NULL,
    is_used     BOOLEAN     NOT NULL DEFAULT FALSE
);

ALTER TABLE commerce.coupons      ENABLE ROW LEVEL SECURITY;
ALTER TABLE commerce.user_coupons ENABLE ROW LEVEL SECURITY;

-- 로그인 사용자는 쿠폰 목록 읽기 가능 (발급 여부 확인용)
CREATE POLICY "coupons_select_authenticated"
    ON commerce.coupons FOR SELECT TO authenticated USING (true);

-- 발급된 쿠폰은 본인 것만 조회 가능
CREATE POLICY "user_coupons_select_own"
    ON commerce.user_coupons FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
