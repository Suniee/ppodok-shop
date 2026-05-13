-- cancel_requests 테이블 생성: 교환/환불 신청 저장
-- 작성일: 2026-05-13

CREATE TYPE public.cancel_request_type AS ENUM ('exchange', 'refund');
CREATE TYPE public.cancel_request_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.cancel_requests (
    id          UUID                            PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id    UUID                            NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    type        public.cancel_request_type      NOT NULL,           -- exchange(교환) | refund(환불)
    reason      TEXT                            NOT NULL,           -- 신청 사유
    status      public.cancel_request_status    NOT NULL DEFAULT 'pending',
    admin_note  TEXT,                                               -- 어드민 처리 메모
    created_at  TIMESTAMPTZ                     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ                     NOT NULL DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE public.cancel_requests ENABLE ROW LEVEL SECURITY;

-- 사용자는 본인 주문의 신청 조회 가능
CREATE POLICY "사용자 본인 조회" ON public.cancel_requests
    FOR SELECT USING (
        order_id IN (
            SELECT id FROM public.orders WHERE user_id = auth.uid()
        )
    );

-- 사용자는 본인 주문에 신청 삽입 가능
CREATE POLICY "사용자 본인 신청" ON public.cancel_requests
    FOR INSERT WITH CHECK (
        order_id IN (
            SELECT id FROM public.orders WHERE user_id = auth.uid()
        )
    );

-- 주문당 하나의 pending 신청만 허용하는 유니크 인덱스
CREATE UNIQUE INDEX cancel_requests_order_pending_unique
    ON public.cancel_requests (order_id)
    WHERE status = 'pending';
