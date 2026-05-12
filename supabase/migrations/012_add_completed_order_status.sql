-- orders.status CHECK 제약 조건에 'completed'(주문완료) 상태 추가
-- 작성일: 2026-05-13

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
    ADD CONSTRAINT orders_status_check
    CHECK (status IN ('pending', 'confirmed', 'shipping', 'delivered', 'completed', 'cancelled'));
