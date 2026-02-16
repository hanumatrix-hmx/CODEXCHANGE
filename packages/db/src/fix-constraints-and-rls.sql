    -- 1. FIX FOREIGN KEYS (Add ON DELETE CASCADE)

    -- Assets: Builder deletion cascades to assets
    ALTER TABLE "assets" DROP CONSTRAINT IF EXISTS "assets_builder_id_profiles_id_fk";
    ALTER TABLE "assets" ADD CONSTRAINT "assets_builder_id_profiles_id_fk" 
    FOREIGN KEY ("builder_id") REFERENCES "profiles"("id") ON DELETE CASCADE;

    -- Licenses: Buyer deletion cascades to licenses (Asset deletion already cascades if set)
    ALTER TABLE "licenses" DROP CONSTRAINT IF EXISTS "licenses_buyer_id_profiles_id_fk";
    ALTER TABLE "licenses" ADD CONSTRAINT "licenses_buyer_id_profiles_id_fk" 
    FOREIGN KEY ("buyer_id") REFERENCES "profiles"("id") ON DELETE CASCADE;

    ALTER TABLE "licenses" DROP CONSTRAINT IF EXISTS "licenses_asset_id_assets_id_fk";
    ALTER TABLE "licenses" ADD CONSTRAINT "licenses_asset_id_assets_id_fk" 
    FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE;

    -- Reviews: User deletion cascades to reviews
    ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "reviews_user_id_profiles_id_fk";
    ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_profiles_id_fk" 
    FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE;

    ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "reviews_asset_id_assets_id_fk";
    ALTER TABLE "reviews" ADD CONSTRAINT "reviews_asset_id_assets_id_fk" 
    FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE;

    -- Survey Responses
    ALTER TABLE "survey_responses" DROP CONSTRAINT IF EXISTS "survey_responses_user_id_profiles_id_fk";
    ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_user_id_profiles_id_fk" 
    FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE;

    -- 2. ENABLE ROW LEVEL SECURITY

    ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "assets" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "licenses" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "transactions" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "payouts" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "surveys" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "survey_responses" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;

    -- 3. CREATE POLICIES

    -- PROFILES
    CREATE POLICY "Public profiles are viewable by everyone" ON "profiles"
    FOR SELECT USING (true);

    CREATE POLICY "Users can insert their own profile" ON "profiles"
    FOR INSERT WITH CHECK (auth.uid() = id);

    CREATE POLICY "Users can update own profile" ON "profiles"
    FOR UPDATE USING (auth.uid() = id);

    -- CATEGORIES
    CREATE POLICY "Categories are viewable by everyone" ON "categories"
    FOR SELECT USING (true);

    -- ASSETS
    CREATE POLICY "Assets are viewable by everyone" ON "assets"
    FOR SELECT USING (true);

    CREATE POLICY "Builders can insert assets" ON "assets"
    FOR INSERT WITH CHECK (auth.uid() = builder_id);

    CREATE POLICY "Builders can update own assets" ON "assets"
    FOR UPDATE USING (auth.uid() = builder_id);

    CREATE POLICY "Builders can delete own assets" ON "assets"
    FOR DELETE USING (auth.uid() = builder_id);

    -- LICENSES
    CREATE POLICY "Users can view own licenses" ON "licenses"
    FOR SELECT USING (auth.uid() = buyer_id);

    CREATE POLICY "Builders can view licenses for their assets" ON "licenses"
    FOR SELECT USING (
    EXISTS (SELECT 1 FROM assets WHERE assets.id = licenses.asset_id AND assets.builder_id = auth.uid())
    );

    -- TRANSACTIONS
    CREATE POLICY "Users can view own transactions" ON "transactions"
    FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = builder_id);

    -- REVIEWS
    CREATE POLICY "Reviews are viewable by everyone" ON "reviews"
    FOR SELECT USING (true);

    CREATE POLICY "Authenticated users can create reviews" ON "reviews"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

    -- PAYOUTS
    CREATE POLICY "Builders can view own payouts" ON "payouts"
    FOR SELECT USING (auth.uid() = builder_id);

