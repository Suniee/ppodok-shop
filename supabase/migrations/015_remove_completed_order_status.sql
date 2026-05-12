-- orders.status CHECK 제약 조건에서 'completed'(주문완료) 상태 제거
-- 작성일: 2026-05-13

-- 기존 completed 상태 주문을 confirmed로 일괄 변경 (안전한 마이그레이션)
UPDATE orders SET status = 'confirmed' WHERE status = 'completed';

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
    ADD CONSTRAINT orders_status_check
    CHECK (status IN ('pending', 'confirmed', 'shipping', 'delivered', 'purchase_confirmed', 'review_written', 'cancelled'));
