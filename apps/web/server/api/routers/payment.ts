import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
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
    getLicenseByOrderId,
} from "@codexchange/db/src/payment-queries";
import { db } from "@codexchange/db";
import { assets, orders, licenses } from "@codexchange/db";
import { eq, and } from "drizzle-orm";

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

            // Handle free assets (0 amount) by bypassing Cashfree
            if (amountTotal === 0) {
                // Check if user already owns any license for this asset
                const existingLicense = await db.query.licenses.findFirst({
                    where: and(
                        eq(licenses.buyerId, ctx.user.id),
                        eq(licenses.assetId, input.assetId)
                    ),
                });

                if (existingLicense) {
                    throw new Error("You already own a license for this asset. Free assets can only be claimed once.");
                }

                // Create a completed order bypass
                const orderId = `free_${Date.now()}_${Math.random().toString(36).substring(7)}`;
                const [order] = await db.insert(orders).values({
                    assetId: input.assetId,
                    buyerId: ctx.user.id,
                    builderId: asset.builderId,
                    amountBase: "0.00",
                    amountPlatformFee: "0.00",
                    amountGst: "0.00",
                    amountTcs: "0.00",
                    amountTotal: "0.00",
                    licenseType: input.licenseType,
                    cashfreeOrderId: orderId,
                    paymentSessionId: "free_session_bypass",
                    status: "paid",
                    currency: "INR",
                }).returning();

                // Claim the license automatically
                await createLicense({
                    assetId: input.assetId,
                    buyerId: ctx.user.id,
                    orderId: order.id,
                    licenseType: input.licenseType,
                });

                return {
                    orderId,
                    paymentSessionId: "free_session_bypass",
                    orderAmount: 0,
                    isFree: true,
                };
            }

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
     * Verify payment status and create license if successful.
     * Public: session may have expired during the Cashfree redirect — that's OK.
     * Security comes from Cashfree API confirming the payment, not caller identity.
     * The license is always created for the buyer stored in the original order record.
     */
    verifyPayment: publicProcedure
        .input(z.object({ orderId: z.string() }))
        .mutation(async ({ input }) => {

            // Get order from database
            const order = await getOrderByCashfreeId(input.orderId);

            if (!order) {
                throw new Error("Order not found");
            }

            // If this is a free order that was already provisioned locally, return success directly
            if (order.status === "paid" && parseFloat(order.amountTotal) === 0) {
                const license = await getLicenseByOrderId(order.id);
                return {
                    status: "SUCCESS",
                    order,
                    license,
                };
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
