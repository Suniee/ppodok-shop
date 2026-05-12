-- orders.status CHECK 제약 조건에 'purchase_confirmed'(구매확정) 상태 추가
-- 작성일: 2026-05-13

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
    ADD CONSTRAINT orders_status_check
    CHECK (status IN ('pending', 'confirmed', 'completed', 'shipping', 'delivered', 'purchase_confirmed', 'cancelled'));
