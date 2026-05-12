-- toss_transactions 테이블에서 order_name 컬럼 제거
-- 작성일: 2026-05-13

ALTER TABLE public.toss_transactions DROP COLUMN IF EXISTS order_name;
