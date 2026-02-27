import { NextRequest, NextResponse } from "next/server";
import {
    capturePayment,
    createLicense,
    getOrderByCashfreeId,
    getLicenseByOrderId,
} from "@codexchange/db/src/payment-queries";
import { verifyWebhookSignature } from "@codexchange/payment";
import type { WebhookPayload } from "@codexchange/payment";

export async function POST(request: NextRequest) {
    // Read raw body FIRST — must happen before any JSON parsing
    const payload = await request.text();

    // --- Signature Verification ---
    const signature = request.headers.get("x-webhook-signature") || "";
    const timestamp = request.headers.get("x-webhook-timestamp") || "";

    if (!signature || !timestamp) {
        console.warn("Webhook rejected: missing x-webhook-signature or x-webhook-timestamp headers");
        return NextResponse.json({ error: "Missing signature headers" }, { status: 401 });
    }

    // Replay attack prevention — auto-detect timestamp unit (Cashfree sends milliseconds,
    // but guard against seconds format too). Values >= 1e12 are already in ms.
    const tsRaw = Number(timestamp);
    const timestampMs = tsRaw >= 1e12 ? tsRaw : tsRaw * 1000;
    const webhookAgeMs = Date.now() - timestampMs;
    const TEN_MINUTES_MS = 10 * 60 * 1000;
    const CLOCK_SKEW_MS = 60 * 1000; // allow 60s future slack for Vercel/Cashfree clock drift
    if (webhookAgeMs > TEN_MINUTES_MS || webhookAgeMs < -CLOCK_SKEW_MS) {
        console.warn(`Webhook rejected: timestamp too old or in the future (age: ${webhookAgeMs}ms, raw: ${timestamp})`);
        return NextResponse.json({ error: "Webhook timestamp expired" }, { status: 401 });
    }

    const isValid = verifyWebhookSignature(payload, signature, timestamp);
    if (!isValid) {
        console.warn("Webhook rejected: invalid signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    // --- End Signature Verification ---

    try {
        const webhookData: WebhookPayload = JSON.parse(payload);

        // Extract order details
        const { order, payment } = webhookData.data;
        const cashfreeOrderId = order.order_id;
        const paymentStatus = payment.payment_status;

        // Get order from database
        const dbOrder = await getOrderByCashfreeId(cashfreeOrderId);

        if (!dbOrder) {
            console.error(`Order not found for cashfree_order_id: ${cashfreeOrderId}`);
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Update order status
        const status = paymentStatus === "SUCCESS" ? "success" : "failed";
        await capturePayment(cashfreeOrderId, status, payment);

        // Create license if payment successful and not already created
        if (paymentStatus === "SUCCESS") {
            const existingLicense = await getLicenseByOrderId(dbOrder.id);

            if (!existingLicense) {
                await createLicense({
                    assetId: dbOrder.assetId,
                    buyerId: dbOrder.buyerId,
                    orderId: dbOrder.id,
                    licenseType: dbOrder.licenseType as "usage" | "source",
                });

            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Webhook error:", error);
        return NextResponse.json(
            { error: "Webhook processing failed" },
            { status: 500 }
        );
    }
}
