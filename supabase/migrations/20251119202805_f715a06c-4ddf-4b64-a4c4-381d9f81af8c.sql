-- Create storage bucket for tour guide images
INSERT INTO storage.buckets (id, name, public)
VALUES ('tour-guide-images', 'tour-guide-images', true);

-- Create policies for tour guide images
CREATE POLICY "Admins can upload tour guide images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'tour-guide-images' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Anyone can view tour guide images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'tour-guide-images');

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