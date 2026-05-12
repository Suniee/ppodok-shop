-- orders, order_items 테이블 생성: 주문 정보 및 주문 상품 저장
-- 작성일: 2026-05-12

CREATE TABLE public.orders (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
    status          TEXT        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'confirmed', 'shipping', 'delivered', 'cancelled')),
    -- 배송 정보
    recipient_name  TEXT        NOT NULL,
    phone           TEXT        NOT NULL,
    postal_code     TEXT        NOT NULL,
    address         TEXT        NOT NULL,
    address_detail  TEXT,
    memo            TEXT,
    -- 금액
    items_total     INTEGER     NOT NULL,
    shipping_fee    INTEGER     NOT NULL DEFAULT 0,
    total_price     INTEGER     NOT NULL,
    -- 결제 수단
    payment_method  TEXT        NOT NULL DEFAULT 'card',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.order_items (
    id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id     UUID    NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id   TEXT    NOT NULL,
    product_name TEXT    NOT NULL,
    price        INTEGER NOT NULL,
    quantity     INTEGER NOT NULL,
    emoji        TEXT,
    image_url    TEXT
);

-- RLS 활성화
ALTER TABLE public.orders     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 본인 주문 조회
CREATE POLICY "orders_select_own" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

-- 주문 생성은 비회원 포함 누구나 가능
CREATE POLICY "orders_insert_all" ON public.orders
    FOR INSERT WITH CHECK (true);

-- 본인 주문의 상품만 조회
CREATE POLICY "order_items_select_own" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE id = order_id AND auth.uid() = user_id
        )
    );

CREATE POLICY "order_items_insert_all" ON public.order_items
    FOR INSERT WITH CHECK (true);
