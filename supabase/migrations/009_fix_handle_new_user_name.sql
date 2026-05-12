-- 회원가입 트리거: 가입 시 입력한 이름을 profiles에 함께 저장
-- 작성일: 2026-05-12

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'name'   -- 회원가입 폼에서 전달한 이름
    );
    RETURN NEW;
END;
$$;
