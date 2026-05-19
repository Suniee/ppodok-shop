-- 이메일 인증 완료 시 customer_profiles 자동 활성화 트리거
-- 작성일: 2026-05-19
-- auth.users.email_confirmed_at 이 null → 값으로 변경되는 순간 DB 레벨에서 처리한다.
-- 프론트엔드(confirm-email 페이지) 흐름 성공 여부와 무관하게 항상 보장된다.

CREATE OR REPLACE FUNCTION public.handle_email_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = commerce, public
AS $$
BEGIN
    -- email_confirmed_at 이 null → 값으로 바뀔 때만 실행 (중복 방지)
    IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
        UPDATE commerce.customer_profiles
        SET status = 'active'
        WHERE id = NEW.id
          AND status = 'pending';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_email_confirmed();
