-- 개발 환경용 RLS 비활성화
-- 작성일: 2026-05-11
-- Auth 미구현 상태에서 anon key로 CRUD가 가능하도록 RLS를 끈다.
-- 추후 Auth 도입 시 RLS 재활성화 + 역할 기반 정책으로 교체한다.

ALTER TABLE categories        DISABLE ROW LEVEL SECURITY;
ALTER TABLE products          DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories DISABLE ROW LEVEL SECURITY;
