-- toss_transactions 테이블 생성: 토스페이먼츠 거래내역 API 응답 저장
-- 작성일: 2026-05-13

CREATE TABLE public.toss_transactions (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_key TEXT        NOT NULL UNIQUE,  -- 토스 transactionKey (중복 방지)
    payment_key     TEXT        NOT NULL,
    order_id        TEXT        NOT NULL,
    method          TEXT        NOT NULL,
    amount          INTEGER     NOT NULL,
    status          TEXT        NOT NULL,         -- DONE | CANCELED | PARTIAL_CANCELED 등
    transaction_at  TIMESTAMPTZ NOT NULL,
    currency        TEXT        NOT NULL DEFAULT 'KRW',
    provider        TEXT,                         -- 간편결제 제공사 (카카오페이 등)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS 활성화 (서비스 롤만 접근 허용)
ALTER TABLE public.toss_transactions ENABLE ROW LEVEL SECURITY;

-- 조회 성능을 위한 인덱스
CREATE INDEX idx_toss_transactions_payment_key  ON public.toss_transactions (payment_key);
CREATE INDEX idx_toss_transactions_transaction_at ON public.toss_transactions (transaction_at DESC);
