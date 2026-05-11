-- products 테이블에 images 컬럼 추가 + product-images 스토리지 버킷 생성
-- 작성일: 2026-05-11

-- 상품 이미지 URL 배열 컬럼 추가 (없으면 빈 배열로 초기화)
ALTER TABLE products ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';

-- product-images 버킷 생성
-- public = true: 별도 인증 없이 URL로 직접 접근 가능 (프론트 이미지 노출용)
-- file_size_limit = 5MB, JPEG/PNG/WEBP만 허용
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 스토리지 RLS 정책 초기화 후 재생성 (idempotent)
DROP POLICY IF EXISTS "product_images_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "product_images_admin_insert"  ON storage.objects;
DROP POLICY IF EXISTS "product_images_admin_delete"  ON storage.objects;

-- 공개 읽기: 누구나 product-images 버킷의 오브젝트 조회 가능
CREATE POLICY "product_images_public_read" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'product-images');

-- 업로드/삭제: service_role은 RLS를 우회하므로 이 정책은 사실상 불필요하지만
-- 명시적으로 authenticated만 허용해 anon 업로드 차단
CREATE POLICY "product_images_admin_insert" ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "product_images_admin_delete" ON storage.objects
    FOR DELETE
    USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
