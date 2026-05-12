-- 배너 테이블 생성
-- position: hero(최상단 캐러셀), promo(신상품-베스트 사이 3개)
-- 작성일: 2026-05-12

CREATE TABLE IF NOT EXISTS public.banners (
    id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    title      text        NOT NULL DEFAULT '',
    subtitle   text        NOT NULL DEFAULT '',
    tag        text        NOT NULL DEFAULT '',
    cta        text        NOT NULL DEFAULT '지금 쇼핑하기',
    link       text        NOT NULL DEFAULT '/',
    emoji      text        NOT NULL DEFAULT '🎁',
    bg_color   text        NOT NULL DEFAULT '#EBF3FF',
    text_color text        NOT NULL DEFAULT '#0064FF',
    position   text        NOT NULL DEFAULT 'hero'
                           CHECK (position IN ('hero', 'promo')),
    active     boolean     NOT NULL DEFAULT true,
    "order"    int         NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS 활성화: 읽기는 누구나, 쓰기는 service_role만
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "banners_public_select" ON public.banners
    FOR SELECT USING (true);

-- 히어로 배너 초기 데이터
INSERT INTO public.banners (title, subtitle, tag, cta, link, emoji, bg_color, text_color, position, active, "order") VALUES
    ('봄맞이 특가전',     '생활용품 최대 40% 할인',   '봄 특가전',    '지금 쇼핑하기',  '/products',          '🌸', '#EBF3FF', '#0064FF', 'hero',  true,  1),
    ('주방용품 기획전',   '스마트한 주방의 시작',      '신상품 입고',   '신상품 보기',    '/category/kitchen',  '🍳', '#F0FFF4', '#00A878', 'hero',  true,  2),
    ('K-뷰티 기획전',    '피부 고민 이제 해결해요',   'K-뷰티 기획전', '할인 상품 보기', '/category/beauty',   '💄', '#FFF0F6', '#C9006B', 'hero',  false, 3);

-- 프로모 배너 초기 데이터 (order 1=대형, 2·3=소형)
INSERT INTO public.banners (title, subtitle, tag, cta, link, emoji, bg_color, text_color, position, active, "order") VALUES
    ('세제/세탁용품 최대 30% 할인', '이달의 특별 혜택',  '이달의 특가',  '바로가기', '/category/detergent',        '🧺', '#0064FF', '#ffffff', 'promo', true, 1),
    ('첫 구매 시 10% 할인',        '신규 회원 전용',     '신규 회원 혜택', '혜택 받기', '/join',                  '🎉', '#ffffff', '#0064FF', 'promo', true, 2),
    ('3만원 이상 무료배송',         '배송비 걱정 없이',   '무료배송',     '상품 보기', '/products?filter=free-shipping', '🚚', '#ffffff', '#0064FF', 'promo', true, 3);
