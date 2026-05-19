-- orders, order_items 테이블에 쿠폰 할인 컬럼 추가
-- 작성일: 2026-05-16

-- 장바구니 쿠폰 (주문 전체 할인)
ALTER TABLE commerce.orders
    ADD COLUMN cart_coupon_id UUID    REFERENCES commerce.user_coupons(id) ON DELETE SET NULL,
    ADD COLUMN cart_discount  INTEGER NOT NULL DEFAULT 0;

-- 상품 쿠폰 (개별 상품 할인)
ALTER TABLE commerce.order_items
    ADD COLUMN user_coupon_id  UUID    REFERENCES commerce.user_coupons(id) ON DELETE SET NULL,
    ADD COLUMN coupon_discount INTEGER NOT NULL DEFAULT 0;
