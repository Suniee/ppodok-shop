-- 수퍼관리자 계정 생성: email=super@ppodok.kr / password=super0427
-- 작성일: 2026-05-13
-- 주의: Supabase SQL Editor에서 직접 실행 (migration 파일로 관리)

DO $$
DECLARE
    v_id UUID;
BEGIN
    -- 이미 존재하면 건너뜀
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'super@ppodok.kr') THEN
        RAISE NOTICE '수퍼관리자 계정이 이미 존재합니다.';
        RETURN;
    END IF;

    v_id := gen_random_uuid();

    -- auth.users 직접 삽입 (Supabase 시드 표준 방식)
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data,
        confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_id,
        'authenticated',
        'authenticated',
        'super@ppodok.kr',
        crypt('super0427', gen_salt('bf')),
        NOW(), NOW(), NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"name":"수퍼관리자"}'::jsonb,
        '', '', '', ''
    );

    -- auth.identities 삽입 (이메일 로그인 활성화)
    INSERT INTO auth.identities (
        id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
        v_id,
        'super@ppodok.kr',
        v_id,
        json_build_object('sub', v_id::text, 'email', 'super@ppodok.kr')::jsonb,
        'email',
        NOW(), NOW(), NOW()
    );

    -- handle_new_user 트리거가 profiles(pending)를 생성하므로 role/status 갱신
    -- 트리거 실패 대비 UPSERT 처리
    INSERT INTO public.profiles (id, email, name, role, status)
    VALUES (v_id, 'super@ppodok.kr', '수퍼관리자', 'admin', 'active')
    ON CONFLICT (id) DO UPDATE
        SET role   = 'admin',
            status = 'active',
            name   = '수퍼관리자';

    RAISE NOTICE '수퍼관리자 계정 생성 완료 (ID: %)', v_id;
END $$;
