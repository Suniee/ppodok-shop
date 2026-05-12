-- 회원 프로필 테이블 생성 + 회원가입 자동 생성 트리거
-- 작성일: 2026-05-12
-- auth.users는 Supabase 내장 테이블이므로, 서비스 전용 컬럼은 public.profiles에 관리한다

-- ── 프로필 테이블 ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
    id              UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email           TEXT        NOT NULL,
    name            TEXT,                              -- 표시 이름 (닉네임)
    phone           TEXT,                              -- 연락처
    role            TEXT        NOT NULL DEFAULT 'customer'
                                CHECK (role IN ('customer', 'admin')),
    -- 주소 (카카오 우편번호 서비스 기반)
    postal_code     TEXT,                              -- 5자리 우편번호
    address         TEXT,                              -- 도로명주소 (예: 서울특별시 강남구 테헤란로 427)
    address_detail  TEXT,                              -- 상세주소 (예: 101동 502호)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 본인 프로필만 조회 가능
CREATE POLICY "profiles_own_select" ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- 본인 프로필만 수정 가능 (role 컬럼은 service_role만 변경)
CREATE POLICY "profiles_own_update" ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- ── 회원가입 트리거 ────────────────────────────────────────────
-- auth.users에 새 유저가 생성되면 자동으로 profiles 레코드를 만든다
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER          -- auth.users에 접근하려면 definer 권한 필요
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ── updated_at 자동 갱신 트리거 ───────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
