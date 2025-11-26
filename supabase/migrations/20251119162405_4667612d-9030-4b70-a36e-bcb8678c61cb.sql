-- Create storage bucket for tour images
INSERT INTO storage.buckets (id, name, public)
VALUES ('tour-images', 'tour-images', true);

-- Create RLS policies for tour images bucket
CREATE POLICY "Admins can upload tour images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tour-images' 
  AND (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ))
);

CREATE POLICY "Admins can update tour images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tour-images' 
  AND (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ))
);

CREATE POLICY "Admins can delete tour images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'tour-images' 
  AND (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ))
);

CREATE POLICY "Anyone can view tour images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'tour-images');