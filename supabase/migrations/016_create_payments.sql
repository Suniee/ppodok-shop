-- payments 테이블 생성: 토스페이먼츠 결제 승인 응답 저장
-- 작성일: 2026-05-13

CREATE TABLE public.payments (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID        NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    payment_key     TEXT        NOT NULL UNIQUE,   -- 토스 paymentKey
    order_name      TEXT        NOT NULL,          -- 토스 orderName (상품명)
    method          TEXT        NOT NULL,          -- card | 간편결제 | 계좌이체 등
    amount          INTEGER     NOT NULL,          -- 결제 금액
    status          TEXT        NOT NULL,          -- DONE | CANCELED 등
    requested_at    TIMESTAMPTZ,                   -- 결제 요청 시각
    approved_at     TIMESTAMPTZ,                   -- 결제 승인 시각
    raw_response    JSONB       NOT NULL,          -- 토스 원본 응답 전체 보관
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS 활성화 (읽기/쓰기 모두 서비스 롤만 허용 — 프론트 직접 접근 불필요)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
