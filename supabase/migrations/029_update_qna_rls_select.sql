-- Q&A 비밀글 SELECT 정책 변경
-- 기존: 비밀글은 작성자 외 SELECT 자체 차단 → 목록에 아예 안 보임
-- 변경: 전체 목록에 표시하되, 내용 마스킹은 클라이언트에서 처리
-- 작성일: 2026-05-15
DROP POLICY IF EXISTS "qna_select" ON product_qna;

CREATE POLICY "qna_select" ON product_qna
    FOR SELECT USING (true);
