import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
    createOrder as createCashfreeOrder,
    verifyPayment as verifyCashfreePayment,
} from "@codexchange/payment";
import {
    createOrder,
    capturePayment,
    createLicense,
    getUserOrders,
    getOrderByCashfreeId,
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

            const amountTotal = parseFloat(priceStr);
            const amountBase = amountTotal;
            const amountPlatformFee = amountBase * 0.16;
            const amountGst = amountPlatformFee * 0.18;
            const amountTcs = amountBase * 0.01;

            // Create Cashfree order
            const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/verify?order_id={order_id}`;

            const orderResponse = await createCashfreeOrder(
                {
                    assetId: input.assetId,
                    licenseType: input.licenseType,
                    buyerId: ctx.user.id,
                    buyerEmail: ctx.user.email,
                    buyerName: ctx.user.name || "",
                },
                amountTotal,
                returnUrl
            );

            // Create order record in database
            await createOrder({
                assetId: input.assetId,
                buyerId: ctx.user.id,
                builderId: asset.builderId,
                amountBase: amountBase.toFixed(2),
                amountPlatformFee: amountPlatformFee.toFixed(2),
                amountGst: amountGst.toFixed(2),
                amountTcs: amountTcs.toFixed(2),
                amountTotal: amountTotal.toFixed(2),
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

            // Get order from database
            const order = await getOrderByCashfreeId(input.orderId);

            if (!order) {
                throw new Error("Order not found");
            }

            // Verify the user owns this order
            if (order.buyerId !== ctx.user.id) {
                throw new Error("Unauthorized");
            }

            // Verify payment with Cashfree
            const paymentStatus = await verifyCashfreePayment(input.orderId);

            // Update order status and capture payment
            const statusToSet = paymentStatus.paymentStatus === "SUCCESS" ? "success" : "failed";
            await capturePayment(
                input.orderId,
                statusToSet,
                paymentStatus
            );

            // Create license if payment successful
            let license = null;
            if (paymentStatus.paymentStatus === "SUCCESS") {
                license = await createLicense({
                    assetId: order.assetId,
                    buyerId: order.buyerId,
                    orderId: order.id,
                    licenseType: order.licenseType as "usage" | "source",
                });
            }

            return {
                status: paymentStatus.paymentStatus,
                order,
                license,
            };
        }),

    /**
     * Get user's order history
     */
    getOrderHistory: protectedProcedure.query(async ({ ctx }) => {
        if (!ctx.user) {
            throw new Error("User not authenticated");
        }

        const orders = await getUserOrders(ctx.user.id);
        return orders;
    }),
});
