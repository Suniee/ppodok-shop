-- products 테이블에 상품 상세 이미지 컬럼 추가
-- 상세 페이지 전용 이미지로, 카드 대표 이미지(images)와 분리 관리
-- 작성일: 2026-05-15
ALTER TABLE products ADD COLUMN detail_images text[] DEFAULT '{}';
