-- ============================================
-- RLS Policies: Storage Buckets
-- ============================================

-- Tour Images Bucket (Public)
CREATE POLICY "Anyone can view tour images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'tour-images');

CREATE POLICY "Authenticated users can upload tour images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'tour-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Admins can update tour images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'tour-images' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete tour images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'tour-images' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- Tour Guide Images Bucket (Public)
CREATE POLICY "Anyone can view tour guide images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'tour-guide-images');

CREATE POLICY "Authenticated users can upload tour guide images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'tour-guide-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Admins can update tour guide images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'tour-guide-images' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete tour guide images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'tour-guide-images' AND
  has_role(auth.uid(), 'admin'::app_role)
);