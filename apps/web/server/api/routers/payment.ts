import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
    createOrder as createCashfreeOrder,
    verifyPayment as verifyCashfreePayment,
} from "@codexchange/payment";
import {
    createTransaction,
    updateTransactionStatus,
    createLicense,
    getUserTransactions,
    getTransactionByOrderId,
} from "@codexchange/db/src/payment-queries";
import { db } from "@codexchange/db";
import { assets } from "@codexchange/db";
import { eq } from "drizzle-orm";

export const paymentRouter = createTRPCRouter({
    /**
     * Create a payment order for purchasing a license
     */
    createOrder: protectedProcedure
        .input(
            z.object({
                assetId: z.string(),
                licenseType: z.enum(["usage", "source"]),
            })
        )
        .mutation(async ({ input, ctx }) => {
            if (!ctx.user) {
                throw new Error("User not authenticated");
            }

            // Fetch asset details
            const asset = await db.query.assets.findFirst({
                where: eq(assets.id, input.assetId),
                with: {
                    builder: true,
                },
            });

            if (!asset) {
                throw new Error("Asset not found");
            }

            // Get price based on license type
            const priceStr =
                input.licenseType === "usage"
                    ? asset.usageLicensePrice
                    : asset.sourceLicensePrice;

            if (!priceStr) {
                throw new Error(`${input.licenseType} license not available for this asset`);
            }

            const orderAmount = parseFloat(priceStr);

            // Create Cashfree order
            const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/verify`;

            const orderResponse = await createCashfreeOrder(
                {
                    assetId: input.assetId,
                    licenseType: input.licenseType,
                    buyerId: ctx.user.id,
                    buyerEmail: ctx.user.email,
                    buyerName: ctx.user.name || "",
                },
                orderAmount,
                returnUrl
            );

            // Create transaction record in database
            await createTransaction({
                assetId: input.assetId,
                buyerId: ctx.user.id,
                builderId: asset.builderId,
                amount: orderAmount.toString(),
                licenseType: input.licenseType,
                cashfreeOrderId: orderResponse.orderId,
                paymentSessionId: orderResponse.paymentSessionId,
            });

            return {
                orderId: orderResponse.orderId,
                paymentSessionId: orderResponse.paymentSessionId,
                orderAmount: orderResponse.orderAmount,
            };
        }),

    /**
     * Verify payment status and create license if successful
     */
    verifyPayment: protectedProcedure
        .input(z.object({ orderId: z.string() }))
        .mutation(async ({ input, ctx }) => {
            if (!ctx.user) {
                throw new Error("User not authenticated");
            }

            // Get transaction from database
            const transaction = await getTransactionByOrderId(input.orderId);

            if (!transaction) {
                throw new Error("Transaction not found");
            }

            // Verify the user owns this transaction
            if (transaction.buyerId !== ctx.user.id) {
                throw new Error("Unauthorized");
            }

            // Verify payment with Cashfree
            const paymentStatus = await verifyCashfreePayment(input.orderId);

            // Update transaction status
            await updateTransactionStatus(
                input.orderId,
                paymentStatus.paymentStatus === "SUCCESS" ? "completed" : "failed",
                paymentStatus
            );

            // Create license if payment successful
            let license = null;
            if (paymentStatus.paymentStatus === "SUCCESS") {
                license = await createLicense({
                    assetId: transaction.assetId,
                    buyerId: transaction.buyerId,
                    transactionId: transaction.id,
                    licenseType: transaction.licenseType as "usage" | "source",
                });
            }

            return {
                status: paymentStatus.paymentStatus,
                transaction,
                license,
            };
        }),

    /**
     * Get user's transaction history
     */
    getTransactionHistory: protectedProcedure.query(async ({ ctx }) => {
        if (!ctx.user) {
            throw new Error("User not authenticated");
        }

        const transactions = await getUserTransactions(ctx.user.id);
        return transactions;
    }),
});
