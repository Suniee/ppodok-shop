-- profiles status 컬럼에 'pending' 추가 및 신규 가입 시 승인 대기 상태로 설정
-- 작성일: 2026-05-13

-- 기존 status 체크 제약 조건 제거 (이름이 자동 생성되므로 동적으로 탐색)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT conname FROM pg_constraint
        WHERE conrelid = 'public.profiles'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) LIKE '%status%'
    LOOP
        EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- pending 포함한 새 체크 제약 조건 추가
ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_status_check
    CHECK (status IN ('pending', 'active', 'inactive', 'suspended'));

-- 신규 가입 시 승인 대기(pending) 상태로 저장
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, status)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'name',
        'pending'   -- 관리자 승인 전까지 대기 상태
    );
    RETURN NEW;
END;
$$;
