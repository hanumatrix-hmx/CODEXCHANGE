-- 1. Helper Function for Admin Check
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Enable RLS on all tables
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "builder_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "assets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "listing_images" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "listing_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "licenses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "refunds" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "listing_tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "moderation_queue" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "moderation_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "surveys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "survey_responses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payouts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;

-- 3. DROP existing policies to avoid conflicts
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- 4. PROFILES
CREATE POLICY "Public profiles are viewable by everyone" ON "profiles" FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON "profiles" FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON "profiles" FOR UPDATE USING (auth.uid() = id);

-- 5. BUILDER PROFILES
CREATE POLICY "Builder profiles are viewable by everyone" ON "builder_profiles" FOR SELECT USING (true);
CREATE POLICY "Users can manage own builder profile" ON "builder_profiles" FOR ALL USING (auth.uid() = id);

-- 6. CATEGORIES
CREATE POLICY "Categories are viewable by everyone" ON "categories" FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON "categories" FOR ALL USING (public.is_admin(auth.uid()));

-- 7. ASSETS
CREATE POLICY "Approved assets are viewable by everyone" ON "assets" 
FOR SELECT USING (status = 'approved' OR auth.uid() = builder_id OR public.is_admin(auth.uid()));
CREATE POLICY "Builders can manage own assets" ON "assets" FOR ALL USING (auth.uid() = builder_id);

-- 8. LISTING IMAGES & VERSIONS
CREATE POLICY "Images are viewable by everyone" ON "listing_images" FOR SELECT USING (true);
CREATE POLICY "Builders can manage own listing images" ON "listing_images" 
FOR ALL USING (EXISTS (SELECT 1 FROM assets WHERE assets.id = asset_id AND assets.builder_id = auth.uid()));

CREATE POLICY "Versions are viewable by everyone" ON "listing_versions" FOR SELECT USING (true);
CREATE POLICY "Builders can manage own versions" ON "listing_versions" 
FOR ALL USING (EXISTS (SELECT 1 FROM assets WHERE assets.id = asset_id AND assets.builder_id = auth.uid()));

-- 9. TAGS
CREATE POLICY "Tags are viewable by everyone" ON "tags" FOR SELECT USING (true);
CREATE POLICY "Admins can manage tags" ON "tags" FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Listing tags are viewable by everyone" ON "listing_tags" FOR SELECT USING (true);
CREATE POLICY "Builders can manage listing tags" ON "listing_tags" 
FOR ALL USING (EXISTS (SELECT 1 FROM assets WHERE assets.id = asset_id AND assets.builder_id = auth.uid()));

-- 10. LICENSES, ORDERS, PAYMENTS, & REFUNDS
CREATE POLICY "View own licenses" ON "licenses" 
FOR SELECT USING (auth.uid() = buyer_id OR EXISTS (SELECT 1 FROM assets WHERE assets.id = asset_id AND assets.builder_id = auth.uid()));

CREATE POLICY "View own orders" ON "orders" 
FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = builder_id OR public.is_admin(auth.uid()));

CREATE POLICY "View own payments" ON "payments" 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND (orders.buyer_id = auth.uid() OR orders.builder_id = auth.uid())) 
  OR public.is_admin(auth.uid())
);

CREATE POLICY "View own refunds" ON "refunds" 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND (orders.buyer_id = auth.uid() OR orders.builder_id = auth.uid())) 
  OR public.is_admin(auth.uid())
);

-- 11. MODERATION
CREATE POLICY "Moderators can view queue" ON "moderation_queue" 
FOR SELECT USING (public.is_admin(auth.uid()) OR auth.uid() = assigned_to);
CREATE POLICY "Moderators can update queue" ON "moderation_queue" 
FOR UPDATE USING (public.is_admin(auth.uid()) OR auth.uid() = assigned_to);

CREATE POLICY "Moderators can view logs" ON "moderation_log" 
FOR SELECT USING (public.is_admin(auth.uid()) OR auth.uid() = moderator_id);
CREATE POLICY "Moderators can insert logs" ON "moderation_log" 
FOR INSERT WITH CHECK (public.is_admin(auth.uid()) OR auth.uid() = moderator_id);

-- 12. SURVEYS
CREATE POLICY "Builders can manage own surveys" ON "surveys" 
FOR ALL USING (EXISTS (SELECT 1 FROM assets WHERE assets.id = asset_id AND assets.builder_id = auth.uid()));
CREATE POLICY "Public can view active surveys" ON "surveys" FOR SELECT USING (is_active = true);

CREATE POLICY "Builders can view responses" ON "survey_responses" 
FOR SELECT USING (EXISTS (
    SELECT 1 FROM surveys s 
    JOIN assets a ON a.id = s.asset_id 
    WHERE s.id = survey_id AND a.builder_id = auth.uid()
));
CREATE POLICY "Users can insert survey responses" ON "survey_responses" FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 13. PAYOUTS
CREATE POLICY "Builders view own payouts" ON "payouts" FOR SELECT USING (auth.uid() = builder_id OR public.is_admin(auth.uid()));
CREATE POLICY "Admins manage payouts" ON "payouts" FOR ALL USING (public.is_admin(auth.uid()));

-- 14. REVIEWS
CREATE POLICY "Reviews are public" ON "reviews" FOR SELECT USING (true);
CREATE POLICY "Users can manage own reviews" ON "reviews" FOR ALL USING (auth.uid() = user_id);

-- 15. AUDIT LOGS
CREATE POLICY "Admins can view audit logs" ON "audit_logs" FOR SELECT USING (public.is_admin(auth.uid()));


-- 16. STORAGE (listing-images bucket)
-- Note: 'storage.objects' is in the 'storage' schema, but we typically run this SQL as a migration or directly in SQL Editor.
-- However, since this file is likely applied via a Drizzle script or similar, we must ensure we are targeting the correct schema/table.
-- Standard Supabase Storage RLS:

-- Allow public read access to listing images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'listing-images' );

-- Allow authenticated users to upload images
-- 1. Give public read access
CREATE POLICY "Public Access listing-images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'listing-images');

-- 2. Allow authenticated users to upload (INSERT)
CREATE POLICY "Authenticated users can upload listing-images" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'listing-images' 
  AND auth.role() = 'authenticated'
);

-- 3. Allow authenticated users to update
CREATE POLICY "Authenticated users can update listing-images" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'listing-images' 
  AND auth.role() = 'authenticated'
);

-- 4. Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete listing-images" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'listing-images' 
  AND auth.role() = 'authenticated'
);

