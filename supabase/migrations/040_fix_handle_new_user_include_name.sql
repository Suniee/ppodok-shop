-- handle_new_user 트리거 수정: 회원가입 시 입력한 이름을 customer_profiles에 함께 저장
-- 작성일: 2026-05-19
-- 038_split_profiles.sql 에서 customer_profiles 전환 시 name 컬럼이 누락됐던 문제 수정

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = commerce, public
AS $$
BEGIN
    INSERT INTO commerce.customer_profiles (id, email, name, status)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'name',  -- 회원가입 폼에서 전달한 이름
        'pending'
    );
    RETURN NEW;
END;
$$;
