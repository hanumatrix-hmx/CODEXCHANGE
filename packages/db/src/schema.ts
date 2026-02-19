import { pgTable, text, timestamp, integer, decimal, boolean, jsonb, pgEnum, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", ["buyer", "builder", "admin"]);
export const licenseTypeEnum = pgEnum("license_type", ["usage", "source"]);
export const assetStatusEnum = pgEnum("asset_status", ["draft", "pending_review", "approved", "rejected"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "completed", "failed", "refunded"]);
export const qualityTierEnum = pgEnum("quality_tier", ["bronze", "silver", "gold"]);
export const builderVerificationStatusEnum = pgEnum("builder_verification_status", ["pending", "verified", "rejected"]);
export const moderationStatusEnum = pgEnum("moderation_status", ["pending", "in_review", "approved", "rejected", "appealed"]);


// Profiles (extends Supabase auth.users)
export const profiles = pgTable("profiles", {
    id: uuid("id").primaryKey(), // matches auth.users.id
    email: text("email").notNull().unique(),
    fullName: text("full_name"),
    role: userRoleEnum("role").notNull().default("buyer"),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),
    companyName: text("company_name"),
    website: text("website"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Builder Profiles
export const builderProfiles = pgTable("builder_profiles", {
    id: uuid("id").primaryKey().references(() => profiles.id, { onDelete: "cascade" }),
    storeName: text("store_name").notNull(),
    storeSlug: text("store_slug").notNull().unique(),

    // Indian Compliance
    gstin: text("gstin").notNull(),
    pan: text("pan").notNull(),
    bankAccountId: text("bank_account_id").notNull(),

    verificationStatus: builderVerificationStatusEnum("verification_status").default("pending").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


// Categories
export const categories = pgTable("categories", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    parentId: uuid("parent_id"), // for hierarchical categories
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Assets (AI tools/software)
export const assets = pgTable("assets", {
    id: uuid("id").primaryKey().defaultRandom(),
    builderId: uuid("builder_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").notNull().references(() => categories.id),

    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull(),
    longDescription: text("long_description"),

    // Pricing
    usageLicensePrice: decimal("usage_license_price", { precision: 10, scale: 2 }),
    sourceLicensePrice: decimal("source_license_price", { precision: 10, scale: 2 }),

    // Scarcity
    maxLicenses: integer("max_licenses"),
    soldLicenses: integer("sold_licenses").default(0).notNull(),

    // Quality
    qualityTier: qualityTierEnum("quality_tier"),
    status: assetStatusEnum("status").notNull().default("draft"),

    // Technical details
    techStack: jsonb("tech_stack").$type<string[]>(),
    demoUrl: text("demo_url"),
    githubUrl: text("github_url"),

    // License features
    licenseFeatures: jsonb("license_features").$type<{ usage: string[]; source: string[] }>(),

    // Storage
    thumbnailUrl: text("thumbnail_url"),
    fileStoragePath: text("file_storage_path"), // S3 path

    // Metadata
    avgRating: decimal("avg_rating", { precision: 3, scale: 2 }).default("0"),
    totalReviews: integer("total_reviews").default(0).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Listing Images
export const listingImages = pgTable("listing_images", {
    id: uuid("id").primaryKey().defaultRandom(),
    assetId: uuid("asset_id").notNull().references(() => assets.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Listing Versions
export const listingVersions = pgTable("listing_versions", {
    id: uuid("id").primaryKey().defaultRandom(),
    assetId: uuid("asset_id").notNull().references(() => assets.id, { onDelete: "cascade" }),
    version: text("version").notNull(), // Semver
    changelog: text("changelog"),
    packageUrl: text("package_url").notNull(),
    checksum: text("checksum"), // SHA-256
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tags
export const tags = pgTable("tags", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Listing Tags
export const listingTags = pgTable("listing_tags", {
    assetId: uuid("asset_id").notNull().references(() => assets.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
}, (t) => ({
    pk: [t.assetId, t.tagId],
}));

// Moderation
export const moderationQueue = pgTable("moderation_queue", {
    id: uuid("id").primaryKey().defaultRandom(),
    assetId: uuid("asset_id").notNull().references(() => assets.id, { onDelete: "cascade" }),
    status: moderationStatusEnum("status").default("pending").notNull(),
    assignedTo: uuid("assigned_to").references(() => profiles.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const moderationLog = pgTable("moderation_log", {
    id: uuid("id").primaryKey().defaultRandom(),
    queueId: uuid("queue_id").notNull().references(() => moderationQueue.id, { onDelete: "cascade" }),
    moderatorId: uuid("moderator_id").notNull().references(() => profiles.id),
    action: text("action").notNull(), // approve, reject, comment, assign
    reason: text("reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});


// Licenses
export const licenses = pgTable("licenses", {
    id: uuid("id").primaryKey().defaultRandom(),
    assetId: uuid("asset_id").notNull().references(() => assets.id, { onDelete: "cascade" }),
    buyerId: uuid("buyer_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    transactionId: uuid("transaction_id").references(() => transactions.id),

    licenseType: text("license_type").notNull(), // usage, source
    licenseKey: text("license_key").notNull().unique(),
    status: text("status").default("active").notNull(), // active, expired, revoked

    activatedAt: timestamp("activated_at"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Transactions
export const transactions = pgTable("transactions", {
    id: uuid("id").primaryKey().defaultRandom(),
    assetId: uuid("asset_id").notNull().references(() => assets.id),
    buyerId: uuid("buyer_id").notNull().references(() => profiles.id),
    builderId: uuid("builder_id").notNull().references(() => profiles.id),

    amount: text("amount").notNull(), // Stored as string to avoid precision issues
    currency: text("currency").default("INR").notNull(),
    status: text("status").notNull(), // pending, completed, failed, refunded
    licenseType: text("license_type").notNull(), // usage, source

    // Payment gateway details
    paymentGateway: text("payment_gateway").default("cashfree"), // cashfree, razorpay, stripe, etc.
    gatewayTransactionId: text("gateway_transaction_id"),

    // Cashfree specific fields
    cashfreeOrderId: text("cashfree_order_id").unique(),
    paymentSessionId: text("payment_session_id"),
    paymentMethod: text("payment_method"), // upi, card, netbanking, wallet
    paymentDetails: jsonb("payment_details"), // Store raw Cashfree response

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Surveys (pricing surveys)
export const surveys = pgTable("surveys", {
    id: uuid("id").primaryKey().defaultRandom(),
    assetId: uuid("asset_id").notNull().references(() => assets.id, { onDelete: "cascade" }),

    isActive: boolean("is_active").default(true).notNull(),
    totalResponses: integer("total_responses").default(0).notNull(),

    // Calculated price bands (Van Westendorp)
    priceFloor: decimal("price_floor", { precision: 10, scale: 2 }),
    priceOptimal: decimal("price_optimal", { precision: 10, scale: 2 }),
    priceCeiling: decimal("price_ceiling", { precision: 10, scale: 2 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Survey Responses
export const surveyResponses = pgTable("survey_responses", {
    id: uuid("id").primaryKey().defaultRandom(),
    surveyId: uuid("survey_id").notNull().references(() => surveys.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }),

    // Van Westendorp 4 questions
    tooCheap: decimal("too_cheap", { precision: 10, scale: 2 }),
    cheap: decimal("cheap", { precision: 10, scale: 2 }),
    expensive: decimal("expensive", { precision: 10, scale: 2 }),
    tooExpensive: decimal("too_expensive", { precision: 10, scale: 2 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Payouts (builder earnings)
export const payouts = pgTable("payouts", {
    id: uuid("id").primaryKey().defaultRandom(),
    builderId: uuid("builder_id").notNull().references(() => profiles.id),

    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currency: text("currency").default("INR").notNull(),
    status: text("status").notNull().default("pending"), // pending, processing, completed, failed

    // Razorpay Route details
    transferId: text("transfer_id"),

    transactionIds: jsonb("transaction_ids").$type<string[]>(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    processedAt: timestamp("processed_at"),
});

// Reviews
export const reviews = pgTable("reviews", {
    id: uuid("id").primaryKey().defaultRandom(),
    assetId: uuid("asset_id").notNull().references(() => assets.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    licenseId: uuid("license_id").references(() => licenses.id, { onDelete: "cascade" }),

    rating: integer("rating").notNull(), // 1-5
    title: text("title"),
    comment: text("comment"),

    isVerifiedPurchase: boolean("is_verified_purchase").default(false).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Audit Logs
export const auditLogs = pgTable("audit_logs", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => profiles.id),

    action: text("action").notNull(), // e.g., "asset_approved", "payment_completed"
    entityType: text("entity_type").notNull(), // e.g., "asset", "transaction"
    entityId: uuid("entity_id"),

    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations (for Drizzle queries)
export const profilesRelations = relations(profiles, ({ one, many }) => ({
    assetsCreated: many(assets),
    licenses: many(licenses),
    transactions: many(transactions),
    reviews: many(reviews),
    builderProfile: one(builderProfiles, {
        fields: [profiles.id],
        references: [builderProfiles.id],
    }),
}));


export const assetsRelations = relations(assets, ({ one, many }) => ({
    builder: one(profiles, {
        fields: [assets.builderId],
        references: [profiles.id],
    }),
    category: one(categories, {
        fields: [assets.categoryId],
        references: [categories.id],
    }),
    licenses: many(licenses),
    transactions: many(transactions),
    reviews: many(reviews),
    surveys: many(surveys),
    listingImages: many(listingImages),
    versions: many(listingVersions),
    tags: many(listingTags),
    moderationQueue: one(moderationQueue, {
        fields: [assets.id],
        references: [moderationQueue.assetId],
    }),
}));


export const reviewsRelations = relations(reviews, ({ one }) => ({
    asset: one(assets, {
        fields: [reviews.assetId],
        references: [assets.id],
    }),
    user: one(profiles, {
        fields: [reviews.userId],
        references: [profiles.id],
    }),
    license: one(licenses, {
        fields: [reviews.licenseId],
        references: [licenses.id],
    }),
}));

export const licensesRelations = relations(licenses, ({ one }) => ({
    asset: one(assets, {
        fields: [licenses.assetId],
        references: [assets.id],
    }),
    buyer: one(profiles, {
        fields: [licenses.buyerId],
        references: [profiles.id],
    }),
    transaction: one(transactions, {
        fields: [licenses.transactionId],
        references: [transactions.id],
    }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
    asset: one(assets, {
        fields: [transactions.assetId],
        references: [assets.id],
    }),
    buyer: one(profiles, {
        fields: [transactions.buyerId],
        references: [profiles.id],
    }),
    builder: one(profiles, {
        fields: [transactions.builderId],
        references: [profiles.id],
    }),
}));

export const builderProfilesRelations = relations(builderProfiles, ({ one }) => ({
    profile: one(profiles, {
        fields: [builderProfiles.id],
        references: [profiles.id],
    }),
}));

export const listingImagesRelations = relations(listingImages, ({ one }) => ({
    asset: one(assets, {
        fields: [listingImages.assetId],
        references: [assets.id],
    }),
}));

export const listingVersionsRelations = relations(listingVersions, ({ one }) => ({
    asset: one(assets, {
        fields: [listingVersions.assetId],
        references: [assets.id],
    }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
    assets: many(listingTags),
}));

export const listingTagsRelations = relations(listingTags, ({ one }) => ({
    asset: one(assets, {
        fields: [listingTags.assetId],
        references: [assets.id],
    }),
    tag: one(tags, {
        fields: [listingTags.tagId],
        references: [tags.id],
    }),
}));

export const moderationQueueRelations = relations(moderationQueue, ({ one, many }) => ({
    asset: one(assets, {
        fields: [moderationQueue.assetId],
        references: [assets.id],
    }),
    assignedTo: one(profiles, {
        fields: [moderationQueue.assignedTo],
        references: [profiles.id],
    }),
    logs: many(moderationLog),
}));

export const moderationLogRelations = relations(moderationLog, ({ one }) => ({
    queue: one(moderationQueue, {
        fields: [moderationLog.queueId],
        references: [moderationQueue.id],
    }),
    moderator: one(profiles, {
        fields: [moderationLog.moderatorId],
        references: [profiles.id],
    }),
}));

