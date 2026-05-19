-- coupons 테이블에 상품 쿠폰 대상 상품 ID 목록 컬럼 추가
-- 작성일: 2026-05-16
-- type='product' 쿠폰에서 적용 가능한 상품 ID 배열. NULL이면 전체 상품 적용 가능.

ALTER TABLE commerce.coupons
    ADD COLUMN product_ids TEXT[] DEFAULT NULL;

COMMENT ON COLUMN commerce.coupons.product_ids IS 'type=product 쿠폰의 대상 상품 ID 목록. NULL이면 제한 없음.';
