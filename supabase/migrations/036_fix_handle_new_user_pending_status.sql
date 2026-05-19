-- handle_new_user 트리거: 신규 가입 시 status를 'pending'으로 설정
-- 작성일: 2026-05-19
-- 기존에는 status를 명시하지 않아 컬럼 기본값 'active'로 삽입됨.
-- 이메일 미인증 상태에서도 정상 회원으로 조회되는 문제를 수정한다.
-- 인증 완료 시 /confirm-email 에서 autoActivateCustomerAction이 'active'로 변경한다.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = commerce, public
AS $$
BEGIN
    INSERT INTO commerce.profiles (id, email, status)
    VALUES (NEW.id, NEW.email, 'pending');
    RETURN NEW;
END;
$$;
