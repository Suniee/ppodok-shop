-- ══════════════════════════════════════════════════════════════════════════════
-- 뽀득삽 DB 초기화 스크립트 v1.0
-- 작성일: 2026-05-15
-- 용도: 새 Supabase 프로젝트에 한 번에 실행하는 통합 초기화 스크립트
--       기존 migrations/001~030의 최종 상태를 반영한다.
-- 주의: auth.* 테이블은 Supabase 내장이므로 제외.
--       모든 앱 테이블은 commerce 스키마에 생성한다.
-- ══════════════════════════════════════════════════════════════════════════════


-- ── 0. 익스텐션 ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_cron;


-- ── 1. commerce 스키마 생성 및 권한 ──────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS commerce;

-- PostgREST(Supabase API)가 commerce 스키마에 접근할 수 있도록 권한 부여
-- Supabase 대시보드 → Settings → API → Exposed schemas 에 'commerce' 추가도 필요
GRANT USAGE ON SCHEMA commerce TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA commerce
    GRANT ALL ON TABLES    TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA commerce
    GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA commerce
    GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;


-- ── 2. 공유 유틸리티 함수 ─────────────────────────────────────────────────────
-- 여러 테이블에서 공유하는 updated_at 자동 갱신 트리거 함수
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


-- ── 3. 스토리지 버킷 ──────────────────────────────────────────────────────────
-- 상품 이미지 버킷: 공개 읽기, 5MB 제한, 이미지 파일만 허용
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "product_images_public_read"  ON storage.objects;
DROP POLICY IF EXISTS "product_images_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "product_images_admin_delete" ON storage.objects;

CREATE POLICY "product_images_public_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'product-images');

-- service_role은 RLS를 우회하므로 아래 정책은 authenticated 사용자 업로드용
CREATE POLICY "product_images_admin_insert" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "product_images_admin_delete" ON storage.objects
    FOR DELETE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');


-- ══════════════════════════════════════════════════════════════════════════════
-- 테이블 생성 (commerce 스키마)
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 4. 카테고리 ───────────────────────────────────────────────────────────────
CREATE TABLE commerce.categories (
    id         SERIAL      PRIMARY KEY,
    name       TEXT        NOT NULL,
    slug       TEXT        NOT NULL UNIQUE,
    icon       TEXT        NOT NULL DEFAULT '📦',
    sort_order INT         NOT NULL DEFAULT 0,
    is_active  BOOLEAN     NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE commerce.categories ENABLE ROW LEVEL SECURITY;

-- anon 포함 누구나 읽기 가능 (프론트 카테고리 목록에 필요)
CREATE POLICY "categories_anon_select" ON commerce.categories
    FOR SELECT USING (true);


-- ── 5. 상품 ───────────────────────────────────────────────────────────────────
CREATE TABLE commerce.products (
    id              TEXT        PRIMARY KEY,
    name            TEXT        NOT NULL,
    price           INTEGER     NOT NULL,
    original_price  INTEGER,
    emoji           TEXT        NOT NULL DEFAULT '📦',
    bg_color        TEXT        NOT NULL DEFAULT '#F5F5F5',
    is_new          BOOLEAN     NOT NULL DEFAULT false,
    is_best         BOOLEAN     NOT NULL DEFAULT false,
    badge           TEXT,
    is_visible      BOOLEAN     NOT NULL DEFAULT true,
    images          TEXT[]               DEFAULT '{}',
    detail_images   TEXT[]               DEFAULT '{}',
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE commerce.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_anon_select" ON commerce.products
    FOR SELECT USING (true);


-- ── 6. 상품-카테고리 연결 ─────────────────────────────────────────────────────
CREATE TABLE commerce.product_categories (
    product_id  TEXT    NOT NULL REFERENCES commerce.products(id)   ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES commerce.categories(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
);

ALTER TABLE commerce.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_categories_anon_select" ON commerce.product_categories
    FOR SELECT USING (true);


-- ── 7. 회원 프로필 ───────────────────────────────────────────────────────────
-- auth.users의 보조 테이블. 서비스 전용 컬럼을 여기에 관리한다.
CREATE TABLE commerce.profiles (
    id             UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email          TEXT        NOT NULL,
    name           TEXT,
    phone          TEXT,
    role           TEXT        NOT NULL DEFAULT 'customer'
                               CHECK (role IN ('customer', 'admin')),
    status         TEXT        NOT NULL DEFAULT 'active'
                               CONSTRAINT profiles_status_check
                               CHECK (status IN ('pending', 'active', 'inactive', 'suspended')),
    grade          TEXT        NOT NULL DEFAULT '일반'
                               CHECK (grade IN ('일반', '실버', '골드', 'VIP')),
    admin_role     TEXT        NOT NULL DEFAULT 'general'
                               CONSTRAINT profiles_admin_role_check
                               CHECK (admin_role IN ('super', 'general')),
    postal_code    TEXT,
    address        TEXT,
    address_detail TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE commerce.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_own_select" ON commerce.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_own_update" ON commerce.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP TRIGGER IF EXISTS profiles_updated_at ON commerce.profiles;
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON commerce.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ── 8. 탈퇴 회원 보관 ────────────────────────────────────────────────────────
-- 탈퇴 후 재가입 방지용. pg_cron으로 보관 기간 경과 시 자동 삭제.
CREATE TABLE commerce.withdrawn_profiles (
    id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    email        TEXT        NOT NULL,
    withdrawn_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX withdrawn_profiles_email_idx
    ON commerce.withdrawn_profiles (lower(email));

ALTER TABLE commerce.withdrawn_profiles ENABLE ROW LEVEL SECURITY;
-- service_role만 접근 (일반 사용자 직접 접근 차단, RLS 정책 없음)


-- ── 9. 앱 설정 ────────────────────────────────────────────────────────────────
CREATE TABLE commerce.app_settings (
    key         TEXT        PRIMARY KEY,
    value       TEXT        NOT NULL,
    description TEXT,
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE commerce.app_settings ENABLE ROW LEVEL SECURITY;
-- service_role만 접근

INSERT INTO commerce.app_settings (key, value, description) VALUES
    ('withdrawn_cron_schedule',    '0 0 * * *', '탈퇴 회원 정리 배치 스케줄 (cron 표현식)'),
    ('withdrawn_retention_minutes', '1440',      '탈퇴 회원 보관 기간 (분, 기본 1일)')
ON CONFLICT (key) DO NOTHING;


-- ── 10. 배너 ─────────────────────────────────────────────────────────────────
-- position: hero(최상단 캐러셀) | promo(신상품-베스트 사이 3개)
CREATE TABLE commerce.banners (
    id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    title      TEXT        NOT NULL DEFAULT '',
    subtitle   TEXT        NOT NULL DEFAULT '',
    tag        TEXT        NOT NULL DEFAULT '',
    cta        TEXT        NOT NULL DEFAULT '지금 쇼핑하기',
    link       TEXT        NOT NULL DEFAULT '/',
    emoji      TEXT        NOT NULL DEFAULT '🎁',
    bg_color   TEXT        NOT NULL DEFAULT '#EBF3FF',
    text_color TEXT        NOT NULL DEFAULT '#0064FF',
    position   TEXT        NOT NULL DEFAULT 'hero'
                           CHECK (position IN ('hero', 'promo')),
    active     BOOLEAN     NOT NULL DEFAULT true,
    "order"    INT         NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE commerce.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "banners_public_select" ON commerce.banners
    FOR SELECT USING (true);

-- 히어로 배너 초기 데이터
INSERT INTO commerce.banners (title, subtitle, tag, cta, link, emoji, bg_color, text_color, position, active, "order") VALUES
    ('봄맞이 특가전',   '생활용품 최대 40% 할인', '봄 특가전',     '지금 쇼핑하기',  '/products',         '🌸', '#EBF3FF', '#0064FF', 'hero', true,  1),
    ('주방용품 기획전', '스마트한 주방의 시작',   '신상품 입고',   '신상품 보기',    '/category/kitchen', '🍳', '#F0FFF4', '#00A878', 'hero', true,  2),
    ('K-뷰티 기획전',  '피부 고민 이제 해결해요', 'K-뷰티 기획전', '할인 상품 보기', '/category/beauty',  '💄', '#FFF0F6', '#C9006B', 'hero', false, 3);

-- 프로모 배너 초기 데이터 (order 1=대형, 2·3=소형)
INSERT INTO commerce.banners (title, subtitle, tag, cta, link, emoji, bg_color, text_color, position, active, "order") VALUES
    ('세제/세탁용품 최대 30% 할인', '이달의 특별 혜택', '이달의 특가',    '바로가기', '/category/detergent',            '🧺', '#0064FF', '#ffffff', 'promo', true, 1),
    ('첫 구매 시 10% 할인',        '신규 회원 전용',   '신규 회원 혜택', '혜택 받기', '/join',                          '🎉', '#ffffff', '#0064FF', 'promo', true, 2),
    ('3만원 이상 무료배송',         '배송비 걱정 없이', '무료배송',       '상품 보기', '/products?filter=free-shipping', '🚚', '#ffffff', '#0064FF', 'promo', true, 3);


-- ── 11. 주문 ─────────────────────────────────────────────────────────────────
CREATE TABLE commerce.orders (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
    status         TEXT        NOT NULL DEFAULT 'pending'
                               CHECK (status IN (
                                   'pending', 'confirmed', 'shipping', 'delivered',
                                   'purchase_confirmed', 'review_written', 'cancelled'
                               )),
    recipient_name TEXT        NOT NULL,
    phone          TEXT        NOT NULL,
    postal_code    TEXT        NOT NULL,
    address        TEXT        NOT NULL,
    address_detail TEXT,
    memo           TEXT,
    items_total    INTEGER     NOT NULL,
    shipping_fee   INTEGER     NOT NULL DEFAULT 0,
    total_price    INTEGER     NOT NULL,
    payment_method TEXT        NOT NULL DEFAULT 'card',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE commerce.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_select_own" ON commerce.orders
    FOR SELECT USING (auth.uid() = user_id);

-- 비회원 주문도 허용
CREATE POLICY "orders_insert_all" ON commerce.orders
    FOR INSERT WITH CHECK (true);


-- ── 12. 주문 상품 ────────────────────────────────────────────────────────────
CREATE TABLE commerce.order_items (
    id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id     UUID    NOT NULL REFERENCES commerce.orders(id) ON DELETE CASCADE,
    product_id   TEXT    NOT NULL,
    product_name TEXT    NOT NULL,
    price        INTEGER NOT NULL,
    quantity     INTEGER NOT NULL,
    emoji        TEXT,
    image_url    TEXT
);

ALTER TABLE commerce.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items_select_own" ON commerce.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM commerce.orders
            WHERE id = order_id AND auth.uid() = user_id
        )
    );

CREATE POLICY "order_items_insert_all" ON commerce.order_items
    FOR INSERT WITH CHECK (true);


-- ── 13. 결제 ─────────────────────────────────────────────────────────────────
-- 토스페이먼츠 결제 승인 응답 저장
CREATE TABLE commerce.payments (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id     UUID        NOT NULL REFERENCES commerce.orders(id) ON DELETE CASCADE,
    payment_key  TEXT        NOT NULL UNIQUE,
    order_name   TEXT        NOT NULL,
    method       TEXT        NOT NULL,
    amount       INTEGER     NOT NULL,
    status       TEXT        NOT NULL,
    requested_at TIMESTAMPTZ,
    approved_at  TIMESTAMPTZ,
    raw_response JSONB       NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE commerce.payments ENABLE ROW LEVEL SECURITY;
-- 읽기/쓰기 모두 service_role만 허용 (프론트 직접 접근 불필요)


-- ── 14. 토스 거래 내역 ───────────────────────────────────────────────────────
-- 토스페이먼츠 거래내역 API 응답 저장 (정산 조회용)
CREATE TABLE commerce.toss_transactions (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_key TEXT        NOT NULL UNIQUE,
    payment_key     TEXT        NOT NULL,
    order_id        TEXT        NOT NULL,
    method          TEXT        NOT NULL,
    amount          INTEGER     NOT NULL,
    status          TEXT        NOT NULL,
    transaction_at  TIMESTAMPTZ NOT NULL,
    currency        TEXT        NOT NULL DEFAULT 'KRW',
    provider        TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE commerce.toss_transactions ENABLE ROW LEVEL SECURITY;
-- service_role만 접근

CREATE INDEX idx_toss_transactions_payment_key    ON commerce.toss_transactions (payment_key);
CREATE INDEX idx_toss_transactions_transaction_at ON commerce.toss_transactions (transaction_at DESC);


-- ── 15. 교환/환불 신청 ───────────────────────────────────────────────────────
CREATE TYPE commerce.cancel_request_type   AS ENUM ('exchange', 'refund');
CREATE TYPE commerce.cancel_request_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE commerce.cancel_requests (
    id         UUID                            PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id   UUID                            NOT NULL REFERENCES commerce.orders(id) ON DELETE CASCADE,
    type       commerce.cancel_request_type    NOT NULL,
    reason     TEXT                            NOT NULL,
    status     commerce.cancel_request_status  NOT NULL DEFAULT 'pending',
    admin_note TEXT,
    created_at TIMESTAMPTZ                     NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ                     NOT NULL DEFAULT NOW()
);

ALTER TABLE commerce.cancel_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "사용자 본인 조회" ON commerce.cancel_requests
    FOR SELECT USING (
        order_id IN (SELECT id FROM commerce.orders WHERE user_id = auth.uid())
    );

CREATE POLICY "사용자 본인 신청" ON commerce.cancel_requests
    FOR INSERT WITH CHECK (
        order_id IN (SELECT id FROM commerce.orders WHERE user_id = auth.uid())
    );

-- 주문당 pending 신청은 1건만 허용
CREATE UNIQUE INDEX cancel_requests_order_pending_unique
    ON commerce.cancel_requests (order_id)
    WHERE status = 'pending';


-- ── 16. 관리자 메뉴 설정 ──────────────────────────────────────────────────────
-- MENU_ITEMS 기본값을 오버라이드할 때만 레코드를 저장한다
CREATE TABLE commerce.admin_menu_config (
    menu_id         TEXT        PRIMARY KEY,
    sort_order      INTEGER     NOT NULL DEFAULT 0,
    visible_super   BOOLEAN     NOT NULL DEFAULT TRUE,
    visible_general BOOLEAN     NOT NULL DEFAULT TRUE,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE commerce.admin_menu_config ENABLE ROW LEVEL SECURITY;

-- 관리자 API는 항상 service_role(admin client) 사용 → 일반 접근 완전 차단
CREATE POLICY "service role only" ON commerce.admin_menu_config
    USING (FALSE);


-- ── 17. 상품 리뷰 ────────────────────────────────────────────────────────────
CREATE TABLE commerce.product_reviews (
    id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id TEXT        NOT NULL REFERENCES commerce.products(id) ON DELETE CASCADE,
    user_id    UUID        NOT NULL REFERENCES auth.users(id)        ON DELETE CASCADE,
    user_name  TEXT        NOT NULL DEFAULT '익명',
    rating     SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
    content    TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_reviews_product_id ON commerce.product_reviews (product_id);

ALTER TABLE commerce.product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_select" ON commerce.product_reviews
    FOR SELECT USING (true);

CREATE POLICY "reviews_insert" ON commerce.product_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews_delete" ON commerce.product_reviews
    FOR DELETE USING (auth.uid() = user_id);


-- ── 18. 상품 Q&A ──────────────────────────────────────────────────────────────
CREATE TABLE commerce.product_qna (
    id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id  TEXT        NOT NULL REFERENCES commerce.products(id) ON DELETE CASCADE,
    user_id     UUID        NOT NULL REFERENCES auth.users(id)        ON DELETE CASCADE,
    user_name   TEXT        NOT NULL DEFAULT '익명',
    question    TEXT        NOT NULL,
    answer      TEXT,
    answered_at TIMESTAMPTZ,
    is_secret   BOOLEAN     NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_qna_product_id ON commerce.product_qna (product_id);

ALTER TABLE commerce.product_qna ENABLE ROW LEVEL SECURITY;

-- 전체 목록 표시 (비밀글 내용 마스킹은 클라이언트에서 처리)
CREATE POLICY "qna_select" ON commerce.product_qna
    FOR SELECT USING (true);

CREATE POLICY "qna_insert" ON commerce.product_qna
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "qna_delete" ON commerce.product_qna
    FOR DELETE USING (auth.uid() = user_id);


-- ══════════════════════════════════════════════════════════════════════════════
-- 함수 및 트리거
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 19. 회원가입 자동 프로필 생성 트리거 ─────────────────────────────────────
-- auth.users INSERT 시 commerce.profiles 레코드를 자동 생성한다
-- status='pending': 관리자 승인 전까지 로그인 불가
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = commerce, public
AS $$
BEGIN
    INSERT INTO commerce.profiles (id, email, name, status)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'name',
        'pending'
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── 20. 탈퇴 배치 스케줄 관리 함수 ──────────────────────────────────────────
-- app_settings의 스케줄·보관 기간을 동시에 갱신하고 pg_cron을 재등록한다
CREATE OR REPLACE FUNCTION public.update_withdrawn_cron(
    new_schedule      TEXT,
    retention_minutes INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    BEGIN
        PERFORM cron.unschedule('cleanup-withdrawn-profiles');
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    INSERT INTO commerce.app_settings (key, value)
    VALUES
        ('withdrawn_cron_schedule',    new_schedule),
        ('withdrawn_retention_minutes', retention_minutes::text)
    ON CONFLICT (key) DO UPDATE
        SET value = EXCLUDED.value, updated_at = NOW();

    PERFORM cron.schedule(
        'cleanup-withdrawn-profiles',
        new_schedule,
        format(
            'DELETE FROM commerce.withdrawn_profiles WHERE withdrawn_at < now() - interval ''%s minutes''',
            retention_minutes
        )
    );
END;
$$;

-- 매일 자정 UTC / 1일(1440분) 보관으로 초기 등록
SELECT public.update_withdrawn_cron('0 0 * * *', 1440);


-- ══════════════════════════════════════════════════════════════════════════════
-- 시드 데이터: 수퍼관리자
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 21. 수퍼관리자 계정 생성 ─────────────────────────────────────────────────
-- 실행 전 아래 이메일·비밀번호를 환경에 맞게 변경할 것
-- email: super@ppodok.kr / password: super0427
DO $$
DECLARE
    v_id UUID;
BEGIN
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'super@ppodok.kr') THEN
        RAISE NOTICE '수퍼관리자 계정이 이미 존재합니다.';
        RETURN;
    END IF;

    v_id := gen_random_uuid();

    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data,
        confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_id, 'authenticated', 'authenticated',
        'super@ppodok.kr',
        crypt('super0427', gen_salt('bf')),
        NOW(), NOW(), NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"name":"수퍼관리자"}'::jsonb,
        '', '', '', ''
    );

    INSERT INTO auth.identities (
        id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
        v_id, 'super@ppodok.kr', v_id,
        json_build_object('sub', v_id::text, 'email', 'super@ppodok.kr')::jsonb,
        'email', NOW(), NOW(), NOW()
    );

    -- handle_new_user 트리거가 profiles(status=pending)를 먼저 생성하므로 UPSERT로 갱신
    INSERT INTO commerce.profiles (id, email, name, role, status, admin_role)
    VALUES (v_id, 'super@ppodok.kr', '수퍼관리자', 'admin', 'active', 'super')
    ON CONFLICT (id) DO UPDATE
        SET role       = 'admin',
            status     = 'active',
            admin_role = 'super',
            name       = '수퍼관리자';

    RAISE NOTICE '수퍼관리자 계정 생성 완료 (ID: %)', v_id;
END $$;
