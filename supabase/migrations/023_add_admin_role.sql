-- profiles 테이블에 admin_role 컬럼 추가: 수퍼관리자/일반관리자 등급 구분
-- 작성일: 2026-05-14

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS admin_role TEXT NOT NULL DEFAULT 'general'
    CONSTRAINT profiles_admin_role_check CHECK (admin_role IN ('super', 'general'));

-- super@ppodok.kr 을 수퍼관리자로 설정
UPDATE public.profiles
SET admin_role = 'super'
WHERE email = 'super@ppodok.kr';
