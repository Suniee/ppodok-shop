-- profiles 테이블에 회원 상태 및 등급 컬럼 추가
-- 작성일: 2026-05-13

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive', 'suspended')),
    ADD COLUMN IF NOT EXISTS grade  TEXT NOT NULL DEFAULT '일반'
        CHECK (grade IN ('일반', '실버', '골드', 'VIP'));
