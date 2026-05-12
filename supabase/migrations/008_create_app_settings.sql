-- 앱 전역 설정 테이블 및 탈퇴 배치 관리 함수
-- 작성일: 2026-05-12

-- 앱 설정 키-값 테이블
CREATE TABLE IF NOT EXISTS public.app_settings (
    key         text        PRIMARY KEY,
    value       text        NOT NULL,
    description text,
    updated_at  timestamptz DEFAULT now()
);

-- RLS 활성화: service_role로만 접근
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- 기본 설정값 삽입
INSERT INTO public.app_settings (key, value, description) VALUES
    ('withdrawn_cron_schedule',    '* * * * *', '탈퇴 회원 정리 배치 스케줄 (cron 표현식)'),
    ('withdrawn_retention_minutes', '1',         '탈퇴 회원 보관 기간 (분)')
ON CONFLICT (key) DO NOTHING;

-- 탈퇴 배치 스케줄과 보관 기간을 동시에 변경하는 함수
-- app_settings 업데이트 후 pg_cron 작업을 재등록한다
CREATE OR REPLACE FUNCTION public.update_withdrawn_cron(
    new_schedule        text,
    retention_minutes   int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 기존 작업 제거 (없으면 무시)
    BEGIN
        PERFORM cron.unschedule('cleanup-withdrawn-profiles');
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    -- 설정 저장
    INSERT INTO public.app_settings (key, value)
        VALUES
            ('withdrawn_cron_schedule',    new_schedule),
            ('withdrawn_retention_minutes', retention_minutes::text)
        ON CONFLICT (key) DO UPDATE
            SET value = EXCLUDED.value, updated_at = now();

    -- 새 스케줄로 재등록
    PERFORM cron.schedule(
        'cleanup-withdrawn-profiles',
        new_schedule,
        format(
            'DELETE FROM public.withdrawn_profiles WHERE withdrawn_at < now() - interval ''%s minutes''',
            retention_minutes
        )
    );
END;
$$;

-- 기존 배치를 1분마다 / 1분 보관으로 재등록 (개발용)
SELECT public.update_withdrawn_cron('* * * * *', 1);
