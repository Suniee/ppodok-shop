-- commerce 스키마 생성 및 기존 앱 테이블 이동
-- 작성일: 2026-05-15
-- auth.* (Supabase 내장) 을 제외한 모든 앱 테이블을 commerce 스키마로 이동한다.

-- ── 1. 스키마 생성 및 접근 권한 ──────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS commerce;

-- PostgREST(Supabase API)에서 commerce 스키마에 접근할 수 있도록 권한 부여
GRANT USAGE ON SCHEMA commerce TO anon, authenticated, service_role;

-- 이후 commerce 스키마에 생성되는 객체에 자동으로 권한 부여
ALTER DEFAULT PRIVILEGES IN SCHEMA commerce
    GRANT ALL ON TABLES    TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA commerce
    GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA commerce
    GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

-- ── 2. 이동 전: cross-table 참조 RLS 정책 제거 ────────────────────────────────
-- 아래 정책은 public.orders 등 스키마 경로가 하드코딩되어 있어
-- 테이블 이동 후 참조가 깨진다. 이동 완료 후 7단계에서 재생성한다.
DROP POLICY IF EXISTS "order_items_select_own" ON public.order_items;
DROP POLICY IF EXISTS "사용자 본인 조회"         ON public.cancel_requests;
DROP POLICY IF EXISTS "사용자 본인 신청"         ON public.cancel_requests;

-- ── 3. ENUM 타입 이동 ──────────────────────────────────────────────────────────
ALTER TYPE public.cancel_request_type   SET SCHEMA commerce;
ALTER TYPE public.cancel_request_status SET SCHEMA commerce;

-- ── 4. 테이블 이동 ────────────────────────────────────────────────────────────
-- 독립 테이블 (다른 앱 테이블을 참조하지 않음)
ALTER TABLE public.profiles           SET SCHEMA commerce;
ALTER TABLE public.withdrawn_profiles SET SCHEMA commerce;
ALTER TABLE public.categories         SET SCHEMA commerce;
ALTER TABLE public.products           SET SCHEMA commerce;
ALTER TABLE public.app_settings       SET SCHEMA commerce;
ALTER TABLE public.banners            SET SCHEMA commerce;
ALTER TABLE public.admin_menu_config  SET SCHEMA commerce;
ALTER TABLE public.toss_transactions  SET SCHEMA commerce;

-- 상품 관련 (products, categories 참조)
ALTER TABLE public.product_categories SET SCHEMA commerce;
ALTER TABLE public.product_reviews    SET SCHEMA commerce;
ALTER TABLE public.product_qna        SET SCHEMA commerce;

-- 주문 관련 (orders 참조)
ALTER TABLE public.orders             SET SCHEMA commerce;
ALTER TABLE public.order_items        SET SCHEMA commerce;
ALTER TABLE public.payments           SET SCHEMA commerce;
ALTER TABLE public.cancel_requests    SET SCHEMA commerce;

-- ── 5. 이동된 객체 권한 부여 ──────────────────────────────────────────────────
GRANT ALL ON ALL TABLES    IN SCHEMA commerce TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA commerce TO anon, authenticated, service_role;
GRANT USAGE ON TYPE commerce.cancel_request_type   TO anon, authenticated;
GRANT USAGE ON TYPE commerce.cancel_request_status TO anon, authenticated;

-- ── 6. handle_new_user 트리거 함수 갱신 ──────────────────────────────────────
-- profiles가 commerce 스키마로 이동했으므로 INSERT 대상 경로 업데이트
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = commerce, public
AS $$
BEGIN
    INSERT INTO commerce.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$;

-- ── 7. cross-table 참조 RLS 정책 재생성 ──────────────────────────────────────
-- order_items: commerce.orders 참조
CREATE POLICY "order_items_select_own" ON commerce.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM commerce.orders
            WHERE id = order_id AND auth.uid() = user_id
        )
    );

-- cancel_requests: commerce.orders 참조
CREATE POLICY "사용자 본인 조회" ON commerce.cancel_requests
    FOR SELECT USING (
        order_id IN (
            SELECT id FROM commerce.orders WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "사용자 본인 신청" ON commerce.cancel_requests
    FOR INSERT WITH CHECK (
        order_id IN (
            SELECT id FROM commerce.orders WHERE user_id = auth.uid()
        )
    );

-- ── 8. pg_cron 갱신: commerce.withdrawn_profiles 참조 ────────────────────────
SELECT cron.unschedule('cleanup-withdrawn-profiles');
SELECT cron.schedule(
    'cleanup-withdrawn-profiles',
    '0 0 * * *',
    $$DELETE FROM commerce.withdrawn_profiles WHERE withdrawn_at < now() - interval '1 day'$$
);
