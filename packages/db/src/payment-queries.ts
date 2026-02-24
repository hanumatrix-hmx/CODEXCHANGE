import { db } from "./index";
import { orders, payments, licenses, assets } from "./schema";
import { eq, desc, sql } from "drizzle-orm";

/**
 * Create a new order record (intent to purchase)
 */
export async function createOrder(data: {
    assetId: string;
    buyerId: string;
    builderId: string;
    licenseType: "usage" | "source";
    amountBase: string;
    amountPlatformFee: string;
    amountGst: string;
    amountTcs: string;
    amountTotal: string;
    cashfreeOrderId: string;
    paymentSessionId: string;
}) {
    const [order] = await db
        .insert(orders)
        .values({
            ...data,
            status: "pending",
            currency: "INR",
        })
        .returning();

    return order;
}

/**
 * Capture payment and update order status
 */
export async function capturePayment(
    cashfreeOrderId: string,
    status: "success" | "failed",
    paymentDetails?: any
) {
    // 1. Get the order first
    const order = await db.query.orders.findFirst({
        where: eq(orders.cashfreeOrderId, cashfreeOrderId),
    });

    if (!order) {
        throw new Error(`Order not found for cashfreeOrderId: ${cashfreeOrderId}`);
    }

    const orderStatus = status === "success" ? "paid" : "failed";

    // 2. Perform transaction to update order and insert payment
    const result = await db.transaction(async (tx) => {
        // Update order status
        const [updatedOrder] = await tx
            .update(orders)
            .set({
                status: orderStatus,
                updatedAt: new Date(),
            })
            .where(eq(orders.id, order.id))
            .returning();

        // Create payment record
        const paymentData: any = {
            orderId: order.id,
            amount: order.amountTotal,
            currency: order.currency,
            status: status,
            paymentGateway: "cashfree",
        };

        if (paymentDetails) {
            paymentData.paymentDetails = paymentDetails;
            paymentData.gatewayPaymentId = paymentDetails.cf_payment_id;
            paymentData.paymentMethod = paymentDetails.payment_group;
        }

        const [payment] = await tx
            .insert(payments)
            .values(paymentData)
            .returning();

        return { order: updatedOrder, payment };
    });

    return result.order;
}

/**
 * Get order by Cashfree order ID
 */
export async function getOrderByCashfreeId(cashfreeOrderId: string) {
    const order = await db.query.orders.findFirst({
        where: eq(orders.cashfreeOrderId, cashfreeOrderId),
        with: {
            asset: true,
            buyer: true,
            builder: true,
        },
    });

    return order;
}

/**
 * Create a license after successful payment
 */
export async function createLicense(data: {
    assetId: string;
    buyerId: string;
    orderId: string;
    licenseType: "usage" | "source";
}) {
    // Generate a unique license key
    const licenseKey = `${data.licenseType.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    // Use a transaction to ensure both license creation and asset update happen atomically
    const result = await db.transaction(async (tx) => {
        // Create the license
        const [license] = await tx
            .insert(licenses)
            .values({
                ...data,
                licenseKey,
                status: "active",
                activatedAt: new Date(),
                // Set expiration based on license type (optional)
                // expiresAt: licenseType === "usage" ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null,
            })
            .returning();

        // Increment soldLicenses count on the asset
        await tx
            .update(assets)
            .set({
                soldLicenses: sql`${assets.soldLicenses} + 1`,
            })
            .where(eq(assets.id, data.assetId));

        return license;
    });

    return result;
}

/**
 * Get user's order history
 */
export async function getUserOrders(userId: string) {
    const userOrders = await db.query.orders.findMany({
        where: eq(orders.buyerId, userId),
        with: {
            asset: {
                with: {
                    category: true,
                },
            },
        },
        orderBy: [desc(orders.createdAt)],
    });

    return userOrders;
}

/**
 * Get license by order ID
 */
export async function getLicenseByOrderId(orderId: string) {
    const license = await db.query.licenses.findFirst({
        where: eq(licenses.orderId, orderId),
    });

    return license;
}
