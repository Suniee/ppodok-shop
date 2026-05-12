-- 탈퇴 회원 프로필 보관 테이블: 재가입 방지용
-- pg_cron으로 1일 경과 시 자동 삭제
-- 작성일: 2026-05-12

-- pg_cron 익스텐션 활성화 (이미 활성화된 경우 무시)
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE TABLE IF NOT EXISTS public.withdrawn_profiles (
    id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    email       text        NOT NULL,
    withdrawn_at timestamptz DEFAULT now() NOT NULL
);

-- 이메일 소문자 유니크 인덱스 (중복 탈퇴 방지)
CREATE UNIQUE INDEX IF NOT EXISTS withdrawn_profiles_email_idx
    ON public.withdrawn_profiles (lower(email));

-- RLS 활성화: 일반 사용자 직접 접근 차단, service_role로만 읽기/쓰기
ALTER TABLE public.withdrawn_profiles ENABLE ROW LEVEL SECURITY;

-- pg_cron: 매일 자정 UTC에 1일 경과한 탈퇴 프로필 삭제
SELECT cron.schedule(
    'cleanup-withdrawn-profiles',
    '0 0 * * *',
    $$DELETE FROM public.withdrawn_profiles WHERE withdrawn_at < now() - interval '1 day'$$
);
