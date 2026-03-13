import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { getUserLicenses, getLicenseById } from "@codexchange/db/src/queries";
import { generateSignedDownloadUrl } from "../../../lib/supabase-storage";
import { db, licenses } from "@codexchange/db";
import { eq, and, or, isNull, gt } from "drizzle-orm";

export const licenseRouter = createTRPCRouter({
    /**
     * Get user's licenses.
     * Auth: Only the authenticated user can view their own licenses.
     */
    getUserLicenses: protectedProcedure
        .input(z.object({ userId: z.string() }))
        .query(async ({ input, ctx }) => {
            if (ctx.user.id !== input.userId) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You can only view your own licenses",
                });
            }
            return await getUserLicenses(input.userId);
        }),

    /**
     * Check if the user already owns a license for a specific asset.
     * Public procedure so we can safely call it while loading auth or logged out.
     */
    checkOwnership: publicProcedure
        .input(z.object({ assetId: z.string().uuid() }))
        .query(async ({ input, ctx }) => {
            if (!ctx.user) return { owned: false, licenseType: null };

            const license = await db.query.licenses.findFirst({
                where: and(
                    eq(licenses.buyerId, ctx.user.id),
                    eq(licenses.assetId, input.assetId),
                    eq(licenses.status, "active"),
                    or(
                        isNull(licenses.expiresAt),
                        gt(licenses.expiresAt, new Date())
                    )
                ),
            });

            if (!license) return { owned: false, licenseType: null };

            return {
                owned: true,
                licenseType: license.licenseType as "usage" | "source",
            };
        }),

    /**
     * Get a single license by ID with full details.
     * Auth: Only the license owner can view it.
     */
    getById: protectedProcedure
        .input(z.object({ licenseId: z.string().uuid() }))
        .query(async ({ input, ctx }) => {
            const license = await getLicenseById(input.licenseId, ctx.user.id);

            if (!license) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "License not found or you do not have access",
                });
            }

            return license;
        }),

    /**
     * Generate a secure download URL for the purchased asset files.
     * Auth: User must own an active license.
     */
    generateDownloadUrl: protectedProcedure
        .input(z.object({ licenseId: z.string().uuid() }))
        .mutation(async ({ input, ctx }) => {
            // Validate license ownership and active status
            const license = await getLicenseById(input.licenseId, ctx.user.id);

            if (!license) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "License not found or you do not have access",
                });
            }

            if (license.status !== "active") {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: `Cannot download files: license is ${license.status}`,
                });
            }

            const storagePath = license.asset?.fileStoragePath;
            if (!storagePath) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "No downloadable files found for this asset",
                });
            }

            try {
                const { url, expiresAt } = await generateSignedDownloadUrl(storagePath);
                return { url, expiresAt };
            } catch (error: any) {
                console.error("Download URL generation failed:", error);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: error?.message || "Failed to generate download link. Please try again later.",
                });
            }
        }),

    /**
     * Get license metadata for PDF generation (client-side).
     * Returns all fields needed to construct the license agreement PDF.
     */
    getLicensePdfData: protectedProcedure
        .input(z.object({ licenseId: z.string().uuid() }))
        .query(async ({ input, ctx }) => {
            const license = await getLicenseById(input.licenseId, ctx.user.id);

            if (!license) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "License not found or you do not have access",
                });
            }

            return {
                licenseKey: license.licenseKey,
                licenseType: license.licenseType,
                status: license.status,
                activatedAt: license.activatedAt,
                expiresAt: license.expiresAt,
                createdAt: license.createdAt,
                assetName: license.asset?.name ?? "Unknown Asset",
                assetDescription: license.asset?.description ?? "",
                builderName: license.asset?.builder?.fullName ?? "Unknown Builder",
                buyerName: ctx.user.name ?? "License Holder",
                buyerEmail: ctx.user.email,
                categoryName: license.asset?.category?.name ?? "",
                orderId: license.orderId,
                orderAmount: license.order?.amountTotal ?? "0.00",
                orderCurrency: license.order?.currency ?? "INR",
            };
        }),

    /**
     * Deactivate a license (stub — will be implemented later).
     */
    deactivateLicense: protectedProcedure
        .input(z.object({ licenseId: z.string().uuid() }))
        .mutation(async ({ input, ctx }) => {
            const license = await getLicenseById(input.licenseId, ctx.user.id);

            if (!license) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "License not found or you do not have access",
                });
            }

            // TODO: Implement actual deactivation logic
            return {
                success: true,
                message: "License deactivation request received. This feature is coming soon.",
            };
        }),

    /**
     * Transfer a license to another user (stub — will be implemented later).
     */
    transferLicense: protectedProcedure
        .input(
            z.object({
                licenseId: z.string().uuid(),
                targetEmail: z.string().email(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const license = await getLicenseById(input.licenseId, ctx.user.id);

            if (!license) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "License not found or you do not have access",
                });
            }

            if (input.targetEmail === ctx.user.email) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Cannot transfer a license to yourself",
                });
            }

            // TODO: Implement actual transfer logic (lookup target user, update license, send emails)
            return {
                success: true,
                message: `License transfer request to ${input.targetEmail} received. This feature is coming soon.`,
            };
        }),
});
