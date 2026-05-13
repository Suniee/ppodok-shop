-- admin_menu_config 테이블 생성: 관리자 사이드메뉴 순서·권한별 노출 설정 저장
-- 작성일: 2026-05-14
-- 하드코딩된 MENU_ITEMS의 기본값을 오버라이드할 때만 레코드를 저장한다.
-- menu_id 는 lib/admin-menu.ts 의 MenuItemDef.id 와 대응한다.

CREATE TABLE IF NOT EXISTS public.admin_menu_config (
    menu_id         TEXT        PRIMARY KEY,
    sort_order      INTEGER     NOT NULL DEFAULT 0,
    visible_super   BOOLEAN     NOT NULL DEFAULT TRUE,
    visible_general BOOLEAN     NOT NULL DEFAULT TRUE,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: service_role 만 접근 (관리자 API는 항상 admin client 사용)
ALTER TABLE public.admin_menu_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role only" ON public.admin_menu_config
    USING (FALSE);
