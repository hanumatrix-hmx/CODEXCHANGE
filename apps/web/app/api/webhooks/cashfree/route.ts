import { NextRequest, NextResponse } from "next/server";
import {
    updateTransactionStatus,
    createLicense,
    getTransactionByOrderId,
    getLicenseByTransactionId,
} from "@codexchange/db/src/payment-queries";
import type { WebhookPayload } from "@codexchange/payment";

export async function POST(request: NextRequest) {
    try {
        // Get webhook payload
        const payload = await request.text();
        const webhookData: WebhookPayload = JSON.parse(payload);

        // Get signature from headers for verification (optional but recommended)
        // const _signature = request.headers.get("x-webhook-signature") || "";
        // const _timestamp = request.headers.get("x-webhook-timestamp") || "";

        // TODO: Verify webhook signature
        // const isValid = verifyWebhookSignature(payload, signature, timestamp);
        // if (!isValid) {
        //     return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        // }

        // Extract order details
        const { order, payment } = webhookData.data;
        const cashfreeOrderId = order.order_id;
        const paymentStatus = payment.payment_status;

        // Get transaction from database
        const transaction = await getTransactionByOrderId(cashfreeOrderId);

        if (!transaction) {
            console.error(`Transaction not found for order: ${cashfreeOrderId}`);
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }

        // Update transaction status
        const status = paymentStatus === "SUCCESS" ? "completed" : "failed";
        await updateTransactionStatus(cashfreeOrderId, status, payment);

        // Create license if payment successful and not already created
        if (paymentStatus === "SUCCESS") {
            // Check if license already exists to prevent duplicates
            const existingLicense = await getLicenseByTransactionId(transaction.id);

            if (!existingLicense) {
                await createLicense({
                    assetId: transaction.assetId,
                    buyerId: transaction.buyerId,
                    transactionId: transaction.id,
                    licenseType: transaction.licenseType as "usage" | "source",
                });

                console.log(`License created for order: ${cashfreeOrderId}`);
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
