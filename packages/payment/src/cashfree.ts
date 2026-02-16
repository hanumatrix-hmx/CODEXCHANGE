import { Cashfree, CFEnvironment } from "cashfree-pg";
import crypto from "crypto";
import type {
    CreateOrderRequest,
    CreateOrderResponse,
    PaymentVerificationResponse,
} from "./types";

// Initialize Cashfree SDK with v5 API
const cashfree = new Cashfree(
    process.env.CASHFREE_ENVIRONMENT === "production"
        ? CFEnvironment.PRODUCTION
        : CFEnvironment.SANDBOX,
    process.env.CASHFREE_APP_ID || "",
    process.env.CASHFREE_SECRET_KEY || ""
);

/**
 * Create a payment order in Cashfree
 */
export async function createOrder(
    request: CreateOrderRequest,
    orderAmount: number,
    returnUrl: string
): Promise<CreateOrderResponse> {
    try {
        const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        const orderRequest = {
            order_amount: orderAmount,
            order_currency: "INR",
            order_id: orderId,
            customer_details: {
                customer_id: request.buyerId,
                customer_email: request.buyerEmail,
                customer_phone: request.buyerPhone || "9999999999",
                customer_name: request.buyerName,
            },
            order_meta: {
                return_url: returnUrl,
                notify_url: process.env.CASHFREE_WEBHOOK_URL,
            },
            order_note: `Purchase ${request.licenseType} license for asset ${request.assetId}`,
        };

        const response = await cashfree.PGCreateOrder(orderRequest);

        if (!response.data || !response.data.payment_session_id) {
            throw new Error("Failed to create order: No payment session ID");
        }

        return {
            orderId: response.data.order_id || orderId,
            paymentSessionId: response.data.payment_session_id || "",
            orderAmount: response.data.order_amount || orderAmount,
        };
    } catch (error) {
        console.error("Error creating Cashfree order:", error);
        throw new Error(`Failed to create payment order: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

/**
 * Verify payment status from Cashfree
 */
export async function verifyPayment(orderId: string): Promise<PaymentVerificationResponse> {
    try {
        const response = await cashfree.PGFetchOrder(orderId);

        if (!response.data) {
            return {
                orderId,
                orderStatus: "ACTIVE",
                paymentStatus: "PENDING",
            };
        }

        const order = response.data;
        const orderStatus = order.order_status || "ACTIVE";

        return {
            orderId: order.order_id || orderId,
            orderStatus: orderStatus as "PAID" | "ACTIVE" | "EXPIRED" | "FAILED",
            paymentStatus: orderStatus === "PAID" ? "SUCCESS" : "PENDING",
            paymentMethod: undefined, // Payment method is not available in order response
            paymentTime: undefined, // Payment time is not available in order response
            transactionId: order.cf_order_id?.toString(),
        };
    } catch (error) {
        console.error("Error verifying payment:", error);
        throw new Error(`Failed to verify payment: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

/**
 * Get order details from Cashfree
 */
export async function getOrderDetails(orderId: string) {
    try {
        const response = await cashfree.PGFetchOrder(orderId);
        return response.data;
    } catch (error) {
        console.error("Error fetching order details:", error);
        throw new Error(`Failed to fetch order details: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
    payload: string,
    signature: string,
    timestamp: string
): boolean {
    try {
        // Cashfree webhook signature verification
        // The signature is computed as: base64(sha256(timestamp + raw_body))
        const secretKey = process.env.CASHFREE_SECRET_KEY || "";

        const computedSignature = crypto
            .createHmac("sha256", secretKey)
            .update(timestamp + payload)
            .digest("base64");

        return computedSignature === signature;
    } catch (error) {
        console.error("Error verifying webhook signature:", error);
        return false;
    }
}
