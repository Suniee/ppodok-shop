-- commerce.company_info 테이블 생성: 프론트 푸터에 표시할 회사정보 저장 (단일 행)
-- 작성일: 2026-05-15

CREATE TABLE IF NOT EXISTS commerce.company_info (
    id                  int PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- 항상 1행만 유지
    company_name        text NOT NULL DEFAULT '',
    representative      text NOT NULL DEFAULT '',
    business_number     text NOT NULL DEFAULT '',
    mail_order_number   text NOT NULL DEFAULT '',
    address             text NOT NULL DEFAULT '',
    phone               text NOT NULL DEFAULT '',
    support_hours       text NOT NULL DEFAULT '',
    copyright           text NOT NULL DEFAULT '',
    sns_facebook        text NOT NULL DEFAULT '',
    sns_instagram       text NOT NULL DEFAULT '',
    sns_naver           text NOT NULL DEFAULT '',
    sns_kakao           text NOT NULL DEFAULT '',
    updated_at          timestamptz NOT NULL DEFAULT now()
);

-- 기본 회사 정보 삽입
INSERT INTO commerce.company_info (
    id, company_name, representative, business_number,
    mail_order_number, address, phone, support_hours, copyright,
    sns_facebook, sns_instagram, sns_naver, sns_kakao
) VALUES (
    1, '제이코리아', '대표이사', '000-00-00000',
    '제0000-서울강서-0000호', '서울특별시 강서구 마곡동 000-00',
    '02-2606-1285', '평일 10:00~18:00, 주말·공휴일 휴무',
    '© 2025 뽀독샵. All Rights Reserved.',
    '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

-- RLS 활성화 (읽기는 누구나, 쓰기는 service_role만)
ALTER TABLE commerce.company_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_info_select" ON commerce.company_info
    FOR SELECT USING (true);
