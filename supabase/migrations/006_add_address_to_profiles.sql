-- profiles 테이블에 주소 컬럼 추가
-- 작성일: 2026-05-12
-- 005_create_profiles.sql을 이미 실행한 경우에만 이 파일을 실행한다

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS postal_code    TEXT,         -- 5자리 우편번호
    ADD COLUMN IF NOT EXISTS address        TEXT,         -- 도로명주소
    ADD COLUMN IF NOT EXISTS address_detail TEXT;         -- 상세주소 (사용자 직접 입력)
