-- coupons 테이블에 카테고리 쿠폰 대상 카테고리 ID 목록 컬럼 추가
-- 작성일: 2026-05-16
-- type='product' 쿠폰에서 product_ids(상품 지정) 또는 category_ids(카테고리 지정) 중 하나를 사용.
-- 둘 다 NULL이면 전체 상품 적용.

ALTER TABLE commerce.coupons
    ADD COLUMN category_ids INTEGER[] DEFAULT NULL;

COMMENT ON COLUMN commerce.coupons.category_ids IS 'type=product 쿠폰의 대상 카테고리 ID 목록. product_ids와 배타적으로 사용. NULL이면 제한 없음.';
