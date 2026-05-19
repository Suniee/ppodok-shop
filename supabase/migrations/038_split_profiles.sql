-- profiles 테이블을 customer_profiles / admin_profiles 로 분리
-- 작성일: 2026-05-19
-- 기존 profiles 테이블은 데이터 보존을 위해 유지하되, 신규 쿼리는 분리된 테이블을 사용한다.

-- ── 1. customer_profiles: 프론트 가입 회원 ─────────────────────────────────
CREATE TABLE IF NOT EXISTS commerce.customer_profiles (
    id              UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email           TEXT        NOT NULL,
    name            TEXT,
    phone           TEXT,
    postal_code     TEXT,
    address         TEXT,
    address_detail  TEXT,
    status          TEXT        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'active', 'inactive', 'suspended')),
    grade           TEXT        NOT NULL DEFAULT '일반'
                                CHECK (grade IN ('일반', '실버', '골드', 'VIP')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. admin_profiles: 관리자 ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS commerce.admin_profiles (
    id              UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email           TEXT        NOT NULL,
    name            TEXT,
    phone           TEXT,
    admin_role      TEXT        NOT NULL DEFAULT 'general'
                                CHECK (admin_role IN ('super', 'general')),
    status          TEXT        NOT NULL DEFAULT 'active'
                                CHECK (status IN ('pending', 'active', 'inactive', 'suspended')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 3. 기존 profiles 데이터 이전 ───────────────────────────────────────────
INSERT INTO commerce.customer_profiles
    (id, email, name, phone, postal_code, address, address_detail, status, grade, created_at, updated_at)
SELECT
    id, email, name, phone, postal_code, address, address_detail,
    status, COALESCE(grade, '일반'), created_at, updated_at
FROM commerce.profiles
WHERE role = 'customer'
ON CONFLICT (id) DO NOTHING;

INSERT INTO commerce.admin_profiles
    (id, email, name, phone, admin_role, status, created_at, updated_at)
SELECT
    id, email, name, phone,
    COALESCE(admin_role, 'general'), status, created_at, updated_at
FROM commerce.profiles
WHERE role = 'admin'
ON CONFLICT (id) DO NOTHING;

-- ── 4. RLS 활성화 및 정책 설정 ─────────────────────────────────────────────
ALTER TABLE commerce.customer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_profiles_own_select" ON commerce.customer_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "customer_profiles_own_update" ON commerce.customer_profiles
    FOR UPDATE USING (auth.uid() = id);

ALTER TABLE commerce.admin_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_profiles_own_select" ON commerce.admin_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "admin_profiles_own_update" ON commerce.admin_profiles
    FOR UPDATE USING (auth.uid() = id);

-- ── 5. updated_at 자동 갱신 트리거 ────────────────────────────────────────
DROP TRIGGER IF EXISTS customer_profiles_updated_at ON commerce.customer_profiles;
CREATE TRIGGER customer_profiles_updated_at
    BEFORE UPDATE ON commerce.customer_profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS admin_profiles_updated_at ON commerce.admin_profiles;
CREATE TRIGGER admin_profiles_updated_at
    BEFORE UPDATE ON commerce.admin_profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 6. handle_new_user 트리거: 신규 가입 시 customer_profiles에 삽입 ────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = commerce, public
AS $$
BEGIN
    INSERT INTO commerce.customer_profiles (id, email, status)
    VALUES (NEW.id, NEW.email, 'pending');
    RETURN NEW;
END;
$$;
