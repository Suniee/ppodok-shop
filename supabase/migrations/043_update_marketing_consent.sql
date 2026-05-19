-- 선택 개인정보 약관 삭제 및 마케팅 동의를 이메일·SMS 채널로 분리
-- 작성일: 2026-05-20

-- ── 1. 'privacy_optional' 약관 삭제 ────────────────────────────
DELETE FROM commerce.terms WHERE consent_key = 'privacy_optional';

-- ── 2. 'marketing' 약관 제목·내용 업데이트 ──────────────────────
UPDATE commerce.terms
SET
    title      = '광고성 정보 수신 동의',
    content    = $$뽀득삽에서 발송하는 광고·프로모션 정보의 수신 채널을 선택해 주세요.

■ 수신 채널 및 활용 목적
· 이메일: 신상품 입고·재입고 안내, 할인·쿠폰·이벤트·프로모션 정보, 맞춤형 상품 추천, 회원 전용 혜택 안내
· SMS: 주요 프로모션 및 긴급 혜택 알림

■ 수집 항목 및 보유 기간
· 이메일 수신 동의: 이름, 이메일 주소 / 수신 거부 의사 표시 시까지 (회원 탈퇴 시 즉시 삭제)
· SMS 수신 동의: 이름, 휴대폰 번호 / 수신 거부 의사 표시 시까지 (회원 탈퇴 시 즉시 삭제)

■ 수신 거부 방법
· 이메일: 수신된 이메일 하단의 '수신 거부' 링크 클릭
· SMS: 수신된 문자의 수신 거부 번호로 회신
· 마이페이지 > 알림 설정에서 언제든지 변경 가능

■ 동의 거부 시 불이익
본 동의는 선택 사항이며, 동의하지 않으셔도 회원가입 및 기본 서비스 이용에 불이익이 없습니다.
단, 신상품 입고·이벤트·혜택 등 맞춤 정보를 받으실 수 없습니다.$$,
    updated_at = now()
WHERE consent_key = 'marketing';

-- ── 3. customer_profiles: 선택 개인정보 동의 컬럼 제거 ──────────
ALTER TABLE commerce.customer_profiles
    DROP COLUMN IF EXISTS privacy_optional_agreed_at;

-- ── 4. customer_profiles: 마케팅 동의를 이메일·SMS 컬럼으로 분리 ─
ALTER TABLE commerce.customer_profiles
    DROP COLUMN IF EXISTS marketing_agreed,
    DROP COLUMN IF EXISTS marketing_agreed_at,
    ADD COLUMN IF NOT EXISTS marketing_email_agreed     BOOLEAN     NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS marketing_email_agreed_at  TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS marketing_sms_agreed       BOOLEAN     NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS marketing_sms_agreed_at    TIMESTAMPTZ;
